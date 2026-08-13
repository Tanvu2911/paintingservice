const StatCard = ({ label, value, colorClass = "text-slate-900", borderClass = "", icon = "📈" }) => {
  return (
    <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300 relative overflow-hidden group ${borderClass}`}>
      <div className="absolute -right-4 -bottom-4 text-6xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">{icon}</div>
      <div className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] mb-2">{label}</div>
      <div className={`text-4xl font-black tracking-tighter ${colorClass}`}>{value?.toLocaleString()}</div>
    </div>
  );
};

export default StatCard;