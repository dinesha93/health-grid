from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(conn=Depends(get_db)):
    zones = conn.execute("SELECT COUNT(*) FROM zones").fetchone()[0]
    return {
        "status": "operational",
        "service": "HealthGrid API",
        "database": "sqlite",
        "zones_loaded": zones,
        "data_mode": "SYNTHETIC DEMO DATA",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
