"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Activity,
  Zap,
  Sun,
} from "lucide-react";

import Sidebar        from "@/components/Sidebar";
import Topbar         from "@/components/Topbar";
import StatCard        from "@/components/StatCard";
import TelemetryChart  from "@/components/TelemetryChart";
import DevicesCard     from "@/components/DevicesCard";
import MotorSpeedCard  from "@/components/MotorSpeedCard";

const SETTINGS_ID  = 1;
const HISTORY_MAX  = 20;

function formatTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const [telemetry, setTelemetry] = useState({
    temperature: null,
    humidity:    null,
    motion:      false,
    is_dark:     false,
    ldr_raw:     null,
    fan_on:      false,
    light_on:    false,
    created_at:  null,
  });

  const [settings, setSettings] = useState({
    mode:           "AUTO",
    fan_override:   false,
    light_override: false,
    motor_speed:    200,
  });

  const [history, setHistory]     = useState([]);
  const [loaded,  setLoaded]      = useState(false);
  const [synced,  setSynced]      = useState(false);
  const [lastSync, setLastSync]   = useState("");

  // Debounce motor speed saves
  const speedTimer = useRef(null);

  /* ── Initial fetch + realtime ───────────────────── */
  useEffect(() => {
    let telCh, setCh;

    const init = async () => {
      // Latest telemetry
      const { data: tRow } = await supabase
        .from("econode_telemetry")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tRow) {
        setTelemetry((p) => ({ ...p, ...tRow }));
        setLastSync(formatTime(tRow.created_at));
      }

      // Historical (last 20 rows)
      const { data: hist } = await supabase
        .from("econode_telemetry")
        .select("temperature,humidity,ldr_raw,created_at")
        .order("created_at", { ascending: true })
        .limit(HISTORY_MAX);

      if (hist) {
        setHistory(
          hist.map((r) => ({
            time: formatTime(r.created_at),
            temp: r.temperature,
            hum:  r.humidity,
            ldr:  r.ldr_raw ?? null,
          }))
        );
      }

      // Device settings
      const { data: sRow } = await supabase
        .from("econode_device_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .maybeSingle();

      if (sRow) setSettings((p) => ({ ...p, ...sRow }));

      setLoaded(true);
      setSynced(true);

      /* ── Realtime subscriptions ────────────────── */
      telCh = supabase
        .channel(`tel_${Date.now()}`)
        .on("postgres_changes",
            { event: "*", schema: "public", table: "econode_telemetry" },
            ({ new: row }) => {
              if (!row) return;
              setTelemetry((p) => ({ ...p, ...row }));
              setLastSync(formatTime(row.created_at));
              setSynced(true);
              setHistory((prev) => {
                const next = [
                  ...prev,
                  {
                    time: formatTime(row.created_at),
                    temp: row.temperature,
                    hum:  row.humidity,
                    ldr:  row.ldr_raw ?? null,
                  },
                ];
                return next.slice(-HISTORY_MAX);
              });
            })
        .subscribe();

      setCh = supabase
        .channel(`set_${Date.now()}`)
        .on("postgres_changes",
            { event: "*", schema: "public", table: "econode_device_settings", filter: `id=eq.${SETTINGS_ID}` },
            ({ new: row }) => { if (row) setSettings((p) => ({ ...p, ...row })); })
        .subscribe();
    };

    init();
    return () => {
      if (telCh) supabase.removeChannel(telCh);
      if (setCh)  supabase.removeChannel(setCh);
    };
  }, []);

  /* ── Settings update ────────────────────────────── */
  const updateSettings = useCallback(async (patch) => {
    setSettings((p) => ({ ...p, ...patch }));
    await supabase
      .from("econode_device_settings")
      .update(patch)
      .eq("id", SETTINGS_ID);
  }, []);

  /* ── Motor speed (debounced) ───────────────────── */
  const handleSpeedChange = (val) => {
    setSettings((p) => ({ ...p, motor_speed: val }));
    clearTimeout(speedTimer.current);
    speedTimer.current = setTimeout(() => {
      supabase
        .from("econode_device_settings")
        .update({ motor_speed: val })
        .eq("id", SETTINGS_ID);
    }, 500);
  };

  /* ── Derived ─────────────────────────────────────── */
  const isManual    = settings.mode === "MANUAL";
  const effectiveFan   = isManual ? settings.fan_override   : telemetry.fan_on;
  const effectiveLight = isManual ? settings.light_override : telemetry.light_on;

  const tempTrend =
    history.length >= 2
      ? history.at(-1).temp > history.at(-2).temp ? "up" : "down"
      : null;

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          synced={synced}
          lastSync={lastSync}
          mode={settings.mode}
          onModeChange={(mode) => updateSettings({ mode })}
        />

        {/* ── Main scroll area ───────────────────── */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── Stat row ───────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Temperature"
              value={telemetry.temperature != null ? telemetry.temperature.toFixed(1) : null}
              unit="°C"
              icon={Thermometer}
              accent="#818cf8"
              trend={tempTrend}
              sublabel="DHT11 sensor"
            />
            <StatCard
              label="Humidity"
              value={telemetry.humidity != null ? Math.round(telemetry.humidity) : null}
              unit="%"
              icon={Droplets}
              accent="#22d3ee"
              sublabel="Relative humidity"
            />
            <StatCard
              label="Fan"
              value={effectiveFan ? "ON" : "OFF"}
              unit=""
              icon={Wind}
              accent={effectiveFan ? "#818cf8" : "#475569"}
              sublabel={isManual ? "Manual override" : "Threshold driven"}
            />
            <StatCard
              label="Ambient Light"
              value={telemetry.is_dark ? "Dark" : "Bright"}
              unit=""
              icon={Sun}
              accent={telemetry.is_dark ? "#f59e0b" : "#fde68a"}
              sublabel={
                telemetry.ldr_raw != null
                  ? `ADC: ${telemetry.ldr_raw} / 4095`
                  : "LDR on GPIO 34"
              }
            />
          </div>

          {/* ── Chart + Devices ─────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TelemetryChart data={history} />
            </div>
            <DevicesCard
              telemetry={telemetry}
              settings={settings}
              onFanToggle={(val)   => updateSettings({ fan_override:   val })}
              onLightToggle={(val) => updateSettings({ light_override: val })}
            />
          </div>

          {/* ── Motor speed ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MotorSpeedCard
              speed={settings.motor_speed ?? 200}
              onChange={handleSpeedChange}
              disabled={!isManual}
            />

            {/* Mini activity log */}
            <div className="lg:col-span-2 glass card-hover rounded-2xl p-6"
                 style={{ background: "var(--surface)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-indigo-400" />
                <h3 className="font-display font-semibold text-white">Activity Log</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.length === 0 && (
                  <p className="text-xs text-slate-600">Waiting for telemetry…</p>
                )}
                {[...history].reverse().map((row, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-2"
                       style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-slate-600 tabular w-20 flex-shrink-0">{row.time}</span>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: "#818cf8" }} />
                    <span className="text-slate-400">
                      Temp <span className="text-white font-medium">{row.temp?.toFixed(1)}°C</span>
                      {" · "}
                      Hum <span className="text-white font-medium">{Math.round(row.hum)}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────── */}
          <footer className="flex items-center justify-between pt-4 text-xs text-slate-700"
                  style={{ borderTop: "1px solid var(--border)" }}>
            <span>EcoNode EN-001 · Firmware v1.2 · L298N motor driver</span>
            <span className="flex items-center gap-1.5">
              <Zap size={10} className="text-amber-500" />
              5V regulated · {loaded ? "Live" : "Connecting…"}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
