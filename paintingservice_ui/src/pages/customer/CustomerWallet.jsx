import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import useBookingHistory from "../../hooks/useBookingHistory";
import WalletCard from "../../components/common/WalletCard";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatMoney } from "../../util/formatters";
import StatusBadge from "../../components/common/StatusBadge";

export default function CustomerWallet() {
  const { showToast } = useOutletContext();
  const { bookings, loading } = useBookingHistory("customer", showToast);

  const totalPaid = bookings.reduce((s, b) => {
    let paid = 0;
    if (b.depositPaid) paid += Number(b.depositAmount) || 0;
    if (b.finalPaid) paid += Number(b.remainingAmount) || 0;
    return s + paid;
  }, 0);

  const totalPending = bookings.reduce((s, b) => {
    if (b.finalPaid) return s;
    let pending = 0;
    if (!b.depositPaid) pending += Number(b.depositAmount) || 0;
    if (b.depositPaid && !b.finalPaid)
      pending += Number(b.remainingAmount) || 0;
    return s + pending;
  }, 0);

  const columns = [
    { key: "id", label: "Mã đơn", render: (r) => `#${r.id}` },
    {
      key: "deposit",
      label: "Phí cọc (30%)",
      render: (r) => (
        <span className={r.depositPaid ? "text-[#1E3A8A] font-bold" : "text-amber-600 font-semibold"}>
          {formatMoney(r.depositAmount)} {r.depositPaid ? "✓ Đã cọc" : "— Chưa cọc"}
        </span>
      ),
    },
    {
      key: "remaining",
      label: "Còn lại (70%)",
      render: (r) => (
        <span className={r.finalPaid ? "text-[#1E3A8A] font-bold" : "text-amber-600 font-semibold"}>
          {formatMoney(r.remainingAmount)} {r.finalPaid ? "✓ Đã tất toán" : "— Chưa tất toán"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "action",
      label: "Thao tác",
      render: (r) => (
        <Link
          to={`/customer/bookings/${r.id}`}
          className="inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          Chi tiết / Thanh toán
        </Link>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-[#1E3A8A]">Ví &amp; Lịch Sử Thanh Toán</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý tổng quan các khoản cọc 30% và tất toán 70% các công trình thi công sơn nhà của Precision Paint
        </p>
      </div>

      <WalletCard
        balance={totalPending}
        title="Số tiền cần thanh toán"
        subtitle={`Đã thanh toán: ${formatMoney(totalPaid)}`}
        accent="blue"
      />
      <DataTable
        columns={columns}
        data={bookings}
        emptyMessage="Chưa có giao dịch thanh toán nào."
      />
    </div>
  );
}
