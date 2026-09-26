import { useAnalytics, useHealthGrid, useZoneDetail } from "../hooks/useHealthGrid";
import { errorMessage } from "../services/api";
import { HospitalLoadChart, RespiratoryChart, RiskTrendChart, TrendIndicators } from "../components/charts/Charts";
import { ZoneSelector } from "../components/zone/ZoneSelectors";
import { ErrorState, GlassCard, LoadingState } from "../components/common/Primitives";
import { RISK_META } from "../data/constants";

export default function Analytics() {
  const { selectedZoneId, selectZone } = useHealthGrid();
  const zoneId = selectedZoneId ?? 4;
  const analytics = useAnalytics(zoneId);
  const detail = useZoneDetail(zoneId);
  return (
    <div data-testid="analytics-page" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="caption">Predictive Analytics</p>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">Signal trends & risk trajectory</h2>
        </div>
        <ZoneSelector value={zoneId} onChange={selectZone} testId="analytics-zone-selector" />
      </div>
      {analytics.isLoading ? <LoadingState label="Loading analytics…" testId="analytics-loading" /> : analytics.isError || !analytics.data ? <ErrorState message={errorMessage(analytics.error)} onRetry={() => analytics.refetch()} testId="analytics-error" /> : (
        <>
          <TrendIndicators trends={analytics.data.trends} />
          <div className="grid gap-4 lg:grid-cols-2">
            <RespiratoryChart data={analytics.data} baseline={detail.data?.signals.find((s) => s.signal_key === "respiratory")?.baseline} height={280} />
            <RiskTrendChart data={analytics.data} height={280} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HospitalLoadChart data={analytics.data} height={260} />
            <GlassCard eyebrow="City overview" title="Zone risk ranking" testId="city-risk-ranking">
              <ul className="space-y-2">
                {[...analytics.data.city_risk].sort((a, b) => b.risk_score - a.risk_score).map((z) => (
                  <li key={z.zone_id} data-testid={`city-risk-zone-${z.zone_id}`} className="flex items-center gap-3">
                    <span className="w-16 font-mono text-xs text-slate-400">ZONE {z.zone_id}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${z.risk_score}%`, background: RISK_META[z.risk_level].color }} /></div>
                    <span className="w-10 text-right font-mono text-sm font-bold" style={{ color: RISK_META[z.risk_level].color }}>{z.risk_score}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
