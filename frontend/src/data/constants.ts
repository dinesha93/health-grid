import { Activity, Cpu, LayoutDashboard, MapPin, ShieldAlert, TrendingUp, type LucideIcon } from "lucide-react";
import type { RiskLevel, Severity } from "../types";

export const NAV_ITEMS: { id: string; path: string; label: string; short: string; icon: LucideIcon }[] = [
  { id: "command-center", path: "/", label: "Command Center", short: "Command", icon: LayoutDashboard },
  { id: "zones-map", path: "/zones", label: "Zones & Map Intelligence", short: "Zones", icon: MapPin },
  { id: "hospitals-fleet", path: "/hospitals", label: "Hospitals & Fleet", short: "Fleet", icon: Activity },
  { id: "alerts-response", path: "/alerts", label: "Alerts & Response", short: "Alerts", icon: ShieldAlert },
  { id: "analytics", path: "/analytics", label: "Predictive Analytics", short: "Analytics", icon: TrendingUp },
  { id: "how-it-works", path: "/how-it-works", label: "Architecture & Privacy", short: "System", icon: Cpu },
];

export const RISK_META: Record<RiskLevel, { color: string; text: string; badge: string; fill: string; glow: string }> = {
  LOW: { color: "#10B981", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", fill: "bg-emerald-500", glow: "shadow-[0_0_24px_rgba(16,185,129,0.25)]" },
  MODERATE: { color: "#F59E0B", text: "text-amber-400", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", fill: "bg-amber-500", glow: "shadow-[0_0_24px_rgba(245,158,11,0.25)]" },
  HIGH: { color: "#EF4444", text: "text-rose-400", badge: "bg-rose-500/15 text-rose-400 border-rose-500/40", fill: "bg-rose-500", glow: "shadow-[0_0_28px_rgba(239,68,68,0.35)]" },
};

export const SEVERITY_META: Record<Severity, { text: string; bar: string }> = {
  NORMAL: { text: "text-slate-400", bar: "bg-slate-600" },
  ELEVATED: { text: "text-amber-300", bar: "bg-amber-400" },
  HIGH: { text: "text-orange-400", bar: "bg-orange-500" },
  CRITICAL: { text: "text-rose-400", bar: "bg-rose-500" },
};

export const PIPELINE_STEPS = [
  { title: "City Health Signals", detail: "Hospitals, ambulances, pharmacies, environmental sensors" },
  { title: "Zone Aggregation", detail: "Signals rolled up into 6 geographic health zones" },
  { title: "Historical Baseline", detail: "48h rolling baseline & variance per signal" },
  { title: "Anomaly Detection", detail: "Percent deviation & z-score vs. baseline" },
  { title: "Risk Scoring", detail: "Weighted 0–100 model (35/25/15/15/10)" },
  { title: "Spatial Analysis", detail: "Neighbor zones checked for clustering" },
  { title: "Early Alert", detail: "Abnormal pattern flagged with explanation" },
  { title: "Emergency Resource Response", detail: "Ambulances, beds, staffing & monitoring plan" },
];

export const RISK_WEIGHTS = [
  { label: "Respiratory / symptom anomaly", weight: 35 },
  { label: "Hospital load anomaly", weight: 25 },
  { label: "Ambulance demand anomaly", weight: 15 },
  { label: "Environmental anomaly (AQI)", weight: 15 },
  { label: "Pharmacy demand anomaly", weight: 10 },
];

export const PRIVACY_STATEMENT =
  "HealthGrid uses aggregated city-level signals. Individual patient identity is not required for risk analysis.";

export const MAP_CENTER: [number, number] = [37.76, -122.44];
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
