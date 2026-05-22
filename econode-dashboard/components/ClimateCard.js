"use client";

import Toggle from "./Toggle";

// Inline SVG icons keep dependencies minimal
const ThermoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const DropIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M12 2.5s-6.5 7-6.5 11.5a6.5 6.5 0 1 0 13 0C18.5 9.5 12 2.5 12 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const FanIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={`w-5 h-5 transition-all duration-700 ${active ? "animate-spin text-sky-400" : "text-zinc-500"}`}
    style={{ animationDuration: "3s" }}
  >
    <path
      d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0c0 3 2 5 5 5m-5-5c0 3-2 5-5 5m5-5c3 0 5-2 5-5m-5 5c-3 0-5-2-5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function ClimateCard({ temperature, humidity, fanOn, mode, onFanToggle }) {
  const isAuto = mode === "AUTO";
  const tempExceeded = temperature >= 28;
  const humExceeded = humidity >= 65;

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
      {/* decorative corner gradient */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-sky-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-start justify-between mb-8 relative">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-1">Climate</div>
          <h2 className="font-display text-3xl text-white">Environmental Control</h2>
        </div>
        <div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
            transition-colors duration-300
            ${fanOn ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30" : "bg-white/[0.03] text-zinc-500 ring-1 ring-white/5"}
          `}
        >
          <FanIcon active={fanOn} />
          <span className="font-medium tracking-wider">{fanOn ? "FAN ON" : "FAN OFF"}</span>
        </div>
      </div>

      {/* Readouts */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="relative">
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-2">
            <ThermoIcon />
            <span>Temperature</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`font-display text-6xl tabular ${tempExceeded ? "text-amber-300" : "text-white"}`}>
              {temperature?.toFixed?.(1) ?? "--"}
            </span>
            <span className="text-zinc-500 text-lg font-light">°C</span>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-2">
            <DropIcon />
            <span>Humidity</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`font-display text-6xl tabular ${humExceeded ? "text-amber-300" : "text-white"}`}>
              {humidity?.toFixed?.(0) ?? "--"}
            </span>
            <span className="text-zinc-500 text-lg font-light">%</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

      {/* Manual override */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-200">Manual Override</div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {isAuto ? "Switch to Manual mode to control" : "Direct fan control"}
          </div>
        </div>
        <Toggle
          checked={fanOn}
          onChange={onFanToggle}
          disabled={isAuto}
          accent="sky"
        />
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed mt-6 italic font-light">
        Auto: Fan activates only when thresholds (28°C or 65% Humidity) are exceeded.
      </p>
    </div>
  );
}
