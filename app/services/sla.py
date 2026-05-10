from datetime import datetime, timedelta, timezone
from app.config import settings
from app.models.complaint import Severity


SLA_HOURS = {
    Severity.P1: settings.SLA_P1_HOURS,
    Severity.P2: settings.SLA_P2_HOURS,
    Severity.P3: settings.SLA_P3_HOURS,
    Severity.P4: settings.SLA_P4_HOURS,
}


def calculate_deadline(severity: Severity) -> datetime:
    hours = SLA_HOURS.get(severity, settings.SLA_P4_HOURS)
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def is_breached(deadline: datetime) -> bool:
    if deadline is None:
        return False
    return datetime.now(timezone.utc) > deadline
