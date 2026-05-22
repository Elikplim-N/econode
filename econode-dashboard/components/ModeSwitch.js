"use client";

export default function ModeSwitch({ mode, onChange }) {
  const isAuto = mode === "AUTO";

  return (
    <div className="relative inline-flex items-center rounded-full p-1 glass-strong">
      {/* Sliding indicator */}
      <div
        className={`
          absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full
          transition-all duration-400 ease-out
          ${
            isAuto
              ? "left-1 bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 shadow-[0_0_24px_-4px_rgba(16,185,129,0.6)]"
              : "left-[calc(50%+0rem)] bg-gradient-to-br from-amber-500/90 to-amber-600/90 shadow-[0_0_24px_-4px_rgba(245,158,11,0.6)]"
          }
        `}
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      />

      <button
        onClick={() => onChange("AUTO")}
        className={`
          relative z-10 px-5 py-2 rounded-full text-xs font-medium tracking-[0.15em] uppercase
          transition-colors duration-300
          ${isAuto ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
        `}
      >
        Auto
      </button>
      <button
        onClick={() => onChange("MANUAL")}
        className={`
          relative z-10 px-5 py-2 rounded-full text-xs font-medium tracking-[0.15em] uppercase
          transition-colors duration-300
          ${!isAuto ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
        `}
      >
        Manual
      </button>
    </div>
  );
}
