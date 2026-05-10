"""
Smart assignment engine.
1. Find the ward that contains the complaint's lat/lon (PostGIS ST_Within)
2. Among officers assigned to that ward + matching department, pick the one with lowest current_load
3. If no officers match the ward, fall back to any officer in the right department
"""
import math
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.complaint import Complaint, Category
from app.models.user import User, UserRole
from app.models.ward import Ward

CATEGORY_DEPARTMENT = {
    Category.road: "Road",
    Category.water: "Water",
    Category.electricity: "Electricity",
    Category.sanitation: "Sanitation",
    Category.safety: "Safety",
    Category.other: None,
}


def find_ward(db: Session, lat: float, lon: float) -> Optional[Ward]:
    """Use PostGIS ST_Within to find which ward polygon contains this point."""
    result = db.execute(
        text("SELECT id FROM wards WHERE ST_Within(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), boundary_geom) LIMIT 1"),
        {"lat": lat, "lon": lon},
    ).fetchone()
    if result:
        return db.query(Ward).filter(Ward.id == result[0]).first()
    return None


def assign_officer(db: Session, complaint: Complaint) -> Optional[User]:
    department = CATEGORY_DEPARTMENT.get(complaint.category)

    query = db.query(User).filter(User.role == UserRole.officer, User.is_active == True)
    if department:
        query = query.filter(User.department == department)

    # Prefer officer in same ward
    if complaint.ward_id:
        ward_officers = query.filter(User.ward_id == complaint.ward_id).order_by(User.current_load).first()
        if ward_officers:
            return ward_officers

    # Fallback: any matching officer with lowest load
    return query.order_by(User.current_load).first()


def increment_load(db: Session, officer: User):
    officer.current_load += 1
    db.commit()


def decrement_load(db: Session, officer: User):
    if officer.current_load > 0:
        officer.current_load -= 1
    db.commit()
