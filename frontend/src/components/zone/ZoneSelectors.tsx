import { useZones } from "../../hooks/useHealthGrid";
import { RISK_META } from "../../data/constants";
import { RiskBadge } from "../common/Primitives";

export function ZoneSelector({ value, onChange, testId = "zone-selector" }: { value: number | null; onChange: (id: number) => void; testId?: string }) {
  const zones = useZones();
  return (
    <div data-testid={testId} className="flex flex-wrap gap-1.5">
      {(zones.data ?? []).map((z) => (
        <button key={z.id} data-testid={`${testId}-${z.id}`} onClick={() => onChange(z.id)} className={`inline-flex items-center gap-2 rounded border px-2.5 py-1.5 font-mono text-xs tracking-wider transition-colors ${value === z.id ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-200" : "border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}>
          ZONE {z.id} <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK_META[z.risk_level].color }} />
        </button>
      ))}
    </div>
  );
}

export function ZoneGrid({ selected, onSelect }: { selected: number | null; onSelect: (id: number) => void }) {
  const zones = useZones();
  return (
    <div data-testid="zone-grid" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {(zones.data ?? []).map((z) => (
        <button key={z.id} data-testid={`zone-grid-card-${z.id}`} onClick={() => onSelect(z.id)} className={`glass p-3 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${selected === z.id ? "border-cyan-500/60" : ""}`}>
          <div className="flex items-center justify-between"><p className="font-mono text-xs tracking-wider text-slate-400">ZONE {z.id}</p><RiskBadge level={z.risk_level} size="sm" /></div>
          <p className="mt-1 truncate text-sm font-semibold text-slate-100">{z.name}</p>
          <p className="mt-1 font-mono text-2xl font-bold" style={{ color: RISK_META[z.risk_level].color }}>{z.risk_score}<span className="text-xs text-slate-500"> /100</span></p>
          <p className="text-[10px] text-slate-500">{z.population.toLocaleString()} residents · neighbors {z.neighbors.join(", ")}</p>
        </button>
      ))}
    </div>
  );
}
