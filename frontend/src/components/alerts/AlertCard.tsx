import { useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, ShieldAlert } from "lucide-react";
import type { Alert } from "../../types";
import { useAlerts, useHealthGrid } from "../../hooks/useHealthGrid";
import { EmptyState, ErrorState, GlassCard, LoadingState } from "../common/Primitives";
import { errorMessage } from "../../services/api";

export function AlertCard({ alert }: { alert: Alert }) {
  const navigate = useNavigate();
  const { selectZone, acknowledge } = useHealthGrid();
  const acked = !!alert.acknowledged;
  return (
    <article data-testid={`alert-card-${alert.id}`} className={`fade-up relative overflow-hidden rounded-lg border p-4 sm:p-5 ${acked ? "border-slate-800 bg-slate-900/50" : "border-rose-500/50 bg-rose-950/25 shadow-[0_0_25px_rgba(239,68,68,0.2)]"}`}>
      {!acked && <span className="absolute inset-y-0 left-0 w-1 bg-rose-500" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${acked ? "text-slate-500" : "text-rose-400"}`} />
            <h3 data-testid="alert-title" className={`font-display text-base font-extrabold tracking-wide sm:text-lg ${acked ? "text-slate-300" : "text-rose-200"}`}>{alert.title}</h3>
            {acked && <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-slate-400">ACKNOWLEDGED</span>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
            <div><p className="caption">Zone</p><p data-testid="alert-zone" className="font-mono text-lg font-bold text-slate-100">Zone {alert.zone_id}</p></div>
            <div><p className="caption">Risk Score</p><p data-testid="alert-risk-score" className="font-mono text-lg font-bold text-rose-400">{Math.round(alert.risk_score)} / 100</p></div>
            <div><p className="caption">Severity</p><p data-testid="alert-severity" className="font-mono text-lg font-bold text-rose-400">{alert.severity}</p></div>
          </div>
          <p className="mt-3 text-sm text-slate-300"><span className="caption mr-2">Reason</span>{alert.reason}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-500">DETECTED {new Date(alert.created_at).toLocaleString()}</p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <button data-testid={`alert-view-zone-${alert.id}`} onClick={() => { selectZone(alert.zone_id); navigate("/"); }} className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 font-mono text-xs tracking-wider text-cyan-200 transition-colors hover:bg-cyan-500/20">
            <Eye className="h-3.5 w-3.5" /> VIEW ZONE
          </button>
          {!acked && (
            <button data-testid={`alert-acknowledge-${alert.id}`} onClick={() => acknowledge(alert.id)} className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 font-mono text-xs tracking-wider text-slate-200 transition-colors hover:border-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> ACKNOWLEDGE
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function AlertFeed({ limit, onlyActive = false }: { limit?: number; onlyActive?: boolean }) {
  const alerts = useAlerts();
  if (alerts.isLoading) return <LoadingState label="Loading alerts…" testId="alerts-loading" />;
  if (alerts.isError) return <ErrorState message={errorMessage(alerts.error)} onRetry={() => alerts.refetch()} testId="alerts-error" />;
  let list = alerts.data ?? [];
  if (onlyActive) list = list.filter((a) => !a.acknowledged);
  if (limit) list = list.slice(0, limit);
  if (list.length === 0) {
    return (
      <GlassCard testId="alerts-empty" eyebrow="Alert Feed" title="No active alerts">
        <EmptyState title="All zones within expected ranges" hint="Run SIMULATE INCOMING DATA on a zone to see how HealthGrid flags an abnormal pattern." testId="alerts-empty-state" />
      </GlassCard>
    );
  }
  return <div data-testid="alert-feed" className="space-y-3">{list.map((a) => <AlertCard key={a.id} alert={a} />)}</div>;
}
