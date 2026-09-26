import { NavLink, Outlet } from "react-router-dom";
import { Bell, Radio } from "lucide-react";
import { NAV_ITEMS, PRIVACY_STATEMENT } from "../../data/constants";
import { useAlerts, useHealth, useHealthGrid } from "../../hooks/useHealthGrid";

function NavLinks({ compact }: { compact?: boolean }) {
  return (
    <>
      {NAV_ITEMS.map(({ id, path, label, short, icon: Icon }) => (
        <NavLink
          key={id}
          to={path}
          end={path === "/"}
          data-testid={`sidebar-nav-${id}`}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors duration-200 ${
              isActive ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200"
            } ${compact ? "shrink-0 whitespace-nowrap" : ""}`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className={compact ? "text-xs" : ""}>{compact ? short : label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Header() {
  const health = useHealth();
  const alerts = useAlerts();
  const { lastUpdated } = useHealthGrid();
  const operational = health.isSuccess && health.data.status === "operational";
  const activeAlerts = alerts.data?.filter((a) => !a.acknowledged).length ?? 0;
  return (
    <header data-testid="app-header" className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#07090E]/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 data-testid="brand-title" className="font-display text-lg font-extrabold tracking-[0.2em] text-slate-50 sm:text-xl">HEALTHGRID</h1>
            <p className="text-[11px] text-slate-400">City Health Intelligence Platform</p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <span data-testid="system-status" className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[11px] tracking-wider ${operational ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : health.isError ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-slate-700 text-slate-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${operational ? "bg-emerald-400 pulse-dot" : health.isError ? "bg-rose-400" : "bg-slate-500"}`} />
            {operational ? "SYSTEM OPERATIONAL" : health.isError ? "API UNREACHABLE" : "CONNECTING"}
          </span>
          <span data-testid="synthetic-data-badge" className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] tracking-wider text-amber-300">SYNTHETIC DEMO DATA</span>
          <span data-testid="last-updated" className="hidden font-mono text-[11px] text-slate-500 md:inline">
            LAST UPDATED {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <NavLink to="/alerts" data-testid="header-alert-bell" className="relative grid h-8 w-8 place-items-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:text-slate-100">
            <Bell className="h-4 w-4" />
            {activeAlerts > 0 && (
              <span data-testid="header-alert-count" className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white">{activeAlerts}</span>
            )}
          </NavLink>
        </div>
      </div>
      <nav data-testid="mobile-nav" className="flex gap-1 overflow-x-auto border-t border-slate-800/80 px-3 py-2 lg:hidden">
        <NavLinks compact />
      </nav>
    </header>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <aside data-testid="sidebar" className="hidden w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#07090E]/70 lg:flex">
        <div className="px-5 pb-4 pt-6">
          <p className="caption">Command Navigation</p>
        </div>
        <nav className="flex flex-col gap-1 px-3"><NavLinks /></nav>
        <div className="mt-auto space-y-3 p-5">
          <p className="caption">Privacy</p>
          <p className="text-xs leading-relaxed text-slate-500">{PRIVACY_STATEMENT}</p>
          <p className="font-mono text-[10px] tracking-wider text-slate-600">DETECT EARLIER · RESPOND SMARTER · PROTECT THE CITY</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
