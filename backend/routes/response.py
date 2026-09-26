from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from schemas.models import ResponsePlanOut, ZoneIdRequest
from services import analysis_pipeline as pipeline
from services.response_engine import generate_plan

router = APIRouter(tags=["response"])


@router.post("/response-plan", response_model=ResponsePlanOut)
def create_response_plan(body: ZoneIdRequest, conn=Depends(get_db)):
    try:
        analysis = pipeline.analyze_zone(conn, body.zone_id, persist=True)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zone {body.zone_id} not found")
    zone = analysis["zone"]
    plan = generate_plan(zone, pipeline.spatial_for(conn, zone))
    return pipeline.save_plan(conn, plan)


@router.get("/response-plans", response_model=list[ResponsePlanOut])
def list_response_plans(conn=Depends(get_db)):
    return [pipeline.plan_row(r) for r in conn.execute("SELECT * FROM response_plans ORDER BY id DESC").fetchall()]
