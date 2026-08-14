export default function StatCard({
  label,
  value,
  colorClass = "text-blue-400",
  borderClass = "border-l-4 border-l-blue-500",
  variant = "dark",
}) {
  const isDark = variant === "dark";

  return (
    <div
      className={`rounded-2xl p-6 ${borderClass} ${
        isDark
          ? "bg-slate-800/60 border border-slate-700/60 shadow-lg shadow-black/20"
          : "bg-white shadow-sm border border-slate-100"
      }`}
    >
      <p
        className={`text-xs font-black uppercase tracking-widest mb-2 ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className={`text-3xl font-black ${colorClass}`}>{value}</p>
    </div>
  );
}

export { StatCard as StatsCard };
