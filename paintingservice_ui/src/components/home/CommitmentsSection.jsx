import { ShieldCheck, Sparkles, Award, CalendarPlus, CheckCircle2 } from "lucide-react";
import ScrollReveal from "../common/ScrollReveal";

export default function CommitmentsSection({ onBookingCTA }) {
  return (
    <section id="commitments" className="relative overflow-hidden bg-gradient-to-br from-[#0B132B] via-[#0f172a] to-[#0A1024] text-white py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-[30rem] h-[30rem] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal animation="fade-right" className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-xs">
              Tại Sao Chọn Chúng Tôi
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Cam Kết Vàng Cho Mọi <br /> Công Trình Sơn Nhà
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Chúng tôi hiểu ngôi nhà là tổ ấm quý giá nhất. Vì vậy mỗi công
              trình đều được giám sát chặt chẽ, sử dụng vật tư loại 1 và được
              thực hiện bởi đội thợ chuyên nghiệp.
            </p>

            <div className="space-y-4">
              <ScrollReveal animation="fade-up" delay={50}>
                <div className="group flex items-start gap-4 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      100% Sơn chính hãng nguyên đai nguyên kiện
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">
                      Mở thùng sơn trực tiếp trước mặt khách hàng, có tem chống giả điện tử của hãng.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={150}>
                <div className="group flex items-start gap-4 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 hover:border-sky-500/50 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      Bọc lót đồ đạc &amp; Vệ sinh sạch sẽ sau thi công
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">
                      Che phủ nilon chuyên dụng toàn bộ sàn, đồ gỗ, sofa. Dọn dẹp sạch sẽ trước khi bàn giao.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={250}>
                <div className="group flex items-start gap-4 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      Bảo hành bong tróc &amp; ố mốc lên đến 5 năm
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">
                      Bảo hành điện tử theo hợp đồng. Đội ngũ hỗ trợ xử lý yêu cầu nhanh chóng.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-left" delay={180}>
            <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-8 text-white border border-slate-800 relative shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tư vấn nhanh &bull; Báo giá tức thì</span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black leading-snug text-white">
                Bạn Cần Sơn Lại Nhà Hay Cải Tạo Căn Hộ?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Đặt lịch hẹn để kỹ thuật viên liên hệ tư vấn trực tiếp và khảo sát đo đạc thực tế miễn phí tại Hà Nội ngay hôm nay.
              </p>

              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800 font-medium">
                  <span className="text-slate-400">Khảo sát &amp; Đo đạc:</span>
                  <span className="font-bold text-emerald-400">Miễn phí 100%</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800 font-medium">
                  <span className="text-slate-400">Hợp đồng điện tử:</span>
                  <span className="font-bold text-sky-400">Minh bạch từng m²</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400">Thời gian có mặt:</span>
                  <span className="font-bold text-amber-400">Sau 30 - 60 phút</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onBookingCTA}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] group/btn"
              >
                <CalendarPlus className="w-4 h-4 text-white" />
                <span>Đặt Lịch Khảo Sát &amp; Nhận Báo Giá Ngay</span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
