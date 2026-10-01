import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Pagination from "../../../components/common/Pagination";
import { parseHanoiAddress, HANOI_DISTRICTS } from "../../../data/hanoiLocations";
import { formatMoney } from "../../../util/formatters";
import {
  Search,
  Eye,
  Filter,
  RefreshCw,
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  Briefcase,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  DollarSign,
  LayoutGrid,
  List,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

function getOrderTechnicians(o) {
  const techs = [];
  if (o.bookingServices && o.bookingServices.length > 0) {
    o.bookingServices.forEach((s) => {
      const name = s.technicianName || s.technician?.username;
      if (name && !techs.includes(name)) {
        techs.push(name);
      }
    });
  }
  if (techs.length === 0 && (o.technicianName || o.technician?.username)) {
    techs.push(o.technicianName || o.technician?.username);
  }
  return techs;
}

function getOrderServices(o) {
  if (o.bookingServices && o.bookingServices.length > 0) {
    const list = o.bookingServices.map((s) => s.serviceName).filter(Boolean);
    if (list.length > 0) return list;
  }
  const name = o.serviceName || o.service?.name;
  return name ? [name] : ["Sơn nhà"];
}

export default function OrderList() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest' | 'price_desc' | 'price_asc'
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch all orders & services
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [orderRes, serviceRes] = await Promise.all([
        AxiosConfig.get("/bookings"),
        AxiosConfig.get("/services").catch(() => ({ data: [] })),
      ]);
      const data = Array.isArray(orderRes.data)
        ? orderRes.data
        : orderRes.data?.content || [];
      setOrders(data);
      setServices(serviceRes.data || []);
      if (isRefresh) showToast?.("Đã làm mới dữ liệu thành công!", "success");
    } catch {
      showToast?.("Không tải được danh sách yêu cầu", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Thống kê số lượng theo nhóm trạng thái
  const counts = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const surveyAssigned = orders.filter((o) =>
      ["SURVEY_ASSIGNED", "ACCEPTED", "SURVEYING"].includes(o.status)
    ).length;
    const waitingQuote = orders.filter(
      (o) => o.status === "WAITING_ADMIN_QUOTE"
    ).length;
    const waitingContract = orders.filter((o) =>
      [
        "CUSTOMER_ACCEPTED_QUOTE",
        "WAITING_CONTRACT_APPROVAL",
        "WAITING_CUSTOMER_SIGNATURE",
      ].includes(o.status)
    ).length;
    const waitingDeposit = orders.filter(
      (o) => o.status === "WAITING_DEPOSIT"
    ).length;
    const depositConfirmed = orders.filter(
      (o) => o.status === "DEPOSIT_CONFIRMED"
    ).length;
    const inProgress = orders.filter((o) =>
      ["ASSIGNED", "PROCESSING"].includes(o.status)
    ).length;
    const workerCompleted = orders.filter(
      (o) => o.status === "WORKER_COMPLETED"
    ).length;
    const completed = orders.filter((o) =>
      ["COMPLETED", "FULLY_PAID", "PAID_TO_STAFF"].includes(o.status)
    ).length;
    const cancelled = orders.filter(
      (o) => o.status === "CANCELLED" || o.status === "WORKER_REJECTED"
    ).length;

    return {
      total,
      pending,
      surveyAssigned,
      waitingQuote,
      waitingContract,
      waitingDeposit,
      depositConfirmed,
      inProgress,
      workerCompleted,
      completed,
      cancelled,
    };
  }, [orders]);

  // Bộ lọc nâng cao
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // 1. Lọc theo tab trạng thái
        if (selectedStatusTab !== "ALL") {
          if (selectedStatusTab === "PENDING" && o.status !== "PENDING") return false;
          if (
            selectedStatusTab === "SURVEY" &&
            !["SURVEY_ASSIGNED", "ACCEPTED", "SURVEYING"].includes(o.status)
          )
            return false;
          if (
            selectedStatusTab === "QUOTE" &&
            o.status !== "WAITING_ADMIN_QUOTE"
          )
            return false;
          if (
            selectedStatusTab === "CONTRACT" &&
            ![
              "CUSTOMER_ACCEPTED_QUOTE",
              "WAITING_CONTRACT_APPROVAL",
              "WAITING_CUSTOMER_SIGNATURE",
            ].includes(o.status)
          )
            return false;
          if (
            selectedStatusTab === "DEPOSIT" &&
            !["WAITING_DEPOSIT", "DEPOSIT_CONFIRMED"].includes(o.status)
          )
            return false;
          if (
            selectedStatusTab === "PROGRESS" &&
            !["ASSIGNED", "PROCESSING"].includes(o.status)
          )
            return false;
          if (
            selectedStatusTab === "ACCEPTANCE" &&
            o.status !== "WORKER_COMPLETED"
          )
            return false;
          if (
            selectedStatusTab === "COMPLETED" &&
            !["COMPLETED", "FULLY_PAID", "PAID_TO_STAFF"].includes(o.status)
          )
            return false;
          if (
            selectedStatusTab === "CANCELLED" &&
            !["CANCELLED", "WORKER_REJECTED"].includes(o.status)
          )
            return false;
        }

        // 2. Lọc theo quận/huyện
        if (selectedDistrict) {
          const parsed = parseHanoiAddress(o.address);
          const cleanSelected = selectedDistrict
            .replace("Quận ", "")
            .replace("Huyện ", "")
            .replace("Thị xã ", "")
            .toLowerCase();
          const cleanAddress = (o.address || "").toLowerCase();
          if (
            !cleanAddress.includes(cleanSelected) &&
            (!parsed.district ||
              !parsed.district.toLowerCase().includes(cleanSelected))
          ) {
            return false;
          }
        }

        // 3. Lọc theo dịch vụ
        if (selectedService) {
          const target = selectedService.toLowerCase();
          const sServices = getOrderServices(o);
          const hasServiceMatch = sServices.some((sn) =>
            sn.toLowerCase().includes(target)
          ) || String(o.serviceId) === selectedService || (o.bookingServices || []).some(s => String(s.serviceId) === selectedService);
          if (!hasServiceMatch) return false;
        }

        // 4. Tìm kiếm từ khóa
        if (searchTerm.trim()) {
          const term = searchTerm.trim().toLowerCase();
          const matchId = String(o.id).includes(term) || `#${o.id}`.includes(term);
          const matchCustomer =
            o.customerName?.toLowerCase().includes(term) ||
            o.customer?.username?.toLowerCase().includes(term) ||
            o.customerPhone?.includes(term) ||
            o.customer?.phoneNumber?.includes(term);
          const matchSupervisor =
            o.supervisorName?.toLowerCase().includes(term) ||
            o.surveyorName?.toLowerCase().includes(term);
          const orderTechs = getOrderTechnicians(o);
          const matchTechnician = orderTechs.some((tn) =>
            tn.toLowerCase().includes(term)
          );
          const matchAddress = o.address?.toLowerCase().includes(term);
          const orderServices = getOrderServices(o);
          const matchService = orderServices.some((sn) =>
            sn.toLowerCase().includes(term)
          );

          if (
            !matchId &&
            !matchCustomer &&
            !matchSupervisor &&
            !matchTechnician &&
            !matchAddress &&
            !matchService
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "oldest") {
          return (a.id || 0) - (b.id || 0);
        }
        if (sortOrder === "price_desc") {
          return (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0);
        }
        if (sortOrder === "price_asc") {
          return (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0);
        }
        // default newest
        return (b.id || 0) - (a.id || 0);
      });
  }, [
    orders,
    selectedStatusTab,
    selectedDistrict,
    selectedService,
    searchTerm,
    sortOrder,
  ]);

  // Reset trang khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatusTab, selectedDistrict, selectedService, searchTerm, sortOrder]);

  // Phân trang
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const hasActiveFilters =
    selectedStatusTab !== "ALL" ||
    selectedDistrict !== "" ||
    selectedService !== "" ||
    searchTerm !== "" ||
    sortOrder !== "newest";

  const handleResetFilters = () => {
    setSelectedStatusTab("ALL");
    setSelectedDistrict("");
    setSelectedService("");
    setSearchTerm("");
    setSortOrder("newest");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <DashboardHeader
        title="Quản Lý Yêu Cầu / Đơn Hàng"
        subtitle="Theo dõi toàn bộ vòng đời công trình, điều phối nhân sự, duyệt báo giá & hợp đồng."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* 4 Cards Thống Kê Tổng Quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Tổng số yêu cầu
            </span>
            <div className="text-3xl font-black text-slate-900">{counts.total}</div>
            <span className="text-[11px] text-slate-500 font-medium">Toàn bộ hồ sơ trên hệ thống</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-black shrink-0">
            📋
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition border-l-4 border-l-amber-500">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
              Chờ tiếp nhận &amp; Khảo sát
            </span>
            <div className="text-3xl font-black text-amber-600">
              {counts.pending + counts.surveyAssigned}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {counts.pending} đơn mới chưa gán GS
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black shrink-0">
            ⏳
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition border-l-4 border-l-indigo-500">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
              Báo giá &amp; Ký HĐ, Cọc
            </span>
            <div className="text-3xl font-black text-indigo-700">
              {counts.waitingQuote + counts.waitingContract + counts.waitingDeposit + counts.depositConfirmed}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {counts.depositConfirmed} đơn đã cọc chờ thợ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-black shrink-0">
            ✍️
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition border-l-4 border-l-emerald-600">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Đang thi công &amp; Xong
            </span>
            <div className="text-3xl font-black text-emerald-600">
              {counts.inProgress + counts.completed}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {counts.completed} đơn đã hoàn tất
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black shrink-0">
            🛠️
          </div>
        </div>
      </div>

      {/* Tabs Chuyển Nhanh Trạng Thái (Status Pills) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setSelectedStatusTab("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
          >
            <span>Tất cả</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedStatusTab === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("PENDING")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "PENDING"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
              }`}
          >
            <span>Chờ tiếp nhận</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-amber-100 text-amber-800">
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("SURVEY")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "SURVEY"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
          >
            <span>Đang khảo sát</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-blue-100 text-blue-800">
              {counts.surveyAssigned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("QUOTE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "QUOTE"
              ? "bg-amber-700 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-800"
              }`}
          >
            <span>Chờ gửi báo giá</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-amber-100 text-amber-900 font-black">
              {counts.waitingQuote}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("DEPOSIT")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "DEPOSIT"
              ? "bg-teal-700 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
          >
            <span>Ký HĐ &amp; Cọc</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-teal-100 text-teal-800 font-bold">
              {counts.waitingDeposit + counts.depositConfirmed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("PROGRESS")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "PROGRESS"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
          >
            <span>Đang thi công</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-indigo-100 text-indigo-800">
              {counts.inProgress}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("ACCEPTANCE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "ACCEPTANCE"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
          >
            <span>Nghiệm thu</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-emerald-100 text-emerald-800">
              {counts.workerCompleted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("COMPLETED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
          >
            <span>Hoàn thành</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-emerald-100 text-emerald-800">
              {counts.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("CANCELLED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedStatusTab === "CANCELLED"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
              }`}
          >
            <span>Đã hủy</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-rose-100 text-rose-800">
              {counts.cancelled}
            </span>
          </button>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Bộ Lọc Đa Chiều */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Ô tìm kiếm chính */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo #Mã đơn, Tên khách, SĐT, Địa chỉ, Thợ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Lọc theo Quận/Huyện Hà Nội */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium cursor-pointer"
            >
              <option value="">Tất cả Quận / Huyện (HN)</option>
              {HANOI_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Lọc theo Dịch vụ */}
          <div>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium cursor-pointer"
            >
              <option value="">Tất cả loại Dịch vụ</option>
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sắp xếp */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="price_desc">Giá trị cao nhất</option>
              <option value="price_asc">Giá trị thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Thanh công cụ phụ: Nút Làm mới, Reset bộ lọc & Chuyển đổi View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>
              Tìm thấy <strong className="text-slate-900">{filteredOrders.length}</strong> yêu cầu phù hợp
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span>{refreshing ? "Đang tải..." : "Làm mới"}</span>
            </button>

            {/* Switch View Mode */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
                title="Xem dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
                title="Xem dạng thẻ lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner />
      ) : paginatedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto text-2xl font-black">
            🔍
          </div>
          <h3 className="font-bold text-slate-900 text-base">Không tìm thấy yêu cầu nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Không có đơn hàng nào khớp với các tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
            >
              Xóa toàn bộ bộ lọc
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* =================================================================== */
        /* 1. DẠNG BẢNG CHI TIẾT (TABLE VIEW)                                 */
        /* =================================================================== */
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Đơn hàng &amp; Dịch vụ</th>
                  <th className="py-3.5 px-5">Khách hàng</th>
                  <th className="py-3.5 px-5">Công trình &amp; Khu vực</th>
                  <th className="py-3.5 px-5">Dự toán &amp; Nhân sự</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedOrders.map((o) => {
                  const parsed = parseHanoiAddress(o.address);
                  const srvName = o.serviceName || o.service?.name || "Sơn nhà";
                  const hasDeposit =
                    o.paymentStatus === "DEPOSIT_PAID" ||
                    o.paymentStatus === "FULLY_PAID" ||
                    o.depositPaid;

                  const supName = o.supervisorName || o.supervisor?.username || o.surveyorName;
                  const techList = getOrderTechnicians(o);
                  const orderServices = getOrderServices(o);
                  const firstService = orderServices[0] || "Sơn nhà";

                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/admin/bookings/${o.id}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      {/* 1. Mã đơn & Dịch vụ */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="flex items-center gap-1.5 font-bold flex-wrap">
                          <span className="font-mono text-slate-900 group-hover:text-emerald-700 transition">
                            #{o.id}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-800 truncate max-w-[150px]">
                            {firstService}
                          </span>
                          {orderServices.length > 1 && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                              +{orderServices.length - 1} gói
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Ngày tạo: {o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </div>
                      </td>

                      {/* 2. Khách hàng */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="font-bold text-slate-900 truncate">
                          {o.customerName || o.customer?.fullName || o.customer?.username || "Khách vãng lai"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{o.customerPhone || o.customer?.phoneNumber || "—"}</span>
                        </div>
                      </td>

                      {/* 3. Địa chỉ & Khu vực */}
                      <td className="py-3.5 px-5 align-top max-w-xs">
                        <div className="text-slate-700 font-medium text-xs truncate" title={o.address}>
                          {o.address || "—"}
                        </div>
                        {parsed.district && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{parsed.district}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Dự toán & Nhân sự */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="font-black text-slate-900 text-xs">
                          {Number(o.totalAmount) > 0 ? (
                            <span className="font-mono text-emerald-700">{formatMoney(o.totalAmount)} {hasDeposit ? "(Đã cọc)" : ""}</span>
                          ) : (
                            <span className="text-slate-400 italic font-normal text-[11px]">Chưa báo giá</span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5 space-x-1.5 flex flex-wrap items-center gap-y-0.5">
                          <span>GS: <strong className={supName ? "text-blue-900" : "text-amber-700"}>{supName ? `@${supName}` : "Chưa gán"}</strong></span>
                          <span>·</span>
                          <span>
                            Thợ:{" "}
                            {techList.length > 0 ? (
                              <strong className="text-emerald-900 font-semibold" title={techList.join(", ")}>
                                {techList.map((t) => `@${t}`).join(", ")}
                              </strong>
                            ) : (
                              <strong className="text-slate-400 font-normal">Chưa gán</strong>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* 5. Trạng thái */}
                      <td className="py-3.5 px-5 align-top">
                        <StatusBadge status={o.status} />
                      </td>

                      {/* 6. Hành động */}
                      <td className="py-3.5 px-5 text-right align-top whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* 2. DẠNG THẺ LƯỚI HIỆN ĐẠI (GRID CARDS VIEW)                        */
        /* =================================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedOrders.map((o) => {
              const parsed = parseHanoiAddress(o.address);
              const srvName = o.serviceName || o.service?.name || "Sơn nhà";
              const hasDeposit =
                o.paymentStatus === "DEPOSIT_PAID" ||
                o.paymentStatus === "FULLY_PAID" ||
                o.depositPaid;

              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/admin/bookings/${o.id}`)}
                  className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div className="space-y-4">
                    {/* Top Header của Card */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition">
                            #{o.id}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 truncate max-w-[130px]">
                            {srvName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tạo ngày {o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </div>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    {/* Khách hàng & Địa chỉ */}
                    <div className="space-y-2.5 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">
                            {o.customerName || o.customer?.fullName || o.customer?.username || "Khách vãng lai"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {o.customerPhone || o.customer?.phoneNumber || "Chưa có SĐT"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-1">
                          <p className="text-slate-800 font-medium leading-relaxed line-clamp-2">
                            {o.address || "Chưa có địa chỉ"}
                          </p>
                          {parsed.district && (
                            <span className="inline-block text-[10px] font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">
                              {parsed.district}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nhân sự & Dự toán */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Giám sát</span>
                        <div className="font-bold text-slate-900 truncate text-[11.5px]">
                          {o.supervisorName || o.supervisor?.username ? (
                            `@${o.supervisorName || o.supervisor?.username}`
                          ) : (
                            <span className="text-amber-700 font-semibold text-[10.5px]">Chưa gán GS</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Đội thợ</span>
                        <div className="font-bold text-slate-900 truncate text-[11.5px]">
                          {getOrderTechnicians(o).length > 0 ? (
                            getOrderTechnicians(o).map((t) => `@${t}`).join(", ")
                          ) : (
                            <span className="text-slate-400 italic text-[10.5px]">Chưa gán thợ</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dự toán tổng tiền */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Tổng dự toán:</span>
                      <span className="font-black text-slate-900 text-sm">
                        {Number(o.totalAmount) > 0 ? formatMoney(o.totalAmount) : "Chưa báo giá"}
                      </span>
                    </div>
                  </div>

                  {/* Nút Xem chi tiết & Điều phối */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/bookings/${o.id}`);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-white" />
                      <span>Xem Chi Tiết &amp; Điều Phối</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
}