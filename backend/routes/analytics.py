from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_db
from schemas.models import AnalyticsOut
from services import analysis_pipeline as pipeline

router = APIRouter(tags=["analytics"])
POINTS = 24


def _trend(series: list[dict], key: str) -> dict:
    if len(series) < 2:
        return {"current": 0, "previous": 0, "change_pct": 0, "direction": "flat"}
    current = series[-1][key]
    window = [p[key] for p in series[-7:-1]] or [current]
    previous = sum(window) / len(window)
    change = (current - previous) / previous * 100 if previous else 0
    return {
        "current": current,
        "previous": round(previous, 1),
        "change_pct": round(change, 1),
        "direction": "up" if change > 3 else ("down" if change < -3 else "flat"),
    }


@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(zone_id: int = Query(4, ge=1, le=6), conn=Depends(get_db)):
    try:
        zone = pipeline.load_zone(conn, zone_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
    signals = pipeline.load_signals(conn, zone_id)
    baselines = {k: v[1] for k, v in signals.items()}
    history = pipeline.load_history(conn, zone_id)

    rows = conn.execute(
        "SELECT signal_key, value, recorded_at, is_simulated FROM historical_health_signals WHERE zone_id=? ORDER BY recorded_at", (zone_id,)
    ).fetchall()
    by_time: dict[str, dict] = {}
    for r in rows:
        point = by_time.setdefault(r["recorded_at"], {"time": r["recorded_at"], "simulated": bool(r["is_simulated"])})
        point[r["signal_key"]] = r["value"]

    series = []
    for point in list(by_time.values())[-POINTS:]:
        values = {k: point.get(k, baselines[k]) for k in baselines}
        point["risk_score"] = pipeline.score_values(zone, values, baselines, history)["score"]
        point["label"] = point["time"][11:16]
        series.append(point)

    hospitals = pipeline.list_hospitals(conn)
    return {
        "zone_id": zone_id,
        "zone_name": zone["name"],
        "series": series,
        "trends": {k: _trend(series, k) for k in ("ambulance", "aqi", "pharmacy", "respiratory")},
        "hospital_loads": [{"name": h["name"], "load": h["emergency_load"], "beds": h["available_beds"], "status": h["status"]} for h in hospitals],
        "city_risk": [{"zone_id": z["id"], "name": z["name"], "risk_score": z["risk_score"], "risk_level": z["risk_level"]} for z in pipeline.list_zones(conn)],
    }
