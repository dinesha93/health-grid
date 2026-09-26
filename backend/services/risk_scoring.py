"""Weighted risk model: 35% symptom / 25% hospital load / 15% ambulance / 15% environment / 10% pharmacy."""
from services.anomaly_detection import SIGNALS

# Absolute-level references used to compute a zone's baseline pressure index (0-100)
PRESSURE_REF = {
    "respiratory": ("per100k", 120.0),
    "ambulance": ("per100k", 40.0),
    "hospital_load": ("direct", 100.0),
    "aqi": ("scale", 300.0),
    "pharmacy": ("scale", 250.0),
}


def risk_level(score: float) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MODERATE"
    return "LOW"


def baseline_pressure(baselines: dict[str, float], population: int) -> float:
    pop_100k = max(population, 1) / 100000
    total = 0.0
    for key, (mode, ref) in PRESSURE_REF.items():
        value = baselines.get(key, 0.0)
        if mode == "per100k":
            level = value / pop_100k / ref * 100
        elif mode == "direct":
            level = value
        else:
            level = value / ref * 100
        total += SIGNALS[key]["weight"] * min(100.0, max(0.0, level))
    return round(total, 2)


def compute_risk(anomalies: list[dict], pressure: float) -> dict:
    anomaly_index = sum(a["weight"] * a["anomaly_score"] for a in anomalies)
    headroom = (100 - pressure) / 100
    score = max(0.0, min(100.0, pressure + anomaly_index * headroom))
    contributions = [
        {
            "signal_key": a["signal_key"],
            "label": a["label"],
            "weight": a["weight"],
            "anomaly_score": a["anomaly_score"],
            "contribution": round(a["weight"] * a["anomaly_score"] * headroom, 1),
        }
        for a in anomalies
    ]
    return {
        "score": int(round(score)),
        "level": risk_level(round(score)),
        "baseline_pressure": round(pressure, 1),
        "anomaly_index": round(anomaly_index, 1),
        "contributions": contributions,
        "weights": {k: v["weight"] for k, v in SIGNALS.items()},
    }
