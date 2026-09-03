import { Paintbrush, MapPin, Phone, Mail, Clock } from "lucide-react";

export default function HomeFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-16 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
              <Paintbrush className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-base font-black text-white tracking-tight">
              PAINTING<span className="text-blue-400">247</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            Hệ thống dịch vụ sơn sửa nhà trọn gói Precision Paint uy tín hàng đầu. Cam kết chất lượng, bảo hành dài hạn và giá thành minh bạch.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm mb-3.5">Dịch vụ chính</h5>
          <ul className="space-y-2.5 text-slate-400 font-normal">
            <li className="hover:text-white transition-colors cursor-pointer">Sơn cải tạo nhà cũ</li>
            <li className="hover:text-white transition-colors cursor-pointer">Sơn nhà mới trọn gói</li>
            <li className="hover:text-white transition-colors cursor-pointer">Chống thấm tường &amp; trần</li>
            <li className="hover:text-white transition-colors cursor-pointer">Sơn hiệu ứng nghệ thuật</li>
            <li className="hover:text-white transition-colors cursor-pointer">Sơn sàn công nghiệp</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm mb-3.5">Chính sách &amp; Hỗ trợ</h5>
          <ul className="space-y-2.5 text-slate-400 font-normal">
            <li className="hover:text-white transition-colors cursor-pointer">Thanh toán trực tuyến VNPay</li>
            <li className="hover:text-white transition-colors cursor-pointer">Chính sách bảo hành 5 năm</li>
            <li className="hover:text-white transition-colors cursor-pointer">Quy trình giải quyết khiếu nại</li>
            <li className="hover:text-white transition-colors cursor-pointer">Bảo mật thông tin khách hàng</li>
            <li className="hover:text-white transition-colors cursor-pointer">Hướng dẫn thanh toán hợp đồng</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm mb-3.5">Liên hệ hỗ trợ</h5>
          <ul className="space-y-2.5 text-slate-400 font-normal">
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Trụ sở: Hà Nội &amp; TP. Hồ Chí Minh</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Hotline 24/7: 1900.247.xxx</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Email: support@painting247.vn</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Giờ làm việc: 7:30 - 20:30 hàng ngày</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-3">
        <p>&copy; 2026 PAINTING247 Precision Paint. Bản quyền thuộc về hệ thống dịch vụ sơn nhà.</p>
        <p className="flex items-center gap-4">
          <span className="hover:text-slate-400 transition cursor-pointer">Điều khoản sử dụng</span>
          <span>&bull;</span>
          <span className="hover:text-slate-400 transition cursor-pointer">Chính sách bảo mật</span>
        </p>
      </div>
    </footer>
  );
}
