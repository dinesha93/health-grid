"""Simulates a sudden multi-signal surge in a zone (with mild spillover to neighbors) and resets it."""
import json
import logging
import sqlite3
from datetime import datetime, timezone

from models.seed_data import BASELINES, HOSPITAL_SURGE
from services import analysis_pipeline as pipeline
from services.response_engine import generate_plan, haversine_km

logger = logging.getLogger("healthgrid.simulation")

# Explicit demo scenario for Zone 4 (matches the hackathon storyline)
SCENARIOS = {4: {"respiratory": 47, "ambulance": 17, "hospital_load": 89, "aqi": 178, "pharmacy": 135}}
SURGE_FACTORS = {"respiratory": 2.6, "ambulance": 2.8, "hospital_load": 31, "aqi": 1.9, "pharmacy": 1.35}
SPILLOVER = {"respiratory": 1.45, "ambulance": 1.35, "hospital_load": 5, "aqi": 1.15, "pharmacy": 1.07}
NEIGHBOR_SPILLOVER_OVERRIDE = {
    4: {5: {"respiratory": 31, "ambulance": 11, "hospital_load": 68, "aqi": 124, "pharmacy": 116},
        3: {"respiratory": 58, "ambulance": 21, "hospital_load": 79, "aqi": 150, "pharmacy": 122}},
}


def _apply(current: dict, factors: dict) -> dict:
    out = {}
    for key, base in current.items():
        f = factors[key]
        if key == "hospital_load":
            out[key] = round(min(98, base + f), 1)
        elif key in ("respiratory", "ambulance"):
            out[key] = float(round(base * f))
        else:
            out[key] = round(base * f, 1)
    return out


def _write_signals(conn: sqlite3.Connection, zone_id: int, values: dict, simulated: int) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    for key, value in values.items():
        conn.execute(
            "UPDATE health_signals SET current_value=?, updated_at=? WHERE zone_id=? AND signal_key=?", (value, ts, zone_id, key)
        )
        if simulated:
            conn.execute(
                "INSERT INTO historical_health_signals (zone_id, signal_key, value, recorded_at, is_simulated) VALUES (?,?,?,?,1)",
                (zone_id, key, value, ts),
            )


def simulate_zone(conn: sqlite3.Connection, zone_id: int) -> dict:
    zone = pipeline.load_zone(conn, zone_id)
    current = {k: v[0] for k, v in pipeline.load_signals(conn, zone_id).items()}
    target = SCENARIOS.get(zone_id) or _apply(current, SURGE_FACTORS)
    _write_signals(conn, zone_id, target, simulated=1)

    overrides = NEIGHBOR_SPILLOVER_OVERRIDE.get(zone_id, {})
    for n in zone["neighbors"]:
        n_current = {k: v[0] for k, v in pipeline.load_signals(conn, n).items()}
        _write_signals(conn, n, overrides.get(n) or _apply(n_current, SPILLOVER), simulated=1)

    pipeline.recalculate_all(conn)
    zone = pipeline.load_zone(conn, zone_id)
    events = [f"Signals updated for Zone {zone_id}", f"Spillover applied to neighbors {zone['neighbors']}", "Anomaly detection & risk scoring recalculated"]

    if zone["risk_level"] == "HIGH":
        _apply_resource_pressure(conn, zone)
        alert = pipeline.ensure_alert(conn, zone)
        spatial = pipeline.spatial_for(conn, zone)
        pipeline.save_plan(conn, generate_plan(zone, spatial))
        events += [f"Alert #{alert['id']} created: {alert['title']}", "Emergency response plan generated"]
    logger.info("Simulation applied to zone %s -> %s (%s)", zone_id, zone["risk_score"], zone["risk_level"])
    return {"zone_id": zone_id, "risk_score": zone["risk_score"], "risk_level": zone["risk_level"], "events": events}


def _apply_resource_pressure(conn: sqlite3.Connection, zone: dict) -> None:
    for hid, patch in HOSPITAL_SURGE.items():
        sets = ", ".join(f"{k}=?" for k in patch)
        conn.execute(f"UPDATE hospitals SET {sets} WHERE id=?", (*patch.values(), hid))
    available = [dict(r) for r in conn.execute("SELECT * FROM ambulances WHERE status='AVAILABLE'").fetchall()]
    available.sort(key=lambda a: haversine_km(a["lat"], a["lng"], zone["center_lat"], zone["center_lng"]))
    for unit in available[:2]:
        conn.execute("UPDATE ambulances SET status='ASSIGNED', assigned_zone_id=? WHERE id=?", (zone["id"], unit["id"]))


def reset_all(conn: sqlite3.Connection) -> dict:
    from database import seed_resources
    ts = datetime.now(timezone.utc).isoformat()
    for zone_id, baselines in BASELINES.items():
        for key, value in baselines.items():
            conn.execute("UPDATE health_signals SET current_value=?, updated_at=? WHERE zone_id=? AND signal_key=?", (value, ts, zone_id, key))
    conn.execute("DELETE FROM historical_health_signals WHERE is_simulated=1")
    conn.execute("DELETE FROM alerts")
    conn.execute("DELETE FROM response_plans")
    seed_resources(conn)
    pipeline.recalculate_all(conn)
    logger.info("Simulation reset: all zones restored to baseline")
    return {"status": "reset", "message": "All zones restored to historical baseline.", "zones": json.loads(json.dumps(pipeline.list_zones(conn)))}
