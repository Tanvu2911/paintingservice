import { useOutletContext } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
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
      icon: <ClipboardList className="w-6 h-6 text-slate-700" />,
      color: "border-l-slate-700",
    },
    {
      title: "Đang thực hiện",
      value: String(stats.inProgress),
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      color: "border-l-amber-500",
    },
    {
      title: "Hoàn thành",
      value: String(stats.completed),
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      color: "border-l-emerald-500",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: `${completionRate}%`,
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
      color: "border-l-indigo-500",
    },
    {
      title: "Tổng giá trị",
      value: formatMoney(stats.totalRevenue),
      icon: <Wallet className="w-6 h-6 text-emerald-700" />,
      color: "border-l-emerald-600",
    },
    {
      title: "Đã hủy",
      value: String(stats.cancelled),
      icon: <XCircle className="w-6 h-6 text-rose-600" />,
      color: "border-l-rose-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <StatisticCards data={cards} />
      <div className="bg-white rounded-2xl border p-4 text-xs font-medium text-slate-600">
        Tổng số bản ghi đang quản lý: <strong>{bookings.length}</strong>
      </div>
    </div>
  );
}
