import { DataFlowPipeline, PrivacyNote } from "../components/DataFlowPipeline";
import { GlassCard } from "../components/common/Primitives";
import { RISK_WEIGHTS } from "../data/constants";

export default function HowItWorks() {
  return (
    <div data-testid="how-it-works-page" className="space-y-5">
      <div>
        <p className="caption">Architecture & Privacy</p>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">From fragmented signals to early, explainable response</h2>
      </div>
      <DataFlowPipeline />
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard eyebrow="Anomaly detection" title="Baseline deviation" testId="method-anomaly">
          <p className="text-sm text-slate-300">Each current signal is compared against its 48-hour historical baseline. HealthGrid computes percentage deviation, a z-score using historical variance, a saturating 0–100 anomaly score and a severity band (NORMAL → ELEVATED → HIGH → CRITICAL).</p>
        </GlassCard>
        <GlassCard eyebrow="Risk scoring" title="Weighted 0–100 model" testId="method-risk">
          <ul className="space-y-1.5">
            {RISK_WEIGHTS.map((w) => (
              <li key={w.label} className="flex items-center gap-3 text-sm">
                <span className="w-10 font-mono font-bold text-cyan-300">{w.weight}%</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-500" style={{ width: `${w.weight * 2.5}%` }} /></div>
                <span className="w-40 text-xs text-slate-400 sm:w-48">{w.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[11px] text-slate-500">0–39 LOW · 40–69 MODERATE · 70–100 HIGH</p>
        </GlassCard>
        <GlassCard eyebrow="Spatial & response" title="Neighbors and resources" testId="method-spatial">
          <p className="text-sm text-slate-300">Adjacent zones are checked for elevated signals to flag potential spatial clusters without claiming an outbreak. The response engine then converts the risk state into concrete ambulance, bed, staffing and monitoring actions.</p>
        </GlassCard>
      </div>
      <PrivacyNote />
      <p data-testid="synthetic-notice" className="font-mono text-[11px] tracking-wider text-amber-400/80">SYNTHETIC DEMO DATA — This prototype uses synthetic data and is intended for hackathon demonstration.</p>
    </div>
  );
}
