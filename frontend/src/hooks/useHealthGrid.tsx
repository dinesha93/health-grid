import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "../services/api";

type Phase = "idle" | "analyzing" | "resetting";

interface HealthGridState {
  selectedZoneId: number | null;
  selectZone: (id: number | null) => void;
  phase: Phase;
  lastUpdated: Date;
  simulate: (zoneId: number) => Promise<void>;
  reset: (zoneId: number) => Promise<void>;
  generatePlan: (zoneId: number) => Promise<void>;
  acknowledge: (alertId: number) => Promise<void>;
}

const Ctx = createContext<HealthGridState | null>(null);
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function HealthGridProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshAll = useCallback(async () => {
    await qc.invalidateQueries();
    setLastUpdated(new Date());
  }, [qc]);

  const simulateMut = useMutation({
    mutationFn: async (zoneId: number) => (await Promise.all([api.simulate(zoneId), delay(1800)]))[0],
    onSuccess: async (res) => {
      await refreshAll();
      const { risk_score, risk_level } = res.detail.zone;
      toast[risk_level === "HIGH" ? "error" : "success"](`Zone ${res.detail.zone.id} recalculated → ${risk_score}/100 ${risk_level}`, {
        description: risk_level === "HIGH" ? "Abnormal health pattern detected. Alert and response plan generated." : "Signals updated and re-scored.",
      });
    },
    onError: (e) => toast.error("Simulation failed", { description: errorMessage(e) }),
    onSettled: () => setPhase("idle"),
  });

  const resetMut = useMutation({
    mutationFn: async (zoneId: number) => (await Promise.all([api.reset(zoneId), delay(700)]))[0],
    onSuccess: async () => {
      await refreshAll();
      toast.success("Simulation reset", { description: "All zones restored to historical baseline." });
    },
    onError: (e) => toast.error("Reset failed", { description: errorMessage(e) }),
    onSettled: () => setPhase("idle"),
  });

  const planMut = useMutation({
    mutationFn: api.responsePlan,
    onSuccess: async (plan) => {
      await refreshAll();
      toast.success(plan.title, { description: `${plan.actions.length} actions generated from current risk state.` });
    },
    onError: (e) => toast.error("Could not generate response plan", { description: errorMessage(e) }),
  });

  const ackMut = useMutation({
    mutationFn: api.acknowledgeAlert,
    onSuccess: async () => {
      await refreshAll();
      toast.success("Alert acknowledged");
    },
    onError: (e) => toast.error("Could not acknowledge alert", { description: errorMessage(e) }),
  });

  const value = useMemo<HealthGridState>(
    () => ({
      selectedZoneId,
      selectZone: setSelectedZoneId,
      phase,
      lastUpdated,
      simulate: async (id) => {
        setPhase("analyzing");
        await simulateMut.mutateAsync(id).catch(() => undefined);
      },
      reset: async (id) => {
        setPhase("resetting");
        await resetMut.mutateAsync(id).catch(() => undefined);
      },
      generatePlan: async (id) => {
        await planMut.mutateAsync(id).catch(() => undefined);
      },
      acknowledge: async (id) => {
        await ackMut.mutateAsync(id).catch(() => undefined);
      },
    }),
    [selectedZoneId, phase, lastUpdated, simulateMut, resetMut, planMut, ackMut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHealthGrid() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHealthGrid must be used within HealthGridProvider");
  return ctx;
}

export const useHealth = () => useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 30_000 });
export const useZones = () => useQuery({ queryKey: ["zones"], queryFn: api.zones });
export const useZoneDetail = (id: number | null) =>
  useQuery({ queryKey: ["zone", id], queryFn: () => api.zone(id as number), enabled: id !== null });
export const useAlerts = () => useQuery({ queryKey: ["alerts"], queryFn: api.alerts });
export const useHospitals = (zoneId?: number | null) => useQuery({ queryKey: ["hospitals", zoneId ?? null], queryFn: () => api.hospitals(zoneId) });
export const useAmbulances = (zoneId?: number | null) => useQuery({ queryKey: ["ambulances", zoneId ?? null], queryFn: () => api.ambulances(zoneId) });
export const useAnalytics = (zoneId: number) => useQuery({ queryKey: ["analytics", zoneId], queryFn: () => api.analytics(zoneId) });
export const useResponsePlans = () => useQuery({ queryKey: ["response-plans"], queryFn: api.responsePlans });
