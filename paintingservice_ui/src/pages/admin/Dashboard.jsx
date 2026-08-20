import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import { formatMoney } from "../../util/formatters";
import { calculateFinancials } from "../../util/orderFlowUtils";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Line,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Users,
  Briefcase,
  Layers,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Search,
  Activity,
  Award,
  ChevronRight,
} from "lucide-react";

// ── Palette màu hiện đại & chuẩn Design System
const PALETTE = {
  primary: "#2563eb",   // Blue 600
  secondary: "#4f46e5", // Indigo 600
  success: "#10b981",   // Emerald 500
  warning: "#f59e0b",   // Amber 500
  danger: "#ef4444",    // Red 500
  teal: "#0d9488",      // Teal 600
  emerald: "#059669",   // Emerald 600
  slate: "#64748b",    // Slate 500
  dark: "#0f172a",     // Slate 900
};

const PIE_COLORS = [
  PALETTE.primary,
  PALETTE.success,
  PALETTE.teal,
  PALETTE.warning,
  PALETTE.secondary,
  PALETTE.emerald,
];

const STAGE_CONFIG = [
  { key: "PENDING", label: "1. Đặt lịch mới", color: "bg-amber-500", textColor: "text-amber-600" },
  { key: "SURVEY", label: "2. Khảo sát & Báo giá", color: "bg-blue-500", textColor: "text-blue-600" },
  { key: "CONTRACT", label: "3. Ký HĐ & Đặt cọc", color: "bg-teal-600", textColor: "text-teal-600" },
  { key: "PROCESSING", label: "4. Đang thi công", color: "bg-indigo-600", textColor: "text-indigo-600" },
  { key: "COMPLETED", label: "5. Nghiệm thu xong", color: "bg-emerald-500", textColor: "text-emerald-600" },
];

/** Parse an toàn ngày tháng từ Backend (Array [y,m,d] hoặc ISO String) */
function parseDateSafe(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [y, m, d, h = 0, min = 0, s = 0] = raw;
    return new Date(y, m - 1, d, h, min, s);
  }
  const dt = new Date(raw);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatDateDisplay(raw) {
  const d = parseDateSafe(raw);
  if (!d) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Custom Tooltip chuẩn Glassmorphism
const PremiumTooltip = ({ active, payload, label, isMoney = false }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-xl shadow-2xl p-3.5 text-xs min-w-[170px] animate-in fade-in duration-150">
      <p className="font-bold text-slate-300 pb-1.5 mb-2 border-b border-slate-800">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => {
          const isCount =
            p.dataKey === "orderCount" ||
            p.dataKey === "count" ||
            p.name?.toLowerCase().includes("số lượng") ||
            p.name?.toLowerCase().includes("số đơn");

          const displayVal = isCount
            ? `${p.value} đơn`
            : isMoney || p.dataKey === "contractRev" || p.dataKey === "actualCollected" || p.dataKey === "revenue"
            ? formatMoney(p.value)
            : p.value;

          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                <span className="text-slate-400 font-medium">{p.name}:</span>
              </div>
              <span className="font-bold text-white font-mono">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Card Thống Kê KPI Cao Cấp
function MetricCard({ title, value, subValue, icon: Icon, badge, trendText, colorScheme = "blue" }) {
  const schemeStyles = {
    blue: {
      bgIcon: "bg-blue-50 text-blue-600",
      border: "hover:border-blue-300",
      accent: "from-blue-600 to-indigo-600",
    },
    emerald: {
      bgIcon: "bg-emerald-50 text-emerald-600",
      border: "hover:border-emerald-300",
      accent: "from-emerald-600 to-teal-600",
    },
    amber: {
      bgIcon: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-300",
      accent: "from-amber-500 to-orange-500",
    },
    teal: {
      bgIcon: "bg-teal-50 text-teal-600",
      border: "hover:border-teal-300",
      accent: "from-teal-600 to-emerald-600",
    },
  }[colorScheme] || {
    bgIcon: "bg-teal-50 text-teal-600",
    border: "hover:border-teal-300",
    accent: "from-teal-600 to-emerald-600",
  };

  return (
    <div className={`relative bg-white rounded-2xl p-5 border border-slate-100 shadow-xs ${schemeStyles.border} transition-all duration-200 group hover:shadow-md overflow-hidden flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-xl ${schemeStyles.bgIcon} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium truncate max-w-[190px]">{subValue}</span>
        {badge && (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
        {trendText && (
          <span className="inline-flex items-center gap-0.5 font-bold text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" /> {trendText}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Khung Biểu Đồ Chuẩn
function DashboardSection({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100/80 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);

  // Filter & Search
  const [timeRange, setTimeRange] = useState("ALL"); // "30D" | "90D" | "ALL"
  const [tableSearch, setTableSearch] = useState("");
  const [tableStatus, setTableStatus] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, pRes, sRes, uRes, stRes] = await Promise.all([
        AxiosConfig.get("/bookings").catch(() => ({ data: [] })),
        AxiosConfig.get("/contracts").catch(() => ({ data: [] })),
        AxiosConfig.get("/payments").catch(() => ({ data: [] })),
        AxiosConfig.get("/services").catch(() => ({ data: [] })),
        AxiosConfig.get("/users").catch(() => ({ data: [] })),
        AxiosConfig.get("/staff").catch(() => ({ data: [] })),
      ]);

      const normalize = (res) => (Array.isArray(res.data) ? res.data : res.data?.content || []);
      setBookings(normalize(bRes));
      setContracts(normalize(cRes));
      setPayments(normalize(pRes));
      setServices(normalize(sRes));
      setUsers(normalize(uRes));
      setStaff(normalize(stRes));
    } catch {
      showToast?.("Không tải được toàn bộ dữ liệu thống kê", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Tính toán các chỉ số kinh doanh cốt lõi (Core Business Metrics)
  const metrics = useMemo(() => {
    let totalContractValue = 0;
    let depositCollected = 0;
    let finalCollected = 0;
    let actualCollected = 0;
    let pendingCollection = 0;

    bookings.forEach((b) => {
      const fin = calculateFinancials(b);
      totalContractValue += fin.total;

      if (fin.isFinalPaid) {
        depositCollected += fin.deposit;
        finalCollected += fin.remaining;
      } else if (fin.isDepositPaid) {
        depositCollected += fin.deposit;
      }

      actualCollected += fin.collected;
      pendingCollection += fin.uncollected;
    });

    const completedBookings = bookings.filter((b) => b.status === "COMPLETED" || b.status === "PAID_TO_STAFF").length;
    const inProgressBookings = bookings.filter((b) => [
      "ASSIGNED", "SURVEYING", "ACCEPTED", "PROCESSING", "SURVEY_DONE", 
      "WAITING_CUSTOMER_SIGNATURE", "WAITING_DEPOSIT", "DEPOSIT_CONFIRMED", "CONTRACT_APPROVED"
    ].includes(b.status)).length;
    const pendingBookings = bookings.filter((b) => b.status === "PENDING" || b.status === "SURVEY_ASSIGNED").length;
    const completionRate = bookings.length > 0 ? ((completedBookings / bookings.length) * 100).toFixed(1) : 0;

    const customersCount = users.filter((u) => (u.role?.name || u.role || "").includes("CUSTOMER")).length;

    return {
      totalContractValue,
      depositCollected,
      finalCollected,
      actualCollected,
      pendingCollection,
      totalOrders: bookings.length,
      completedBookings,
      inProgressBookings,
      pendingBookings,
      completionRate,
      customersCount,
      staffCount: staff.length,
    };
  }, [bookings, users, staff]);

  // ── 1. Biểu đồ Doanh thu & Thu thực tế theo từng tháng (Dual-Axis Composed Chart)
  const monthlyRevenueChartData = useMemo(() => {
    const monthMap = {};

    bookings.forEach((b) => {
      const d = parseDateSafe(b.createdAt || b.appointmentDate);
      if (!d) return;
      const key = `T${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      if (!monthMap[key]) monthMap[key] = { month: key, contractRev: 0, actualCollected: 0, orderCount: 0, rawDate: d };
      monthMap[key].orderCount += 1;
      monthMap[key].contractRev += (Number(b.totalAmount) || 0);

      const fin = calculateFinancials(b);
      monthMap[key].actualCollected += fin.collected;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.rawDate - b.rawDate)
      .slice(-12);
  }, [bookings]);

  // ── 2. Biểu đồ Cơ cấu doanh thu theo Dịch vụ (Top Services Breakdown)
  const serviceBreakdownData = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const sName = b.serviceName || b.service?.name || "Sơn sửa tổng hợp";
      const amt = Number(b.totalAmount) || 0;
      if (!map[sName]) map[sName] = { name: sName, revenue: 0, count: 0 };
      map[sName].revenue += amt;
      map[sName].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [bookings]);

  // ── 3. Phễu tiến độ công trình (Project Execution Pipeline Funnel)
  const pipelineData = useMemo(() => {
    const counts = {
      PENDING: 0,
      SURVEY: 0,
      CONTRACT: 0,
      PROCESSING: 0,
      COMPLETED: 0,
    };

    bookings.forEach((b) => {
      if (b.status === "PENDING" || b.status === "SURVEY_ASSIGNED") counts.PENDING++;
      else if (["ASSIGNED", "SURVEYING", "SURVEY_DONE", "ACCEPTED"].includes(b.status)) counts.SURVEY++;
      else if (["WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE", "WAITING_CUSTOMER_SIGNATURE", "WAITING_DEPOSIT", "DEPOSIT_CONFIRMED", "CONTRACT_APPROVED"].includes(b.status)) counts.CONTRACT++;
      else if (b.status === "PROCESSING" || b.status === "WORKER_COMPLETED") counts.PROCESSING++;
      else if (["COMPLETED", "PAID_TO_STAFF"].includes(b.status)) counts.COMPLETED++;
    });

    return STAGE_CONFIG.map((stage) => ({
      ...stage,
      count: counts[stage.key] || 0,
      percentage: bookings.length > 0 ? (((counts[stage.key] || 0) / bookings.length) * 100).toFixed(0) : 0,
    }));
  }, [bookings]);

  // ── 4. Cơ cấu Dòng tiền & Thanh toán (Donut Breakdown)
  const cashflowDonutData = useMemo(() => {
    let depositPaid = 0;
    let finalPaid = 0;
    let pendingPayment = 0;

    bookings.forEach((b) => {
      const fin = calculateFinancials(b);
      if (fin.isFinalPaid) {
        depositPaid += fin.deposit;
        finalPaid += fin.remaining;
      } else if (fin.isDepositPaid) {
        depositPaid += fin.deposit;
        pendingPayment += fin.remaining;
      } else {
        pendingPayment += fin.total;
      }
    });

    return [
      { name: "Đã thu Cọc (30%)", value: depositPaid, color: PALETTE.primary },
      { name: "Đã thu Tất toán (70%)", value: finalPaid, color: PALETTE.success },
      { name: "Chờ thu từ khách", value: pendingPayment, color: PALETTE.warning },
    ].filter((d) => d.value > 0);
  }, [bookings]);

  // ── Danh sách đơn hàng gần đây (Recent Active Projects)
  const recentOrders = useMemo(() => {
    return [...bookings]
      .filter((o) => {
        if (tableStatus !== "ALL" && o.status !== tableStatus) return false;
        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase().trim();
          const matchId = String(o.id).includes(q);
          const matchCustomer = (o.customerName || o.customer?.fullName || o.customer?.username || "").toLowerCase().includes(q);
          const matchAddress = (o.address || "").toLowerCase().includes(q);
          const matchService = (o.serviceName || "").toLowerCase().includes(q);
          if (!matchId && !matchCustomer && !matchAddress && !matchService) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = parseDateSafe(a.createdAt || a.appointmentDate);
        const db = parseDateSafe(b.createdAt || b.appointmentDate);
        return (db?.getTime() || 0) - (da?.getTime() || 0);
      })
      .slice(0, 8);
  }, [bookings, tableSearch, tableStatus]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER EXECUTIVE DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Tổng Quan Điều Hành Hệ Thống</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo hiệu suất kinh doanh, tiến độ công trình và dòng tiền theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── 4 THẺ METRICS KPI ĐỈNH CAO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng Doanh Thu Đơn Hàng"
          value={formatMoney(metrics.totalContractValue)}
          subValue={`Thực thu: ${formatMoney(metrics.actualCollected)}`}
          icon={DollarSign}
          colorScheme="blue"
          trendText={`Cọc: ${formatMoney(metrics.depositCollected)}`}
        />
        <MetricCard
          title="Thực Thu Từ Khách"
          value={formatMoney(metrics.actualCollected)}
          subValue={`Chờ thu: ${formatMoney(metrics.pendingCollection)}`}
          icon={DollarSign}
          colorScheme="emerald"
          trendText={`Tất toán: ${formatMoney(metrics.finalCollected)}`}
        />
        <MetricCard
          title="Tổng Số Đơn Dịch Vụ"
          value={metrics.totalOrders}
          subValue={`${metrics.inProgressBookings} đang thực hiện`}
          icon={Briefcase}
          colorScheme="teal"
          badge={`${metrics.pendingBookings} chờ xử lý`}
        />
        <MetricCard
          title="Tỷ Lệ Hoàn Thành"
          value={`${metrics.completionRate}%`}
          subValue={`${metrics.completedBookings} công trình đã xong`}
          icon={CheckCircle2}
          colorScheme="amber"
          badge={`${metrics.customersCount} Khách`}
        />
      </div>

      {/* ── ROW 1: DOANH THU & DÒNG TIỀN (2/3) + PHÂN BỔ THU CHI (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu & Thực thu */}
        <DashboardSection
          title="Xu Hướng Doanh Thu & Dòng Tiền Thu Thực Tế"
          subtitle="So sánh tổng giá trị hợp đồng ký kết và tiền thu được (Cọc + Tất toán) qua các tháng"
          className="lg:col-span-2"
        >
          {monthlyRevenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={290}>
              <ComposedChart data={monthlyRevenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradContract" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}tr` : v)}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PremiumTooltip isMoney />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="contractRev"
                  name="Giá trị Hợp đồng"
                  stroke={PALETTE.primary}
                  strokeWidth={2.5}
                  fill="url(#gradContract)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="actualCollected"
                  name="Thực thu từ khách"
                  fill={PALETTE.success}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  opacity={0.85}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orderCount"
                  name="Số lượng đơn"
                  stroke={PALETTE.teal}
                  strokeWidth={2}
                  dot={{ r: 3, fill: PALETTE.teal }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Activity className="w-8 h-8 text-slate-300 mb-2" />
              <span>Chưa có dữ liệu giao dịch theo tháng</span>
            </div>
          )}
        </DashboardSection>

        {/* Biểu đồ Cơ cấu Dòng tiền Thu & Công nợ */}
        <DashboardSection
          title="Cơ Cấu Dòng Tiền & Công Nợ"
          subtitle="Tỷ lệ thực thu cọc, tất toán và số tiền còn lại"
        >
          {cashflowDonutData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={cashflowDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {cashflowDonutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PremiumTooltip isMoney />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {cashflowDonutData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
              Chưa có dữ liệu thanh toán
            </div>
          )}
        </DashboardSection>
      </div>

      {/* ── ROW 2: DOANH THU THEO DỊCH VỤ (1/2) + PHỄU TIẾN ĐỘ CÔNG TRÌNH (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doanh thu theo gói Dịch vụ */}
        <DashboardSection
          title="Xếp Hạng Doanh Thu Theo Dịch Vụ"
          subtitle="Dịch vụ nào mang lại giá trị cao nhất cho doanh nghiệp"
        >
          {serviceBreakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviceBreakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}tr` : v)}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<PremiumTooltip isMoney />} />
                <Bar dataKey="revenue" name="Tổng doanh thu" fill={PALETTE.primary} radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {serviceBreakdownData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-xs">
              Chưa có dữ liệu dịch vụ
            </div>
          )}
        </DashboardSection>

        {/* Phễu tiến độ công trình */}
        <DashboardSection
          title="Phễu Tiến Độ & Trạng Thái Công Trình"
          subtitle="Theo dõi tỷ lệ chuyển đổi từ khảo sát đến hoàn thành bàn giao"
        >
          <div className="space-y-3.5 pt-1">
            {pipelineData.map((stage) => (
              <div key={stage.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{stage.count} đơn</span>
                    <span className="text-[11px] font-bold text-slate-400">({stage.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${Math.max(5, stage.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      {/* ── ROW 3: BẢNG CÔNG TRÌNH & ĐƠN HÀNG GẦN ĐÂY */}
      <DashboardSection
        title="Danh Sách Công Trình Gần Đây"
        subtitle="Theo dõi chi tiết các yêu cầu mới nhất cần xử lý hoặc phân công"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã đơn, khách, địa chỉ..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <select
              value={tableStatus}
              onChange={(e) => setTableStatus(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-slate-700"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="ASSIGNED">Đã phân công</option>
              <option value="PROCESSING">Đang thi công</option>
              <option value="COMPLETED">Đã hoàn thành</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6 -my-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Mã Đơn</th>
                <th className="py-3.5 px-6">Khách Hàng</th>
                <th className="py-3.5 px-6">Dịch Vụ & Địa Chỉ</th>
                <th className="py-3.5 px-6 text-right">Tổng Kinh Phí</th>
                <th className="py-3.5 px-6 text-center">Trạng Thái</th>
                <th className="py-3.5 px-6">Ngày Tạo</th>
                <th className="py-3.5 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Không tìm thấy công trình nào phù hợp.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const customerName = o.customerName || o.customer?.fullName || o.customer?.username || "Khách hàng";
                  const initialChar = customerName.charAt(0).toUpperCase();
                  const total = Number(o.totalAmount) || 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <span className="font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded-lg text-[11px]">
                          #{o.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {initialChar}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{customerName}</p>
                            {o.customerPhone && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{o.customerPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 max-w-[200px]">
                        <p className="font-semibold text-slate-800 truncate">{o.serviceName || o.service?.name || "Sơn sửa nhà"}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{o.address || "—"}</p>
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-900 font-mono">
                        {total > 0 ? formatMoney(total) : <span className="text-slate-400 font-normal">Chờ báo giá</span>}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 whitespace-nowrap">
                        {formatDateDisplay(o.createdAt || o.appointmentDate)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <span>Chi tiết</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}