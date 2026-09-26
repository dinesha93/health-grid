import { ClipboardList, Sparkles } from "lucide-react";
import type { ResponsePlan, Zone } from "../../types";
import { RISK_META } from "../../data/constants";
import { useHealthGrid } from "../../hooks/useHealthGrid";
import { EmptyState, GlassCard, Stat } from "../common/Primitives";

export function ResponsePlanPanel({ plan, zone }: { plan: ResponsePlan | null; zone: Zone }) {
  const { generatePlan } = useHealthGrid();
  const meta = RISK_META[plan?.priority ?? zone.risk_level];
  return (
    <GlassCard testId="response-plan-panel" eyebrow="Emergency Response Engine" title={plan ? plan.title : "Response Plan"} accent={plan?.priority === "HIGH" ? "HIGH" : undefined}
      right={
        <button data-testid="generate-response-plan-button" onClick={() => generatePlan(zone.id)} className="inline-flex items-center gap-2 rounded-md border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] tracking-wider text-cyan-200 transition-colors hover:bg-cyan-500/20">
          <Sparkles className="h-3.5 w-3.5" /> GENERATE RESPONSE PLAN
        </button>
      }>
      {!plan ? (
        <EmptyState title={`No response plan for Zone ${zone.id}`} hint="Plans are generated automatically when a zone reaches HIGH risk, or on demand from the current risk state." testId="response-plan-empty" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <ol data-testid="response-plan-actions" className="space-y-2">
            {plan.actions.map((a, i) => (
              <li key={i} data-testid={`response-action-${i + 1}`} className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-xs font-bold text-slate-950" style={{ background: meta.color }}>{i + 1}</span>
                <span className="text-sm text-slate-200">{a}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-2">
            <p className="caption flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Resource Impact</p>
            <Stat label="Ambulances" value={`+${plan.resource_impact.ambulances}`} testId="plan-impact-ambulances" tone="text-rose-300" />
            <Stat label="Beds" value={`+${plan.resource_impact.beds}`} testId="plan-impact-beds" tone="text-amber-300" />
            <Stat label="Monitoring" value={`Zones ${plan.resource_impact.monitoring_zones.join(", ")}`} testId="plan-impact-monitoring" tone="text-cyan-300 text-base" />
            <p className="font-mono text-[10px] text-slate-500">PRIORITY {plan.priority} · RISK {Math.round(plan.risk_score)}/100</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
