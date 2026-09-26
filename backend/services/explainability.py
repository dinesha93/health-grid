DISCLAIMER = (
    "The system identifies statistical abnormalities in aggregated signals. It does not diagnose diseases or confirm outbreaks."
)


def _statement(a: dict) -> str:
    if a["signal_key"] == "aqi" and a["current"] > 150:
        return f"{a['current']:.0f} — Environmental stress"
    if a["deviation_pct"] > 0:
        return f"{a['deviation_label']} above baseline"
    if a["deviation_pct"] < 0:
        return f"{a['deviation_label'][1:]}% below baseline".replace("%%", "%")
    return "At baseline"


def build_explanation(zone: dict, anomalies: list[dict], risk: dict) -> dict:
    flagged = [a for a in anomalies if a["severity"] != "NORMAL"]
    total_contrib = sum(c["contribution"] for c in risk["contributions"]) or 1.0
    contrib_by_key = {c["signal_key"]: c["contribution"] for c in risk["contributions"]}
    factors = [
        {
            "signal_key": a["signal_key"],
            "label": "Emergency department load" if a["signal_key"] == "hospital_load" else a["label"],
            "statement": _statement(a),
            "baseline": a["baseline"],
            "current": a["current"],
            "z_score": a["z_score"],
            "severity": a["severity"],
            "share_pct": round(contrib_by_key.get(a["signal_key"], 0) / total_contrib * 100) if flagged else 0,
        }
        for a in anomalies
    ]
    if risk["level"] == "HIGH":
        headline = f"WHY WAS ZONE {zone['id']} FLAGGED?"
    elif risk["level"] == "MODERATE":
        headline = f"WHY IS ZONE {zone['id']} ELEVATED?"
    else:
        headline = f"ZONE {zone['id']} SIGNAL ATTRIBUTION"
    summary = (
        "Multiple independent signals changed simultaneously."
        if len(flagged) >= 3
        else ("A limited set of signals deviates from baseline." if flagged else "All signals are within historical baseline ranges.")
    )
    return {
        "headline": headline,
        "flagged_signal_count": len(flagged),
        "factors": factors,
        "summary": summary,
        "disclaimer": DISCLAIMER,
    }
