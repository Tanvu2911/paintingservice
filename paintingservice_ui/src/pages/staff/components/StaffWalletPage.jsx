import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import useWalletData from "../../../hooks/useWalletData";
import WalletCard from "../../../components/common/WalletCard";
import DataTable from "../../../components/common/DataTable";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

function StaffWalletPage({ title, accent = "blue", roleLabel }) {
  const { user, showToast } = useOutletContext();
  const { salaryHistory, balance, paidTotal, totalEarned, loading } =
    useWalletData(user?.id, showToast);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const columns = [
    {
      key: "bookingId",
      label: "Mã đơn",
      render: (row) => `#${row.bookingId}`,
    },
    {
      key: "role",
      label: "Vai trò",
      render: (row) => row.roleInBooking || roleLabel,
    },
    {
      key: "amount",
      label: "Số tiền",
      render: (row) => (
        <span className="text-emerald-600 font-bold">
          +{formatMoney(row.amountEarned)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (row) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            row.paymentStatus === "PAID"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {row.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
        </span>
      ),
    },
    {
      key: "date",
      label: "Ngày tính",
      render: (row) =>
        row.calculatedAt
          ? new Date(row.calculatedAt).toLocaleDateString("vi-VN")
          : "—",
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>

      <WalletCard
        balance={balance}
        title="Số dư có thể rút"
        subtitle={`Tổng thu nhập: ${formatMoney(totalEarned)} · Đã nhận: ${formatMoney(paidTotal)}`}
        accent={accent}
        onWithdraw={() => setShowWithdraw(true)}
        onViewHistory={() =>
          document.getElementById("tx-history")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 border rounded-xl">
          <p className="text-slate-500 text-sm">Đã thanh toán</p>
          <p className="text-lg font-bold text-emerald-600">{formatMoney(paidTotal)}</p>
        </div>
        <div className="bg-white p-4 border rounded-xl">
          <p className="text-slate-500 text-sm">Chờ thanh toán</p>
          <p className="text-lg font-bold text-amber-600">{formatMoney(balance)}</p>
        </div>
      </div>

      <div id="tx-history">
        <h3 className="font-bold text-slate-800 mb-3">Lịch sử giao dịch</h3>
        <DataTable
          columns={columns}
          data={salaryHistory}
          emptyMessage="Chưa có giao dịch nào."
        />
      </div>

      <ConfirmDialog
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onConfirm={() => {
          setShowWithdraw(false);
          showToast?.(
            "Yêu cầu rút tiền đã được ghi nhận. Admin sẽ xử lý trong 1-3 ngày làm việc.",
            "success"
          );
        }}
        title="Yêu cầu rút tiền"
        message={`Xác nhận rút ${formatMoney(balance)} về tài khoản ngân hàng đã đăng ký?`}
        confirmColor="bg-emerald-600 hover:bg-emerald-700"
      />
    </div>
  );
}

export default StaffWalletPage;
