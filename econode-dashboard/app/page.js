"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import ModeSwitch from "@/components/ModeSwitch";
import ClimateCard from "@/components/ClimateCard";
import LightingCard from "@/components/LightingCard";

const SETTINGS_ID = 1;

export default function Dashboard() {
  // Telemetry (sensors)
  const [telemetry, setTelemetry] = useState({
    temperature: null,
    humidity: null,
    motion: false,
    is_dark: false,
    fan_on: false,
    light_on: false,
  });

  // Device settings (mode + overrides)
  const [settings, setSettings] = useState({
    mode: "AUTO", // "AUTO" | "MANUAL"
    fan_override: false,
    light_override: false,
  });

  const [loaded, setLoaded] = useState(false);

  // --- Initial load + realtime subscription ---
  useEffect(() => {
    let telemetryChannel;
    let settingsChannel;

    const init = async () => {
      // Fetch latest telemetry row
      const { data: tRow } = await supabase
        .from("econode_telemetry")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tRow) setTelemetry((prev) => ({ ...prev, ...tRow }));

      // Fetch device settings (single row id=1)
      const { data: sRow } = await supabase
        .from("econode_device_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .maybeSingle();

      if (sRow) setSettings((prev) => ({ ...prev, ...sRow }));

      setLoaded(true);

      // Realtime: telemetry inserts/updates
      telemetryChannel = supabase
        .channel(`telemetry_${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "econode_telemetry" },
          (payload) => {
            if (payload.new) {
              setTelemetry((prev) => ({ ...prev, ...payload.new }));
            }
          }
        )
        .subscribe();

      // Realtime: device settings updates (filtered to id=1)
      settingsChannel = supabase
        .channel(`settings_${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "econode_device_settings",
            filter: `id=eq.${SETTINGS_ID}`,
          },
          (payload) => {
            if (payload.new) {
              setSettings((prev) => ({ ...prev, ...payload.new }));
            }
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (telemetryChannel) supabase.removeChannel(telemetryChannel);
      if (settingsChannel) supabase.removeChannel(settingsChannel);
    };
  }, []);

  // --- Update helper ---
  const updateSettings = async (patch) => {
    // Optimistic update for snappy UI
    setSettings((prev) => ({ ...prev, ...patch }));

    const { error } = await supabase
      .from("econode_device_settings")
      .update(patch)
      .eq("id", SETTINGS_ID);

    if (error) {
      console.error("Failed to update settings:", error.message);
      // Realtime channel will reconcile if optimistic update was wrong
    }
  };

  // Effective fan/light state: in MANUAL, use override; in AUTO, use sensor-driven state
  const effectiveFan = settings.mode === "MANUAL" ? settings.fan_override : telemetry.fan_on;
  const effectiveLight = settings.mode === "MANUAL" ? settings.light_override : telemetry.light_on;

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-8 sm:py-12 max-w-6xl mx-auto">
      {/* ───── HEADER ───── */}
      <header className="mb-10 sm:mb-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Title block */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-amber-500 rounded-full" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
                EcoNode · IoT Dashboard
              </span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl text-white leading-[1.05]">
              Power-Optimized
              <br />
              <span className="italic text-amber-200/90">Automation</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-3 max-w-md">
              Dual-mode control for a 5V regulated node — climate and occupancy intelligence on a single sensor mesh.
            </p>
          </div>

          {/* Status pills + mode switch */}
          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill label="Cloud Sync Active" tone="emerald" />
              <StatusPill label="5V Regulated" tone="sky" showDot={false} />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">Master Mode</span>
              <ModeSwitch
                mode={settings.mode}
                onChange={(mode) => updateSettings({ mode })}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ───── CARDS ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <ClimateCard
          temperature={telemetry.temperature}
          humidity={telemetry.humidity}
          fanOn={effectiveFan}
          mode={settings.mode}
          onFanToggle={(val) => updateSettings({ fan_override: val })}
        />
        <LightingCard
          motion={telemetry.motion}
          isDark={telemetry.is_dark}
          lightOn={effectiveLight}
          mode={settings.mode}
          onLightToggle={(val) => updateSettings({ light_override: val })}
        />
      </div>

      {/* ───── FOOTER ───── */}
      <footer className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-zinc-600">
        <div className="flex items-center gap-4">
          <span>Node ID: EN-001</span>
          <span className="text-zinc-700">·</span>
          <span>Firmware v1.2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
          <span>Telemetry live · {loaded ? "Synced" : "Connecting…"}</span>
        </div>
      </footer>
    </main>
  );
}
