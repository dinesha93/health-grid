export type RiskLevel = "LOW" | "MODERATE" | "HIGH";
export type Severity = "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL";

export interface Zone {
  id: number;
  name: string;
  population: number;
  center_lat: number;
  center_lng: number;
  polygon: [number, number][];
  neighbors: number[];
  baseline_pressure: number;
  risk_score: number;
  risk_level: RiskLevel;
  updated_at?: string;
}

export interface Signal {
  signal_key: string;
  label: string;
  unit: string;
  current: number;
  baseline: number;
}

export interface Anomaly extends Signal {
  category: string;
  weight: number;
  deviation_pct: number;
  deviation_label: string;
  z_score: number;
  anomaly_score: number;
  severity: Severity;
}

export interface RiskContribution {
  signal_key: string;
  label: string;
  weight: number;
  anomaly_score: number;
  contribution: number;
}

export interface Risk {
  score: number;
  level: RiskLevel;
  baseline_pressure: number;
  anomaly_index: number;
  contributions: RiskContribution[];
  weights: Record<string, number>;
}

export interface ExplanationFactor {
  signal_key: string;
  label: string;
  statement: string;
  baseline: number;
  current: number;
  z_score: number;
  severity: Severity;
  share_pct: number;
}

export interface Explanation {
  headline: string;
  flagged_signal_count: number;
  factors: ExplanationFactor[];
  summary: string;
  disclaimer: string;
}

export interface NeighborZone {
  id: number;
  name: string;
  risk_level: RiskLevel;
  risk_score: number;
}

export interface Spatial {
  zone_id: number;
  neighbors: NeighborZone[];
  elevated_neighbor_count: number;
  cluster_detected: boolean;
  cluster_zones: NeighborZone[];
  title: string;
  message: string;
}

export interface RankedHospital {
  id: string;
  name: string;
  facility: string;
  emergency_load: number;
  available_beds: number;
  icu_available: number;
  distance_km: number;
  score: number;
  eligible: boolean;
  status: string;
}

export interface HospitalRecommendation {
  label: string;
  recommended: RankedHospital;
  ranked: RankedHospital[];
  rationale: string;
}

export interface AmbulanceRecommendation {
  label: string;
  additional_units: number;
  headline: string;
  detail: string;
}

export interface ResponsePlan {
  id?: number;
  zone_id: number;
  title: string;
  priority: RiskLevel;
  risk_score: number;
  actions: string[];
  resource_impact: { ambulances: number; beds: number; monitoring_zones: number[] };
  created_at?: string;
}

export interface Alert {
  id: number;
  zone_id: number;
  title: string;
  severity: string;
  risk_score: number;
  reason: string;
  acknowledged: number;
  created_at: string;
}

export interface ZoneDetail {
  zone: Zone;
  signals: Signal[];
  anomalies: Anomaly[];
  risk: Risk;
  explanation: Explanation;
  spatial: Spatial;
  hospital_recommendation: HospitalRecommendation | null;
  ambulance_recommendation: AmbulanceRecommendation | null;
  response_plan: ResponsePlan | null;
  alert: Alert | null;
}

export interface SimulationResult {
  simulation: { zone_id: number; risk_score?: number; risk_level?: RiskLevel; events?: string[]; message?: string };
  detail: ZoneDetail;
}

export interface Hospital {
  id: string;
  name: string;
  facility: string;
  zone_id: number;
  lat: number;
  lng: number;
  emergency_load: number;
  available_beds: number;
  total_beds: number;
  icu_available: number;
  icu_total: number;
  status: "STABLE" | "STRAINED" | "CRITICAL";
}

export interface HospitalsResponse {
  hospitals: Hospital[];
  network_load: number;
  recommendation: HospitalRecommendation | null;
}

export type AmbulanceStatus = "AVAILABLE" | "ON_ROUTE" | "ASSIGNED";

export interface AmbulanceUnit {
  id: string;
  status: AmbulanceStatus;
  lat: number;
  lng: number;
  zone_id: number;
  assigned_zone_id: number | null;
}

export interface AmbulancesResponse {
  summary: { total: number; available: number; on_route: number; assigned: number; avg_response_time: number };
  units: AmbulanceUnit[];
  recommendation: AmbulanceRecommendation | null;
}

export interface SeriesPoint {
  time: string;
  label: string;
  simulated: boolean;
  respiratory: number;
  ambulance: number;
  hospital_load: number;
  aqi: number;
  pharmacy: number;
  risk_score: number;
}

export interface Trend {
  current: number;
  previous: number;
  change_pct: number;
  direction: "up" | "down" | "flat";
}

export interface Analytics {
  zone_id: number;
  zone_name: string;
  series: SeriesPoint[];
  trends: Record<string, Trend>;
  hospital_loads: { name: string; load: number; beds: number; status: string }[];
  city_risk: { zone_id: number; name: string; risk_score: number; risk_level: RiskLevel }[];
}

export interface HealthStatus {
  status: string;
  database: string;
  zones_loaded: number;
  data_mode: string;
  timestamp: string;
}
