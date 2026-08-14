import { useOutletContext } from "react-router-dom";
import useBookingHistory from "../../../hooks/useBookingHistory";
import StatisticCards from "../components/StatisticCards";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";

export default function TechnicianDashboard() {
  const { showToast } = useOutletContext();
  const { stats, loading } = useBookingHistory("technician", showToast);

  if (loading) return <LoadingSpinner />;

  const cards = [
    {
      title: "Công trình đang làm",
      value: String(stats.inProgress),
      icon: "🏗️",
      color: "border-l-blue-500",
    },
    {
      title: "Công trình hoàn thành",
      value: String(stats.completed),
      icon: "✅",
      color: "border-l-emerald-500",
    },
    {
      title: "Tổng giá trị",
      value: formatMoney(stats.totalRevenue),
      icon: "💰",
      color: "border-l-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tổng quan thi công</h1>
      <StatisticCards data={cards} />
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
        <span className="font-bold">Lưu ý an toàn:</span> Hãy luôn nhớ mang đồ bảo hộ và che chắn nội thất của khách hàng trước khi bả matit/lăn sơn.
      </div>
    </div>
  );
}
