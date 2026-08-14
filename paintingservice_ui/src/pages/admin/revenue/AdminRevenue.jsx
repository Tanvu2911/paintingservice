import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import StatCard from "../../../components/common/StatCard";
import DataTable from "../../../components/common/DataTable";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";
import StatusBadge from "../../../components/common/StatusBadge";

export default function AdminRevenue() {
  const { showToast } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await AxiosConfig.get("/bookings");
        const data = res.data?.content || res.data || [];
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        showToast?.("Không tải được dữ liệu doanh thu", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  const totalRevenue = bookings.reduce(
    (s, b) => s + (Number(b.totalAmount) || 0),
    0
  );
  const paidDeposit = bookings.filter((b) => b.depositPaid).length;
  const paidFinal = bookings.filter((b) => b.finalPaid).length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;

  const columns = [
    { key: "id", label: "Mã đơn", render: (r) => `#${r.id}` },
    {
      key: "customer",
      label: "Khách hàng",
      render: (r) => r.customerName || r.customer?.username || "—",
    },
    {
      key: "amount",
      label: "Tổng giá trị",
      render: (r) => formatMoney(r.totalAmount),
    },
    {
      key: "deposit",
      label: "Cọc",
      render: (r) => (
        <span className={r.depositPaid ? "text-emerald-600" : "text-amber-600"}>
          {r.depositPaid ? "✓ Đã TT" : "Chưa TT"}
        </span>
      ),
    },
    {
      key: "final",
      label: "Còn lại",
      render: (r) => (
        <span className={r.finalPaid ? "text-emerald-600" : "text-amber-600"}>
          {r.finalPaid ? "✓ Đã TT" : formatMoney(r.remainingAmount)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Thu nhập / Doanh thu</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tổng doanh thu" value={formatMoney(totalRevenue)} />
        <StatCard
          label="Đơn hoàn thành"
          value={completed}
          colorClass="text-emerald-600"
          borderClass="border-l-4 border-l-emerald-500"
        />
        <StatCard
          label="Đã TT cọc"
          value={paidDeposit}
          colorClass="text-blue-600"
          borderClass="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Đã TT đủ"
          value={paidFinal}
          colorClass="text-purple-600"
          borderClass="border-l-4 border-l-purple-500"
        />
      </div>
      <DataTable columns={columns} data={bookings} emptyMessage="Chưa có dữ liệu." />
    </div>
  );
}
