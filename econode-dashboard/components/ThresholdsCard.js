"use client";

import { useState, useRef } from "react";
import { Thermometer, Droplets, Save, RotateCcw, CheckCircle } from "lucide-react";

function ThresholdRow({
  icon: Icon,
  label,
  unit,
  value,
  min,
  max,
  step = 0.5,
  accent,
  currentReading,
  onChange,
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const isBreached = currentReading != null && currentReading >= value;

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}22` }}>
            <Icon size={16} style={{ color: accent }} />
          </div>
          <span className="text-sm font-medium text-white">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          {isBreached && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
              ⚠ Breached
            </span>
          )}
          <div className="flex items-center gap-1 rounded-lg overflow-hidden"
               style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(1))))}
              className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors text-sm font-mono"
            >−</button>
            <span className="text-white font-display font-semibold tabular text-sm px-1 min-w-[3.5rem] text-center">
              {value}{unit}
            </span>
            <button
              onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(1))))}
              className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors text-sm font-mono"
            >+</button>
          </div>
        </div>
      </div>

      {/* Progress bar showing current reading vs threshold */}
      <div className="space-y-1">
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          {/* Threshold marker */}
          <div className="absolute top-0 bottom-0 w-0.5 z-10"
               style={{ left: `${pct}%`, background: accent, opacity: 0.8 }} />
          {/* Current reading fill */}
          {currentReading != null && (
            <div className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-700"
                 style={{
                   width: `${Math.min(100, ((currentReading - min) / (max - min)) * 100)}%`,
                   background: isBreached
                     ? "linear-gradient(90deg, rgba(239,68,68,0.6), rgba(239,68,68,0.3))"
                     : `linear-gradient(90deg, ${accent}99, ${accent}44)`,
                 }} />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>{min}{unit}</span>
          {currentReading != null && (
            <span style={{ color: isBreached ? "#f87171" : "#64748b" }}>
              Now: {typeof currentReading === "number" ? currentReading.toFixed(1) : "—"}{unit}
            </span>
          )}
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function ThresholdsCard({ settings, telemetry, onSave }) {
  const defaults = {
    temp_threshold: settings.temp_threshold ?? 28.0,
    humidity_threshold: settings.humidity_threshold ?? 65.0,
  };

  const [tempVal, setTempVal]   = useState(defaults.temp_threshold);
  const [humVal,  setHumVal]    = useState(defaults.humidity_threshold);
  const [saved,   setSaved]     = useState(false);
  const saveTimer               = useRef(null);

  // Keep local state in sync if settings update from realtime
  const prevSettings = useRef(settings);
  if (
    settings.temp_threshold !== prevSettings.current.temp_threshold ||
    settings.humidity_threshold !== prevSettings.current.humidity_threshold
  ) {
    prevSettings.current = settings;
    setTempVal(settings.temp_threshold ?? 28.0);
    setHumVal(settings.humidity_threshold  ?? 65.0);
  }

  const isDirty =
    tempVal !== (settings.temp_threshold ?? 28.0) ||
    humVal  !== (settings.humidity_threshold ?? 65.0);

  const handleSave = async () => {
    await onSave({ temp_threshold: tempVal, humidity_threshold: humVal });
    setSaved(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setTempVal(settings.temp_threshold ?? 28.0);
    setHumVal(settings.humidity_threshold ?? 65.0);
  };

  return (
    <div className="glass card-hover rounded-2xl p-6" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-white">Auto Thresholds</h3>
          <p className="text-xs text-slate-500 mt-0.5">Fan triggers when either value is exceeded</p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty && !saved}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: saved ? "rgba(16,185,129,0.2)"   : isDirty ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)",
              color:      saved ? "#34d399"                : isDirty ? "#a5b4fc"               : "#475569",
              cursor:     !isDirty && !saved ? "not-allowed" : "pointer",
            }}
          >
            {saved ? <CheckCircle size={12} /> : <Save size={12} />}
            {saved ? "Saved!" : "Save to node"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <ThresholdRow
          icon={Thermometer}
          label="Temperature Threshold"
          unit="°C"
          value={tempVal}
          min={15}
          max={45}
          step={0.5}
          accent="#818cf8"
          currentReading={telemetry.temperature}
          onChange={setTempVal}
        />
        <ThresholdRow
          icon={Droplets}
          label="Humidity Threshold"
          unit="%"
          value={humVal}
          min={20}
          max={95}
          step={1}
          accent="#22d3ee"
          currentReading={telemetry.humidity}
          onChange={setHumVal}
        />
      </div>

      <p className="text-[10px] text-slate-700 mt-4 text-center">
        Changes sync to the node within 3 seconds via Supabase cloud settings
      </p>
    </div>
  );
}
