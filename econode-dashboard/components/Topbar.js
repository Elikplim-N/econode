"use client";

import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function Topbar({ synced, lastSync, mode, onModeChange }) {
  const isManual = mode === "MANUAL";

  return (
    <header className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Page title */}
      <div>
        <h2 className="font-display font-semibold text-lg text-white">Overview</h2>
        <p className="text-xs text-slate-500">
          {lastSync ? `Updated ${lastSync}` : "Connecting to node…"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Sync status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${synced ? "" : "opacity-60"}`}
             style={{ background: synced ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color:      synced ? "#34d399"              : "#f87171" }}>
          {synced
            ? <><span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-400" /><Wifi size={12} />Cloud Sync</>
            : <><WifiOff size={12} />Offline</>
          }
        </div>

        {/* Mode toggle */}
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
