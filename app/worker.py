from celery import Celery
from app.config import settings

celery_app = Celery(
    "smart_city_gims",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.sla_monitor"],
)

celery_app.conf.beat_schedule = {
    "sla-monitor-every-5-minutes": {
        "task": "app.tasks.sla_monitor.check_sla_breaches",
        "schedule": 300.0,  # every 5 minutes
    },
}
celery_app.conf.timezone = "UTC"
