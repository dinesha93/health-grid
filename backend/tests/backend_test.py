"""HealthGrid backend API tests."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://city-health-intel.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module", autouse=True)
def reset_before_and_after():
    # ensure clean baseline
    try:
        requests.post(f"{API}/zones/4/reset", timeout=10)
    except Exception:
        pass
    yield
    try:
        requests.post(f"{API}/zones/4/reset", timeout=10)
    except Exception:
        pass


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "operational"
    assert data["zones_loaded"] == 6


# ---------- Zones ----------
def test_get_zones_baseline():
    r = requests.get(f"{API}/zones", timeout=10)
    assert r.status_code == 200
    zones = r.json()
    assert len(zones) == 6
    z4 = next(z for z in zones if z["id"] == 4)
    assert z4["risk_score"] == 32
    assert z4["risk_level"] == "LOW"


def test_get_zone_detail_baseline():
    r = requests.get(f"{API}/zones/4", timeout=10)
    assert r.status_code == 200
    d = r.json()
    for k in ("signals", "anomalies", "risk", "explanation", "spatial", "zone"):
        assert k in d, f"missing {k}"


def test_zone_validation_422():
    r = requests.get(f"{API}/zones/9", timeout=10)
    assert r.status_code == 422


# ---------- Simulation ----------
@pytest.fixture(scope="module")
def sim_result():
    # make sure baseline
    requests.post(f"{API}/zones/4/reset", timeout=10)
    time.sleep(0.3)
    r = requests.post(f"{API}/zones/4/simulate", timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def test_simulate_zone_risk(sim_result):
    zone = sim_result["detail"]["zone"]
    assert zone["risk_score"] == 84
    assert zone["risk_level"] == "HIGH"


def test_simulate_anomalies_deviation_labels(sim_result):
    anomalies = sim_result["detail"]["anomalies"]
    labels = [a.get("deviation_label") or a.get("deviation") for a in anomalies]
    joined = " ".join(str(x) for x in labels)
    for exp in ("+161%", "+183%", "+31%", "+35%"):
        assert exp in joined, f"expected {exp} in {joined}"


def test_simulate_spatial(sim_result):
    sp = sim_result["detail"]["spatial"]
    assert sp["cluster_detected"] is True
    zones = sp.get("zones") or [z.get("zone_id") for z in sp.get("cluster_zones", [])]
    # gather ids from any structure
    zone_ids = []
    for k in ("zones", "cluster_zones", "affected_zones"):
        for v in sp.get(k, []) or []:
            if isinstance(v, dict):
                zone_ids.append(v.get("zone_id") or v.get("id"))
            else:
                zone_ids.append(v)
    for zid in (3, 4, 5):
        assert zid in zone_ids, f"zone {zid} missing from spatial cluster: {sp}"


def test_simulate_hospital_recommendation(sim_result):
    hr = sim_result["detail"].get("hospital_recommendation") or sim_result.get("hospital_recommendation")
    assert hr is not None
    text = str(hr)
    assert "DEMO RECOMMENDATION" in text


def test_simulate_ambulance_recommendation(sim_result):
    ar = sim_result["detail"].get("ambulance_recommendation") or sim_result.get("ambulance_recommendation")
    assert ar is not None
    assert ar.get("additional_units") == 2


def test_simulate_response_plan(sim_result):
    rp = sim_result["detail"].get("response_plan") or sim_result.get("response_plan")
    assert rp is not None
    title = rp.get("title") or rp.get("headline") or ""
    assert "HIGH PRIORITY RESPONSE PLAN" in title
    actions = rp.get("actions", [])
    assert len(actions) == 6


def test_simulate_alert_created(sim_result):
    r = requests.get(f"{API}/alerts", timeout=10)
    assert r.status_code == 200
    alerts = r.json()
    unack = [a for a in alerts if not a.get("acknowledged")]
    assert len(unack) >= 1


# ---------- Hospitals after simulate ----------
def test_hospitals_after_simulate(sim_result):
    r = requests.get(f"{API}/hospitals", timeout=10)
    assert r.status_code == 200
    data = r.json()
    load = data.get("network_load") if isinstance(data, dict) else None
    if load is None and isinstance(data, dict):
        load = data.get("summary", {}).get("network_load")
    assert load is not None
    assert 60 <= load <= 75


# ---------- Ambulances after simulate ----------
def test_ambulances_after_simulate(sim_result):
    r = requests.get(f"{API}/ambulances", timeout=10)
    assert r.status_code == 200
    data = r.json()
    summary = data.get("summary", data)
    assert summary["total"] == 20
    assert summary["available"] == 10
    assert summary["assigned"] == 5


# ---------- Alert acknowledge ----------
def test_acknowledge_alert(sim_result):
    r = requests.get(f"{API}/alerts", timeout=10)
    alerts = r.json()
    unack = [a for a in alerts if not a.get("acknowledged")]
    if not unack:
        pytest.skip("no unacked alerts")
    aid = unack[0]["id"]
    r2 = requests.post(f"{API}/alerts/{aid}/acknowledge", timeout=10)
    assert r2.status_code == 200
    body = r2.json()
    assert body.get("acknowledged") in (1, True)


def test_acknowledge_nonexistent_alert():
    r = requests.post(f"{API}/alerts/999999/acknowledge", timeout=10)
    assert r.status_code == 404


# ---------- Response plan ----------
def test_post_response_plan():
    r = requests.post(f"{API}/response-plan", json={"zone_id": 4}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "actions" in data or "plan" in data or "response_plan" in data


# ---------- Analytics ----------
def test_analytics_zone4():
    r = requests.get(f"{API}/analytics", params={"zone_id": 4}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    series = data.get("series") or data.get("data") or data
    if isinstance(series, dict):
        # find list of points
        for v in series.values():
            if isinstance(v, list) and len(v) > 0:
                series = v
                break
    assert isinstance(series, list)
    assert len(series) == 24


# ---------- analyze-zone validation ----------
def test_analyze_zone_valid():
    r = requests.post(f"{API}/analyze-zone", json={"zone_id": 4}, timeout=10)
    assert r.status_code == 200


def test_analyze_zone_invalid():
    r = requests.post(f"{API}/analyze-zone", json={"zone_id": 99}, timeout=10)
    assert r.status_code == 422


# ---------- Reset ----------
def test_reset_restores_baseline():
    r = requests.post(f"{API}/zones/4/reset", timeout=10)
    assert r.status_code == 200
    time.sleep(0.3)
    z = requests.get(f"{API}/zones/4", timeout=10).json()
    zone = z["zone"]
    assert zone["risk_score"] == 32
    assert zone["risk_level"] == "LOW"
    amb = requests.get(f"{API}/ambulances", timeout=10).json()
    summary = amb.get("summary", amb)
    assert summary["available"] == 12
