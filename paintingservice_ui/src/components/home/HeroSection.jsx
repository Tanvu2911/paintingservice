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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#090D1A] via-[#0F172A] to-[#0B132B] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Decorative ambient color blur circles & SVG dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute -top-24 -left-20 w-[34rem] h-[34rem] bg-gradient-to-br from-blue-600/25 to-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-[32rem] h-[32rem] bg-gradient-to-bl from-amber-500/20 to-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-[30rem] h-[30rem] bg-gradient-to-tr from-sky-500/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300 shadow-xs backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Cam kết sơn chính hãng 100% • Khảo sát &amp; Báo giá tận nơi miễn phí</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white">
          Nâng Tầm Không Gian Sống <br className="hidden sm:inline" />
          Bằng <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-400 bg-clip-text text-transparent underline decoration-amber-400 underline-offset-8">Lớp Sơn Precision Paint</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          Giải pháp thi công sơn nhà trọn gói uy tín: Hợp đồng điện tử minh bạch,
          thanh toán trực tuyến qua VNPay Sandbox, thợ lành nghề và bảo hành điện tử dài hạn.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onBookingCTA}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <CalendarPlus className="w-5 h-5 text-white" />
            <span>Đặt Lịch Khảo Sát &amp; Nhận Báo Giá Miễn Phí</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <a
            href="#services"
            className="px-7 py-4 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl border border-slate-700 shadow-sm transition-all flex items-center gap-2 backdrop-blur-md hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Xem Bảng Giá Dịch Vụ</span>
          </a>
        </div>

        {/* Interactive Paint Palette Strip */}
        <div className="pt-6 max-w-2xl mx-auto">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 px-2">
              <Palette className="w-4 h-4 text-emerald-400" />
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
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg z-20">
                    {c.name} ({c.tag})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Color-Coded Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800 max-w-4xl mx-auto">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-lg backdrop-blur-md hover:border-emerald-400 hover:bg-slate-850 transition-all">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">5.200+</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Công trình hoàn thiện</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 shadow-lg backdrop-blur-md hover:border-amber-400 hover:bg-slate-850 transition-all">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">99.8%</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Khách hàng hài lòng</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-sky-500/30 shadow-lg backdrop-blur-md hover:border-sky-400 hover:bg-slate-850 transition-all">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-400 to-blue-300 bg-clip-text text-transparent">VNPay</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Thanh toán tự động</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 shadow-lg backdrop-blur-md hover:border-indigo-400 hover:bg-slate-850 transition-all">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">5 Năm</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bảo hành điện tử</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
