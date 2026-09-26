import { Ambulance, BedDouble, Building2, Star } from "lucide-react";
import type { AmbulanceRecommendation, AmbulancesResponse, Hospital, HospitalRecommendation } from "../../types";
import { GlassCard, Stat } from "../common/Primitives";

const STATUS_TONE: Record<string, string> = { STABLE: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", STRAINED: "text-amber-400 border-amber-500/30 bg-amber-500/10", CRITICAL: "text-rose-400 border-rose-500/40 bg-rose-500/15" };

export function HospitalCard({ h, recommended }: { h: Hospital; recommended?: boolean }) {
  const loadTone = h.emergency_load >= 85 ? "bg-rose-500" : h.emergency_load >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div data-testid={`hospital-card-${h.id}`} className={`glass p-4 ${recommended ? "border-cyan-500/50 shadow-[0_0_20px_rgba(14,165,233,0.15)]" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-display text-base font-bold text-slate-100">{h.name}</h4>
          <p className="text-xs text-slate-500">{h.facility} · Zone {h.zone_id}</p>
        </div>
        <span data-testid={`hospital-status-${h.id}`} className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider ${STATUS_TONE[h.status]}`}>{h.status}</span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs"><span className="caption">Emergency Load</span><span data-testid={`hospital-load-${h.id}`} className="font-mono font-bold text-slate-100">{Math.round(h.emergency_load)}%</span></div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-[width] duration-1000 ${loadTone}`} style={{ width: `${h.emergency_load}%` }} /></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded border border-slate-800 bg-slate-950/40 p-2"><p className="caption">Available Beds</p><p data-testid={`hospital-beds-${h.id}`} className="font-mono text-lg font-bold text-slate-100">{h.available_beds}<span className="text-xs text-slate-500">/{h.total_beds}</span></p></div>
        <div className="rounded border border-slate-800 bg-slate-950/40 p-2"><p className="caption">ICU Available</p><p data-testid={`hospital-icu-${h.id}`} className="font-mono text-lg font-bold text-slate-100">{h.icu_available}<span className="text-xs text-slate-500">/{h.icu_total}</span></p></div>
      </div>
      {recommended && <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-cyan-300"><Star className="h-3 w-3 fill-current" /> RECOMMENDED RECEIVING FACILITY</p>}
    </div>
  );
}

export function HospitalRecommendationCard({ rec }: { rec: HospitalRecommendation }) {
  return (
    <GlassCard testId="hospital-recommendation" eyebrow={rec.label} title={`Route to ${rec.recommended.name}`} accent="cyan" right={<Building2 className="h-5 w-5 text-cyan-400" />}>
      <p className="text-sm text-slate-300">{rec.rationale}</p>
      <div className="mt-3 space-y-1.5">
        {rec.ranked.map((h, i) => (
          <div key={h.id} data-testid={`hospital-rank-${h.id}`} className={`flex items-center justify-between rounded border px-3 py-1.5 font-mono text-xs ${i === 0 ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100" : "border-slate-800 text-slate-400"} ${!h.eligible ? "opacity-60" : ""}`}>
            <span>#{i + 1} {h.name}</span>
            <span>{Math.round(h.emergency_load)}% · {h.available_beds} beds · {h.distance_km} km{!h.eligible ? " · excluded" : ""}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AmbulancePanel({ data, showUnits = false }: { data: AmbulancesResponse; showUnits?: boolean }) {
  const { summary, recommendation, units } = data;
  return (
    <GlassCard testId="ambulance-panel" eyebrow="Ambulance Intelligence" title="Fleet Status" right={<Ambulance className="h-5 w-5 text-cyan-400" />}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Total" value={summary.total} testId="ambulance-total" />
        <Stat label="Available" value={summary.available} testId="ambulance-available" tone="text-sky-300" />
        <Stat label="On Route" value={summary.on_route} testId="ambulance-on-route" tone="text-violet-300" />
        <Stat label="Assigned" value={summary.assigned} testId="ambulance-assigned" tone="text-rose-300" />
        <Stat label="Avg Response" value={`${summary.avg_response_time}`} sub="minutes" testId="ambulance-response-time" />
      </div>
      {recommendation && <AmbulanceRecommendationCard rec={recommendation} />}
      {showUnits && (
        <div data-testid="ambulance-units" className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
          {units.map((u) => (
            <div key={u.id} data-testid={`ambulance-unit-${u.id}`} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5 font-mono text-[11px]">
              <span className="text-slate-200">{u.id}</span>
              <span className={u.status === "AVAILABLE" ? "text-sky-300" : u.status === "ON_ROUTE" ? "text-violet-300" : "text-rose-300"}>{u.status === "ASSIGNED" && u.assigned_zone_id ? `→ Z${u.assigned_zone_id}` : u.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export function AmbulanceRecommendationCard({ rec }: { rec: AmbulanceRecommendation }) {
  return (
    <div data-testid="ambulance-recommendation" className="mt-4 rounded-md border border-rose-500/40 bg-rose-950/20 p-3">
      <p className="caption text-rose-300/80">Recommended · {rec.label}</p>
      <p className="mt-1 flex items-center gap-2 font-display text-sm font-bold text-rose-100"><BedDouble className="hidden h-4 w-4" /><Ambulance className="h-4 w-4 text-rose-400" /> {rec.headline}</p>
      <p className="mt-1 text-xs text-slate-400">{rec.detail}</p>
    </div>
  );
}
