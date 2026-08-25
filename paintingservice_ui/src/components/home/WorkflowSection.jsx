import { Search, FileText, Hammer, Award, Clock } from "lucide-react";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Khảo Sát & Báo Giá Miễn Phí",
    desc: "Kỹ thuật viên có mặt tận nơi sau 30 phút, đo đạc diện tích thực tế và tư vấn chủng loại sơn tối ưu chi phí.",
    Icon: Search,
    highlight: "Miễn phí 100%",
    iconBg: "bg-sky-100 text-sky-700",
    stepNumColor: "text-sky-100",
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    borderHover: "hover:border-sky-300 hover:shadow-sky-500/10",
  },
  {
    step: "02",
    title: "Ký Hợp Đồng & Cọc 24 Giờ",
    desc: "Hợp đồng điện tử minh bạch từng mét vuông. Khách chuyển cọc qua VNPay Sandbox để giữ lịch thi công.",
    Icon: FileText,
    highlight: "Hạn cọc 24 giờ",
    iconBg: "bg-amber-100 text-amber-700",
    stepNumColor: "text-amber-100",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    borderHover: "hover:border-amber-300 hover:shadow-amber-500/10",
  },
  {
    step: "03",
    title: "Thi Công Chuẩn 5 Bước",
    desc: "Che chắn đồ đạc cẩn thận, bả bột, sơn lót kháng kiềm và sơn phủ 2 lớp. Giám sát báo cáo tiến độ mỗi ngày.",
    Icon: Hammer,
    highlight: "Che chắn 100%",
    iconBg: "bg-emerald-100 text-emerald-700",
    stepNumColor: "text-emerald-100",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderHover: "hover:border-emerald-300 hover:shadow-emerald-500/10",
  },
  {
    step: "04",
    title: "Nghiệm Thu & Bảo Hành",
    desc: "Khách hàng nghiệm thu từng mét vuông tường, hài lòng mới tất toán. Kích hoạt bảo hành điện tử lên đến 5 năm.",
    Icon: Award,
    highlight: "Bảo hành 5 năm",
    iconBg: "bg-indigo-100 text-indigo-700",
    stepNumColor: "text-indigo-100",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderHover: "hover:border-indigo-300 hover:shadow-indigo-500/10",
  },
];

export default function WorkflowSection({ onBookingCTA }) {
  return (
    <section id="workflow" className="bg-gradient-to-b from-slate-50 via-sky-50/20 to-slate-100 text-slate-900 py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 shadow-xs">
            Quy Trình 4 Bước Chuẩn Precision Paint
          </span>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 text-slate-900">
            Minh Bạch Từ Khảo Sát Đến Bàn Giao
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Bảo vệ quyền lợi tối đa của khách hàng với hợp đồng điện tử và thanh toán tự động qua VNPay Sandbox.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_STEPS.map((step) => {
            const StepIcon = step.Icon;
            return (
              <div
                key={step.step}
                className={`bg-white border border-slate-200 rounded-3xl p-6 relative hover:shadow-xl transition-all duration-300 group ${step.borderHover}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${step.iconBg}`}>
                  <StepIcon className="w-6 h-6" />
                </div>
                <span className={`absolute top-5 right-5 text-4xl font-black ${step.stepNumColor}`}>
                  {step.step}
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${step.badgeBg}`}>
                  {step.highlight}
                </span>
                <h4 className="font-bold text-slate-900 text-base mb-2">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Banner lưu ý */}
        <div className="mt-12 bg-white border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-sm">
                Thanh toán an toàn qua cổng VNPay Sandbox:
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Khách hàng nộp cọc 30% và tất toán 70% trực tiếp trên hệ thống để được xác nhận tự động.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBookingCTA}
            className="whitespace-nowrap px-6 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
          >
            Đặt Lịch Ngay
          </button>
        </div>
      </div>
    </section>
  );
}
