export default function LoadingSkeleton({ rows = 4, columns = 4, variant = "light" }) {
  const isDark = variant === "dark";

  return (
    <div
      className={`rounded-2xl p-4 space-y-3 animate-pulse ${
        isDark ? "bg-slate-800/60 border border-slate-700/60" : "bg-white border border-slate-100"
      }`}
    >
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }).map((__, col) => (
            <div
              key={col}
              className={`h-4 rounded flex-1 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
              style={{ opacity: 1 - col * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
