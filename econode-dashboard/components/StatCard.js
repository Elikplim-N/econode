"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ label, value, unit, icon: Icon, accent = "#6366f1", trend, sublabel, large }) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#64748b";

  return (
    <div
      className="glass card-hover rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "var(--surface)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide uppercase text-slate-500">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `${accent}22` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          className={`tabular font-display font-semibold stat-value text-white leading-none ${large ? "text-5xl" : "text-3xl"}`}
        >
          {value ?? "—"}
        </span>
        {unit && <span className="text-sm text-slate-500 mb-1">{unit}</span>}
      </div>

      {/* Sub info */}
      {(sublabel || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <TrendIcon size={13} style={{ color: trendColor }} />
          )}
          {sublabel && (
            <span className="text-xs text-slate-500">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
