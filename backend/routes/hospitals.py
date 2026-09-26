from fastapi import APIRouter, Depends, Query

from database import get_db
from schemas.models import HospitalsOut
from services import analysis_pipeline as pipeline
from services.response_engine import recommend_hospital

router = APIRouter(tags=["hospitals"])


@router.get("/hospitals", response_model=HospitalsOut)
def get_hospitals(zone_id: int | None = Query(None, ge=1, le=6), conn=Depends(get_db)):
    hospitals = pipeline.list_hospitals(conn)
    recommendation = None
    zones = pipeline.list_zones(conn)
    target = next((z for z in zones if z["id"] == zone_id), None) if zone_id else next((z for z in zones if z["risk_level"] == "HIGH"), None)
    if target:
        recommendation = recommend_hospital(target, hospitals)
    return {"hospitals": hospitals, "network_load": pipeline.network_load(hospitals), "recommendation": recommendation}
