"use client";

export default function Toggle({ checked, onChange, disabled = false, accent = "amber" }) {
  const accents = {
    amber: "bg-amber-500 shadow-[0_0_20px_-2px_rgba(245,158,11,0.5)]",
    sky: "bg-sky-500 shadow-[0_0_20px_-2px_rgba(14,165,233,0.5)]",
    emerald: "bg-emerald-500 shadow-[0_0_20px_-2px_rgba(16,185,129,0.5)]",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 shrink-0 items-center rounded-full
        transition-all duration-300 ease-out
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
        ${checked ? accents[accent] : "bg-zinc-800 border border-white/5"}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 rounded-full bg-white shadow-md
          transition-transform duration-300 ease-out
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
