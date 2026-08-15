import { useOutletContext } from "react-router-dom";
import useBookingHistory from "../../../hooks/useBookingHistory";
import StatisticCards from "./StatisticCards";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";

export default function StaffStatisticsPage({ title, role }) {
  const { showToast } = useOutletContext();
  const { stats, loading, bookings } = useBookingHistory(role, showToast);

  if (loading) return <LoadingSpinner />;

  const completionRate =
    stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  const cards = [
    {
      title: "Tổng công việc",
      value: String(stats.total),
      icon: "📋",
      color: "border-l-blue-500",
    },
    {
      title: "Đang thực hiện",
      value: String(stats.inProgress),
      icon: "🔄",
      color: "border-l-orange-500",
    },
    {
      title: "Hoàn thành",
      value: String(stats.completed),
      icon: "✅",
      color: "border-l-emerald-500",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: `${completionRate}%`,
      icon: "📈",
      color: "border-l-purple-500",
    },
    {
      title: "Tổng giá trị",
      value: formatMoney(stats.totalRevenue),
      icon: "💰",
      color: "border-l-amber-500",
    },
    {
      title: "Đã hủy",
      value: String(stats.cancelled),
      icon: "❌",
      color: "border-l-rose-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <StatisticCards data={cards} />
      <div className="bg-white rounded-2xl border p-4 text-sm text-slate-600">
        Tổng số bản ghi đang quản lý: <strong>{bookings.length}</strong>
      </div>
    </div>
  );
}
