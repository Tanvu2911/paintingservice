import { Search, FileText, Hammer, Award, Clock, ArrowRight } from "lucide-react";
import ScrollReveal from "../common/ScrollReveal";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Khảo Sát & Báo Giá Miễn Phí",
    desc: "Kỹ thuật viên có mặt tận nơi sau 30 phút, đo đạc diện tích thực tế và tư vấn chủng loại sơn tối ưu chi phí.",
    Icon: Search,
    highlight: "Miễn phí 100%",
    iconBg: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    stepNumColor: "text-slate-800 group-hover:text-slate-700 transition-colors",
    badgeBg: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    borderHover: "hover:border-sky-400/60 hover:shadow-2xl hover:shadow-sky-500/20",
  },
  {
    step: "02",
    title: "Ký Hợp Đồng & Cọc 24 Giờ",
    desc: "Hợp đồng điện tử minh bạch từng mét vuông. Khách chuyển cọc qua VNPay Sandbox để giữ lịch thi công.",
    Icon: FileText,
    highlight: "Hạn cọc 24 giờ",
    iconBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    stepNumColor: "text-slate-800 group-hover:text-slate-700 transition-colors",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    borderHover: "hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/20",
  },
  {
    step: "03",
    title: "Thi Công Chuẩn 5 Bước",
    desc: "Che chắn đồ đạc cẩn thận, bả bột, sơn lót kháng kiềm và sơn phủ 2 lớp. Giám sát báo cáo tiến độ mỗi ngày.",
    Icon: Hammer,
    highlight: "Che chắn 100%",
    iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    stepNumColor: "text-slate-800 group-hover:text-slate-700 transition-colors",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    borderHover: "hover:border-emerald-400/60 hover:shadow-2xl hover:shadow-emerald-500/20",
  },
  {
    step: "04",
    title: "Nghiệm Thu & Bảo Hành",
    desc: "Khách hàng nghiệm thu từng mét vuông tường, hài lòng mới tất toán. Kích hoạt bảo hành điện tử lên đến 5 năm.",
    Icon: Award,
    highlight: "Bảo hành 5 năm",
    iconBg: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
    stepNumColor: "text-slate-800 group-hover:text-slate-700 transition-colors",
    badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    borderHover: "hover:border-indigo-400/60 hover:shadow-2xl hover:shadow-indigo-500/20",
  },
];

export default function WorkflowSection({ onBookingCTA }) {
  return (
    <section id="workflow" className="relative overflow-hidden bg-slate-950 text-white py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-800/80">
      {/* Ambient background decoration */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30 shadow-xs">
            Quy Trình 4 Bước Chuẩn Precision Paint
          </span>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-3.5 text-white">
            Minh Bạch Từ Khảo Sát Đến Bàn Giao
          </h3>
          <p className="text-sm text-slate-400 mt-2.5">
            Bảo vệ quyền lợi tối đa của khách hàng với hợp đồng điện tử và thanh toán tự động qua VNPay Sandbox.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_STEPS.map((step, index) => {
            const StepIcon = step.Icon;
            return (
              <ScrollReveal
                key={step.step}
                animation="fade-up"
                delay={index * 140}
                className="h-full"
              >
                <div
                  className={`h-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-7 relative hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 hover:scale-[1.02] cursor-default ${step.borderHover}`}
                >
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-115 shadow-xs ${step.iconBg}`}>
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <span className={`absolute top-6 right-6 text-5xl font-black select-none pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${step.stepNumColor}`}>
                    {step.step}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2.5 ${step.badgeBg}`}>
                    {step.highlight}
                  </span>
                  <h4 className="font-bold text-white text-base mb-2">{step.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">{step.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Banner lưu ý */}
        <ScrollReveal animation="zoom-in" delay={180}>
          <div className="mt-14 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-slate-950/90 backdrop-blur-md border border-blue-800/60 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-white text-sm sm:text-base">
                  Thanh toán an toàn &amp; tự động qua cổng VNPay Sandbox:
                </h5>
                <p className="text-xs text-slate-300 mt-0.5 font-normal">
                  Khách hàng nộp cọc 30% và tất toán 70% trực tiếp trên hệ thống để được kích hoạt tiến độ và nghiệm thu bảo hành.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBookingCTA}
              className="whitespace-nowrap px-7 py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1.5 group/btn"
            >
              <span>Đặt Lịch Ngay</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
