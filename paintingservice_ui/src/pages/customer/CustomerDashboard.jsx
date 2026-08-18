import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import {
  CalendarPlus,
  ClipboardList,
  History,
  User,
  ArrowRight,
} from "lucide-react";
import useBookingHistory from "../../hooks/useBookingHistory";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerDashboard() {
  const { user, showToast } = useOutletContext();
  const { stats, loading } = useBookingHistory("customer", showToast);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Xin chào, {user?.fullName || user?.username}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan và quản lý tiến độ các công trình sơn nhà của bạn
          </p>
        </div>
        <Link
          to="/customer/booking"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <CalendarPlus className="w-4 h-4 text-white" />
          <span>Đặt lịch khảo sát mới</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng yêu cầu
          </p>
          <p className="text-3xl font-black text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Chờ tiếp nhận
          </p>
          <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Đang thực hiện
          </p>
          <p className="text-3xl font-black text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Hoàn thành
          </p>
          <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Lối tắt chức năng
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <QuickLink
            to="/customer/booking"
            title="Đăng ký khảo sát mới"
            desc="Đặt lịch hẹn kỹ thuật viên đến tận nơi đo đạc và tư vấn miễn phí"
            Icon={CalendarPlus}
          />
          <QuickLink
            to="/customer/ongoing"
            title="Quản lý yêu cầu đang làm"
            desc="Theo dõi tiến độ khảo sát, ký hợp đồng, cọc và báo cáo thi công hàng ngày"
            Icon={ClipboardList}
          />
          <QuickLink
            to="/customer/history"
            title="Lịch sử công trình"
            desc="Xem lại danh sách các công trình đã hoàn tất và thông tin bảo hành"
            Icon={History}
          />
          <QuickLink
            to="/customer/profile"
            title="Hồ sơ & Địa chỉ"
            desc="Cập nhật thông tin liên hệ, số điện thoại và địa chỉ công trình mặc định"
            Icon={User}
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc, Icon }) {
  return (
    <Link
      to={to}
      className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-start gap-4 group"
    >
      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{title}</p>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
