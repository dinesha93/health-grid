import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { RiskLevel } from "../../types";
import { RISK_META } from "../../data/constants";

export function GlassCard({ title, eyebrow, right, children, className = "", testId, accent }: {
  title?: string; eyebrow?: string; right?: ReactNode; children: ReactNode; className?: string; testId?: string; accent?: RiskLevel | "cyan";
}) {
  const accentClass = accent === "HIGH" ? "border-rose-500/50 bg-rose-950/20 shadow-[0_0_25px_rgba(239,68,68,0.15)]"
    : accent === "MODERATE" ? "border-amber-500/40 bg-amber-950/10"
    : accent === "cyan" ? "border-cyan-500/40 shadow-[0_0_20px_rgba(14,165,233,0.12)]" : "";
  return (
    <section data-testid={testId} className={`glass fade-up p-4 sm:p-5 ${accentClass} ${className}`}>
      {(title || eyebrow || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="caption">{eyebrow}</p>}
            {title && <h3 className="font-display text-base font-bold tracking-tight text-slate-100 md:text-lg">{title}</h3>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function RiskBadge({ level, size = "md", testId }: { level: RiskLevel; size?: "sm" | "md" | "lg"; testId?: string }) {
  const meta = RISK_META[level];
  const sizing = size === "lg" ? "px-3 py-1 text-sm" : size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold tracking-wider ${sizing} ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.fill} ${level === "HIGH" ? "pulse-dot" : ""}`} />
      {level}
    </span>
  );
}

export function LoadingState({ label = "Loading…", testId = "loading-state" }: { label?: string; testId?: string }) {
  return (
    <div data-testid={testId} className="flex items-center gap-3 py-8 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry, testId = "error-state" }: { message: string; onRetry?: () => void; testId?: string }) {
  return (
    <div data-testid={testId} className="flex flex-col items-start gap-3 rounded-md border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200">
      <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Data unavailable</div>
      <p className="text-rose-200/80">{message}</p>
      {onRetry && (
        <button data-testid={`${testId}-retry`} onClick={onRetry} className="rounded border border-rose-400/40 px-3 py-1 font-mono text-xs uppercase tracking-wider hover:bg-rose-500/10">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, testId = "empty-state" }: { title: string; hint?: string; testId?: string }) {
  return (
    <div data-testid={testId} className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-800 py-10 text-center">
      <Inbox className="h-6 w-6 text-slate-600" />
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint && <p className="max-w-xs text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, sub, testId, tone }: { label: string; value: ReactNode; sub?: ReactNode; testId?: string; tone?: string }) {
  return (
    <div data-testid={testId} className="rounded-md border border-slate-800/80 bg-slate-950/40 p-3">
      <p className="caption">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${tone ?? "text-slate-100"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
