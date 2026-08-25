import { ShieldCheck, Sparkles, Award, CalendarPlus } from "lucide-react";

export default function CommitmentsSection({ onBookingCTA }) {
  return (
    <section id="commitments" className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Tại Sao Chọn Chúng Tôi
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            Cam Kết Vàng Cho Mọi <br /> Công Trình Sơn Nhà
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Chúng tôi hiểu ngôi nhà là tổ ấm quý giá nhất. Vì vậy mỗi công
            trình đều được giám sát chặt chẽ, sử dụng vật tư loại 1 và được
            thực hiện bởi đội thợ chuyên nghiệp.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  100% Sơn chính hãng nguyên đai nguyên kiện
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mở thùng sơn trực tiếp trước mặt khách hàng, có tem chống giả điện tử của hãng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Bọc lót đồ đạc &amp; Vệ sinh sạch sẽ sau thi công
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Che phủ nilon chuyên dụng toàn bộ sàn, đồ gỗ, sofa. Dọn dẹp sạch sẽ trước khi bàn giao.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Bảo hành bong tróc &amp; ố mốc lên đến 5 năm
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bảo hành điện tử theo hợp đồng. Đội ngũ hỗ trợ xử lý yêu cầu nhanh chóng.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 text-slate-900 border border-slate-200 relative shadow-sm space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
            Nhận tư vấn nhanh &amp; Báo giá tức thì
          </div>
          <h4 className="text-2xl font-black leading-snug text-slate-900">
            Bạn Cần Sơn Lại Nhà Hay Cải Tạo Căn Hộ?
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đặt lịch hẹn để kỹ thuật viên liên hệ tư vấn trực tiếp và khảo sát tận nơi miễn phí ngay hôm nay.
          </p>

          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-blue-100">
              <span className="text-slate-500">Khảo sát &amp; Đo đạc:</span>
              <span className="font-bold text-[#1E3A8A]">Miễn phí 100%</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-blue-100">
              <span className="text-slate-500">Hợp đồng điện tử:</span>
              <span className="font-bold text-[#1E3A8A]">Minh bạch từng m²</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Thời gian có mặt:</span>
              <span className="font-bold text-[#1E3A8A]">Sau 30 - 60 phút</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBookingCTA}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <CalendarPlus className="w-4 h-4 text-white" />
            <span>Đặt Lịch Khảo Sát Ngay</span>
          </button>
        </div>
      </div>
    </section>
  );
}
