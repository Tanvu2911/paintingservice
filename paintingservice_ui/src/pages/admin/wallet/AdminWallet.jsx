import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import WalletCard from "../../../components/common/WalletCard";
import DataTable from "../../../components/common/DataTable";
import StatCard from "../../../components/common/StatCard";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";

export default function AdminWallet() {
  const { showToast } = useOutletContext();
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [salaryRes, bookingsRes] = await Promise.all([
          AxiosConfig.get("/salary-histories"),
          AxiosConfig.get("/bookings"),
        ]);
        setSalaryHistory(Array.isArray(salaryRes.data) ? salaryRes.data : []);
        const b = bookingsRes.data?.content || bookingsRes.data || [];
        setBookings(Array.isArray(b) ? b : []);
      } catch (err) {
        showToast?.("Không tải được dữ liệu ví hệ thống", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  const customerPaid = bookings.reduce((s, b) => {
    let paid = 0;
    if (b.depositPaid) paid += Number(b.depositAmount) || 0;
    if (b.finalPaid) paid += Number(b.remainingAmount) || 0;
    return s + paid;
  }, 0);

  const staffPaid = salaryHistory
    .filter((s) => s.paymentStatus === "PAID")
    .reduce((s, r) => s + (Number(r.amountEarned) || 0), 0);

  const staffPending = salaryHistory
    .filter((s) => s.paymentStatus !== "PAID")
    .reduce((s, r) => s + (Number(r.amountEarned) || 0), 0);

  const systemBalance = customerPaid - staffPaid;

  const columns = [
    {
      key: "type",
      label: "Loại",
      render: (row) => (row._type === "in" ? "Thu từ KH" : "Chi trả NV"),
    },
    {
      key: "ref",
      label: "Tham chiếu",
      render: (row) => row.ref,
    },
    {
      key: "amount",
      label: "Số tiền",
      render: (row) => (
        <span className={row._type === "in" ? "text-emerald-600" : "text-rose-600"}>
          {row._type === "in" ? "+" : "-"}
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (row) => row.status,
    },
  ];

  const reconciliation = [
    ...bookings
      .filter((b) => b.depositPaid || b.finalPaid)
      .map((b) => ({
        _type: "in",
        ref: `Đơn #${b.id}`,
        amount:
          (b.depositPaid ? Number(b.depositAmount) : 0) +
          (b.finalPaid ? Number(b.remainingAmount) : 0),
        status: b.finalPaid ? "Đủ" : "Một phần",
      })),
    ...salaryHistory.map((s) => ({
      _type: "out",
      ref: `NV #${s.workerId} · Đơn #${s.bookingId}`,
      amount: Number(s.amountEarned) || 0,
      status: s.paymentStatus === "PAID" ? "Đã chi" : "Chờ chi",
    })),
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Ví hệ thống & Đối soát</h1>

      <WalletCard
        balance={systemBalance}
        title="Số dư hệ thống (ước tính)"
        subtitle="Thu từ khách hàng trừ chi trả nhân viên"
        accent="emerald"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Thu từ KH" value={formatMoney(customerPaid)} />
        <StatCard
          label="Đã chi NV"
          value={formatMoney(staffPaid)}
          colorClass="text-rose-600"
          borderClass="border-l-4 border-l-rose-500"
        />
        <StatCard
          label="Chờ chi NV"
          value={formatMoney(staffPending)}
          colorClass="text-amber-600"
          borderClass="border-l-4 border-l-amber-500"
        />
      </div>

      <div>
        <h3 className="font-bold text-slate-800 mb-3">Bảng đối soát</h3>
        <DataTable
          columns={columns}
          data={reconciliation}
          emptyMessage="Chưa có giao dịch."
        />
      </div>
    </div>
  );
}
