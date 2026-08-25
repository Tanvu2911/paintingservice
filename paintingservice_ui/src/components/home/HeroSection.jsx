import { ShieldCheck, CalendarPlus, ArrowRight, Sparkles, Palette, Award, CheckCircle } from "lucide-react";

export default function HeroSection({ onBookingCTA }) {
  const COLOR_PALETTES = [
    { name: "Xanh Ngọc Dulux", bg: "bg-emerald-500", border: "border-emerald-300", tag: "Hot Trend 2026" },
    { name: "Xanh Biển Jotun", bg: "bg-sky-500", border: "border-sky-300", tag: "Hiện đại" },
    { name: "Cam Ấm Kova", bg: "bg-amber-500", border: "border-amber-300", tag: "Ấm cúng" },
    { name: "Tím Thạch Anh Nippon", bg: "bg-violet-500", border: "border-violet-300", tag: "Sang trọng" },
    { name: "Hồng San Hô Dulux", bg: "bg-rose-400", border: "border-rose-300", tag: "Tinh tế" },
    { name: "Vàng Kem Hoàng Gia", bg: "bg-yellow-400", border: "border-yellow-300", tag: "Cổ điển" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-sky-50/40 to-amber-50/30 text-slate-900 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
      {/* Decorative ambient color blur circles */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center space-y-7">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/90 border border-emerald-200 text-emerald-900 shadow-xs backdrop-blur-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cam kết sơn chính hãng 100% • Khảo sát &amp; Báo giá tận nơi miễn phí</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
          Nâng Tầm Không Gian Sống <br className="hidden sm:inline" />
          Bằng <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent underline decoration-emerald-300 underline-offset-8">Lớp Sơn Hoàn Hảo</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Giải pháp thi công sơn nhà trọn gói uy tín: Hợp đồng điện tử minh bạch,
          thanh toán trực tuyến qua VNPay Sandbox, thợ lành nghề và bảo hành điện tử dài hạn.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onBookingCTA}
            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <CalendarPlus className="w-4 h-4 text-white" />
            <span>Đặt Lịch Khảo Sát Miễn Phí</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <a
            href="#services"
            className="px-7 py-4 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 backdrop-blur-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Xem Bảng Giá Dịch Vụ</span>
          </a>
        </div>

        {/* Interactive Paint Palette Strip */}
        <div className="pt-6 max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 px-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>Bảng Màu Sơn Xu Hướng 2026:</span>
            </div>
            <div className="flex items-center gap-2">
              {COLOR_PALETTES.map((c, i) => (
                <div
                  key={i}
                  className="group relative cursor-pointer"
                  title={`${c.name} - ${c.tag}`}
                >
                  <div className={`w-6 h-6 rounded-full ${c.bg} border-2 ${c.border} shadow-xs transition-transform group-hover:scale-125`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg z-20">
                    {c.name} ({c.tag})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Color-Coded Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto">
          <div className="p-4 bg-white/90 rounded-2xl border border-emerald-200/80 shadow-xs backdrop-blur-xs hover:border-emerald-400 transition-colors">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">5.200+</div>
            <div className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Công trình hoàn thiện</span>
            </div>
          </div>

          <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/80 shadow-xs backdrop-blur-xs hover:border-amber-400 transition-colors">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">99.8%</div>
            <div className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Khách hàng hài lòng</span>
            </div>
          </div>

          <div className="p-4 bg-white/90 rounded-2xl border border-sky-200/80 shadow-xs backdrop-blur-xs hover:border-sky-400 transition-colors">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">VNPay</div>
            <div className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Thanh toán tự động</span>
            </div>
          </div>

          <div className="p-4 bg-white/90 rounded-2xl border border-indigo-200/80 shadow-xs backdrop-blur-xs hover:border-indigo-400 transition-colors">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">5 Năm</div>
            <div className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bảo hành điện tử</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
