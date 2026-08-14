import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import useBookingHistory from "../../hooks/useBookingHistory";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerDashboard() {
  const { user, showToast } = useOutletContext();
  const { stats, loading } = useBookingHistory("customer", showToast);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Xin chào, {user?.fullName || user?.username}! 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">Tổng quan yêu cầu của bạn</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tổng yêu cầu" value={stats.total} />
        <StatCard
          label="Chờ xử lý"
          value={stats.pending}
          colorClass="text-amber-600"
          borderClass="border-l-4 border-l-amber-500"
        />
        <StatCard
          label="Đang thực hiện"
          value={stats.inProgress}
          colorClass="text-blue-600"
          borderClass="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Hoàn thành"
          value={stats.completed}
          colorClass="text-emerald-600"
          borderClass="border-l-4 border-l-emerald-500"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <QuickLink to="/customer/booking" title="Tạo yêu cầu mới" desc="Đăng ký khảo sát công trình" icon="➕" />
        <QuickLink to="/customer/history" title="Lịch sử yêu cầu" desc="Xem và thanh toán đơn hàng" icon="📜" />
        <QuickLink to="/customer/wallet" title="Ví thanh toán" desc="Theo dõi cọc & phần còn lại" icon="💰" />
        <QuickLink to="/customer/profile" title="Tài khoản" desc="Cập nhật thông tin cá nhân" icon="👤" />
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc, icon }) {
  return (
    <Link
      to={to}
      className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition flex gap-4"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
