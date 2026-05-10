"""
Celery Beat task — runs every 5 minutes.
Scans all open complaints, marks overdue ones, escalates P1/P2 breaches.
"""
from datetime import datetime, timezone
from app.worker import celery_app
from app.database import SessionLocal
from app.models.complaint import Complaint, ComplaintStatus, ComplaintEvent, Severity


@celery_app.task(name="app.tasks.sla_monitor.check_sla_breaches")
def check_sla_breaches():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        open_statuses = [ComplaintStatus.submitted, ComplaintStatus.assigned, ComplaintStatus.in_progress]

        overdue = (
            db.query(Complaint)
            .filter(
                Complaint.status.in_(open_statuses),
                Complaint.sla_deadline < now,
                Complaint.is_overdue == False,
            )
            .all()
        )

        for complaint in overdue:
            complaint.is_overdue = True

            if complaint.severity in (Severity.P1, Severity.P2):
                complaint.status = ComplaintStatus.escalated
                event = ComplaintEvent(
                    complaint_id=complaint.id,
                    event_type="escalated",
                    note=f"Auto-escalated: SLA deadline breached at {now.isoformat()}",
                )
                db.add(event)

        db.commit()
        return {"checked": len(overdue), "escalated": sum(1 for c in overdue if c.severity in (Severity.P1, Severity.P2))}
    finally:
        db.close()
