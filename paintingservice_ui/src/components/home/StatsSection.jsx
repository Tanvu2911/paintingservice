const STATS = [
  { value: "1,200+", label: "Công trình hoàn thành" },
  { value: "45+", label: "Thợ thâm niên cao" },
  { value: "100%", label: "Vật liệu chính hãng" },
  { value: "5 Năm", label: "Bảo hành kết cấu" },
];

export default function StatsSection() {
  return (
    <section className="max-w-5xl mx-auto -mt-8 mb-20 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-md md:divide-x divide-slate-100">
        {STATS.map((stat, idx) => (
          <div key={idx} className="text-center p-2 md:p-0">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 mb-1">
              {stat.value}
            </div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
