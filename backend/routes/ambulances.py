from fastapi import APIRouter, Depends, Query

from database import get_db
from schemas.models import AmbulancesOut
from services import analysis_pipeline as pipeline
from services.response_engine import fleet_summary, recommend_ambulances

router = APIRouter(tags=["ambulances"])


@router.get("/ambulances", response_model=AmbulancesOut)
def get_ambulances(zone_id: int | None = Query(None, ge=1, le=6), conn=Depends(get_db)):
    units = pipeline.list_ambulances(conn)
    summary = fleet_summary(units)
    zones = pipeline.list_zones(conn)
    target = next((z for z in zones if z["id"] == zone_id), None) if zone_id else next((z for z in zones if z["risk_level"] == "HIGH"), None)
    return {"summary": summary, "units": units, "recommendation": recommend_ambulances(target, summary) if target else None}
