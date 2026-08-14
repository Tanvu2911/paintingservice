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
      label: "Phí cọc",
      render: (r) => (
        <span className={r.depositPaid ? "text-emerald-600" : "text-amber-600"}>
          {formatMoney(r.depositAmount)} {r.depositPaid ? "✓" : "—"}
        </span>
      ),
    },
    {
      key: "remaining",
      label: "Còn lại",
      render: (r) => (
        <span className={r.finalPaid ? "text-emerald-600" : "text-amber-600"}>
          {formatMoney(r.remainingAmount)} {r.finalPaid ? "✓" : "—"}
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
          className="text-blue-600 text-xs font-semibold hover:underline"
        >
          Thanh toán
        </Link>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Ví thanh toán</h1>
      <WalletCard
        balance={totalPending}
        title="Số tiền cần thanh toán"
        subtitle={`Đã thanh toán: ${formatMoney(totalPaid)}`}
        accent="blue"
      />
      <DataTable
        columns={columns}
        data={bookings}
        emptyMessage="Chưa có giao dịch thanh toán."
      />
    </div>
  );
}
