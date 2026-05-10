from datetime import datetime, timezone, timedelta
from app.services.sla import calculate_deadline, is_breached
from app.models.complaint import Severity


def test_p1_deadline_is_4_hours():
    before = datetime.now(timezone.utc)
    deadline = calculate_deadline(Severity.P1)
    diff = (deadline - before).total_seconds() / 3600
    assert 3.9 < diff <= 4.1


def test_p4_deadline_is_7_days():
    before = datetime.now(timezone.utc)
    deadline = calculate_deadline(Severity.P4)
    diff = (deadline - before).total_seconds() / 3600
    assert 167 < diff <= 168.1


def test_is_breached_past():
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    assert is_breached(past) is True


def test_is_not_breached_future():
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    assert is_breached(future) is False


def test_none_deadline_not_breached():
    assert is_breached(None) is False
