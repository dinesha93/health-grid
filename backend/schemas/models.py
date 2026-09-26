from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

RiskLevel = Literal["LOW", "MODERATE", "HIGH"]


class ZoneOut(BaseModel):
    id: int
    name: str
    population: int
    center_lat: float
    center_lng: float
    polygon: list[list[float]]
    neighbors: list[int]
    baseline_pressure: float
    risk_score: int
    risk_level: RiskLevel
    updated_at: Optional[str] = None


class SignalOut(BaseModel):
    signal_key: str
    label: str
    unit: str
    current: float
    baseline: float


class AnomalyOut(BaseModel):
    signal_key: str
    label: str
    unit: str
    category: str
    weight: float
    baseline: float
    current: float
    deviation_pct: float
    deviation_label: str
    z_score: float
    anomaly_score: float
    severity: str


class RiskOut(BaseModel):
    score: int
    level: RiskLevel
    baseline_pressure: float
    anomaly_index: float
    contributions: list[dict[str, Any]]
    weights: dict[str, float]


class ExplanationOut(BaseModel):
    headline: str
    flagged_signal_count: int
    factors: list[dict[str, Any]]
    summary: str
    disclaimer: str


class SpatialOut(BaseModel):
    zone_id: int
    neighbors: list[dict[str, Any]]
    elevated_neighbor_count: int
    cluster_detected: bool
    cluster_zones: list[dict[str, Any]]
    title: str
    message: str


class ResponsePlanOut(BaseModel):
    id: Optional[int] = None
    zone_id: int
    title: str
    priority: RiskLevel
    risk_score: float
    actions: list[str]
    resource_impact: dict[str, Any]
    created_at: Optional[str] = None


class AlertOut(BaseModel):
    id: int
    zone_id: int
    title: str
    severity: str
    risk_score: float
    reason: str
    acknowledged: int
    created_at: str


class ZoneDetailOut(BaseModel):
    zone: ZoneOut
    signals: list[SignalOut]
    anomalies: list[AnomalyOut]
    risk: RiskOut
    explanation: ExplanationOut
    spatial: SpatialOut
    hospital_recommendation: Optional[dict[str, Any]] = None
    ambulance_recommendation: Optional[dict[str, Any]] = None
    response_plan: Optional[ResponsePlanOut] = None
    alert: Optional[AlertOut] = None


class SimulationOut(BaseModel):
    simulation: dict[str, Any]
    detail: ZoneDetailOut


class ZoneIdRequest(BaseModel):
    zone_id: int = Field(..., ge=1, le=6)


class HospitalOut(BaseModel):
    id: str
    name: str
    facility: str
    zone_id: int
    lat: float
    lng: float
    emergency_load: float
    available_beds: int
    total_beds: int
    icu_available: int
    icu_total: int
    status: str


class HospitalsOut(BaseModel):
    hospitals: list[HospitalOut]
    network_load: int
    recommendation: Optional[dict[str, Any]] = None


class AmbulanceUnitOut(BaseModel):
    id: str
    status: str
    lat: float
    lng: float
    zone_id: int
    assigned_zone_id: Optional[int] = None


class AmbulancesOut(BaseModel):
    summary: dict[str, Any]
    units: list[AmbulanceUnitOut]
    recommendation: Optional[dict[str, Any]] = None


class AnalyticsOut(BaseModel):
    zone_id: int
    zone_name: str
    series: list[dict[str, Any]]
    trends: dict[str, Any]
    hospital_loads: list[dict[str, Any]]
    city_risk: list[dict[str, Any]]
