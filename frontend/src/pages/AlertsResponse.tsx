import { useHealthGrid, useResponsePlans, useZoneDetail } from "../hooks/useHealthGrid";
import { AlertFeed } from "../components/alerts/AlertCard";
import { ExplainabilityPanel } from "../components/ExplainabilityPanel";
import { ResponsePlanPanel } from "../components/response/ResponsePlanPanel";
import { ZoneSelector } from "../components/zone/ZoneSelectors";
import { GlassCard, LoadingState } from "../components/common/Primitives";

export default function AlertsResponse() {
  const { selectedZoneId, selectZone } = useHealthGrid();
  const zoneId = selectedZoneId ?? 4;
  const detail = useZoneDetail(zoneId);
  const plans = useResponsePlans();
  return (
    <div data-testid="alerts-page" className="space-y-5">
      <div>
        <p className="caption">Alerts & Response</p>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">Early alerts, explainability & response plans</h2>
      </div>
      <AlertFeed />
      <GlassCard eyebrow="Zone focus" title="Select zone for explainability & response" testId="alerts-zone-selector-card">
        <ZoneSelector value={zoneId} onChange={selectZone} testId="alerts-zone-selector" />
      </GlassCard>
      {detail.isLoading || !detail.data ? <LoadingState label="Loading zone analysis…" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ExplainabilityPanel detail={detail.data} />
          <ResponsePlanPanel plan={detail.data.response_plan} zone={detail.data.zone} />
        </div>
      )}
      {plans.data && plans.data.length > 0 && (
        <GlassCard eyebrow="Response plan history" title="Generated plans" testId="response-plan-history">
          <ul className="space-y-1.5">
            {plans.data.map((p) => (
              <li key={p.id} data-testid={`plan-history-${p.id}`} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2 font-mono text-xs text-slate-300">
                <span>Zone {p.zone_id} · {p.title}</span>
                <span className="text-slate-500">{p.actions.length} actions · +{p.resource_impact.ambulances} amb · +{p.resource_impact.beds} beds</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
