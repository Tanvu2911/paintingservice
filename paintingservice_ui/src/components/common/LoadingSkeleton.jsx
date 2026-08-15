export default function LoadingSkeleton({ rows = 4, columns = 4 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }).map((__, col) => (
            <div
              key={col}
              className="h-4 bg-slate-200 rounded flex-1"
              style={{ opacity: 1 - col * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
