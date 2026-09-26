import { ArrowRight, Play, RotateCcw, Users } from "lucide-react";
import type { Signal, Zone } from "../../types";
import { RISK_META } from "../../data/constants";
import { useHealthGrid, useZoneDetail, useZones } from "../../hooks/useHealthGrid";
import { EmptyState, ErrorState, LoadingState, RiskBadge } from "../common/Primitives";
import { errorMessage } from "../../services/api";

function SignalCard({ s }: { s: Signal }) {
  const changed = Math.abs(s.current - s.baseline) > 0.01;
  const up = s.current > s.baseline;
  const isPct = s.unit === "%";
  const fmt = (v: number) => (isPct ? `${Math.round(v)}%` : Number.isInteger(v) ? v : v.toFixed(1));
  return (
    <div data-testid={`signal-card-${s.signal_key}`} className={`rounded-md border p-3 transition-colors duration-500 ${changed && up ? "border-rose-500/40 bg-rose-950/20" : "border-slate-800/80 bg-slate-950/40"}`}>
      <p className="caption truncate">{s.label}</p>
      <div className="mt-1.5 flex items-end gap-2">
        {changed ? (
          <>
            <span className="font-mono text-sm text-slate-500 line-through">{fmt(s.baseline)}</span>
            <ArrowRight className="mb-1 h-3 w-3 text-slate-600" />
            <span data-testid={`signal-value-${s.signal_key}`} className={`font-mono text-2xl font-bold tabular-nums ${up ? "text-rose-400" : "text-emerald-400"}`}>{fmt(s.current)}</span>
          </>
        ) : (
          <span data-testid={`signal-value-${s.signal_key}`} className="font-mono text-2xl font-bold tabular-nums text-slate-100">{fmt(s.current)}</span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-slate-500">baseline {fmt(s.baseline)}{!isPct && ` ${s.unit}`}</p>
    </div>
  );
}

function RiskGauge({ zone }: { zone: Zone }) {
  const meta = RISK_META[zone.risk_level];
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div data-testid="zone-risk-gauge" className="relative grid h-24 w-24 place-items-center">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={meta.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (zone.risk_score / 100) * c} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
      </svg>
      <div className="absolute text-center">
        <p data-testid="zone-risk-score" className="font-mono text-2xl font-bold leading-none" style={{ color: meta.color }}>{zone.risk_score}</p>
        <p className="font-mono text-[9px] tracking-wider text-slate-500">/ 100</p>
      </div>
    </div>
  );
}

export function ZoneDetailPanel({ compact = false }: { compact?: boolean }) {
  const { selectedZoneId, selectZone, phase, simulate, reset } = useHealthGrid();
  const zones = useZones();
  const detail = useZoneDetail(selectedZoneId);

  if (selectedZoneId === null) {
    return (
      <div data-testid="zone-detail-empty" className="glass flex h-full flex-col p-5">
        <p className="caption">Zone Intelligence</p>
        <h3 className="font-display text-lg font-bold text-slate-100">Select a zone</h3>
        <EmptyState title="Click a zone on the city map to inspect its health signals" hint="Tip: the demo storyline starts with Zone 4 (Eastside Industrial)." testId="zone-detail-empty-state" />
        <div className="mt-4 flex flex-wrap gap-2">
          {zones.data?.map((z) => (
            <button key={z.id} data-testid={`zone-quick-select-${z.id}`} onClick={() => selectZone(z.id)} className="rounded border border-slate-800 px-3 py-1.5 font-mono text-xs tracking-wider text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300">
              Z{z.id} <span style={{ color: RISK_META[z.risk_level].color }}>●</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (detail.isLoading) return <div className="glass p-5"><LoadingState label={`Loading Zone ${selectedZoneId} intelligence…`} /></div>;
  if (detail.isError || !detail.data) return <div className="glass p-5"><ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} /></div>;

  const { zone, signals, risk } = detail.data;
  const meta = RISK_META[zone.risk_level];
  const analyzing = phase === "analyzing";
  const isSimulated = signals.some((s) => Math.abs(s.current - s.baseline) > 0.01);

  return (
    <div data-testid={`zone-detail-panel-zone-${zone.id}`} className={`glass relative flex h-full flex-col overflow-hidden p-5 transition-shadow duration-700 ${zone.risk_level === "HIGH" ? "border-rose-500/40 " + meta.glow : ""}`}>
      {analyzing && (
        <div data-testid="analyzing-overlay" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#07090E]/85 backdrop-blur-md">
          <div className="radar h-16 w-16 border border-cyan-500/40" />
          <p className="font-mono text-sm tracking-[0.2em] text-cyan-300">ANALYZING INCOMING SIGNALS...</p>
          <p className="text-xs text-slate-500">Comparing against 48h historical baseline · scoring anomalies</p>
          <span className="scanline" />
        </div>
      )}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="caption">Zone Intelligence</p>
          <h3 data-testid="zone-detail-title" className="font-display text-2xl font-extrabold tracking-tight text-slate-50">ZONE {zone.id}</h3>
          <p className="text-sm text-slate-400">{zone.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span data-testid="zone-population" className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300"><Users className="h-3.5 w-3.5 text-slate-500" /> {zone.population.toLocaleString()} population</span>
            <RiskBadge level={zone.risk_level} size="lg" testId="zone-risk-badge" />
          </div>
        </div>
        <RiskGauge zone={zone} />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {signals.map((s) => <SignalCard key={s.signal_key} s={s} />)}
        <div className="rounded-md border border-slate-800/80 bg-slate-950/40 p-3">
          <p className="caption">Anomaly Index</p>
          <p data-testid="zone-anomaly-index" className="mt-1.5 font-mono text-2xl font-bold text-slate-100">{risk.anomaly_index}</p>
          <p className="mt-1 text-[10px] text-slate-500">baseline pressure {risk.baseline_pressure}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          data-testid="simulate-data-button"
          disabled={phase !== "idle"}
          onClick={() => simulate(zone.id)}
          className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-md border border-cyan-400/60 bg-cyan-500/15 px-5 py-3.5 font-display text-sm font-bold tracking-[0.15em] text-cyan-200 transition-[background-color,transform,box-shadow] duration-200 hover:bg-cyan-500/25 hover:shadow-[0_0_28px_rgba(14,165,233,0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" /> SIMULATE INCOMING DATA
        </button>
        <button
          data-testid="reset-simulation-button"
          disabled={phase !== "idle"}
          onClick={() => reset(zone.id)}
          className="flex items-center justify-center gap-2 rounded-md border border-slate-700 px-4 py-3.5 font-mono text-xs tracking-[0.15em] text-slate-300 transition-colors duration-200 hover:border-slate-500 hover:text-slate-100 disabled:opacity-50"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${phase === "resetting" ? "animate-spin" : ""}`} /> RESET SIMULATION
        </button>
      </div>
      {isSimulated && !compact && (
        <p data-testid="simulation-active-note" className="mt-2 font-mono text-[10px] tracking-wider text-amber-400/90">● SIMULATED SURGE ACTIVE — signals deviate from historical baseline</p>
      )}
    </div>
  );
}
