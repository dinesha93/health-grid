import { useAmbulances, useHealthGrid, useHospitals, useZoneDetail, useZones } from "../hooks/useHealthGrid";
import { errorMessage } from "../services/api";
import { CityMap } from "../components/map/CityMap";
import { ZoneDetailPanel } from "../components/zone/ZoneDetailPanel";
import { ZoneGrid } from "../components/zone/ZoneSelectors";
import { SpatialClusterPanel } from "../components/spatial/SpatialClusterPanel";
import { ExplainabilityPanel } from "../components/ExplainabilityPanel";
import { ErrorState, GlassCard, LoadingState } from "../components/common/Primitives";

export default function ZonesMap() {
  const { selectedZoneId, selectZone } = useHealthGrid();
  const zones = useZones();
  const hospitals = useHospitals();
  const ambulances = useAmbulances();
  const detail = useZoneDetail(selectedZoneId);
  return (
    <div data-testid="zones-page" className="space-y-5">
      <div>
        <p className="caption">Zones & Map Intelligence</p>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">Geographic health zones</h2>
      </div>
      <GlassCard testId="zones-map-card" eyebrow="Interactive map" title="Zone polygons · hospitals · ambulance fleet">
        {zones.isLoading ? <LoadingState label="Loading zones…" /> : zones.isError ? <ErrorState message={errorMessage(zones.error)} onRetry={() => zones.refetch()} /> : (
          <CityMap zones={zones.data ?? []} hospitals={hospitals.data?.hospitals} ambulances={ambulances.data?.units} selectedZoneId={selectedZoneId} onSelect={selectZone} heightClass="h-[380px] lg:h-[560px]" />
        )}
      </GlassCard>
      <ZoneGrid selected={selectedZoneId} onSelect={selectZone} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ZoneDetailPanel compact />
        {detail.data ? <SpatialClusterPanel spatial={detail.data.spatial} zone={detail.data.zone} /> : (
          <GlassCard eyebrow="Spatial Intelligence" title="Neighbor analysis" testId="spatial-empty"><p className="text-sm text-slate-400">Select a zone to analyze its geographic neighbors for clustering.</p></GlassCard>
        )}
      </div>
      {detail.data && <ExplainabilityPanel detail={detail.data} />}
    </div>
  );
}
