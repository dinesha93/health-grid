"""Orchestrates: signals -> baseline -> anomaly detection -> risk scoring -> spatial analysis -> alerting."""
import json
import sqlite3
from datetime import datetime, timezone

from services.anomaly_detection import SIGNALS, detect_anomalies
from services.explainability import build_explanation
from services.response_engine import fleet_summary, hospital_status, recommend_ambulances, recommend_hospital
from services.risk_scoring import baseline_pressure, compute_risk
from services.spatial_analysis import analyze_neighbors

ALERT_TITLE = "ABNORMAL HEALTH PATTERN DETECTED"
ALERT_REASON = "Multiple health, emergency and environmental indicators are significantly above historical baseline."


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _zone_row(row: sqlite3.Row) -> dict:
    z = dict(row)
    z["polygon"] = json.loads(z["polygon"])
    z["neighbors"] = json.loads(z["neighbors"])
    z["risk_score"] = int(round(z["risk_score"]))
    return z


def load_zone(conn: sqlite3.Connection, zone_id: int) -> dict:
    row = conn.execute("SELECT * FROM zones WHERE id=?", (zone_id,)).fetchone()
    if row is None:
        raise KeyError(zone_id)
    return _zone_row(row)


def list_zones(conn: sqlite3.Connection) -> list[dict]:
    return [_zone_row(r) for r in conn.execute("SELECT * FROM zones ORDER BY id").fetchall()]


def load_signals(conn: sqlite3.Connection, zone_id: int) -> dict[str, tuple[float, float]]:
    rows = conn.execute("SELECT signal_key, current_value, baseline_value FROM health_signals WHERE zone_id=?", (zone_id,)).fetchall()
    return {r["signal_key"]: (r["current_value"], r["baseline_value"]) for r in rows}


def load_history(conn: sqlite3.Connection, zone_id: int) -> dict[str, list[float]]:
    rows = conn.execute(
        "SELECT signal_key, value FROM historical_health_signals WHERE zone_id=? AND is_simulated=0 ORDER BY recorded_at", (zone_id,)
    ).fetchall()
    out: dict[str, list[float]] = {}
    for r in rows:
        out.setdefault(r["signal_key"], []).append(r["value"])
    return out


def score_values(zone: dict, values: dict[str, float], baselines: dict[str, float], history: dict[str, list[float]]) -> dict:
    anomalies = detect_anomalies({k: (values[k], baselines[k]) for k in baselines if k in values}, history)
    return compute_risk(anomalies, baseline_pressure(baselines, zone["population"]))


def analyze_zone(conn: sqlite3.Connection, zone_id: int, persist: bool = True) -> dict:
    zone = load_zone(conn, zone_id)
    signals = load_signals(conn, zone_id)
    history = load_history(conn, zone_id)
    anomalies = detect_anomalies(signals, history)
    baselines = {k: v[1] for k, v in signals.items()}
    pressure = baseline_pressure(baselines, zone["population"])
    risk = compute_risk(anomalies, pressure)
    if persist:
        conn.execute(
            "UPDATE zones SET risk_score=?, risk_level=?, baseline_pressure=?, updated_at=? WHERE id=?",
            (risk["score"], risk["level"], pressure, _now(), zone_id),
        )
        zone.update(risk_score=risk["score"], risk_level=risk["level"], baseline_pressure=pressure)
    return {"zone": zone, "anomalies": anomalies, "risk": risk, "explanation": build_explanation(zone, anomalies, risk)}


def recalculate_all(conn: sqlite3.Connection) -> None:
    for z in list_zones(conn):
        analyze_zone(conn, z["id"], persist=True)


def spatial_for(conn: sqlite3.Connection, zone: dict) -> dict:
    return analyze_neighbors(zone, {z["id"]: z for z in list_zones(conn)})


def signal_cards(conn: sqlite3.Connection, zone_id: int) -> list[dict]:
    signals = load_signals(conn, zone_id)
    return [
        {"signal_key": k, "label": SIGNALS[k]["label"], "unit": SIGNALS[k]["unit"], "current": signals[k][0], "baseline": signals[k][1]}
        for k in SIGNALS if k in signals
    ]


def list_hospitals(conn: sqlite3.Connection) -> list[dict]:
    out = []
    for r in conn.execute("SELECT * FROM hospitals ORDER BY id").fetchall():
        h = dict(r)
        h["status"] = hospital_status(h["emergency_load"])
        out.append(h)
    return out


def network_load(hospitals: list[dict]) -> int:
    total_w = sum(h["capacity_weight"] for h in hospitals) or 1
    return int(round(sum(h["emergency_load"] * h["capacity_weight"] for h in hospitals) / total_w))


def list_ambulances(conn: sqlite3.Connection) -> list[dict]:
    return [dict(r) for r in conn.execute("SELECT * FROM ambulances ORDER BY id").fetchall()]


def ensure_alert(conn: sqlite3.Connection, zone: dict) -> dict:
    row = conn.execute("SELECT * FROM alerts WHERE zone_id=? AND acknowledged=0 ORDER BY id DESC LIMIT 1", (zone["id"],)).fetchone()
    if row:
        conn.execute("UPDATE alerts SET risk_score=?, severity=? WHERE id=?", (zone["risk_score"], zone["risk_level"], row["id"]))
        return {**dict(row), "risk_score": zone["risk_score"], "severity": zone["risk_level"]}
    cur = conn.execute(
        "INSERT INTO alerts (zone_id,title,severity,risk_score,reason,acknowledged,created_at) VALUES (?,?,?,?,?,0,?)",
        (zone["id"], ALERT_TITLE, zone["risk_level"], zone["risk_score"], ALERT_REASON, _now()),
    )
    return dict(conn.execute("SELECT * FROM alerts WHERE id=?", (cur.lastrowid,)).fetchone())


def latest_alert(conn: sqlite3.Connection, zone_id: int) -> dict | None:
    row = conn.execute("SELECT * FROM alerts WHERE zone_id=? ORDER BY id DESC LIMIT 1", (zone_id,)).fetchone()
    return dict(row) if row else None


def save_plan(conn: sqlite3.Connection, plan: dict) -> dict:
    conn.execute("DELETE FROM response_plans WHERE zone_id=?", (plan["zone_id"],))
    cur = conn.execute(
        "INSERT INTO response_plans (zone_id,title,priority,risk_score,actions,resource_impact,created_at) VALUES (?,?,?,?,?,?,?)",
        (plan["zone_id"], plan["title"], plan["priority"], plan["risk_score"], json.dumps(plan["actions"]), json.dumps(plan["resource_impact"]), _now()),
    )
    return plan_row(conn.execute("SELECT * FROM response_plans WHERE id=?", (cur.lastrowid,)).fetchone())


def plan_row(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    p = dict(row)
    p["actions"] = json.loads(p["actions"])
    p["resource_impact"] = json.loads(p["resource_impact"])
    return p


def latest_plan(conn: sqlite3.Connection, zone_id: int) -> dict | None:
    return plan_row(conn.execute("SELECT * FROM response_plans WHERE zone_id=? ORDER BY id DESC LIMIT 1", (zone_id,)).fetchone())


def zone_detail(conn: sqlite3.Connection, zone_id: int) -> dict:
    analysis = analyze_zone(conn, zone_id, persist=True)
    zone = analysis["zone"]
    spatial = spatial_for(conn, zone)
    hospitals = list_hospitals(conn)
    summary = fleet_summary(list_ambulances(conn))
    return {
        "zone": zone,
        "signals": signal_cards(conn, zone_id),
        "anomalies": analysis["anomalies"],
        "risk": analysis["risk"],
        "explanation": analysis["explanation"],
        "spatial": spatial,
        "hospital_recommendation": recommend_hospital(zone, hospitals),
        "ambulance_recommendation": recommend_ambulances(zone, summary),
        "response_plan": latest_plan(conn, zone_id),
        "alert": latest_alert(conn, zone_id),
    }
