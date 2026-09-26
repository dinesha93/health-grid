SCHEMA = """
CREATE TABLE IF NOT EXISTS zones (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  population INTEGER NOT NULL,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  polygon TEXT NOT NULL,
  neighbors TEXT NOT NULL,
  baseline_pressure REAL NOT NULL DEFAULT 0,
  risk_score REAL NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS health_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL REFERENCES zones(id),
  signal_key TEXT NOT NULL,
  current_value REAL NOT NULL,
  baseline_value REAL NOT NULL,
  updated_at TEXT,
  UNIQUE(zone_id, signal_key)
);

CREATE TABLE IF NOT EXISTS historical_health_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL REFERENCES zones(id),
  signal_key TEXT NOT NULL,
  value REAL NOT NULL,
  recorded_at TEXT NOT NULL,
  is_simulated INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_hist_zone ON historical_health_signals(zone_id, signal_key, recorded_at);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  facility TEXT NOT NULL,
  zone_id INTEGER NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  emergency_load REAL NOT NULL,
  available_beds INTEGER NOT NULL,
  total_beds INTEGER NOT NULL,
  icu_available INTEGER NOT NULL,
  icu_total INTEGER NOT NULL,
  capacity_weight REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS ambulances (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  zone_id INTEGER NOT NULL,
  assigned_zone_id INTEGER
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  risk_score REAL NOT NULL,
  reason TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS response_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  priority TEXT NOT NULL,
  risk_score REAL NOT NULL,
  actions TEXT NOT NULL,
  resource_impact TEXT NOT NULL,
  created_at TEXT NOT NULL
);
"""
