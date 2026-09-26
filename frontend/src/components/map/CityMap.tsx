import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polygon, TileLayer, Tooltip } from "react-leaflet";
import type { AmbulanceUnit, Hospital, Zone } from "../../types";
import { MAP_CENTER, RISK_META, TILE_ATTRIBUTION, TILE_URL } from "../../data/constants";

interface Props {
  zones: Zone[];
  hospitals?: Hospital[];
  ambulances?: AmbulanceUnit[];
  selectedZoneId: number | null;
  onSelect: (id: number) => void;
  heightClass?: string;
}

const labelIcon = (text: string) => L.divIcon({ className: "", html: `<div class="hg-zone-label">${text}</div>`, iconSize: [0, 0] });
const hospitalIcon = (letter: string) => L.divIcon({ className: "", html: `<div class="hg-hospital-marker">${letter}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
const ambulanceIcon = (status: string) => L.divIcon({ className: "", html: `<div class="hg-amb-marker hg-amb-${status}"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] });

export function CityMap({ zones, hospitals = [], ambulances = [], selectedZoneId, onSelect, heightClass = "h-[420px] lg:h-[520px]" }: Props) {
  const icons = useMemo(() => ({ label: labelIcon, hospital: hospitalIcon, amb: ambulanceIcon }), []);
  return (
    <div data-testid="city-map" className={`relative w-full overflow-hidden rounded-lg border border-slate-800 ${heightClass}`}>
      <MapContainer center={MAP_CENTER} zoom={13} className="h-full w-full" scrollWheelZoom={false} zoomControl={false} attributionControl>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} className="hg-dark-tiles" />
        {zones.map((z) => {
          const meta = RISK_META[z.risk_level];
          const selected = z.id === selectedZoneId;
          return (
            <Polygon
              key={`${z.id}-${z.risk_level}-${selected}`}
              positions={z.polygon}
              pathOptions={{ color: selected ? "#e0f2fe" : meta.color, weight: selected ? 3 : 1.5, fillColor: meta.color, fillOpacity: selected ? 0.5 : z.risk_level === "HIGH" ? 0.42 : 0.24, dashArray: selected ? undefined : "4 4" }}
              eventHandlers={{ click: () => onSelect(z.id) }}
            >
              <Tooltip sticky className="hg-tooltip">
                <div className="font-mono text-[11px] tracking-wider text-slate-400">ZONE {z.id}</div>
                <div className="font-semibold text-slate-100">{z.name}</div>
                <div className="mt-1 font-mono text-xs" style={{ color: meta.color }}>{z.risk_level} · {z.risk_score}/100</div>
              </Tooltip>
            </Polygon>
          );
        })}
        {zones.map((z) => (
          <Marker key={`label-${z.id}`} position={[z.center_lat, z.center_lng]} icon={icons.label(`Z${z.id} · ${z.risk_score}`)} interactive={false} />
        ))}
        {hospitals.map((h) => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={icons.hospital(h.name.replace("Hospital ", ""))}>
            <Tooltip className="hg-tooltip" direction="top" offset={[0, -12]}>
              <div className="font-semibold text-slate-100">{h.name} · {h.facility}</div>
              <div className="font-mono text-xs text-slate-300">ER load {h.emergency_load}% · {h.available_beds} beds · ICU {h.icu_available}</div>
            </Tooltip>
          </Marker>
        ))}
        {ambulances.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={icons.amb(a.status)}>
            <Tooltip className="hg-tooltip" direction="top" offset={[0, -6]}>
              <div className="font-mono text-xs text-slate-100">{a.id} · {a.status.replace("_", " ")}{a.assigned_zone_id ? ` → Zone ${a.assigned_zone_id}` : ""}</div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  );
}

export function MapLegend() {
  return (
    <div data-testid="map-legend" className="absolute bottom-3 left-3 z-[400] rounded-md border border-slate-800 bg-[#07090E]/90 p-3 backdrop-blur-xl">
      <p className="caption mb-2">Risk Legend</p>
      <div className="space-y-1.5">
        {(["LOW", "MODERATE", "HIGH"] as const).map((lvl) => (
          <div key={lvl} className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RISK_META[lvl].color }} /> {lvl}
          </div>
        ))}
        <div className="hairline pt-1.5" />
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400"><span className="hg-hospital-marker !h-3 !w-3 !text-[7px]">H</span> Hospital</div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400"><span className="hg-amb-marker hg-amb-AVAILABLE inline-block" /> Ambulance</div>
      </div>
    </div>
  );
}
