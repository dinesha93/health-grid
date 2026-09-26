import axios from "axios";
import type {
  Alert,
  AmbulancesResponse,
  Analytics,
  HealthStatus,
  HospitalsResponse,
  ResponsePlan,
  SimulationResult,
  Zone,
  ZoneDetail,
} from "../types";

const http = axios.create({ baseURL: `${import.meta.env.REACT_APP_BACKEND_URL}/api`, timeout: 15_000 });

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Cannot reach the HealthGrid API. Check that the backend is running.";
    const detail = (err.response.data as { detail?: string } | undefined)?.detail;
    return typeof detail === "string" ? detail : `Request failed (${err.response.status})`;
  }
  return err instanceof Error ? err.message : "Unexpected error";
}

export const api = {
  health: () => http.get<HealthStatus>("/health").then((r) => r.data),
  zones: () => http.get<Zone[]>("/zones").then((r) => r.data),
  zone: (id: number) => http.get<ZoneDetail>(`/zones/${id}`).then((r) => r.data),
  simulate: (id: number) => http.post<SimulationResult>(`/zones/${id}/simulate`).then((r) => r.data),
  reset: (id: number) => http.post<SimulationResult>(`/zones/${id}/reset`).then((r) => r.data),
  analyzeZone: (id: number) => http.post<ZoneDetail>("/analyze-zone", { zone_id: id }).then((r) => r.data),
  alerts: () => http.get<Alert[]>("/alerts").then((r) => r.data),
  acknowledgeAlert: (id: number) => http.post<Alert>(`/alerts/${id}/acknowledge`).then((r) => r.data),
  hospitals: (zoneId?: number | null) => http.get<HospitalsResponse>("/hospitals", { params: zoneId ? { zone_id: zoneId } : {} }).then((r) => r.data),
  ambulances: (zoneId?: number | null) => http.get<AmbulancesResponse>("/ambulances", { params: zoneId ? { zone_id: zoneId } : {} }).then((r) => r.data),
  responsePlan: (id: number) => http.post<ResponsePlan>("/response-plan", { zone_id: id }).then((r) => r.data),
  responsePlans: () => http.get<ResponsePlan[]>("/response-plans").then((r) => r.data),
  analytics: (zoneId: number) => http.get<Analytics>("/analytics", { params: { zone_id: zoneId } }).then((r) => r.data),
};
