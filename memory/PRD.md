# HealthGrid — PRD

## Original problem statement
Build HEALTHGRID, a City-Wide Predictive Healthcare & Emergency Intelligence Platform ("Detect Earlier. Respond Smarter. Protect the City."). One-shot hackathon prototype: a dark futuristic city health command center that aggregates synthetic zone-level signals, detects anomalies vs historical baseline, computes a weighted risk score, runs spatial neighbor analysis, raises explainable alerts and generates emergency response recommendations. Core demo: Zone 4 LOW (32) → SIMULATE INCOMING DATA → HIGH (84) → alert, explanation, spatial cluster, hospital/ambulance recommendations, response plan, charts, reset.

## User choices
- Frontend: React + TypeScript + **Vite** (replaced CRA), Tailwind, Lucide, Recharts, Leaflet + OpenStreetMap
- Database: **SQLite** (auto-init + seed), not MongoDB
- Anomaly detection: statistical baseline-deviation (pct deviation + z-score), no ML deps
- Navigation: multi-page with sidebar (Command Center, Zones & Map, Hospitals & Fleet, Alerts & Response, Analytics, Architecture & Privacy)

## Architecture
- backend/: main.py (FastAPI app, lifespan init), server.py (supervisor entry), database.py (sqlite3), models/{tables,seed_data}.py, schemas/models.py, routes/{health,zones,alerts,hospitals,ambulances,response,analytics}.py, services/{anomaly_detection,risk_scoring,spatial_analysis,response_engine,simulation_engine,explainability,analysis_pipeline}.py
- frontend/: Vite + TS; src/{components,pages,services,data,types,hooks}; React Query + context for state; service layer in services/api.ts using REACT_APP_BACKEND_URL
- Env: backend/.env SQLITE_PATH; frontend/.env REACT_APP_BACKEND_URL (exposed via vite envPrefix)

## User personas
- City health authority / command-center operator (primary demo audience)
- Emergency dispatch coordinator (ambulance/hospital routing)
- Hackathon judges (explainability, privacy, architecture)

## Core requirements (static)
- 6 zones on Leaflet map, clickable, risk-coded LOW/MODERATE/HIGH
- Zone 4 baseline 32/100 LOW → simulate → 84/100 HIGH (backend-calculated)
- Anomaly detection vs baseline, weighted risk model 35/25/15/15/10
- Alert "ABNORMAL HEALTH PATTERN DETECTED" with View Zone / Acknowledge
- Explainability "WHY WAS ZONE 4 FLAGGED?" + disclaimer
- Spatial cluster Zones 3/4/5
- Hospital (DEMO RECOMMENDATION) + ambulance recommendations, response plan, charts, reset
- Synthetic data only; privacy statement; all 12 API endpoints

## Implemented (2026-06)
- Full backend with SQLite seeding (48h history), all endpoints, simulation/reset, alerts, plans, analytics
- Full frontend: 6 pages, KPI cards, dark OSM map with polygons/hospital/ambulance markers, zone panel with simulate/reset + analyzing overlay, alert feed, explainability, spatial, hospital/ambulance panels, response plan, Recharts charts, pipeline visualization, privacy note, loading/error/empty states
- README with setup & demo flow

## Backlog
- P1: Auto-refresh polling for live feel; keyboard shortcuts for demo
- P2: Export response plan (PDF), multi-zone simulation scenarios, historical replay slider
- P2: Forecasting (24–72h risk projection)
