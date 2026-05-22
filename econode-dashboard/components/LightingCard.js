"use client";

import Toggle from "./Toggle";

const MotionIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 ${active ? "text-emerald-400" : "text-zinc-500"}`}>
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M9 22v-7l-2-3 2-4 3 2 3-2 2 4-2 3v7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const BulbIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? "currentColor" : "none"}
    className={`w-5 h-5 transition-colors duration-300 ${active ? "text-amber-300" : "text-zinc-500"}`}
  >
    <path
      d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.2 1.2 2 .1.3.4.5.7.5h4.2c.3 0 .6-.2.7-.5.2-.8.7-1.5 1.2-2A6 6 0 0 0 12 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function Indicator({ icon, label, value, active }) {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
        ${active ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-white/[0.015] ring-1 ring-white/5"}
      `}
    >
      <div className={active ? "text-emerald-400" : "text-zinc-500"}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] tracking-wider uppercase text-zinc-500">{label}</div>
        <div className={`text-sm font-medium ${active ? "text-white" : "text-zinc-400"}`}>{value}</div>
      </div>
    </div>
  );
}

export default function LightingCard({ motion, isDark, lightOn, mode, onLightToggle }) {
  const isAuto = mode === "AUTO";

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
      {/* decorative warm glow */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-start justify-between mb-8 relative">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-1">Occupancy</div>
          <h2 className="font-display text-3xl text-white">Smart Lighting</h2>
        </div>
        <div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
            transition-colors duration-300
            ${lightOn ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" : "bg-white/[0.03] text-zinc-500 ring-1 ring-white/5"}
          `}
        >
          <BulbIcon active={lightOn} />
          <span className="font-medium tracking-wider">{lightOn ? "LIGHT ON" : "LIGHT OFF"}</span>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Indicator
          icon={<MotionIcon active={motion} />}
          label="Motion"
          value={motion ? "Detected" : "None"}
          active={motion}
        />
        <Indicator
          icon={isDark ? <MoonIcon /> : <SunIcon />}
          label="Room Light"
          value={isDark ? "Dark" : "Daylight"}
          active={isDark}
        />
      </div>

      {/* Centerpiece: large bulb visual */}
      <div className="flex justify-center mb-6 relative">
        <div className="relative">
          <div
            className={`
              absolute inset-0 rounded-full blur-2xl transition-opacity duration-700
              ${lightOn ? "opacity-100 bg-amber-400/30" : "opacity-0"}
            `}
          />
          <div
            className={`
              relative h-20 w-20 rounded-full flex items-center justify-center
              transition-all duration-500
              ${
                lightOn
                  ? "bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_40px_-2px_rgba(245,158,11,0.6)]"
                  : "bg-zinc-800/60 ring-1 ring-white/5"
              }
            `}
          >
            <svg viewBox="0 0 24 24" fill="none" className={`w-9 h-9 ${lightOn ? "text-amber-900" : "text-zinc-600"}`}>
              <path
                d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.2 1.2 2 .1.3.4.5.7.5h4.2c.3 0 .6-.2.7-.5.2-.8.7-1.5 1.2-2A6 6 0 0 0 12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
            {isAuto ? "Switch to Manual mode to control" : "Direct light control"}
          </div>
        </div>
        <Toggle
          checked={lightOn}
          onChange={onLightToggle}
          disabled={isAuto}
          accent="amber"
        />
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed mt-6 italic font-light">
        Auto: Lighting activates when human presence is detected in dark conditions.
      </p>
    </div>
  );
}
