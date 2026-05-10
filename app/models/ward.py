from sqlalchemy import Column, Integer, String, JSON
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship
from app.database import Base


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False, default="Pune")
    # PostGIS polygon boundary — used to find which ward a lat/lon falls inside
    boundary_geom = Column(Geometry("POLYGON", srid=4326), nullable=True)
    # officer_ids stored as JSON list for quick lookup without join
    officer_ids = Column(JSON, nullable=True, default=list)

    complaints = relationship("Complaint", back_populates="ward")
