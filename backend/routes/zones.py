import logging

from fastapi import APIRouter, Depends, HTTPException, Path

from database import get_db
from schemas.models import SimulationOut, ZoneDetailOut, ZoneIdRequest, ZoneOut
from services import analysis_pipeline as pipeline
from services import simulation_engine

router = APIRouter(tags=["zones"])
logger = logging.getLogger("healthgrid.zones")
ZoneId = Path(..., ge=1, le=6, description="Zone identifier (1-6)")


def _detail_or_404(conn, zone_id: int) -> dict:
    try:
        return pipeline.zone_detail(conn, zone_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")


@router.get("/zones", response_model=list[ZoneOut])
def get_zones(conn=Depends(get_db)):
    return pipeline.list_zones(conn)


@router.get("/zones/{zone_id}", response_model=ZoneDetailOut)
def get_zone(zone_id: int = ZoneId, conn=Depends(get_db)):
    return _detail_or_404(conn, zone_id)


@router.post("/zones/{zone_id}/simulate", response_model=SimulationOut)
def simulate_zone(zone_id: int = ZoneId, conn=Depends(get_db)):
    try:
        result = simulation_engine.simulate_zone(conn, zone_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
    return {"simulation": result, "detail": pipeline.zone_detail(conn, zone_id)}


@router.post("/zones/{zone_id}/reset", response_model=SimulationOut)
def reset_zone(zone_id: int = ZoneId, conn=Depends(get_db)):
    result = simulation_engine.reset_all(conn)
    return {"simulation": {"zone_id": zone_id, **{k: v for k, v in result.items() if k != "zones"}}, "detail": _detail_or_404(conn, zone_id)}


@router.post("/analyze-zone", response_model=ZoneDetailOut)
def analyze_zone(body: ZoneIdRequest, conn=Depends(get_db)):
    detail = _detail_or_404(conn, body.zone_id)
    if detail["zone"]["risk_level"] == "HIGH":
        detail["alert"] = pipeline.ensure_alert(conn, detail["zone"])
    return detail
