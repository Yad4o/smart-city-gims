from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.complaint import Complaint, ComplaintStatus, ComplaintEvent
from app.models.user import User, UserRole
from app.models.ward import Ward
from app.schemas.analytics import AnalyticsSummary, CategoryStat, WardSLAStat, OfficerStat
from app.utils.auth import require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsSummary)
def get_analytics(
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.admin)),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total = db.query(func.count(Complaint.id)).scalar()
    resolved_today = db.query(func.count(Complaint.id)).filter(
        Complaint.status == ComplaintStatus.resolved,
        Complaint.updated_at >= today_start,
    ).scalar()

    overdue_count = db.query(func.count(Complaint.id)).filter(Complaint.is_overdue == True).scalar()
    sla_breach_rate = round(overdue_count / total, 4) if total else 0.0

    # By category
    cat_rows = db.query(
        Complaint.category,
        func.count(Complaint.id).label("total"),
        func.sum(case((Complaint.status == ComplaintStatus.resolved, 1), else_=0)).label("resolved"),
    ).group_by(Complaint.category).all()

    by_category = [
        CategoryStat(
            category=str(r.category),
            total=r.total,
            resolved=r.resolved or 0,
            resolution_rate=round((r.resolved or 0) / r.total, 4) if r.total else 0.0,
        )
        for r in cat_rows
    ]

    # By ward
    ward_rows = db.query(
        Ward.id,
        Ward.name,
        func.count(Complaint.id).label("total"),
        func.sum(case((Complaint.is_overdue == True, 1), else_=0)).label("breached"),
    ).join(Complaint, Complaint.ward_id == Ward.id, isouter=True).group_by(Ward.id, Ward.name).all()

    by_ward = [
        WardSLAStat(
            ward_id=r.id,
            ward_name=r.name,
            total=r.total or 0,
            breached=r.breached or 0,
            breach_rate=round((r.breached or 0) / r.total, 4) if r.total else 0.0,
        )
        for r in ward_rows
    ]

    # Officer performance
    officer_rows = db.query(
        User.id,
        User.full_name,
        func.count(Complaint.id).label("assigned"),
        func.sum(case((Complaint.status == ComplaintStatus.resolved, 1), else_=0)).label("resolved"),
    ).join(Complaint, Complaint.officer_id == User.id, isouter=True).filter(
        User.role == UserRole.officer
    ).group_by(User.id, User.full_name).all()

    officer_performance = []
    for r in officer_rows:
        res = r.resolved or 0
        assigned = r.assigned or 0
        resolution_rate = res / assigned if assigned else 0
        performance_score = round(resolution_rate * 100, 1)
        officer_performance.append(OfficerStat(
            officer_id=r.id,
            officer_name=r.full_name,
            assigned=assigned,
            resolved=res,
            avg_resolution_hours=0.0,
            performance_score=performance_score,
        ))

    return AnalyticsSummary(
        total_complaints=total,
        resolved_today=resolved_today,
        sla_breach_rate=sla_breach_rate,
        by_category=by_category,
        by_ward=by_ward,
        officer_performance=officer_performance,
    )
