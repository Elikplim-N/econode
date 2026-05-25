"use client";

import { Wind, Lightbulb, Eye, Moon, Cpu } from "lucide-react";

function DeviceRow({ icon: Icon, label, description, active, accent, onToggle, disabled }) {
  const color = active ? accent : "#475569";
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${active ? "glass-strong" : ""}`}
         style={{ border: active ? `1px solid ${accent}33` : "1px solid transparent" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
           style={{ background: active ? `${accent}22` : "rgba(255,255,255,0.04)" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      {onToggle ? (
        <button
          onClick={() => onToggle(!active)}
          disabled={disabled}
          className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 disabled:opacity-40"
          style={{ background: active ? accent : "rgba(255,255,255,0.1)" }}
          aria-label={`Toggle ${label}`}
        >
          <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{ transform: active ? "translateX(20px)" : "translateX(0)" }} />
        </button>
      ) : (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${active ? "text-emerald-400" : "text-slate-500"}`}
              style={{ background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)" }}>
          {active ? "Active" : "Idle"}
        </span>
      )}
    </div>
  );
}

export default function DevicesCard({ telemetry, settings, onFanToggle, onLightToggle }) {
  const isManual = settings.mode === "MANUAL";
  const fanOn    = isManual ? settings.fan_override  : telemetry.fan_on;
  const lightOn  = isManual ? settings.light_override : telemetry.light_on;

  return (
    <div className="glass card-hover rounded-2xl p-6" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-white">Devices</h3>
          <p className="text-xs text-slate-500 mt-0.5">{isManual ? "Manual override active" : "Automated by sensors"}</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: isManual ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)",
                       color:      isManual ? "#fbbf24"               : "#34d399" }}>
          {isManual ? "MANUAL" : "AUTO"}
        </span>
      </div>

      <div className="space-y-2">
        <DeviceRow
          icon={Wind}
          label="Fan / Motor"
          description={fanOn ? "Running via L298N driver" : "Standby"}
          active={fanOn}
          accent="#818cf8"
          onToggle={isManual ? onFanToggle : null}
        />
        <DeviceRow
          icon={Lightbulb}
          label="NeoPixel Light"
          description={lightOn ? "Warm white — occupancy detected" : "Off — room empty"}
          active={lightOn}
          accent="#fbbf24"
          onToggle={isManual ? onLightToggle : null}
        />
        <DeviceRow
          icon={Eye}
          label="PIR Motion Sensor"
          description={telemetry.motion ? "Motion detected" : "No motion"}
          active={telemetry.motion}
          accent="#22d3ee"
        />
        <DeviceRow
          icon={Moon}
          label="Ambient Light"
          description={telemetry.is_dark ? "Low-light environment" : "Sufficient ambient light"}
          active={telemetry.is_dark}
          accent="#f59e0b"
        />
      </div>
    </div>
  );
}
