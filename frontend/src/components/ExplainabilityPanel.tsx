import { Brain, Info } from "lucide-react";
import type { ZoneDetail } from "../types";
import { SEVERITY_META } from "../data/constants";
import { GlassCard } from "./common/Primitives";

export function ExplainabilityPanel({ detail }: { detail: ZoneDetail }) {
  const { explanation, zone, risk } = detail;
  const flagged = explanation.flagged_signal_count > 0;
  return (
    <GlassCard testId={`explainability-why-flagged-zone-${zone.id}`} eyebrow="Explainable AI" title={explanation.headline} accent={zone.risk_level === "HIGH" ? "HIGH" : undefined}
      right={<Brain className={`h-5 w-5 ${zone.risk_level === "HIGH" ? "text-rose-400" : "text-cyan-400"}`} />}>
      <ul className="space-y-3">
        {explanation.factors.map((f) => {
          const sev = SEVERITY_META[f.severity];
          return (
            <li key={f.signal_key} data-testid={`explain-factor-${f.signal_key}`} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-slate-200">{f.label}</p>
              <p data-testid={`explain-statement-${f.signal_key}`} className={`text-right font-mono text-sm font-semibold ${sev.text}`}>{f.statement}</p>
              <div className="col-span-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full rounded-full transition-[width] duration-1000 ease-out ${sev.bar}`} style={{ width: `${flagged ? Math.max(f.share_pct, 2) : 0}%` }} />
                </div>
                <span className="w-24 text-right font-mono text-[10px] text-slate-500">{flagged ? `${f.share_pct}% of uplift` : "baseline"} · z {f.z_score}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/50 p-3">
        <p data-testid="explain-summary" className={`text-sm font-semibold ${flagged ? "text-slate-100" : "text-slate-300"}`}>{explanation.summary}</p>
        <p className="mt-1 font-mono text-[10px] tracking-wider text-slate-500">
          RISK = baseline pressure {risk.baseline_pressure} + anomaly index {risk.anomaly_index} × headroom → <span className="text-slate-300">{risk.score}/100</span>
        </p>
      </div>
      <p data-testid="explain-disclaimer" className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {explanation.disclaimer}
      </p>
    </GlassCard>
  );
}
