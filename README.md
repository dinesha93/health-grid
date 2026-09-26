# HealthGrid — City-Wide Predictive Healthcare & Emergency Intelligence Platform

> **Detect Earlier. Respond Smarter. Protect the City.**
>
> **This prototype uses synthetic data and is intended for hackathon demonstration.** All values shown are aggregated, synthetic, city-level signals. No patient-level information exists anywhere in the system.

---

## Problem

Cities receive health-related signals from hospitals, ambulances, pharmacies and environmental sensors — but these signals live in separate silos. By the time a pattern is obvious in any one of them, hospital pressure has already escalated.

## Solution

HealthGrid fuses aggregated zone-level signals, compares them against a historical baseline, scores anomalies, computes a weighted 0–100 risk score per zone, checks neighboring zones for spatial clustering and converts the risk state into an explainable early alert plus a concrete emergency resource response plan.

HealthGrid is **not** a hospital booking, doctor consultation or patient management app. It is a **city health intelligence and emergency response command center**.

## Architecture

```
City Health Signals → Zone Aggregation → Historical Baseline → Anomaly Detection
      → Risk Scoring → Spatial Analysis → Early Alert → Emergency Resource Response
```

```
frontend/  (React 19 + TypeScript + Vite + Tailwind + Lucide + Recharts + Leaflet/OpenStreetMap)
  src/components/   KPI cards, Leaflet city map, zone panel, alerts, explainability, spatial, resources, charts
  src/pages/        Command Center · Zones & Map · Hospitals & Fleet · Alerts & Response · Analytics · How it works
  src/services/     api.ts – typed service layer over the FastAPI endpoints
  src/data/         constants (navigation, risk palette, pipeline steps)
  src/types/        shared TypeScript types
  src/hooks/        HealthGrid state (React Query + context)

backend/   (Python 3.11 + FastAPI + Pydantic + SQLite)
  main.py                    FastAPI app, CORS, lifespan (auto-init + seed SQLite), error handlers, logging
  server.py                  supervisor entrypoint (re-exports main:app)
  database.py                SQLite connection, schema init, synthetic seeding (48h history per signal)
  models/tables.py           DDL for zones, health_signals, historical_health_signals, hospitals, ambulances, alerts, response_plans
  models/seed_data.py        synthetic zones, baselines, hospitals, ambulance fleet
  schemas/models.py          Pydantic response/request schemas
  routes/                    health · zones · alerts · hospitals · ambulances · response · analytics
  services/
    anomaly_detection.py     baseline-deviation anomaly scoring (pct deviation, z-score, severity)
    risk_scoring.py          weighted 0–100 risk model + LOW/MODERATE/HIGH banding
    spatial_analysis.py      neighbor analysis & spatial cluster detection
    response_engine.py       hospital / ambulance recommendations & response plan generation
    simulation_engine.py     surge simulation & reset
    explainability.py        "WHY WAS ZONE X FLAGGED?" attribution
    analysis_pipeline.py     orchestration + persistence
```

## Features

- Command Center with live KPI cards (Active Zones, High-Risk Zones, Hospital Network Load, Available Ambulances, Active Alerts)
- Leaflet + OpenStreetMap city map with 6 clickable risk-coded zones, hospital markers and ambulance fleet markers
- Zone detail panel with baseline signal cards, risk gauge, **SIMULATE INCOMING DATA** and **RESET SIMULATION**
- Real backend anomaly detection + risk scoring (Zone 4: 32/100 LOW → 84/100 HIGH)
- Automatic alert: *ABNORMAL HEALTH PATTERN DETECTED* with View Zone / Acknowledge
- Explainable AI panel with per-signal attribution and the mandatory non-diagnostic disclaimer
- Spatial intelligence: *POTENTIAL SPATIAL HEALTH CLUSTER* across Zones 3 · 4 · 5
- Hospital network with capacity, ICU availability and a clearly labelled **DEMO RECOMMENDATION**
- Ambulance intelligence with fleet status and “Deploy 2 additional ambulances toward Zone 4”
- Emergency response engine generating the HIGH PRIORITY RESPONSE PLAN and resource impact
- Recharts analytics (respiratory over time, risk trajectory, hospital load) + trend indicators
- “HOW HEALTHGRID WORKS” pipeline visualisation and privacy statement
- Loading, error and empty states everywhere — a failed request never crashes the dashboard

## Technology stack

| Layer     | Stack |
|-----------|-------|
| Frontend  | React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React, Recharts, Leaflet + react-leaflet (OpenStreetMap tiles, no API key) |
| Backend   | Python 3.11, FastAPI, Pydantic v2, uvicorn |
| Database  | SQLite (auto-initialised & seeded on startup) |

## Anomaly detection

For each of the five signals (respiratory complaints, ambulance requests, hospital emergency load, AQI, pharmacy demand index) the service compares the **current value** with the **historical baseline** (48 hourly samples per zone):

- percentage deviation (`(current − baseline) / baseline`; percentage-points for hospital load)
- z-score using historical standard deviation
- saturating 0–100 anomaly score
- severity band: NORMAL · ELEVATED · HIGH · CRITICAL

A statistical baseline-deviation approach was chosen over Isolation Forest to keep the deployment dependency-free and fully explainable.

## Risk scoring

| Signal | Weight |
|--------|--------|
| Respiratory / symptom anomaly | 35 % |
| Hospital load anomaly | 25 % |
| Ambulance demand anomaly | 15 % |
| Environmental anomaly (AQI) | 15 % |
| Pharmacy demand anomaly | 10 % |

`risk = baseline_pressure + Σ(weight × anomaly_score) × (100 − baseline_pressure) / 100`

The baseline pressure index captures a zone's absolute load at baseline (so Zone 4 starts at 32/100), while the weighted anomaly index drives the uplift. Bands: **0–39 LOW · 40–69 MODERATE · 70–100 HIGH**.

## Spatial intelligence

Zones form a 3×2 grid; adjacency is stored per zone (Zone 4 ↔ Zones 3 & 5). When a zone is HIGH and at least one neighbor is MODERATE/HIGH, a *POTENTIAL SPATIAL HEALTH CLUSTER* is reported with the message “Adjacent zones are showing elevated signals. Continued monitoring is recommended.” No outbreak is ever claimed.

## Response engine

Derived from the risk state: HIGH → 6-step HIGH PRIORITY RESPONSE PLAN (+2 ambulances, +8 beds, monitor neighbors); MODERATE → elevated monitoring plan; LOW → routine plan. Hospitals are ranked by emergency load, available beds and synthetic distance (facilities ≥85 % load are excluded); the two closest available ambulances are assigned to the zone.

## Privacy

HealthGrid uses aggregated city-level signals. Individual patient identity is not required for risk analysis. No names, phone numbers, record numbers, histories or exact patient locations are stored or displayed.

## Installation

### Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# .env must contain: SQLITE_PATH="healthgrid.db"  CORS_ORIGINS="*"
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

SQLite is created and seeded automatically on first start (`backend/healthgrid.db`).

### Frontend setup

```bash
cd frontend
yarn install
# .env must contain: REACT_APP_BACKEND_URL=http://localhost:8001
yarn start          # Vite dev server on http://localhost:3000
yarn build          # type-check + production build
```

## API

| Method | Endpoint |
|--------|----------|
| GET  | `/api/health` |
| GET  | `/api/zones` |
| GET  | `/api/zones/{zone_id}` |
| POST | `/api/zones/{zone_id}/simulate` |
| POST | `/api/zones/{zone_id}/reset` |
| POST | `/api/analyze-zone` `{ "zone_id": 4 }` |
| GET  | `/api/alerts` |
| POST | `/api/alerts/{alert_id}/acknowledge` |
| GET  | `/api/hospitals` |
| GET  | `/api/ambulances` |
| POST | `/api/response-plan` `{ "zone_id": 4 }` |
| GET  | `/api/response-plans` |
| GET  | `/api/analytics?zone_id=4` |

## Demo flow

1. Open the **Command Center** — 6 zones, Zone 4 is LOW (32/100).
2. Click **Zone 4** on the map → baseline signals (18 · 6 · 58 % · 92 · 100).
3. Click **SIMULATE INCOMING DATA** → “Analyzing incoming signals…”.
4. Backend recalculates: Zone 4 → **84/100 HIGH**, map turns red, KPIs update.
5. Alert **ABNORMAL HEALTH PATTERN DETECTED** appears.
6. **WHY WAS ZONE 4 FLAGGED?** explains each signal deviation.
7. **POTENTIAL SPATIAL HEALTH CLUSTER** — Zone 3 MODERATE · Zone 4 HIGH · Zone 5 MODERATE.
8. Hospital **DEMO RECOMMENDATION** and “Deploy 2 additional ambulances toward Zone 4”.
9. **HIGH PRIORITY RESPONSE PLAN** with resource impact; charts reflect the surge.
10. **RESET SIMULATION** restores the baseline.

## Future improvements

- Streaming ingestion (Kafka / MQTT) from real aggregated feeds
- Isolation Forest / seasonal models on top of the statistical baseline
- Forecasting of zone risk 24–72 h ahead
- Role-based access for health authorities and dispatchers
- Multi-city tenancy and configurable zone geometry (GeoJSON import)
