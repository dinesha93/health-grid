"""Simple geographic neighbor analysis for spatial cluster detection."""

ELEVATED = {"MODERATE", "HIGH"}


def analyze_neighbors(zone: dict, zones_by_id: dict[int, dict]) -> dict:
    neighbors = [zones_by_id[n] for n in zone["neighbors"] if n in zones_by_id]
    neighbor_out = [
        {"id": n["id"], "name": n["name"], "risk_level": n["risk_level"], "risk_score": n["risk_score"]} for n in neighbors
    ]
    elevated = [n for n in neighbors if n["risk_level"] in ELEVATED]
    cluster = zone["risk_level"] == "HIGH" and len(elevated) > 0
    cluster_zones = sorted(
        [{"id": z["id"], "name": z["name"], "risk_level": z["risk_level"], "risk_score": z["risk_score"]} for z in [zone, *elevated]],
        key=lambda z: z["id"],
    )
    if cluster:
        title = "POTENTIAL SPATIAL HEALTH CLUSTER"
        message = "Adjacent zones are showing elevated signals. Continued monitoring is recommended."
    elif zone["risk_level"] == "HIGH":
        title = "LOCALIZED PATTERN"
        message = "Neighboring zones remain near baseline. The pattern appears localized; continued monitoring is recommended."
    else:
        title = "NO SPATIAL CLUSTER DETECTED"
        message = "Neighboring zones are within expected ranges."
    return {
        "zone_id": zone["id"],
        "neighbors": neighbor_out,
        "elevated_neighbor_count": len(elevated),
        "cluster_detected": cluster,
        "cluster_zones": cluster_zones if cluster else [],
        "title": title,
        "message": message,
    }
