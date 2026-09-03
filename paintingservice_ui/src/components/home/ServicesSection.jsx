import { Paintbrush, CheckCircle2, ArrowRight, Home as HomeIcon, Sparkles, ShieldCheck, Layers, Droplets, Building } from "lucide-react";
import { formatMoney } from "../../util/formatters";

const SERVICE_ICONS = [
  HomeIcon,
  Sparkles,
  ShieldCheck,
  Layers,
  Droplets,
  Building,
  Paintbrush,
];

export default function ServicesSection({ services, loadingServices, onSelectService }) {
  return (
    <section id="services" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-white py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/70">
      {/* Decorative ambient backgrounds */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200 shadow-xs">
            Hạng Mục Dịch Vụ Của Chúng Tôi
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3.5">
            Gói Dịch Vụ Sơn Nhà Trọn Gói Precision Paint
          </h3>
          <p className="text-sm text-slate-500 mt-2.5">
            Chọn gói dịch vụ bên dưới để chuyển thẳng sang phần đặt lịch khảo sát đã chọn sẵn.
          </p>
        </div>

        {loadingServices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-4/5" />
                <div className="h-10 bg-amber-100 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto">
            <Paintbrush className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-bold">Chưa có dịch vụ nào trên hệ thống</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng quay lại sau</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {services.map((srv, index) => {
              const ServiceIcon = SERVICE_ICONS[index % SERVICE_ICONS.length] || Paintbrush;
              return (
                <div
                  key={srv.id}
                  className="bg-white/95 backdrop-blur-xs rounded-3xl border border-slate-200/90 p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center group-hover:bg-[#1E3A8A] group-hover:text-white transition-all duration-300 shadow-xs">
                        <ServiceIcon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200">
                        Chính Hãng 100%
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-[#1E3A8A] transition-colors">
                      {srv.name}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-5 line-clamp-3">
                      {srv.description || "Dịch vụ sơn chất lượng cao, bền màu và thẩm mỹ vượt trội."}
                    </p>

                    <div className="space-y-2 mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Vật tư sơn chính hãng 100%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Che chắn nội thất sạch sẽ</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Bảo hành chất lượng công trình</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Đơn giá cơ sở
                    </div>
                    <div className="text-xl font-black text-[#1E3A8A] mb-3 font-mono">
                      {srv.basePrice ? `${formatMoney(srv.basePrice)} / m²` : "Khảo sát báo giá"}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectService(srv)}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    >
                      <span>Chọn dịch vụ này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
