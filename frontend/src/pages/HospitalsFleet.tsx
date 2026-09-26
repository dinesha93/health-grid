import { useAmbulances, useHealthGrid, useHospitals, useZones } from "../hooks/useHealthGrid";
import { errorMessage } from "../services/api";
import { AmbulancePanel, HospitalCard, HospitalRecommendationCard } from "../components/resources/ResourcePanels";
import { CityMap } from "../components/map/CityMap";
import { ErrorState, GlassCard, LoadingState } from "../components/common/Primitives";

export default function HospitalsFleet() {
  const { selectedZoneId, selectZone } = useHealthGrid();
  const hospitals = useHospitals(selectedZoneId);
  const ambulances = useAmbulances(selectedZoneId);
  const zones = useZones();
  const rec = hospitals.data?.recommendation ?? null;
  return (
    <div data-testid="hospitals-page" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="caption">Hospitals & Fleet</p>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">Hospital network & ambulance intelligence</h2>
        </div>
        {hospitals.data && <span data-testid="network-load-badge" className="rounded border border-slate-700 px-3 py-1 font-mono text-xs tracking-wider text-slate-200">NETWORK LOAD {hospitals.data.network_load}%</span>}
      </div>

      {hospitals.isLoading ? <LoadingState label="Loading hospital network…" /> : hospitals.isError ? <ErrorState message={errorMessage(hospitals.error)} onRetry={() => hospitals.refetch()} /> : (
        <div className="grid gap-3 md:grid-cols-3">
          {hospitals.data!.hospitals.map((h) => <HospitalCard key={h.id} h={h} recommended={rec?.recommended.id === h.id} />)}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {rec ? <HospitalRecommendationCard rec={rec} /> : (
          <GlassCard eyebrow="Demo Recommendation" title="No active routing recommendation" testId="hospital-recommendation-none">
            <p className="text-sm text-slate-400">When a zone reaches MODERATE or HIGH risk, HealthGrid ranks hospitals by available capacity, emergency load, beds and synthetic distance.</p>
          </GlassCard>
        )}
        <GlassCard eyebrow="Fleet positions" title="Live ambulance map" testId="fleet-map-card">
          {zones.data && <CityMap zones={zones.data} hospitals={hospitals.data?.hospitals} ambulances={ambulances.data?.units} selectedZoneId={selectedZoneId} onSelect={selectZone} heightClass="h-[320px]" />}
        </GlassCard>
      </div>

      {ambulances.isLoading ? <LoadingState label="Loading fleet…" /> : ambulances.isError ? <ErrorState message={errorMessage(ambulances.error)} onRetry={() => ambulances.refetch()} /> : ambulances.data && <AmbulancePanel data={ambulances.data} showUnits />}
    </div>
  );
}
