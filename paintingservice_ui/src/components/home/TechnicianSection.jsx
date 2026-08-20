const AVATAR_COLORS = [
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-emerald-600 text-white",
  "bg-teal-600 text-white",
  "bg-orange-500 text-white",
  "bg-rose-600 text-white",
];

function TechnicianCard({ tech, idx }) {
  const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const initials = (tech.username || tech.fullName || "T")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center text-center hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner mb-3 ${colorClass}`}
      >
        {initials}
      </div>
      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
        {tech.username || tech.fullName}
      </h4>
      <span className="mt-1.5 inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
        {tech.specialty || "Thợ thi công"}
      </span>
      <p className="mt-2 text-xs text-slate-400">
        {tech.phoneNumber ? `📞 ${tech.phoneNumber}` : "Chuyên nghiệp · Tận tâm"}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 mb-3" />
      <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-100 rounded" />
    </div>
  );
}

export default function TechnicianSection({ technicians = [], loading = false }) {
  const featured = technicians.slice(0, 6);

  if (!loading && featured.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
      <div className="text-center max-w-xl mx-auto mb-12">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
          Đội Ngũ Thợ Lành Nghề
        </h3>
        <p className="text-sm text-slate-400">
          Mỗi kỹ thuật viên đều được đào tạo bài bản, kinh nghiệm thực chiến
          và cam kết hoàn thành đúng tiến độ.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : featured.map((tech, idx) => (
              <TechnicianCard
                key={tech.userId ?? tech.id ?? idx}
                tech={tech}
                idx={idx}
              />
            ))}
      </div>
    </section>
  );
}
