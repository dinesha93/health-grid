"""Emergency response engine: hospital / ambulance recommendations and response plans derived from risk state."""
import math

from models.seed_data import AVG_RESPONSE_MINUTES

DEMO_LABEL = "DEMO RECOMMENDATION"


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def hospital_status(load: float) -> str:
    if load >= 85:
        return "CRITICAL"
    if load >= 70:
        return "STRAINED"
    return "STABLE"


def recommend_hospital(zone: dict, hospitals: list[dict]) -> dict | None:
    if zone["risk_level"] == "LOW" or not hospitals:
        return None
    max_beds = max(h["available_beds"] for h in hospitals) or 1
    ranked = []
    for h in hospitals:
        dist = haversine_km(zone["center_lat"], zone["center_lng"], h["lat"], h["lng"])
        load_score = 100 - h["emergency_load"]
        bed_score = h["available_beds"] / max_beds * 100
        dist_score = max(0.0, 100 - dist * 10)
        score = 0.30 * load_score + 0.25 * bed_score + 0.45 * dist_score
        eligible = h["emergency_load"] < 85 and h["available_beds"] > 0
        ranked.append({
            "id": h["id"], "name": h["name"], "facility": h["facility"], "emergency_load": h["emergency_load"],
            "available_beds": h["available_beds"], "icu_available": h["icu_available"], "distance_km": round(dist, 1),
            "score": round(score, 1), "eligible": eligible, "status": hospital_status(h["emergency_load"]),
        })
    ranked.sort(key=lambda r: (not r["eligible"], -r["score"]))
    best = ranked[0]
    return {
        "label": DEMO_LABEL,
        "recommended": best,
        "ranked": ranked,
        "rationale": (
            f"{best['name']} selected for Zone {zone['id']}: {best['emergency_load']:.0f}% emergency load, "
            f"{best['available_beds']} available beds, {best['distance_km']} km synthetic distance. "
            "Hospitals at ≥85% load are excluded from primary routing."
        ),
    }


def recommend_ambulances(zone: dict, summary: dict) -> dict | None:
    if zone["risk_level"] == "LOW":
        return None
    units = 2 if zone["risk_level"] == "HIGH" else 1
    return {
        "label": DEMO_LABEL,
        "additional_units": units,
        "headline": f"Deploy {units} additional ambulance{'s' if units > 1 else ''} toward Zone {zone['id']}.",
        "detail": f"{summary['available']} of {summary['total']} units currently available · avg response {summary['avg_response_time']} min.",
    }


def generate_plan(zone: dict, spatial: dict) -> dict:
    level = zone["risk_level"]
    neighbor_ids = sorted(n["id"] for n in spatial["neighbors"])
    monitoring = sorted({zone["id"], *neighbor_ids})
    neighbor_text = " and ".join(f"Zone {n}" for n in neighbor_ids) if len(neighbor_ids) <= 2 else ", ".join(f"Zone {n}" for n in neighbor_ids)
    if level == "HIGH":
        title, ambulances, beds = "HIGH PRIORITY RESPONSE PLAN", 2, 8
        actions = [
            f"Deploy {ambulances} additional ambulances toward Zone {zone['id']}",
            f"Prepare {beds} additional emergency beds",
            "Increase respiratory-care staffing",
            "Increase hospital readiness",
            f"Monitor {neighbor_text.replace('Zone', 'Zones', 1) if len(neighbor_ids) > 1 else neighbor_text}".replace("Zones 3 and Zone 5", "Zones 3 and 5"),
            "Continue monitoring incoming signals",
        ]
    elif level == "MODERATE":
        title, ambulances, beds = "ELEVATED MONITORING PLAN", 1, 4
        actions = [
            f"Pre-position {ambulances} additional ambulance near Zone {zone['id']}",
            f"Prepare {beds} additional emergency beds",
            "Brief respiratory-care staff on elevated signals",
            f"Monitor {neighbor_text}",
            "Continue monitoring incoming signals",
        ]
    else:
        title, ambulances, beds = "ROUTINE MONITORING PLAN", 0, 0
        actions = ["Continue baseline surveillance", "Maintain standard hospital and fleet readiness"]
    return {
        "zone_id": zone["id"],
        "title": title,
        "priority": level,
        "risk_score": zone["risk_score"],
        "actions": actions,
        "resource_impact": {"ambulances": ambulances, "beds": beds, "monitoring_zones": monitoring},
    }


def fleet_summary(units: list[dict]) -> dict:
    counts = {"AVAILABLE": 0, "ON_ROUTE": 0, "ASSIGNED": 0}
    for u in units:
        counts[u["status"]] = counts.get(u["status"], 0) + 1
    return {
        "total": len(units),
        "available": counts["AVAILABLE"],
        "on_route": counts["ON_ROUTE"],
        "assigned": counts["ASSIGNED"],
        "avg_response_time": AVG_RESPONSE_MINUTES,
    }
