import { Network } from "lucide-react";
import type { Spatial, Zone } from "../../types";
import { RISK_META } from "../../data/constants";
import { GlassCard, RiskBadge } from "../common/Primitives";

export function SpatialClusterPanel({ spatial, zone }: { spatial: Spatial; zone: Zone }) {
  const rows = spatial.cluster_detected ? spatial.cluster_zones : [{ id: zone.id, name: zone.name, risk_level: zone.risk_level, risk_score: zone.risk_score }, ...spatial.neighbors].sort((a, b) => a.id - b.id);
  return (
    <GlassCard testId="spatial-cluster-panel" eyebrow="Spatial Intelligence" title={spatial.title} accent={spatial.cluster_detected ? "MODERATE" : undefined}
      right={<Network className={`h-5 w-5 ${spatial.cluster_detected ? "text-amber-400" : "text-cyan-400"}`} />}>
      <div className="flex items-stretch gap-2">
        {rows.map((z) => (
          <div key={z.id} data-testid={`spatial-zone-${z.id}`} className={`flex-1 rounded-md border p-3 text-center ${z.id === zone.id ? "border-slate-500 bg-slate-800/60" : "border-slate-800 bg-slate-950/40"}`}>
            <p className="font-mono text-xs tracking-wider text-slate-400">ZONE {z.id}</p>
            <p className="mt-1 font-mono text-2xl font-bold" style={{ color: RISK_META[z.risk_level].color }}>{z.risk_score}</p>
            <div className="mt-1 flex justify-center"><RiskBadge level={z.risk_level} size="sm" /></div>
            {z.id !== zone.id && <p className="mt-1 text-[10px] text-slate-500">neighbor</p>}
          </div>
        ))}
      </div>
      <p data-testid="spatial-message" className="mt-4 text-sm text-slate-300">{spatial.message}</p>
      <p className="mt-1 font-mono text-[10px] tracking-wider text-slate-500">
        NEIGHBORS OF ZONE {zone.id}: {spatial.neighbors.map((n) => `Z${n.id}`).join(", ")} · ELEVATED: {spatial.elevated_neighbor_count}
      </p>
    </GlassCard>
  );
}
