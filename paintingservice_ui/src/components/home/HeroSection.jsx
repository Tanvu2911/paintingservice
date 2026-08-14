import { useNavigate } from "react-router-dom";

export default function HeroSection({ user }) {
  const navigate = useNavigate();

  return (
    <section className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white pt-24 pb-24 px-4 text-center max-w-5xl mx-auto">
      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100/50 text-blue-600 border border-blue-200/50 mb-8">
        ✨ Giải pháp sửa chữa nhà trọn gói uy tín hàng đầu
      </span>
      <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
        Làm Mới <span className="text-orange-500">Tổ Ấm</span>{" "}
        <br className="hidden sm:inline" />
        Bằng Sự{" "}
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Tâm Huyết
        </span>
      </h2>
      <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
        Đội ngũ thợ lành nghề giàu kinh nghiệm, khảo sát hiện trạng miễn phí,
        báo giá minh bạch vật tư từng hạng mục và cam kết không phát sinh chi
        phí.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {user ? (
          <button
            onClick={() => navigate("/customer/booking")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/20 transition-all"
          >
            Đặt Lịch Khảo Sát Ngay
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/20 transition-all"
          >
            Đặt Lịch Khảo Sát Miễn Phí
          </button>
        )}
        <a
          href="#services"
          className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-xl text-sm transition-all"
        >
          Xem Các Hạng Mục
        </a>
      </div>
    </section>
  );
}
