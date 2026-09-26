"""Statistical baseline-deviation anomaly detection (current vs historical baseline)."""
from statistics import pstdev

SIGNALS = {
    "respiratory": {"label": "Respiratory complaints", "unit": "cases", "weight": 0.35, "saturation": 200.0, "mode": "pct", "category": "Symptom surveillance"},
    "ambulance": {"label": "Ambulance requests", "unit": "requests", "weight": 0.15, "saturation": 250.0, "mode": "pct", "category": "Emergency demand"},
    "hospital_load": {"label": "Hospital emergency load", "unit": "%", "weight": 0.25, "saturation": 40.0, "mode": "points", "category": "Hospital pressure"},
    "aqi": {"label": "AQI", "unit": "index", "weight": 0.15, "saturation": 120.0, "mode": "pct", "category": "Environmental"},
    "pharmacy": {"label": "Pharmacy demand index", "unit": "index", "weight": 0.10, "saturation": 60.0, "mode": "pct", "category": "Pharmacy demand"},
}
SIGNAL_ORDER = list(SIGNALS.keys())


def _severity(score: float) -> str:
    if score >= 70:
        return "CRITICAL"
    if score >= 45:
        return "HIGH"
    if score >= 20:
        return "ELEVATED"
    return "NORMAL"


def score_signal(key: str, current: float, baseline: float, history: list[float] | None = None) -> dict:
    meta = SIGNALS[key]
    if meta["mode"] == "points":
        deviation = current - baseline
    else:
        deviation = (current - baseline) / baseline * 100 if baseline else 0.0
    std = pstdev(history) if history and len(history) > 2 else 0.0
    std = max(std, baseline * 0.05 if meta["mode"] == "pct" else 1.5, 0.5)
    z = (current - baseline) / std
    anomaly_score = max(0.0, min(100.0, deviation / meta["saturation"] * 100))
    return {
        "signal_key": key,
        "label": meta["label"],
        "unit": meta["unit"],
        "category": meta["category"],
        "weight": meta["weight"],
        "baseline": round(baseline, 1),
        "current": round(current, 1),
        "deviation_pct": round(deviation, 1),
        "deviation_label": f"{'+' if deviation >= 0 else ''}{deviation:.0f}%",
        "z_score": round(z, 2),
        "anomaly_score": round(anomaly_score, 1),
        "severity": _severity(anomaly_score),
    }


def detect_anomalies(signals: dict[str, tuple[float, float]], history: dict[str, list[float]]) -> list[dict]:
    """signals: {key: (current, baseline)} ; history: {key: [historical values]}"""
    return [score_signal(k, signals[k][0], signals[k][1], history.get(k)) for k in SIGNAL_ORDER if k in signals]
