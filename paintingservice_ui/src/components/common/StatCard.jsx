export default function StatCard({ label, value, colorClass = "text-blue-600", borderClass = "border-l-4 border-l-blue-500" }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${borderClass}`}>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black ${colorClass}`}>{value}</p>
    </div>
  );
}

export { StatCard as StatsCard };