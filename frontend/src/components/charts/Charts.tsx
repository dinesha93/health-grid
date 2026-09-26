import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Analytics, Trend } from "../../types";
import { GlassCard } from "../common/Primitives";

const axis = { stroke: "#334155", fontSize: 10, fontFamily: "JetBrains Mono" };
const grid = <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />;
const tooltipStyle = { contentStyle: { background: "rgba(7,9,14,0.95)", border: "1px solid #1e293b", borderRadius: 6, fontSize: 12, fontFamily: "JetBrains Mono" }, labelStyle: { color: "#94a3b8" } };

export function RespiratoryChart({ data, baseline, height = 220 }: { data: Analytics; baseline?: number; height?: number }) {
  return (
    <GlassCard testId="chart-respiratory" eyebrow="Syndromic surveillance · 24h" title="Respiratory complaints over time">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data.series} margin={{ left: -20, right: 8, top: 8 }}>
          <defs><linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient></defs>
          {grid}
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          {baseline !== undefined && <ReferenceLine y={baseline} stroke="#64748b" strokeDasharray="4 4" label={{ value: "baseline", fill: "#64748b", fontSize: 10, position: "insideTopLeft" }} />}
          <Area type="monotone" dataKey="respiratory" name="Respiratory" stroke="#38bdf8" strokeWidth={2} fill="url(#respGrad)" isAnimationActive animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function RiskTrendChart({ data, height = 220 }: { data: Analytics; height?: number }) {
  return (
    <GlassCard testId="chart-risk-score" eyebrow={`Zone ${data.zone_id} · ${data.zone_name}`} title="Zone risk score over time">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data.series} margin={{ left: -20, right: 8, top: 8 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "MODERATE", fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }} />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "HIGH", fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} />
          <Line type="monotone" dataKey="risk_score" name="Risk score" stroke="#f8fafc" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#0ea5e9" }} animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function HospitalLoadChart({ data, height = 220 }: { data: Analytics; height?: number }) {
  const color = (load: number) => (load >= 85 ? "#ef4444" : load >= 70 ? "#f59e0b" : "#10b981");
  return (
    <GlassCard testId="chart-hospital-load" eyebrow="Hospital network" title="Hospital emergency load">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data.hospital_loads} margin={{ left: -20, right: 8, top: 8 }} barCategoryGap={28}>
          {grid}
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "ER load"]} />
          <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 4" />
          <Bar dataKey="load" name="ER load" radius={[4, 4, 0, 0]} animationDuration={900}>
            {data.hospital_loads.map((h) => <Cell key={h.name} fill={color(h.load)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function TrendIndicators({ trends }: { trends: Record<string, Trend> }) {
  const items = [
    { key: "ambulance", label: "Ambulance demand", unit: "" },
    { key: "aqi", label: "AQI", unit: "" },
    { key: "pharmacy", label: "Pharmacy demand", unit: "" },
  ];
  return (
    <div data-testid="trend-indicators" className="grid grid-cols-3 gap-2">
      {items.map(({ key, label }) => {
        const t = trends[key];
        if (!t) return null;
        const Icon = t.direction === "up" ? ArrowUpRight : t.direction === "down" ? ArrowDownRight : Minus;
        const tone = t.direction === "up" ? "text-rose-400" : t.direction === "down" ? "text-emerald-400" : "text-slate-400";
        return (
          <div key={key} data-testid={`trend-${key}`} className="glass p-3">
            <p className="caption truncate">{label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="font-mono text-xl font-bold text-slate-100">{Number.isInteger(t.current) ? t.current : t.current.toFixed(1)}</span>
              <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold ${tone}`}><Icon className="h-3.5 w-3.5" />{t.change_pct > 0 ? "+" : ""}{t.change_pct}%</span>
            </div>
            <p className="text-[10px] text-slate-500">vs 6h avg {t.previous}</p>
          </div>
        );
      })}
    </div>
  );
}
