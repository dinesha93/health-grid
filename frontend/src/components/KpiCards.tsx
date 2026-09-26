import { Activity, AlertTriangle, Ambulance, Building2, MapPinned } from "lucide-react";
import { useAlerts, useAmbulances, useHospitals, useZones } from "../hooks/useHealthGrid";

export function KpiCards() {
  const zones = useZones();
  const hospitals = useHospitals();
  const ambulances = useAmbulances();
  const alerts = useAlerts();
  const highRisk = zones.data?.filter((z) => z.risk_level === "HIGH").length ?? 0;
  const activeAlerts = alerts.data?.filter((a) => !a.acknowledged).length ?? 0;
  const kpis = [
    { id: "active-zones", label: "Active Zones", value: zones.data?.length, icon: MapPinned, tone: "text-cyan-300", loading: zones.isLoading, error: zones.isError },
    { id: "high-risk-zones", label: "High-Risk Zones", value: zones.data ? highRisk : undefined, icon: AlertTriangle, tone: highRisk > 0 ? "text-rose-400" : "text-emerald-400", loading: zones.isLoading, error: zones.isError, pulse: highRisk > 0 },
    { id: "hospital-network-load", label: "Hospital Network Load", value: hospitals.data ? `${hospitals.data.network_load}%` : undefined, icon: Building2, tone: (hospitals.data?.network_load ?? 0) >= 70 ? "text-amber-400" : "text-slate-100", loading: hospitals.isLoading, error: hospitals.isError },
    { id: "available-ambulances", label: "Available Ambulances", value: ambulances.data?.summary.available, icon: Ambulance, tone: "text-slate-100", loading: ambulances.isLoading, error: ambulances.isError },
    { id: "active-alerts", label: "Active Alerts", value: alerts.data ? activeAlerts : undefined, icon: Activity, tone: activeAlerts > 0 ? "text-rose-400" : "text-slate-100", loading: alerts.isLoading, error: alerts.isError, pulse: activeAlerts > 0 },
  ];
  return (
    <div data-testid="kpi-cards" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map(({ id, label, value, icon: Icon, tone, loading, error, pulse }, i) => (
        <div key={id} data-testid={`kpi-${id}`} className={`glass fade-up relative overflow-hidden p-4 ${pulse ? "border-rose-500/40" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center justify-between">
            <p className="caption">{label}</p>
            <Icon className={`h-4 w-4 ${pulse ? "text-rose-400" : "text-slate-600"}`} />
          </div>
          <p data-testid={`kpi-${id}-value`} className={`mt-2 font-mono text-2xl font-bold tabular-nums transition-colors duration-500 sm:text-3xl ${tone}`}>
            {error ? "—" : loading || value === undefined ? "··" : value}
          </p>
          {error && <p className="mt-1 text-[10px] text-rose-400">unavailable</p>}
          {pulse && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-rose-500/70" />}
        </div>
      ))}
    </div>
  );
}
