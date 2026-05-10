from pydantic import BaseModel
from typing import List


class CategoryStat(BaseModel):
    category: str
    total: int
    resolved: int
    resolution_rate: float


class WardSLAStat(BaseModel):
    ward_id: int
    ward_name: str
    total: int
    breached: int
    breach_rate: float


class OfficerStat(BaseModel):
    officer_id: int
    officer_name: str
    assigned: int
    resolved: int
    avg_resolution_hours: float
    performance_score: float


class AnalyticsSummary(BaseModel):
    total_complaints: int
    resolved_today: int
    sla_breach_rate: float
    by_category: List[CategoryStat]
    by_ward: List[WardSLAStat]
    officer_performance: List[OfficerStat]
