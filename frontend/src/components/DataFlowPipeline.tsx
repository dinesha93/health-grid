import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { PIPELINE_STEPS, PRIVACY_STATEMENT } from "../data/constants";
import { GlassCard } from "./common/Primitives";

export function DataFlowPipeline() {
  return (
    <GlassCard testId="data-flow-pipeline" eyebrow="Architecture" title="HOW HEALTHGRID WORKS">
      <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
        {PIPELINE_STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col lg:flex-1 lg:flex-row lg:items-center">
            <div data-testid={`pipeline-step-${i + 1}`} className="fade-up flex-1 rounded-md border border-slate-800 bg-slate-950/50 p-3 transition-colors duration-200 hover:border-cyan-500/40" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="font-mono text-[10px] tracking-wider text-cyan-400">STEP {String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 font-display text-sm font-bold text-slate-100">{step.title}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{step.detail}</p>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <span className="flex justify-center py-1 text-slate-600 lg:px-1 lg:py-0">
                <ArrowDown className="h-4 w-4 lg:hidden" />
                <ArrowRight className="hidden h-4 w-4 lg:block" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

export function PrivacyNote() {
  return (
    <div data-testid="privacy-note" className="glass flex items-start gap-3 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
      <div>
        <p className="caption">Privacy by design</p>
        <p className="mt-1 text-sm text-slate-300">{PRIVACY_STATEMENT}</p>
        <p className="mt-1 text-xs text-slate-500">No patient names, phone numbers, medical record numbers, individual histories or exact patient locations are ingested or displayed. All values are synthetic and aggregated at zone level.</p>
      </div>
    </div>
  );
}
