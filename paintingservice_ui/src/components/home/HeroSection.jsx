import { useState, useEffect } from "react";
import { CalendarPlus, ArrowRight, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, CheckCircle2, Building2 } from "lucide-react";
import ScrollReveal from "../common/ScrollReveal";

const SHOWCASE_ITEMS = [
  {
    id: 1,
    image: "/hero-living.jpg",
    title: "Phòng Khách Sang Trọng",
    palette: "Kem Ấm & Xanh Sage",
    colorDots: ["#E7DFD5", "#98A898", "#2C3E50"],
    feature: "Bề mặt mịn lì • Chống bám bẩn 100%",
  },
  {
    id: 2,
    image: "/hero-luxury.jpg",
    title: "Nội Thất Tân Cổ Điển",
    palette: "Trắng Sứ & Phào Chỉ Vàng",
    colorDots: ["#F9F9F7", "#D4AF37", "#3B4252"],
    feature: "Đường nét sắc cạnh • Độ hoàn thiện 5 sao",
  },
  {
    id: 3,
    image: "/hero-villa.jpg",
    title: "Biệt Thự Hiện Đại",
    palette: "Trắng Tuyết & Xám Slate",
    colorDots: ["#FFFFFF", "#64748B", "#1E293B"],
    feature: "Sơn ngoại thất cao cấp • Chống thấm 10 năm",
  },
];

export default function HeroSection({ onBookingCTA }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Tự động chuyển ảnh nền sau mỗi 4.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentItem = SHOWCASE_ITEMS[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? SHOWCASE_ITEMS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex items-center border-b border-slate-800/80">
      {/* ẢNH CÔNG TRÌNH FULL BANNER 100% (Full Background Slider) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {SHOWCASE_ITEMS.map((item, idx) => (
          <div
            key={item.id}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
              idx === activeIdx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}

        {/* Lớp phủ đa tầng: Làm nổi bật ảnh ở bên phải, giữ nền chữ bên trái rõ nét và sang trọng */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />
      </div>

      {/* Nút lùi/tiến đổi ảnh Full Banner */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Ảnh trước"
        className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 border border-slate-700/80 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-110 z-20 cursor-pointer shadow-xl"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        aria-label="Ảnh kế tiếp"
        className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 border border-slate-700/80 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-110 z-20 cursor-pointer shadow-xl"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* NỘI DUNG CHÍNH (Chữ là phụ - Đặt gọn gàng, tinh tế bên trái) */}
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 z-10">
        <div className="max-w-2xl flex flex-col items-start space-y-6 text-left">
          
          <ScrollReveal animation="fade-up" duration={500}>
            {/* 1. Huy hiệu nhỏ trang nhã */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300 bg-slate-900/80 border border-amber-500/30 shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dịch Vụ Thi Công Sơn Nhà 5 Sao • Precision Paint</span>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" duration={600} delay={100}>
            {/* 2. Tiêu đề cô đọng, súc tích */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Nâng Tầm Không Gian Sống <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Đẳng Cấp &amp; Bền Màu
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" duration={600} delay={200}>
            {/* 3. Mô tả ngắn 1 câu - Chữ là phụ */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-200/95 leading-relaxed font-normal max-w-xl drop-shadow-sm">
              Khảo sát &amp; tư vấn phối màu 0đ tận nơi. Thi công sắc nét, bàn giao sạch sẽ với chính sách bảo hành điện tử 5 năm.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" duration={600} delay={300} className="w-full">
            {/* 4. Nút hành động */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={onBookingCTA}
                className="px-7 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-200 flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Đặt Lịch Khảo Sát 0đ</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <a
                href="#services"
                className="px-6 py-3.5 sm:py-4 bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 hover:text-white font-semibold text-sm sm:text-base rounded-xl border border-slate-700/80 transition-all duration-200 flex items-center gap-2 backdrop-blur-md hover:scale-105 active:scale-95 shadow-md"
              >
                <span>Xem Bảng Giá &amp; Dịch Vụ</span>
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" duration={600} delay={400} className="w-full">
            {/* 5. Dải chứng nhận uy tín (Không dùng ảnh khách ảo) */}
            <div className="pt-4 border-t border-slate-700/60 flex flex-wrap items-center gap-5 sm:gap-7 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span><strong className="text-white font-bold">5.200+</strong> công trình đã thực hiện</span>
              </div>

              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bảo hành 5 năm</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100% Sơn chính hãng</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* THẺ THÔNG TIN DỰ ÁN & BỘ ĐIỀU KHIỂN ẢNH (Góc dưới bên phải màn hình) */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 lg:right-10 z-20 max-w-sm sm:max-w-md w-full">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-700/70 shadow-2xl space-y-3">
          {/* Tiêu đề & Thông số hoàn thiện */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {currentItem.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dự án thực tế
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                {currentItem.feature}
              </p>
            </div>

            {/* Số thứ tự ảnh */}
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-amber-400">
                0{activeIdx + 1}
              </span>
              <span className="text-xs text-slate-500"> / 0{SHOWCASE_ITEMS.length}</span>
            </div>
          </div>

          {/* Gam màu thực tế & nút chuyển thumbnail */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400">Gam màu:</span>
              <span className="font-medium text-white">{currentItem.palette}</span>
              <div className="flex items-center gap-1 ml-1">
                {currentItem.colorDots.map((c, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Các nút chấm chọn ảnh */}
            <div className="flex items-center gap-1.5">
              {SHOWCASE_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Chuyển tới ${item.title}`}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeIdx
                      ? "w-6 bg-amber-400"
                      : "w-2 bg-slate-600 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


