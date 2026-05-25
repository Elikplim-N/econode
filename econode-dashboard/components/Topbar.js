"use client";

import { Wifi, WifiOff } from "lucide-react";

const PROJECT_TITLE   = "IoT Enabled Smart Home Automation for Enhanced Energy Efficiency";
const PROJECT_SUBTITLE = "A Case Study — Ghana Communication Technology University (GCTU)";

export default function Topbar({ synced, lastSync, mode, onModeChange }) {
  return (
    <header style={{ borderBottom: "1px solid var(--border)" }}>

      {/* ── Project title banner ─────────────────────── */}
      <div className="px-6 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-white leading-tight"
                style={{ fontSize: "clamp(0.9rem, 2vw, 1.15rem)" }}>
              {PROJECT_TITLE}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--accent2)", opacity: 0.8 }}>
              {PROJECT_SUBTITLE}
            </p>
          </div>

          {/* Sync badge */}
          <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mt-0.5 ${synced ? "" : "opacity-60"}`}
               style={{
                 background: synced ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                 color:      synced ? "#34d399"              : "#f87171",
               }}>
            {synced
              ? <><span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" /><Wifi size={12} />Cloud Sync</>
              : <><WifiOff size={12} />Offline</>
            }
          </div>
        </div>
      </div>

      {/* ── Sub-bar: page label + mode toggle ───────── */}
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <h2 className="font-display font-semibold text-base text-white">Overview</h2>
          <p className="text-[11px] text-slate-500">
            {lastSync ? `Updated ${lastSync}` : "Connecting to node…"}
          </p>
        </div>

        {/* AUTO / MANUAL toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          {["AUTO", "MANUAL"].map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: mode === m ? (m === "MANUAL" ? "rgba(245,158,11,0.2)" : "rgba(99,102,241,0.2)") : "transparent",
                color:      mode === m ? (m === "MANUAL" ? "#fbbf24" : "#a5b4fc") : "#64748b",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
