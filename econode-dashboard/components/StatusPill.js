export default function StatusPill({ label, tone = "emerald", showDot = true }) {
  const tones = {
    emerald: { dot: "bg-emerald-400", text: "text-emerald-300/90", ring: "ring-emerald-500/20" },
    sky: { dot: "bg-sky-400", text: "text-sky-300/90", ring: "ring-sky-500/20" },
    amber: { dot: "bg-amber-400", text: "text-amber-300/90", ring: "ring-amber-500/20" },
  };
  const t = tones[tone];

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        glass text-[11px] font-medium tracking-wide uppercase
        ring-1 ${t.ring} ${t.text}
      `}
    >
      {showDot && (
        <span className={`relative flex h-1.5 w-1.5`}>
          <span className={`pulse-dot absolute inline-flex h-full w-full rounded-full ${t.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${t.dot}`} />
        </span>
      )}
      {label}
    </div>
  );
}
