import { useAmbulances, useAnalytics, useHealthGrid, useHospitals, useZoneDetail, useZones } from "../hooks/useHealthGrid";
import { errorMessage } from "../services/api";
import { KpiCards } from "../components/KpiCards";
import { CityMap } from "../components/map/CityMap";
import { ZoneDetailPanel } from "../components/zone/ZoneDetailPanel";
import { AlertFeed } from "../components/alerts/AlertCard";
import { ExplainabilityPanel } from "../components/ExplainabilityPanel";
import { SpatialClusterPanel } from "../components/spatial/SpatialClusterPanel";
import { ResponsePlanPanel } from "../components/response/ResponsePlanPanel";
import { AmbulanceRecommendationCard, HospitalRecommendationCard } from "../components/resources/ResourcePanels";
import { HospitalLoadChart, RespiratoryChart, RiskTrendChart } from "../components/charts/Charts";
import { ErrorState, GlassCard, LoadingState } from "../components/common/Primitives";

export default function CommandCenter() {
  const { selectedZoneId, selectZone } = useHealthGrid();
  const zones = useZones();
  const hospitals = useHospitals();
  const ambulances = useAmbulances();
  const detail = useZoneDetail(selectedZoneId);
  const analytics = useAnalytics(selectedZoneId ?? 4);
  const d = detail.data;

  return (
    <div data-testid="command-center-page" className="space-y-5">
      <div>
        <p className="caption">Command Center</p>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">City-wide health intelligence</h2>
        <p className="text-sm text-slate-400">Detect earlier. Respond smarter. Protect the city.</p>
      </div>
      <KpiCards />

      <div className="grid gap-4 xl:grid-cols-12">
        <GlassCard className="xl:col-span-7" eyebrow="City Health Map" title="6 monitored health zones" testId="map-card"
          right={<span className="font-mono text-[10px] tracking-wider text-slate-500">CLICK A ZONE TO INSPECT</span>}>
          {zones.isLoading ? <LoadingState label="Loading city zones…" testId="map-loading" /> : zones.isError ? <ErrorState message={errorMessage(zones.error)} onRetry={() => zones.refetch()} testId="map-error" /> : (
            <CityMap zones={zones.data ?? []} hospitals={hospitals.data?.hospitals} ambulances={ambulances.data?.units} selectedZoneId={selectedZoneId} onSelect={selectZone} />
          )}
        </GlassCard>
        <div className="xl:col-span-5"><ZoneDetailPanel /></div>
      </div>

      <AlertFeed onlyActive limit={3} />

      {d && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ExplainabilityPanel detail={d} />
            <SpatialClusterPanel spatial={d.spatial} zone={d.zone} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><ResponsePlanPanel plan={d.response_plan} zone={d.zone} /></div>
            <div className="space-y-4">
              {d.hospital_recommendation ? <HospitalRecommendationCard rec={d.hospital_recommendation} /> : (
                <GlassCard eyebrow="Hospital Network" title="No routing change" testId="hospital-recommendation-none"><p className="text-sm text-slate-400">Hospital routing recommendations appear when a zone reaches MODERATE or HIGH risk.</p></GlassCard>
              )}
              {d.ambulance_recommendation && <GlassCard eyebrow="Ambulance Intelligence" title="Fleet adjustment" testId="ambulance-recommendation-card"><AmbulanceRecommendationCard rec={d.ambulance_recommendation} /></GlassCard>}
            </div>
          </div>
        </>
      )}

      {analytics.isError ? <ErrorState message={errorMessage(analytics.error)} onRetry={() => analytics.refetch()} testId="analytics-error" /> : analytics.data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <RespiratoryChart data={analytics.data} baseline={d?.signals.find((s) => s.signal_key === "respiratory")?.baseline} height={200} />
          <RiskTrendChart data={analytics.data} height={200} />
          <HospitalLoadChart data={analytics.data} height={200} />
        </div>
      )}
    </div>
  );
}
