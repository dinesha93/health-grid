from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from schemas.models import AlertOut

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=list[AlertOut])
def get_alerts(conn=Depends(get_db)):
    return [dict(r) for r in conn.execute("SELECT * FROM alerts ORDER BY acknowledged ASC, id DESC").fetchall()]


@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(alert_id: int, conn=Depends(get_db)):
    row = conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    conn.execute("UPDATE alerts SET acknowledged=1 WHERE id=?", (alert_id,))
    return dict(conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone())
