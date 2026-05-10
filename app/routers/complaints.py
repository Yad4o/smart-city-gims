from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintEvent, ComplaintStatus
from app.schemas.complaint import ComplaintSubmit, ComplaintOut, ComplaintStatusUpdate
from app.services import categorization, assignment, sla as sla_service, notification
from app.utils.auth import get_current_user, require_role
from app.utils.ticket import generate_ticket_id
from app.utils import websocket as ws_manager
import cloudinary
import cloudinary.uploader
from app.config import settings

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintOut, status_code=201)
async def submit_complaint(
    payload: ComplaintSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # AI categorization
    category, severity = await categorization.classify(payload.text)

    # Ward routing
    ward = None
    if payload.lat and payload.lon:
        ward = assignment.find_ward(db, payload.lat, payload.lon)

    # Create complaint
    complaint = Complaint(
        ticket_id=generate_ticket_id(),
        citizen_id=current_user.id,
        text=payload.text,
        category=category,
        severity=severity,
        lat=payload.lat,
        lon=payload.lon,
        address=payload.address,
        ward_id=ward.id if ward else None,
        channel=payload.channel,
        sla_deadline=sla_service.calculate_deadline(severity),
    )
    db.add(complaint)
    db.flush()

    # Assign officer
    officer = assignment.assign_officer(db, complaint)
    if officer:
        complaint.officer_id = officer.id
        complaint.status = ComplaintStatus.assigned
        assignment.increment_load(db, officer)

    db.add(ComplaintEvent(complaint_id=complaint.id, event_type="submitted", actor_id=current_user.id))
    if officer:
        db.add(ComplaintEvent(complaint_id=complaint.id, event_type="assigned", note=f"Assigned to officer {officer.id}"))

    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/{ticket_id}", response_model=ComplaintOut)
def get_complaint(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaint = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role == UserRole.citizen and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return complaint


@router.patch("/{ticket_id}/status", response_model=ComplaintOut)
async def update_status(
    ticket_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.officer, UserRole.admin)),
):
    complaint = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = payload.status
    if payload.status == ComplaintStatus.resolved:
        complaint.resolution_note = payload.note
        if complaint.officer_id:
            officer = db.query(User).filter(User.id == complaint.officer_id).first()
            if officer:
                assignment.decrement_load(db, officer)

    db.add(ComplaintEvent(
        complaint_id=complaint.id,
        event_type="status_changed",
        actor_id=current_user.id,
        note=f"{old_status} → {payload.status}" + (f": {payload.note}" if payload.note else ""),
    ))
    db.commit()
    db.refresh(complaint)

    # WebSocket push + email
    await ws_manager.broadcast(ticket_id, {"ticket_id": ticket_id, "status": payload.status, "note": payload.note})
    citizen = db.query(User).filter(User.id == complaint.citizen_id).first()
    if citizen:
        notification.send_status_email(citizen.email, ticket_id, payload.status, payload.note or "")

    return complaint


@router.post("/{ticket_id}/photo")
async def upload_photo(
    ticket_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.officer, UserRole.admin)),
):
    complaint = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
    result = cloudinary.uploader.upload(await file.read(), folder="smart-city-gims")
    complaint.photo_url = result["secure_url"]
    db.commit()
    return {"photo_url": complaint.photo_url}


@router.get("", response_model=List[ComplaintOut])
def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Complaint)
    if current_user.role == UserRole.citizen:
        query = query.filter(Complaint.citizen_id == current_user.id)
    elif current_user.role == UserRole.officer:
        query = query.filter(Complaint.officer_id == current_user.id)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    return query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()


@router.websocket("/ws/{ticket_id}")
async def complaint_ws(ticket_id: str, websocket: WebSocket):
    """Citizens connect here to receive real-time status updates for their complaint."""
    await ws_manager.connect(ticket_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        ws_manager.disconnect(ticket_id, websocket)
