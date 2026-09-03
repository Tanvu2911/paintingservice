import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  QrCode,
  RefreshCw,
  Search,
  Check,
  ExternalLink,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Clock,
  Eye,
  ShieldAlert,
} from "lucide-react";
import AxiosConfig from "../../../util/AxiosConfig";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";
import QRCodePayment from "../../../components/common/QRCodePayment";
import StaffWarrantyPayoutTab from "./components/StaffWarrantyPayoutTab";
import { formatMoney } from "../../../util/formatters";
import { getVietQRBankCode, calculateFinancials } from "../../../util/orderFlowUtils";

// ── Helper: parse date (ISO string hoặc array từ Jackson)
function parseDate(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [y, m, d] = raw;
    return new Date(y, m - 1, d);
  }
  const dt = new Date(raw);
  return isNaN(dt.getTime()) ? null : dt;
}

function fmtDate(raw) {
  const d = parseDate(raw);
  return d ? d.toLocaleDateString("vi-VN") : "—";
}

// ── Badge nhỏ
function Badge({ ok, okLabel = "Đã chi", failLabel = "Chưa chi" }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <Check className="w-2.5 h-2.5" /> {okLabel}
    </span>
  ) : (
    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      {failLabel}
    </span>
  );
}

// ── KPI summary strip (4 thẻ tài chính tinh gọn)
function KpiStrip({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((k) => (
        <div key={k.label} className={`bg-white rounded-2xl border border-slate-100 shadow-xs p-4 border-t-2 ${k.accent} flex flex-col justify-between`}>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
            <p className="text-xl font-black text-slate-800 mt-1 leading-tight">{k.value}</p>
          </div>
          {k.sub && <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-50">{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export default function PaymentToStaff() {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [salaryHistories, setSalaryHistories] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [warrantyClaims, setWarrantyClaims] = useState([]);

  // UI state
  const initialTab = searchParams.get("tab") || location.state?.tab || "CUSTOMER";
  const initialSearch = searchParams.get("search") ?? location.state?.search ?? "";

  const [activeTab, setActiveTab] = useState(initialTab); // "CUSTOMER" | "STAFF" | "WARRANTY" | "RECONCILIATION"
  const [search, setSearch] = useState(String(initialSearch));
  const [paymentFilter, setPaymentFilter] = useState("ALL"); // "ALL" | "PAID_ALL" | "PAID_DEPOSIT" | "UNPAID"
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("ALL"); // "ALL" | "IN" | "OUT"
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("ALL"); // "ALL" | "COMPLETED" | "PENDING"
  const [payoutModal, setPayoutModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab") || location.state?.tab;
    if (t) setActiveTab(t);
    const s = searchParams.get("search") ?? location.state?.search;
    if (s !== undefined && s !== null) setSearch(String(s));
  }, [location.state, searchParams]);

  const loadData = async (isRefresh = false) => {
    setLoading(true);
    try {
      const [bR, sR, stR, wR] = await Promise.all([
        AxiosConfig.get("/bookings"),
        AxiosConfig.get("/salary-histories").catch(() => ({ data: [] })),
        AxiosConfig.get("/staff").catch(() => ({ data: [] })),
        AxiosConfig.get("/warranty-claims").catch(() => ({ data: [] })),
      ]);
      const norm = (d) => (Array.isArray(d) ? d : d?.content || []);
      setOrders(norm(bR.data));
      setSalaryHistories(norm(sR.data));
      setAllStaff(norm(stR.data));
      setWarrantyClaims(norm(wR.data));
      if (isRefresh) showToast?.("Đã làm mới dữ liệu thanh toán & đối soát!", "success");
    } catch {
      showToast?.("Lỗi tải dữ liệu thanh toán", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Helpers Lấy lương nhân sự chuẩn xác theo ID và Vai trò
  const getSalary = (bookingId, staffId, role, defaultAmt) => {
    const rec = salaryHistories.find((s) => {
      const bId = Number(s.bookingId || s.booking?.id);
      if (bId !== Number(bookingId)) return false;

      const sWorkerId = Number(s.workerId || s.worker?.id || s.worker?.userId);
      const targetStaffId = Number(staffId);

      if (targetStaffId && sWorkerId) {
        return sWorkerId === targetStaffId;
      }
      if (role && s.roleInBooking) {
        return s.roleInBooking.toUpperCase() === role.toUpperCase();
      }
      return false;
    });

    return {
      amount: rec ? Number(rec.amountEarned) || defaultAmt : defaultAmt,
      isPaid: rec?.paymentStatus === "PAID",
      paidAt: rec?.paidAt,
      id: rec?.id
    };
  };

  const getStaffProfile = (id, username) =>
    allStaff.find((s) => Number(s.userId || s.id) === Number(id) || s.username === username);

  const openPayoutQR = (order, staffId, staffName, role, amount) => {
    const fin = calculateFinancials(order);
    if (!fin.isFinalPaid) {
      showToast?.("Chỉ có thể quyết toán thù lao khi khách hàng đã hoàn tất mọi thanh toán!", "warning");
      return;
    }
    const sp = getStaffProfile(staffId, staffName);
    setPayoutModal({
      isWarranty: false,
      orderId: order.id, staffId, staffName, role, amount,
      bankName: sp?.bankName || "MB Bank",
      bankCode: getVietQRBankCode(sp?.bankName || "MB Bank"),
      bankAccountNumber: sp?.bankAccountNumber || sp?.phoneNumber || "—",
      bankAccountName: sp?.bankAccountName || staffName,
    });
  };

  const openWarrantyPayoutQR = (claim, staffId, staffName, role, amount) => {
    const sp = getStaffProfile(staffId, staffName);
    setPayoutModal({
      isWarranty: true,
      claimId: claim.id,
      orderId: claim.bookingId,
      staffId,
      staffName,
      role,
      amount,
      bankName: sp?.bankName || "MB Bank",
      bankCode: getVietQRBankCode(sp?.bankName || "MB Bank"),
      bankAccountNumber: sp?.bankAccountNumber || sp?.phoneNumber || "—",
      bankAccountName: sp?.bankAccountName || staffName,
    });
  };

  const confirmPayout = async () => {
    if (!payoutModal) return;
    try {
      setSubmitting(true);
      if (payoutModal.isWarranty) {
        const res = await AxiosConfig.post(
          `/payments/warranty-staff-payout?claimId=${payoutModal.claimId}&staffId=${payoutModal.staffId}&role=${payoutModal.role}`
        );
        showToast?.(res.data?.message || "Đã quyết toán thù lao bảo hành thành công!", "success");
      } else {
        const res = await AxiosConfig.post(
          `/payments/staff-payout?bookingId=${payoutModal.orderId}&staffId=${payoutModal.staffId}&role=${payoutModal.role}`
        );
        showToast?.(res.data?.message || "Đã quyết toán thù lao thành công!", "success");
      }
      setPayoutModal(null);
      await loadData();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi xác nhận quyết toán", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Tính KPI Toàn Diện Chuẩn Xác (Đồng bộ 100% với Dashboard)
  const kpi = useMemo(() => {
    let depositCollected = 0;
    let finalCollected = 0;
    let totalContractValue = 0;

    orders.forEach((o) => {
      const fin = calculateFinancials(o);
      totalContractValue += fin.total;

      if (fin.isFinalPaid) {
        depositCollected += fin.deposit;
        finalCollected += fin.remaining;
      } else if (fin.isDepositPaid) {
        depositCollected += fin.deposit;
      }
    });

    // Chi trả nhân viên
    const staffPaid = salaryHistories
      .filter((s) => s.paymentStatus === "PAID")
      .reduce((sum, s) => sum + (Number(s.amountEarned) || 0), 0);

    let staffPending = 0;
    orders.forEach((o) => {
      const fin = calculateFinancials(o);
      const total = fin.total;
      const surveyDefault = total * 0.10;
      const workerDefault = total * 0.60;

      const supS = getSalary(o.id, o.supervisorId, "SURVEYOR", surveyDefault);
      const worS = getSalary(o.id, o.technicianId, "TECHNICIAN", workerDefault);

      // Nếu đơn đã cọc hoặc đã xong mà nhân viên chưa nhận tiền
      if (o.supervisorId && !supS.isPaid && (fin.isDepositPaid || fin.isFinalPaid)) {
        staffPending += supS.amount;
      }
      if (o.technicianId && !worS.isPaid && (fin.isDepositPaid || fin.isFinalPaid)) {
        staffPending += worS.amount;
      }
    });

    const totalBookingCollected = depositCollected + finalCollected;

    let warrantyStaffPaidTotal = 0;
    let warrantyStaffPendingTotal = 0;
    let companyFaultStaffPaid = 0;
    let warrantyCustomerPaidTotal = 0;
    let warrantyCustomerPendingTotal = 0;

    warrantyClaims.forEach((c) => {
      const price = Number(c.finalSupportPrice) || 0;
      if (price > 0) {
        if (c.customerPaid || c.customerAccepted) {
          warrantyCustomerPaidTotal += price;
        } else {
          warrantyCustomerPendingTotal += price;
        }
      }

      const surAmt = Number(c.surveyorSalary) || 100000;
      const worAmt = Number(c.workerSalary) || 200000;
      if (c.surveyorId) {
        if (c.surveyorPaid) warrantyStaffPaidTotal += surAmt;
        else warrantyStaffPendingTotal += surAmt;
      }
      if (c.technicianId) {
        if (c.workerPaid) warrantyStaffPaidTotal += worAmt;
        else warrantyStaffPendingTotal += worAmt;
      }
      if (c.faultType !== "CUSTOMER_FAULT") {
        if (c.surveyorPaid) companyFaultStaffPaid += surAmt;
        if (c.workerPaid) companyFaultStaffPaid += worAmt;
      }
    });

    const totalCollected = totalBookingCollected + warrantyCustomerPaidTotal;
    const systemNetBalance = totalCollected - staffPaid - warrantyStaffPaidTotal;

    return {
      totalOrders: orders.length,
      totalContractValue,
      depositCollected,
      finalCollected,
      totalBookingCollected,
      warrantyCustomerPaidTotal,
      warrantyCustomerPendingTotal,
      totalCollected,
      pendingCollection: Math.max(0, totalContractValue - totalBookingCollected),
      staffPaid,
      staffPending,
      systemNetBalance,
      warrantyStaffPaidTotal,
      warrantyStaffPendingTotal,
      companyFaultStaffPaid,
    };
  }, [orders, salaryHistories, warrantyClaims]);

  const filteredWarrantyClaims = useMemo(() => {
    return warrantyClaims.filter((c) => {
      if (!search) return true;
      const s = search.toLowerCase().trim();
      const sq = s.replace(/^#/, "");
      return (
        String(c.id) === sq ||
        String(c.id).includes(sq) ||
        String(c.bookingId) === sq ||
        String(c.bookingId).includes(sq) ||
        (c.customerName && c.customerName.toLowerCase().includes(s)) ||
        (c.surveyorName && c.surveyorName.toLowerCase().includes(s)) ||
        (c.technicianName && c.technicianName.toLowerCase().includes(s))
      );
    });
  }, [warrantyClaims, search]);

  // ── Danh sách sổ cái Đối soát (Inflow & Outflow Transactions)
  const reconciliationLedger = useMemo(() => {
    const list = [];

    // 1. Dòng tiền VÀO (+) từ Khách hàng hợp đồng gốc
    orders.forEach((o) => {
      const fin = calculateFinancials(o);
      const customerName = o.customerName || o.customer?.fullName || o.customer?.username || "Khách hàng";

      if (fin.isDepositPaid) {
        list.push({
          id: `IN-DEP-${o.id}`,
          bookingId: o.id,
          type: "IN",
          category: "Thu tiền cọc (30%)",
          party: customerName,
          partyRole: "Khách hàng",
          amount: fin.deposit,
          status: "COMPLETED",
          statusText: "Đã thu cọc",
          date: o.createdAt,
          rawDate: parseDate(o.createdAt),
          order: o,
        });
      } else {
        list.push({
          id: `IN-DEP-PENDING-${o.id}`,
          bookingId: o.id,
          type: "IN",
          category: "Tiền cọc (30%)",
          party: customerName,
          partyRole: "Khách hàng",
          amount: fin.deposit,
          status: "PENDING",
          statusText: "Chưa thu cọc",
          date: o.createdAt,
          rawDate: parseDate(o.createdAt),
          order: o,
        });
      }

      if (fin.isFinalPaid) {
        list.push({
          id: `IN-FIN-${o.id}`,
          bookingId: o.id,
          type: "IN",
          category: "Thu tất toán (70%)",
          party: customerName,
          partyRole: "Khách hàng",
          amount: fin.remaining,
          status: "COMPLETED",
          statusText: "Đã thu tất toán",
          date: o.createdAt,
          rawDate: parseDate(o.createdAt),
          order: o,
        });
      } else if (fin.isDepositPaid) {
        list.push({
          id: `IN-FIN-PENDING-${o.id}`,
          bookingId: o.id,
          type: "IN",
          category: "Tất toán (70%)",
          party: customerName,
          partyRole: "Khách hàng",
          amount: fin.remaining,
          status: "PENDING",
          statusText: "Chờ tất toán",
          date: o.createdAt,
          rawDate: parseDate(o.createdAt),
          order: o,
        });
      }
    });

    // 2. Dòng tiền RA (-) Chi trả Nhân sự đơn gốc
    orders.forEach((o) => {
      const fin = calculateFinancials(o);
      const total = fin.total;
      const surveyDefault = total * 0.10;
      const workerDefault = total * 0.60;

      if (o.supervisorId) {
        const supS = getSalary(o.id, o.supervisorId, "SURVEYOR", surveyDefault);
        list.push({
          id: `OUT-SUP-${o.id}-${o.supervisorId}`,
          bookingId: o.id,
          staffId: o.supervisorId,
          role: "SURVEYOR",
          type: "OUT",
          category: "Thù lao Giám sát (10% + VT)",
          party: o.supervisorName || "Giám sát viên",
          partyRole: "Giám sát viên",
          amount: supS.amount,
          status: supS.isPaid ? "COMPLETED" : "PENDING",
          statusText: supS.isPaid ? "Đã chi trả" : "Chờ quyết toán",
          date: supS.paidAt || o.createdAt,
          rawDate: parseDate(supS.paidAt || o.createdAt),
          order: o,
          canPayout: !supS.isPaid,
        });
      }

      if (o.technicianId) {
        const worS = getSalary(o.id, o.technicianId, "TECHNICIAN", workerDefault);
        list.push({
          id: `OUT-WOR-${o.id}-${o.technicianId}`,
          bookingId: o.id,
          staffId: o.technicianId,
          role: "TECHNICIAN",
          type: "OUT",
          category: "Thù lao Kỹ thuật (60%)",
          party: o.technicianName || "Kỹ thuật viên",
          partyRole: "Đội thợ thi công",
          amount: worS.amount,
          status: worS.isPaid ? "COMPLETED" : "PENDING",
          statusText: worS.isPaid ? "Đã chi trả" : "Chờ quyết toán",
          date: worS.paidAt || o.createdAt,
          rawDate: parseDate(worS.paidAt || o.createdAt),
          order: o,
          canPayout: !worS.isPaid,
        });
      }
    });

    // 3. Dòng tiền VÀO (+) từ Khách hàng đóng phí hỗ trợ Bảo hành
    warrantyClaims.forEach((c) => {
      const price = Number(c.finalSupportPrice) || 0;
      if (price > 0) {
        const isPaid = Boolean(c.customerPaid || c.customerAccepted);
        list.push({
          id: `IN-WAR-${c.id}`,
          bookingId: c.bookingId,
          type: "IN",
          category: `Thu phí hỗ trợ BH #${c.id}`,
          party: c.customerName || "Khách hàng",
          partyRole: "Khách hàng",
          amount: price,
          status: isPaid ? "COMPLETED" : "PENDING",
          statusText: isPaid ? "Đã thu tiền" : "Chờ khách đóng",
          date: c.createdAt,
          rawDate: parseDate(c.createdAt),
          order: { id: c.bookingId, customerName: c.customerName, address: c.address },
        });
      }

      // 4. Dòng tiền RA (-) Chi trả thù lao bảo hành
      if (c.surveyorId) {
        list.push({
          id: `OUT-WAR-SUP-${c.id}-${c.surveyorId}`,
          bookingId: c.bookingId,
          staffId: c.surveyorId,
          role: "SURVEYOR",
          type: "OUT",
          category: `Thù lao Giám sát BH #${c.id}`,
          party: c.surveyorName || "Giám sát viên",
          partyRole: "Giám sát viên",
          amount: Number(c.surveyorSalary) || 100000,
          status: c.surveyorPaid ? "COMPLETED" : "PENDING",
          statusText: c.surveyorPaid ? "Đã quyết toán" : "Chờ quyết toán",
          date: c.surveyorPaidAt || c.createdAt,
          rawDate: parseDate(c.surveyorPaidAt || c.createdAt),
          order: { id: c.bookingId, customerName: c.customerName, address: c.address },
          canPayout: !c.surveyorPaid,
          isWarranty: true,
          claimId: c.id,
        });
      }

      if (c.technicianId) {
        list.push({
          id: `OUT-WAR-WOR-${c.id}-${c.technicianId}`,
          bookingId: c.bookingId,
          staffId: c.technicianId,
          role: "TECHNICIAN",
          type: "OUT",
          category: `Thù lao Thợ BH #${c.id}`,
          party: c.technicianName || "Kỹ thuật viên",
          partyRole: "Đội thợ thi công",
          amount: Number(c.workerSalary) || 200000,
          status: c.workerPaid ? "COMPLETED" : "PENDING",
          statusText: c.workerPaid ? "Đã quyết toán" : "Chờ quyết toán",
          date: c.workerPaidAt || c.createdAt,
          rawDate: parseDate(c.workerPaidAt || c.createdAt),
          order: { id: c.bookingId, customerName: c.customerName, address: c.address },
          canPayout: !c.workerPaid,
          isWarranty: true,
          claimId: c.id,
        });
      }
    });

    return list.sort((a, b) => (b.rawDate?.getTime() || 0) - (a.rawDate?.getTime() || 0));
  }, [orders, salaryHistories, warrantyClaims]);

  // ── Lọc danh sách theo Tab
  const rawQ = (search || "").toLowerCase().trim();
  const q = rawQ.replace(/^#/, "");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !q || (
        String(o.id) === q ||
        String(o.id).includes(q) ||
        (o.customerName || o.customer?.fullName || o.customer?.username || "").toLowerCase().includes(rawQ) ||
        (o.supervisorName || "").toLowerCase().includes(rawQ) ||
        (o.technicianName || "").toLowerCase().includes(rawQ) ||
        (o.address || "").toLowerCase().includes(rawQ)
      );

      if (!matchSearch) return false;

      if (paymentFilter !== "ALL") {
        const fin = calculateFinancials(o);
        if (paymentFilter === "PAID_ALL" && !fin.isFinalPaid) return false;
        if (paymentFilter === "PAID_DEPOSIT" && (!fin.isDepositPaid || fin.isFinalPaid)) return false;
        if (paymentFilter === "UNPAID" && (fin.isDepositPaid || fin.isFinalPaid)) return false;
      }

      return true;
    }).sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders, q, rawQ, paymentFilter]);

  const filteredLedger = useMemo(() => {
    return reconciliationLedger.filter((item) => {
      const matchSearch = !q || (
        String(item.bookingId).includes(q) ||
        (item.party || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );

      if (!matchSearch) return false;

      if (ledgerTypeFilter !== "ALL" && item.type !== ledgerTypeFilter) return false;
      if (ledgerStatusFilter !== "ALL" && item.status !== ledgerStatusFilter) return false;

      return true;
    });
  }, [reconciliationLedger, q, ledgerTypeFilter, ledgerStatusFilter]);

  const thCls = "py-3.5 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/90";
  const tdCls = "py-3.5 px-4 text-xs";

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header Trung Tâm Thanh Toán & Đối Soát */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Quản Lý Thanh Toán & Đối Soát Dòng Tiền</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Tài chính hệ thống
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phân bổ thù lao: Giám sát 10% (+ Hoàn vật tư) · Kỹ thuật 60% · Phần còn lại kết chuyển Số dư hệ thống
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* ── 4 THẺ KPI TÀI CHÍNH TINH GỌN */}
      <KpiStrip items={[
        {
          label: "Tổng thực thu từ khách",
          value: formatMoney(kpi.totalCollected),
          sub: `Cọc: ${formatMoney(kpi.depositCollected)} · Tất toán: ${formatMoney(kpi.finalCollected)}`,
          accent: "border-t-blue-500"
        },
        {
          label: "Đã chi trả nhân viên",
          value: formatMoney(kpi.staffPaid),
          sub: "Giám sát (10%+VT) & Kỹ thuật (60%)",
          accent: "border-t-indigo-500"
        },
        {
          label: "Chờ quyết toán nhân viên",
          value: formatMoney(kpi.staffPending),
          sub: `Còn ${orders.filter(o => {
            const fin = calculateFinancials(o);
            const supS = getSalary(o.id, o.supervisorId, "SURVEYOR", fin.total * 0.1);
            const worS = getSalary(o.id, o.technicianId, "TECHNICIAN", fin.total * 0.6);
            return fin.isFinalPaid && (
              (o.supervisorId && !supS.isPaid) ||
              (o.technicianId && !worS.isPaid)
            );
          }).length} đơn cần chi`,
          accent: "border-t-amber-500"
        },
        {
          label: "Số dư hệ thống (Dòng tiền ròng)",
          value: formatMoney(kpi.systemNetBalance),
          sub: `Thực thu KH (-${formatMoney(kpi.staffPaid)} đã chi NV)`,
          accent: "border-t-emerald-500"
        },
      ]} />

      {/* ── Thanh Chuyển Tab & Bộ Lọc */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          {[
            { id: "CUSTOMER", label: "1. Thu tiền công trình", icon: CreditCard, count: orders.length },
            { id: "STAFF", label: "2. Quyết toán nhân viên", icon: UsersIcon, count: orders.filter(o => o.supervisorId || o.technicianId).length },
            { id: "WARRANTY", label: "3. Quyết toán bảo hành", icon: ShieldAlert, count: warrantyClaims.length },
            { id: "RECONCILIATION", label: "4. Sổ cái đối soát dòng tiền", icon: Wallet, count: reconciliationLedger.length },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${active ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span>{t.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${active ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách, nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {activeTab === "CUSTOMER" && (
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">Tất cả thanh toán</option>
              <option value="PAID_ALL">Đã thu đủ 100%</option>
              <option value="PAID_DEPOSIT">Đã thu cọc 30%</option>
              <option value="UNPAID">Chưa thu tiền</option>
            </select>
          )}

          {activeTab === "RECONCILIATION" && (
            <div className="flex gap-2">
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">Tất cả luồng</option>
                <option value="IN">Dòng tiền Vào (+)</option>
                <option value="OUT">Dòng tiền Ra (-)</option>
              </select>

              <select
                value={ledgerStatusFilter}
                onChange={(e) => setLedgerStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="PENDING">Chờ xử lý</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Tabs */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* ════════════════ TAB 1: THU TIỀN CÔNG TRÌNH (KHÁCH HÀNG) ════════════════ */}
          {activeTab === "CUSTOMER" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className={thCls}>Mã đơn &amp; Ngày</th>
                      <th className={thCls}>Khách hàng</th>
                      <th className={thCls}>Dịch vụ &amp; Địa chỉ</th>
                      <th className={thCls + " text-right"}>Tổng giá trị</th>
                      <th className={thCls + " text-right"}>Thực thu (Cọc &amp; Tất toán)</th>
                      <th className={thCls + " text-center"}>Trạng thái</th>
                      <th className={thCls + " text-right"}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const fin = calculateFinancials(o);
                        const customerName = o.customerName || o.customer?.fullName || o.customer?.username || "—";

                        return (
                          <tr
                            key={o.id}
                            onClick={() => navigate(`/admin/bookings/${o.id}`)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          >
                            <td className={tdCls}>
                              <div className="font-bold text-slate-900 font-mono">#{o.id}</div>
                              <div className="text-[11px] text-slate-400">{fmtDate(o.createdAt)}</div>
                            </td>
                            <td className={tdCls}>
                              <p className="font-bold text-slate-800">{customerName}</p>
                              {o.customerPhone && <p className="text-[11px] text-slate-400">{o.customerPhone}</p>}
                            </td>
                            <td className={tdCls + " max-w-[220px]"}>
                              <p className="font-semibold text-slate-800 truncate">{o.serviceName || o.service?.name || "—"}</p>
                              <p className="text-[11px] text-slate-400 truncate">{o.address || "—"}</p>
                            </td>
                            <td className={tdCls + " text-right font-bold text-slate-900 font-mono"}>
                              {formatMoney(fin.total)}
                            </td>
                            <td className={tdCls + " text-right"}>
                              <div className="font-bold text-emerald-700 font-mono">{formatMoney(fin.collected)}</div>
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <Badge ok={fin.isDepositPaid} okLabel="Cọc 30%" failLabel="Chưa cọc" />
                                {fin.isFinalPaid && <Badge ok={true} okLabel="Tất toán 100%" />}
                              </div>
                            </td>
                            <td className={tdCls + " text-center"}>
                              <StatusBadge status={o.status} />
                            </td>
                            <td className={tdCls + " text-right whitespace-nowrap"} onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/bookings/${o.id}`)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Xem chi tiết đơn hàng"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Băng tổng kết Tab 1 */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap gap-6 text-slate-600">
                  <span>Tổng giá trị đơn: <strong className="text-slate-900 font-mono">{formatMoney(kpi.totalContractValue)}</strong></span>
                  <span>Đã thu cọc (30%): <strong className="text-blue-700 font-mono">{formatMoney(kpi.depositCollected)}</strong></span>
                  <span>Đã thu tất toán (70%): <strong className="text-emerald-700 font-mono">{formatMoney(kpi.finalCollected)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Tổng thực thu từ khách:</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">{formatMoney(kpi.totalCollected)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 2: QUYẾT TOÁN NHÂN VIÊN ════════════════ */}
          {activeTab === "STAFF" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className={thCls}>Đơn hàng &amp; Khách</th>
                      <th className={thCls + " text-right"}>Tổng HĐ</th>
                      <th className={thCls}>Giám sát (10% + VT)</th>
                      <th className={thCls}>Đội thợ (60%)</th>
                      <th className={thCls + " text-center"}>Trạng thái chi</th>
                      <th className={thCls + " text-right"}>Thao tác chi trả VietQR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          Không tìm thấy đơn hàng nào cần quyết toán.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const fin = calculateFinancials(o);
                        const total = fin.total;
                        const surveyDefault = total * 0.10;
                        const workerDefault = total * 0.60;

                        const supS = getSalary(o.id, o.supervisorId, "SURVEYOR", surveyDefault);
                        const worS = getSalary(o.id, o.technicianId, "TECHNICIAN", workerDefault);

                        const hasSupervisor = Boolean(o.supervisorId);
                        const hasTechnician = Boolean(o.technicianId);

                        const supPaid = !hasSupervisor || supS.isPaid;
                        const worPaid = !hasTechnician || worS.isPaid;
                        const isAllStaffPaid = (hasSupervisor || hasTechnician) && supPaid && worPaid;

                        return (
                          <tr
                            key={o.id}
                            onClick={() => navigate(`/admin/bookings/${o.id}`)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          >
                            <td className={tdCls}>
                              <div className="font-bold text-slate-900 font-mono">#{o.id}</div>
                              <div className="font-medium text-slate-600 truncate max-w-[140px]">
                                {o.customerName || o.customer?.fullName || o.customer?.username || "—"}
                              </div>
                            </td>
                            <td className={tdCls + " text-right font-bold text-slate-900 font-mono"}>
                              {formatMoney(total)}
                            </td>

                            {/* Giám sát */}
                            <td className={tdCls}>
                              {hasSupervisor ? (
                                <div>
                                  <p className="font-semibold text-slate-800">{o.supervisorName || "Giám sát"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-bold text-slate-900 font-mono">{formatMoney(supS.amount)}</span>
                                    <Badge ok={supS.isPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* Kỹ thuật */}
                            <td className={tdCls}>
                              {hasTechnician ? (
                                <div>
                                  <p className="font-semibold text-slate-800">{o.technicianName || "Đội thợ"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-bold text-slate-900 font-mono">{formatMoney(worS.amount)}</span>
                                    <Badge ok={worS.isPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* Trạng thái chi */}
                            <td className={tdCls + " text-center"}>
                              {isAllStaffPaid ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Đã chi đủ
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                  Chờ quyết toán
                                </span>
                              )}
                            </td>

                            {/* Thao tác thanh toán VietQR độc lập cho từng người */}
                            <td className={tdCls + " text-right whitespace-nowrap"} onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/bookings/${o.id}`)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Xem chi tiết đơn hàng"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {hasSupervisor && !supS.isPaid && (
                                  fin.isFinalPaid ? (
                                    <button
                                      type="button"
                                      onClick={() => openPayoutQR(o, o.supervisorId, o.supervisorName || "Giám sát", "SURVEYOR", supS.amount)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                      title="Quét VietQR chi trả Giám sát"
                                    >
                                      <QrCode className="w-3 h-3" /> Trả GS
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                      Chờ khách tất toán
                                    </span>
                                  )
                                )}
                                {hasTechnician && !worS.isPaid && (
                                  fin.isFinalPaid ? (
                                    <button
                                      type="button"
                                      onClick={() => openPayoutQR(o, o.technicianId, o.technicianName || "Kỹ thuật viên", "TECHNICIAN", worS.amount)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                      title="Quét VietQR chi trả Đội thợ"
                                    >
                                      <QrCode className="w-3 h-3" /> Trả Thợ
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                      Chờ khách tất toán
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Băng tổng kết Tab 2 */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap gap-6 text-slate-600">
                  <span>Đã chi nhân viên: <strong className="text-indigo-700 font-mono">{formatMoney(kpi.staffPaid)}</strong></span>
                  <span>Chờ quyết toán nhân viên: <strong className="text-amber-700 font-mono">{formatMoney(kpi.staffPending)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Số dư hệ thống hiện tại:</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">{formatMoney(kpi.systemNetBalance)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 3: QUYẾT TOÁN BẢO HÀNH ════════════════ */}
          {activeTab === "WARRANTY" && (
            <StaffWarrantyPayoutTab
              filteredWarrantyClaims={filteredWarrantyClaims}
              openWarrantyPayoutQR={openWarrantyPayoutQR}
              navigate={navigate}
              kpi={kpi}
              thCls={thCls}
              tdCls={tdCls}
              search={search}
              handleClearSearch={() => setSearch("")}
            />
          )}

          {/* ════════════════ TAB 4: SỔ CÁI ĐỐI SOÁT DÒNG TIỀN ════════════════ */}
          {activeTab === "RECONCILIATION" && (
            <div className="space-y-5">
              {/* Thẻ Dòng Tiền Ròng Hệ Thống (Master Wallet Card) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Số Dư Dòng Tiền Thực Tế Hệ Thống (Dòng Tiền Ròng)</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                      {formatMoney(kpi.systemNetBalance)}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 max-w-xl">
                      Công thức đối soát: <strong className="text-emerald-300">Tổng thực thu từ khách (+{formatMoney(kpi.totalCollected)})</strong> trừ đi <strong className="text-rose-300">Tổng đã chi trả nhân sự (-{formatMoney(kpi.staffPaid)})</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-xs">
                      <p className="text-slate-400 font-medium">Tổng Thu Vào (+)</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5 font-mono">{formatMoney(kpi.totalCollected)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-xs">
                      <p className="text-slate-400 font-medium">Tổng Đã Chi (-)</p>
                      <p className="text-base font-bold text-rose-400 mt-0.5 font-mono">{formatMoney(kpi.staffPaid)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng Đối Soát Chi Tiết Giao Dịch */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Sổ Nhật Ký Thu Chi & Đối Soát Giao Dịch</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Theo dõi chi tiết từng dòng tiền vào và ra gắn liền với mã đơn công trình</p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    {filteredLedger.length} giao dịch đối soát
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className={thCls}>Luồng</th>
                        <th className={thCls}>Mã Đơn</th>
                        <th className={thCls}>Danh Mục Giao Dịch</th>
                        <th className={thCls}>Đối Tác / Nhân Sự</th>
                        <th className={thCls + " text-right"}>Số Tiền</th>
                        <th className={thCls + " text-center"}>Trạng Thái</th>
                        <th className={thCls}>Ngày Ghi Nhận</th>
                        <th className={thCls + " text-right"}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {filteredLedger.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-400">
                            Không có giao dịch đối soát nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredLedger.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => navigate(`/admin/bookings/${item.bookingId}`)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          >
                            {/* In/Out icon */}
                            <td className={tdCls}>
                              {item.type === "IN" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Vào (+)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                                  <ArrowUpRight className="w-3 h-3 text-rose-600" /> Ra (-)
                                </span>
                              )}
                            </td>

                            <td className={tdCls + " font-bold text-slate-900 font-mono"}>
                              #{item.bookingId}
                            </td>

                            <td className={tdCls + " font-semibold text-slate-800"}>
                              {item.category}
                            </td>

                            <td className={tdCls}>
                              <p className="font-bold text-slate-800">{item.party}</p>
                              <p className="text-[10px] text-slate-400">{item.partyRole}</p>
                            </td>

                            <td className={tdCls + " text-right font-black font-mono"}>
                              <span className={item.type === "IN" ? "text-emerald-700" : "text-rose-600"}>
                                {item.type === "IN" ? "+" : "-"}{formatMoney(item.amount)}
                              </span>
                            </td>

                            <td className={tdCls + " text-center"}>
                              {item.status === "COMPLETED" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" /> {item.statusText}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Clock className="w-2.5 h-2.5" /> {item.statusText}
                                </span>
                              )}
                            </td>

                            <td className={tdCls + " text-slate-400 whitespace-nowrap"}>
                              {fmtDate(item.date)}
                            </td>

                            <td className={tdCls + " text-right whitespace-nowrap"} onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/bookings/${item.bookingId}`)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Xem chi tiết đơn hàng"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {item.canPayout && (
                                  <button
                                    type="button"
                                    onClick={() => openPayoutQR(item.order, item.staffId, item.party, item.role, item.amount)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    <QrCode className="w-3 h-3" /> Quyết toán
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tổng kết Sổ cái */}
                <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap gap-6 text-slate-600">
                    <span>Tổng dòng tiền vào: <strong className="text-emerald-700 font-mono">+{formatMoney(kpi.totalCollected)}</strong></span>
                    <span>Tổng dòng tiền đã chi: <strong className="text-rose-600 font-mono">-{formatMoney(kpi.staffPaid)}</strong></span>
                    <span>Chờ quyết toán: <strong className="text-amber-700 font-mono">{formatMoney(kpi.staffPending)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Số dư ròng hệ thống:</span>
                    <span className="text-sm font-black text-slate-900 font-mono">{formatMoney(kpi.systemNetBalance)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal quyết toán VietQR */}
      <Modal
        isOpen={!!payoutModal}
        onClose={() => setPayoutModal(null)}
        title={`Thanh toán thù lao — ${payoutModal?.staffName || ""}`}
        size="md"
      >
        {payoutModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
              {[
                ["Nhân sự", `${payoutModal.staffName} (${payoutModal.role === "SURVEYOR" ? "Giám sát viên" : "Kỹ thuật viên"})`],
                ["Ngân hàng", payoutModal.bankName],
                ["Số tài khoản", payoutModal.bankAccountNumber],
                ["Chủ TK", payoutModal.bankAccountName],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}:</span>
                  <span className="font-bold text-slate-800">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Số tiền quyết toán:</span>
                <span className="font-black text-emerald-700 text-sm">{formatMoney(payoutModal.amount)}</span>
              </div>
            </div>
            <QRCodePayment
              amount={payoutModal.amount}
              orderId={payoutModal.orderId}
              bankId={payoutModal.bankCode}
              bankName={payoutModal.bankName}
              accountNo={payoutModal.bankAccountNumber}
              accountName={payoutModal.bankAccountName}
              addInfo={`LUONG DH${payoutModal.orderId} ${payoutModal.role === "SURVEYOR" ? "GS" : "KT"}`}
              title={`Quét mã VietQR trả thù lao cho ${payoutModal.staffName}`}
              subTitle={payoutModal.role === "SURVEYOR" ? "Giám sát viên" : "Kỹ thuật viên thi công"}
              note="Quét mã trên app ngân hàng rồi bấm Xác nhận để ghi nhận."
              confirmText={submitting ? "Đang xác nhận..." : `Xác nhận đã chuyển ${formatMoney(payoutModal.amount)}`}
              confirmColor="bg-emerald-600 hover:bg-emerald-700"
              onConfirm={confirmPayout}
              onClose={() => setPayoutModal(null)}
              loading={submitting}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function UsersIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}