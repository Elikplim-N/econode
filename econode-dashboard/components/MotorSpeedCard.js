"use client";

import { Gauge } from "lucide-react";

export default function MotorSpeedCard({ speed, onChange, disabled }) {
  const pct = Math.round((speed / 255) * 100);

  const color =
    pct < 30 ? "#10b981" :
    pct < 70 ? "#f59e0b" :
               "#ef4444";

  return (
    <div className="glass card-hover rounded-2xl p-6" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-white">Motor Speed</h3>
          <p className="text-xs text-slate-500 mt-0.5">L298N ENA duty cycle</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: `${color}22` }}>
          <Gauge size={18} style={{ color }} />
        </div>
      </div>

      {/* Arc visualizer */}
      <div className="flex items-center justify-center my-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="50" cy="50" r="40" fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 2 * 40 * 0.75} ${Math.PI * 2 * 40 * 0.25}`}
                    strokeDashoffset={Math.PI * 2 * 40 * 0.125} />
            {/* Fill */}
            <circle cx="50" cy="50" r="40" fill="none"
                    stroke={color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 2 * 40 * 0.75 * pct / 100} ${Math.PI * 2 * 40}`}
                    strokeDashoffset={Math.PI * 2 * 40 * 0.125}
                    style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-bold tabular" style={{ color }}>{pct}%</span>
            <span className="text-[10px] text-slate-500">PWM</span>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="mt-2">
        <div className="flex justify-between text-xs text-slate-600 mb-2">
          <span>0</span>
          <span className="text-slate-400">Raw: {speed}</span>
          <span>255</span>
        </div>
        <input
          type="range"
          min={0}
          max={255}
          value={speed}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full"
          style={{ accentColor: color }}
        />
        {disabled && (
          <p className="text-center text-xs text-slate-600 mt-2">Switch to Manual mode to adjust speed</p>
        )}
      </div>
    </div>
  );
}
