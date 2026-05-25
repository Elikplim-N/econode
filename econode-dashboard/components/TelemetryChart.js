"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-xs space-y-1 shadow-2xl"
         style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">{p.value}{p.unit}</span>
        </div>
      ))}
    </div>
  );
};

const TABS = [
  { id: "climate", label: "Climate" },
  { id: "ldr",     label: "Light (LDR)" },
];

export default function TelemetryChart({ data }) {
  const [tab, setTab] = useState("climate");

  const hasLdr = data.some((d) => d.ldr != null);

  return (
    <div className="glass card-hover rounded-2xl p-6" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-white">Sensor History</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last 20 readings from EcoNode</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: tab === t.id ? "rgba(99,102,241,0.25)" : "transparent",
                color:      tab === t.id ? "#a5b4fc" : "#64748b",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs mb-4">
        {tab === "climate" ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#818cf8" }} />
              <span className="text-slate-400">Temperature</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#22d3ee" }} />
              <span className="text-slate-400">Humidity</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#f59e0b" }} />
            <span className="text-slate-400">LDR raw (0 = bright, 4095 = dark)</span>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
          Collecting data…
        </div>
      ) : tab === "climate" ? (
        /* ── Climate chart ── */
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="temp" name="Temperature" unit="°C"
                  stroke="#818cf8" strokeWidth={2} fill="url(#tempGrad)"
                  dot={false} activeDot={{ r: 4, fill: "#818cf8" }} />
            <Area type="monotone" dataKey="hum" name="Humidity" unit="%"
                  stroke="#22d3ee" strokeWidth={2} fill="url(#humGrad)"
                  dot={false} activeDot={{ r: 4, fill: "#22d3ee" }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        /* ── LDR chart ── */
        <>
          {!hasLdr ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-slate-500 text-sm">No LDR data yet</p>
              <p className="text-xs text-slate-700 max-w-xs text-center">
                Add a <code className="text-amber-500">ldr_raw</code> integer column to your{" "}
                <code className="text-amber-500">econode_telemetry</code> table in Supabase,
                then reflash the firmware.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ldrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 4095]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {/* Reference lines for the dark threshold */}
                <Line type="monotone" dataKey="ldr" name="LDR raw" unit=""
                      stroke="#f59e0b" strokeWidth={2}
                      dot={false} activeDot={{ r: 4, fill: "#f59e0b" }}
                      connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Dark threshold marker */}
          {hasLdr && (
            <p className="text-xs text-slate-600 mt-2 text-center">
              Dark threshold: <span className="text-amber-500 font-medium">1500</span> —
              values above this = dark environment
            </p>
          )}
        </>
      )}
    </div>
  );
}
