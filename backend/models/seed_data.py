import random

LAT0, LAT1, LAT2 = 37.72, 37.76, 37.80
LNG = [-122.50, -122.46, -122.42, -122.38]


def rect(lat_a, lat_b, lng_a, lng_b):
    return [[lat_b, lng_a], [lat_b, lng_b], [lat_a, lng_b], [lat_a, lng_a]]


# 3 x 2 grid. Top row: 1 2 3 / Bottom row: 6 5 4  -> Zone 4 neighbors are 3 (north) and 5 (west)
ZONES = [
    {"id": 1, "name": "Northgate Heights", "population": 145000, "polygon": rect(LAT1, LAT2, LNG[0], LNG[1]), "neighbors": [2, 6]},
    {"id": 2, "name": "Central Metro", "population": 98000, "polygon": rect(LAT1, LAT2, LNG[1], LNG[2]), "neighbors": [1, 3, 5]},
    {"id": 3, "name": "Riverside East", "population": 124000, "polygon": rect(LAT1, LAT2, LNG[2], LNG[3]), "neighbors": [2, 4]},
    {"id": 4, "name": "Eastside Industrial", "population": 82000, "polygon": rect(LAT0, LAT1, LNG[2], LNG[3]), "neighbors": [3, 5]},
    {"id": 5, "name": "South Central", "population": 73000, "polygon": rect(LAT0, LAT1, LNG[1], LNG[2]), "neighbors": [2, 4, 6]},
    {"id": 6, "name": "Westbrook", "population": 61000, "polygon": rect(LAT0, LAT1, LNG[0], LNG[1]), "neighbors": [1, 5]},
]

# Historical baseline per zone (aggregated, synthetic)
BASELINES = {
    1: {"respiratory": 26, "ambulance": 10, "hospital_load": 55, "aqi": 78, "pharmacy": 100},
    2: {"respiratory": 15, "ambulance": 6, "hospital_load": 49, "aqi": 71, "pharmacy": 96},
    3: {"respiratory": 52, "ambulance": 19, "hospital_load": 76, "aqi": 141, "pharmacy": 118},
    4: {"respiratory": 18, "ambulance": 6, "hospital_load": 58, "aqi": 92, "pharmacy": 100},
    5: {"respiratory": 21, "ambulance": 8, "hospital_load": 63, "aqi": 108, "pharmacy": 108},
    6: {"respiratory": 24, "ambulance": 9, "hospital_load": 71, "aqi": 156, "pharmacy": 112},
}

HOSPITALS = [
    {"id": "H-A", "name": "Hospital A", "facility": "Central General", "zone_id": 2, "lat": 37.765, "lng": -122.425,
     "emergency_load": 58, "available_beds": 18, "total_beds": 120, "icu_available": 6, "icu_total": 20, "capacity_weight": 120},
    {"id": "H-B", "name": "Hospital B", "facility": "Eastside Medical Center", "zone_id": 4, "lat": 37.737, "lng": -122.398,
     "emergency_load": 87, "available_beds": 5, "total_beds": 100, "icu_available": 2, "icu_total": 16, "capacity_weight": 100},
    {"id": "H-C", "name": "Hospital C", "facility": "Westbrook Regional", "zone_id": 6, "lat": 37.738, "lng": -122.482,
     "emergency_load": 42, "available_beds": 27, "total_beds": 120, "icu_available": 9, "icu_total": 18, "capacity_weight": 120},
]

# Hospital state after a HIGH-risk event in Zone 4 (synthetic pressure propagation)
HOSPITAL_SURGE = {"H-B": {"emergency_load": 93, "available_beds": 3, "icu_available": 1}, "H-A": {"emergency_load": 64, "available_beds": 15}}

AVG_RESPONSE_MINUTES = 8.4


def _build_ambulances():
    rng = random.Random(42)
    units = []
    zone_by_id = {z["id"]: z for z in ZONES}
    statuses = ["AVAILABLE"] * 12 + ["ON_ROUTE"] * 5 + ["ASSIGNED"] * 3
    assigned_targets = {17: 3, 18: 6, 19: 2}
    for i in range(20):
        zone = zone_by_id[(i % 6) + 1]
        lats = [p[0] for p in zone["polygon"]]
        lngs = [p[1] for p in zone["polygon"]]
        units.append({
            "id": f"AMB-{i + 1:02d}",
            "status": statuses[i],
            "lat": round(rng.uniform(min(lats) + 0.005, max(lats) - 0.005), 5),
            "lng": round(rng.uniform(min(lngs) + 0.005, max(lngs) - 0.005), 5),
            "zone_id": zone["id"],
            "assigned_zone_id": assigned_targets.get(i),
        })
    return units


AMBULANCE_SEED = _build_ambulances()
