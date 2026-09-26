import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { HealthGridProvider } from "./hooks/useHealthGrid";
import { AppShell } from "./components/layout/AppShell";
import CommandCenter from "./pages/CommandCenter";
import ZonesMap from "./pages/ZonesMap";
import HospitalsFleet from "./pages/HospitalsFleet";
import AlertsResponse from "./pages/AlertsResponse";
import Analytics from "./pages/Analytics";
import HowItWorks from "./pages/HowItWorks";

export default function App() {
  return (
    <BrowserRouter>
      <HealthGridProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/zones" element={<ZonesMap />} />
            <Route path="/hospitals" element={<HospitalsFleet />} />
            <Route path="/alerts" element={<AlertsResponse />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster theme="dark" position="bottom-right" richColors closeButton toastOptions={{ style: { background: "rgba(7,9,14,0.95)", border: "1px solid #1e293b", fontFamily: "IBM Plex Sans" } }} />
      </HealthGridProvider>
    </BrowserRouter>
  );
}
