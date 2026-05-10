"""
Simulated multi-channel ingestion endpoints.
In production: email webhooks come from Resend/Mailgun, WhatsApp from Twilio/WATI.
These endpoints simulate the same ingestion flow for demo purposes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintEvent, ComplaintStatus, Channel
from app.schemas.complaint import WebhookEmailPayload, WebhookWhatsAppPayload, ComplaintOut
from app.services import categorization, assignment, sla as sla_service
from app.utils.ticket import generate_ticket_id

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


async def _create_complaint_from_text(text: str, channel: Channel, db: Session, citizen: User) -> Complaint:
    category, severity = await categorization.classify(text)
    ward = None

    complaint = Complaint(
        ticket_id=generate_ticket_id(),
        citizen_id=citizen.id,
        text=text,
        category=category,
        severity=severity,
        channel=channel,
        sla_deadline=sla_service.calculate_deadline(severity),
    )
    db.add(complaint)
    db.flush()

    officer = assignment.assign_officer(db, complaint)
    if officer:
        complaint.officer_id = officer.id
        complaint.status = ComplaintStatus.assigned
        assignment.increment_load(db, officer)

    db.add(ComplaintEvent(complaint_id=complaint.id, event_type="submitted", note=f"Via {channel}"))
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/email", response_model=ComplaintOut, status_code=201)
async def email_webhook(payload: WebhookEmailPayload, db: Session = Depends(get_db)):
    """Simulate an inbound email complaint."""
    citizen = db.query(User).filter(User.email == payload.sender_email).first()
    if not citizen:
        citizen = User(
            email=payload.sender_email,
            full_name=payload.sender_name or payload.sender_email,
            password_hash="webhook_user",
            role=UserRole.citizen,
        )
        db.add(citizen)
        db.commit()
        db.refresh(citizen)

    text = f"{payload.subject}. {payload.body}"
    return await _create_complaint_from_text(text, Channel.email, db, citizen)


@router.post("/whatsapp", response_model=ComplaintOut, status_code=201)
async def whatsapp_webhook(payload: WebhookWhatsAppPayload, db: Session = Depends(get_db)):
    """Simulate an inbound WhatsApp complaint."""
    citizen = db.query(User).filter(User.phone == payload.phone).first()
    if not citizen:
        citizen = User(
            email=f"{payload.phone}@whatsapp.local",
            phone=payload.phone,
            full_name=f"WA:{payload.phone}",
            password_hash="webhook_user",
            role=UserRole.citizen,
        )
        db.add(citizen)
        db.commit()
        db.refresh(citizen)

    return await _create_complaint_from_text(payload.message, Channel.whatsapp, db, citizen)
