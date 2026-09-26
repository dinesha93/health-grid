import json
import logging
import math
import os
import random
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from models.seed_data import AMBULANCE_SEED, BASELINES, HOSPITALS, ZONES
from models.tables import SCHEMA

logger = logging.getLogger("healthgrid.db")
DB_PATH = Path(__file__).parent / os.environ["SQLITE_PATH"]
HISTORY_HOURS = 48


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db():
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db():
    with db() as conn:
        yield conn


def init_db() -> None:
    with db() as conn:
        conn.executescript(SCHEMA)
        count = conn.execute("SELECT COUNT(*) FROM zones").fetchone()[0]
        if count == 0:
            seed(conn)
            logger.info("Seeded synthetic data into %s", DB_PATH)
    from services.analysis_pipeline import recalculate_all
    with db() as conn:
        recalculate_all(conn)


def _history_value(rng: random.Random, key: str, baseline: float, hour_index: int) -> float:
    wave = 1 + 0.05 * math.sin(2 * math.pi * hour_index / 24)
    if key == "hospital_load":
        return round(min(98, max(20, baseline + rng.gauss(0, 2.2) + 2.5 * math.sin(2 * math.pi * hour_index / 24))), 1)
    noise = rng.gauss(0, 0.07)
    value = baseline * wave * (1 + noise)
    return float(round(value)) if key in ("respiratory", "ambulance") else round(value, 1)


def seed(conn: sqlite3.Connection) -> None:
    ts = now_iso()
    for z in ZONES:
        lats = [p[0] for p in z["polygon"]]
        lngs = [p[1] for p in z["polygon"]]
        conn.execute(
            "INSERT INTO zones (id,name,population,center_lat,center_lng,polygon,neighbors,updated_at) VALUES (?,?,?,?,?,?,?,?)",
            (z["id"], z["name"], z["population"], sum(lats) / len(lats), sum(lngs) / len(lngs),
             json.dumps(z["polygon"]), json.dumps(z["neighbors"]), ts),
        )
        base_time = datetime.now(timezone.utc) - timedelta(hours=HISTORY_HOURS)
        for key, baseline in BASELINES[z["id"]].items():
            conn.execute(
                "INSERT INTO health_signals (zone_id,signal_key,current_value,baseline_value,updated_at) VALUES (?,?,?,?,?)",
                (z["id"], key, baseline, baseline, ts),
            )
            rng = random.Random(f"{z['id']}-{key}")
            rows = [
                (z["id"], key, _history_value(rng, key, baseline, h), (base_time + timedelta(hours=h)).isoformat(), 0)
                for h in range(HISTORY_HOURS)
            ]
            conn.executemany(
                "INSERT INTO historical_health_signals (zone_id,signal_key,value,recorded_at,is_simulated) VALUES (?,?,?,?,?)", rows
            )
    seed_resources(conn)


def seed_resources(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM hospitals")
    conn.execute("DELETE FROM ambulances")
    for h in HOSPITALS:
        conn.execute(
            "INSERT INTO hospitals (id,name,facility,zone_id,lat,lng,emergency_load,available_beds,total_beds,icu_available,icu_total,capacity_weight) "
            "VALUES (:id,:name,:facility,:zone_id,:lat,:lng,:emergency_load,:available_beds,:total_beds,:icu_available,:icu_total,:capacity_weight)",
            h,
        )
    for a in AMBULANCE_SEED:
        conn.execute(
            "INSERT INTO ambulances (id,status,lat,lng,zone_id,assigned_zone_id) VALUES (:id,:status,:lat,:lng,:zone_id,:assigned_zone_id)", a
        )
