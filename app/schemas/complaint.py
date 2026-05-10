from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.complaint import Category, Severity, ComplaintStatus, Channel


class ComplaintSubmit(BaseModel):
    text: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    channel: Channel = Channel.api


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    note: Optional[str] = None


class ComplaintEventOut(BaseModel):
    event_type: str
    note: Optional[str] = None
    timestamp: datetime
    actor_id: Optional[int] = None

    class Config:
        from_attributes = True


class ComplaintOut(BaseModel):
    id: int
    ticket_id: str
    text: str
    category: Optional[Category] = None
    severity: Optional[Severity] = None
    status: ComplaintStatus
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    ward_id: Optional[int] = None
    officer_id: Optional[int] = None
    sla_deadline: Optional[datetime] = None
    is_overdue: bool = False
    photo_url: Optional[str] = None
    resolution_note: Optional[str] = None
    channel: Channel
    created_at: datetime
    events: List[ComplaintEventOut] = []

    class Config:
        from_attributes = True


class WebhookEmailPayload(BaseModel):
    sender_email: str
    sender_name: Optional[str] = None
    subject: str
    body: str


class WebhookWhatsAppPayload(BaseModel):
    phone: str
    message: str
