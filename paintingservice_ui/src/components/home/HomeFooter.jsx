import { Paintbrush, MapPin, Phone, Mail, Clock } from "lucide-react";

export default function HomeFooter() {
  return (
    <footer className="bg-white text-slate-600 text-xs py-14 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
              <Paintbrush className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black text-slate-900">
              PAINTING<span className="text-emerald-600">247</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống dịch vụ sơn sửa nhà trọn gói uy tín hàng đầu. Cam kết chất lượng, bảo hành dài hạn và giá thành minh bạch.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-slate-900 text-sm mb-3">Dịch vụ chính</h5>
          <ul className="space-y-2 text-slate-600">
            <li>Sơn cải tạo nhà cũ</li>
            <li>Sơn nhà mới trọn gói</li>
            <li>Chống thấm tường &amp; trần</li>
            <li>Sơn hiệu ứng nghệ thuật</li>
            <li>Sơn sàn công nghiệp</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-slate-900 text-sm mb-3">Chính sách &amp; Hỗ trợ</h5>
          <ul className="space-y-2 text-slate-600">
            <li>Thanh toán trực tuyến VNPay</li>
            <li>Chính sách bảo hành 5 năm</li>
            <li>Quy trình giải quyết khiếu nại</li>
            <li>Bảo mật thông tin khách hàng</li>
            <li>Hướng dẫn thanh toán hợp đồng</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-slate-900 text-sm mb-3">Liên hệ hỗ trợ</h5>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Trụ sở: Hà Nội &amp; TP. Hồ Chí Minh</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Hotline 24/7: 1900.247.xxx</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Email: support@painting247.vn</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Giờ làm việc: 7:30 - 20:30 hàng ngày</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-400">
        <div>
          &copy; {new Date().getFullYear()} PAINTING247. Toàn bộ bản quyền được bảo lưu.
        </div>
        <div className="flex gap-4 text-slate-500 font-semibold">
          <span>Chất Lượng</span>
          <span>•</span>
          <span>Tận Tâm</span>
          <span>•</span>
          <span>Đúng Hẹn</span>
        </div>
      </div>
    </footer>
  );
}
