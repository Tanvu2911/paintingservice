const SERVICE_ICONS = ["🧱", "🎨", "⚡", "🪟", "🪵", "🛡️"];

function ServiceCard({ service, idx }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="w-12 h-12 bg-slate-50 text-2xl rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
        {SERVICE_ICONS[idx % SERVICE_ICONS.length]}
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
        {service.name}
      </h4>
      <p className="text-sm text-slate-500 leading-relaxed">
        {service.description || "Chưa có mô tả chi tiết cho dịch vụ này."}
      </p>
      <div className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest">
        Từ {service.basePrice?.toLocaleString("vi-VN")} VNĐ
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
      <div className="w-12 h-12 bg-slate-100 rounded-xl mb-4" />
      <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-full mb-1" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
  );
}

export default function ServiceSection({ services = [], loading = false }) {
  return (
    <section
      id="services"
      className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center max-w-xl mx-auto mb-12">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
          Dịch Vụ Chuyên Sâu Của Chúng Tôi
        </h3>
        <p className="text-sm text-slate-400">
          Đáp ứng mọi nhu cầu sửa chữa từ dặm vá nhỏ lẻ đến cải tạo kết cấu
          phức tạp toàn diện căn nhà.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : services.map((srv, idx) => (
              <ServiceCard key={srv.id || idx} service={srv} idx={idx} />
            ))}
      </div>
    </section>
  );
}
