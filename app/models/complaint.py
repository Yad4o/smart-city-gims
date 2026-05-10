import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Category(str, enum.Enum):
    road = "Road"
    water = "Water"
    electricity = "Electricity"
    sanitation = "Sanitation"
    safety = "Safety"
    other = "Other"


class Severity(str, enum.Enum):
    P1 = "P1"   # Critical  — 4h SLA
    P2 = "P2"   # High      — 24h SLA
    P3 = "P3"   # Medium    — 72h SLA
    P4 = "P4"   # Low       — 168h SLA


class ComplaintStatus(str, enum.Enum):
    submitted = "submitted"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    escalated = "escalated"


class Channel(str, enum.Enum):
    api = "api"
    email = "email"
    whatsapp = "whatsapp"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, nullable=False, index=True)  # human-readable e.g. GRV-2025-00042
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    category = Column(Enum(Category), nullable=True)
    severity = Column(Enum(Severity), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.submitted, nullable=False)
    channel = Column(Enum(Channel), default=Channel.api, nullable=False)
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    is_overdue = Column(Boolean, default=False)
    photo_url = Column(String, nullable=True)        # proof uploaded by officer
    resolution_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    officer = relationship("User", back_populates="assigned_complaints", foreign_keys=[officer_id])
    ward = relationship("Ward", back_populates="complaints")
    events = relationship("ComplaintEvent", back_populates="complaint", cascade="all, delete-orphan")
    notifications = relationship("ComplaintNotification", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintEvent(Base):
    """Audit log — every status change, note, assignment is recorded here."""
    __tablename__ = "complaint_events"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)   # submitted / assigned / status_changed / note / escalated
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="events")
    actor = relationship("User", back_populates="events")


class ComplaintNotification(Base):
    __tablename__ = "complaint_notifications"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    channel = Column(Enum(Channel), nullable=False)
    recipient = Column(String, nullable=False)    # email or phone
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="sent")       # sent / failed

    complaint = relationship("Complaint", back_populates="notifications")
