import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import { formatMoney } from "../../util/formatters";
import { formatDate } from "../../util/orderFlowUtils";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  FileText,
  User,
  ShieldCheck,
  CreditCard,
  PlusCircle,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Layers,
  Paintbrush,
  FileSignature,
  CheckCircle2,
  Star,
} from "lucide-react";
import ReviewModal from "../../components/review/ReviewModal";

export default function CustomerOngoing() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewsMap, setReviewsMap] = useState({});
  const itemsPerPage = 6;

  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [bookingsRes, reviewsRes] = await Promise.all([
          AxiosConfig.get("/bookings/me"),
          AxiosConfig.get("/reviews/me").catch(() => ({ data: [] })),
        ]);
        const data = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        setBookings(data);

        const reviewsList = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
        const map = {};
        reviewsList.forEach((r) => {
          if (r.bookingId) {
            map[r.bookingId] = r;
          }
        });
        setReviewsMap(map);

        if (isRefresh) showToast?.("Đã làm mới danh sách đơn hàng!", "success");
      } catch (error) {
        console.error("Load ongoing bookings error:", error);
        showToast?.("Không thể tải danh sách yêu cầu dịch vụ!", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );


  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Hủy đơn khi đang ở trạng thái PENDING
  const handleCancelBooking = (bookingId) => {
    setConfirmDialog({
      title: "Xác nhận hủy yêu cầu",
      message: "Bạn có chắc chắn muốn hủy yêu cầu dịch vụ sơn sửa này không?",
      onConfirm: async () => {
        try {
          await AxiosConfig.put(`/bookings/${bookingId}`, {
            status: "CANCELLED",
          });
          showToast?.("Đã hủy yêu cầu thành công!", "success");
          loadBookings();
        } catch (error) {
          showToast?.(error.response?.data?.message || "Không thể hủy yêu cầu!", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  // Đếm số lượng theo nhóm trạng thái
  const counts = useMemo(() => {
    const list = bookings || [];
    const survey = list.filter((b) =>
      ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "WAITING_ADMIN_QUOTE"].includes(b.status)
    ).length;
    const contract = list.filter((b) =>
      [
        "WAITING_CUSTOMER_SIGNATURE",
        "WAITING_CUSTOMER_QUOTE_APPROVAL",
        "CUSTOMER_ACCEPTED_QUOTE",
        "WAITING_CONTRACT_APPROVAL",
        "WAITING_DEPOSIT",
        "DEPOSIT_CONFIRMED",
      ].includes(b.status)
    ).length;
    const processing = list.filter((b) => ["ASSIGNED", "PROCESSING"].includes(b.status)).length;
    const acceptance = list.filter((b) =>
      ["WORKER_COMPLETED", "WAITING_FINAL_PAYMENT"].includes(b.status)
    ).length;
    const completed = list.filter((b) =>
      ["COMPLETED", "PAID_TO_STAFF"].includes(b.status)
    ).length;
    const cancelled = list.filter((b) =>
      ["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"].includes(b.status)
    ).length;
    return { total: list.length, survey, contract, processing, acceptance, completed, cancelled };
  }, [bookings]);

  // Lọc & Tìm kiếm
  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (b) =>
          String(b.id).includes(q) ||
          (b.serviceName || b.service?.name || "").toLowerCase().includes(q) ||
          (b.address || "").toLowerCase().includes(q) ||
          (b.supervisorName || "").toLowerCase().includes(q) ||
          (b.technicianName || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      if (statusFilter === "SURVEY") {
        list = list.filter((b) =>
          ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "WAITING_ADMIN_QUOTE"].includes(b.status)
        );
      } else if (statusFilter === "CONTRACT") {
        list = list.filter((b) =>
          [
            "WAITING_CUSTOMER_SIGNATURE",
            "WAITING_CUSTOMER_QUOTE_APPROVAL",
            "CUSTOMER_ACCEPTED_QUOTE",
            "WAITING_CONTRACT_APPROVAL",
            "WAITING_DEPOSIT",
            "DEPOSIT_CONFIRMED",
          ].includes(b.status)
        );
      } else if (statusFilter === "PROCESSING") {
        list = list.filter((b) => ["ASSIGNED", "PROCESSING"].includes(b.status));
      } else if (statusFilter === "ACCEPTANCE") {
        list = list.filter((b) =>
          ["WORKER_COMPLETED", "WAITING_FINAL_PAYMENT"].includes(b.status)
        );
      } else if (statusFilter === "COMPLETED") {
        list = list.filter((b) =>
          ["COMPLETED", "PAID_TO_STAFF"].includes(b.status)
        );
      } else if (statusFilter === "CANCELLED") {
        list = list.filter((b) =>
          ["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"].includes(b.status)
        );
      }
    }

    return list.sort((a, b) => Number(b.id) - Number(a.id));
  }, [bookings, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-black text-slate-900">
              Quản Lý Yêu Cầu &amp; Lịch Sử Công Trình
            </h1>
            <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {bookings.length} đơn
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi toàn bộ tiến độ từ khảo sát, ký HĐ &amp; cọc, thi công đến nghiệm thu và lịch sử hoàn tất.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/customer/booking")}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Đặt dịch vụ mới</span>
          </button>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={refreshing}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#1E3A8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Category Stage Cards Selector */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {[
            {
              key: "ALL",
              label: "Tất cả yêu cầu",
              step: "Tất cả",
              Icon: Layers,
              count: counts.total,
              activeCls: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-emerald-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-slate-100 text-slate-700",
              color: "text-slate-600",
            },
            {
              key: "SURVEY",
              label: "1. Khảo sát",
              step: "Giai đoạn 1",
              Icon: Calendar,
              count: counts.survey,
              activeCls: "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-blue-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-blue-50 text-blue-700 border border-blue-100",
              color: "text-blue-600",
            },
            {
              key: "CONTRACT",
              label: "2. Ký HĐ & Cọc",
              step: "Giai đoạn 2",
              Icon: FileSignature,
              count: counts.contract,
              activeCls: "bg-amber-600 text-white shadow-lg shadow-amber-600/20 border-amber-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-amber-50 text-amber-800 border border-amber-200",
              color: "text-amber-600",
              alert: counts.contract > 0,
            },
            {
              key: "PROCESSING",
              label: "3. Đang thi công",
              step: "Giai đoạn 3",
              Icon: Paintbrush,
              count: counts.processing,
              activeCls: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border-indigo-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-indigo-50 text-indigo-700 border border-indigo-100",
              color: "text-indigo-600",
            },
            {
              key: "ACCEPTANCE",
              label: "4. Nghiệm thu",
              step: "Giai đoạn 4",
              Icon: ShieldCheck,
              count: counts.acceptance,
              activeCls: "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20 border-cyan-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-cyan-50 text-cyan-700 border border-cyan-100",
              color: "text-cyan-600",
            },
            {
              key: "COMPLETED",
              label: "5. Hoàn thành",
              step: "Lịch sử",
              Icon: CheckCircle2,
              count: counts.completed,
              activeCls: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-emerald-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: counts.completed > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500",
              color: "text-emerald-600",
            },
            {
              key: "CANCELLED",
              label: "6. Đã từ chối / Hủy",
              step: "Đơn dừng",
              Icon: XCircle,
              count: counts.cancelled,
              activeCls: "bg-rose-600 text-white shadow-lg shadow-rose-600/20 border-rose-600",
              inactiveCls: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: counts.cancelled > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-500",
              color: "text-rose-600",
              danger: true,
            },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 cursor-pointer relative overflow-hidden group ${isActive ? tab.activeCls : tab.inactiveCls
                  }`}
              >
                {tab.alert && !isActive && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}

                <div className="flex items-center justify-between gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 group-hover:bg-slate-200/80 " + tab.color
                      }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[11px] font-black px-1.5 py-0.2 rounded-full ${isActive ? tab.badgeActive : tab.badgeInactive
                      }`}
                  >
                    {tab.count}
                  </span>
                </div>

                <div>
                  <span
                    className={`text-[9.5px] font-semibold block uppercase tracking-wider ${isActive ? "text-white/70" : "text-slate-400"
                      }`}
                  >
                    {tab.step}
                  </span>
                  <span
                    className={`text-xs font-bold block truncate leading-tight mt-0.5 ${isActive ? "text-white" : "text-slate-800"
                      }`}
                  >
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Micro Filter Info */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo #Mã đơn, dịch vụ, địa chỉ, thợ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto">
            <span>
              Tìm thấy: <strong className="text-slate-900">{filteredBookings.length}</strong> đơn
            </span>
            {(statusFilter !== "ALL" || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer ml-1"
              >
                (Xóa bộ lọc)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Card List */}
      {loading ? (
        <LoadingSpinner />
      ) : paginatedBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h3 className="font-bold text-slate-800 text-base">Không có công trình nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bạn hiện chưa có yêu cầu nào trong danh mục này hoặc không khớp với tiêu chí tìm kiếm.
          </p>
          <button
            type="button"
            onClick={() => navigate("/customer/booking")}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-xs hover:bg-emerald-700 transition"
          >
            Đăng ký khảo sát công trình mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedBookings.map((b) => {
            const isDepositPaid =
              b.depositPaid ||
              b.paymentStatus === "DEPOSIT_PAID" ||
              ["DEPOSIT_CONFIRMED", "ASSIGNED", "PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT", "COMPLETED"].includes(
                b.status
              );
            const total = Number(b.totalAmount) || 0;
            const deposit = b.depositAmount ? Number(b.depositAmount) : total * 0.3;

            return (
              <div
                key={b.id}
                onClick={() => navigate(`/customer/bookings/${b.id}`)}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div>
                  {/* Card Header: Mã đơn & Trạng thái */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm group-hover:text-emerald-700 transition">
                          #{b.id}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-[130px]">
                          {b.serviceName || b.service?.name || "Sơn sửa nhà"}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Tạo ngày: {formatDate(b.createdAt || b.appointmentDate)}</span>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  {/* Thông tin chính ngắn gọn */}
                  <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-800 font-medium line-clamp-2 leading-snug">
                        {b.address || "Chưa có địa chỉ"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Hẹn KS: <strong className="text-slate-900">{formatDate(b.appointmentDate)} ({b.appointmentTime || "08:00"})</strong>
                      </span>
                    </div>

                    {total > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Tổng dự toán:</span>
                        <span className="font-black text-slate-900 text-sm">
                          {formatMoney(total)}
                        </span>
                      </div>
                    )}

                    {/* Nhân sự phụ trách nếu có */}
                    {(b.supervisorName || b.technicianName) && (
                      <div className="pt-1.5 border-t border-slate-200/60 space-y-1 text-[11px]">
                        {b.supervisorName && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Giám sát:</span>
                            <span className="font-bold text-blue-900">@{b.supervisorName}</span>
                          </div>
                        )}
                        {b.technicianName && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Đội thợ:</span>
                            <span className="font-bold text-emerald-900">@{b.technicianName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lý do hủy / từ chối nếu có */}
                    {["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"].includes(b.status) && (
                      <div className="pt-2 border-t border-rose-100/80 text-[11px] text-rose-700 bg-rose-50/70 p-2.5 rounded-xl space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Đã từ chối báo giá / Hủy đơn</span>
                        </span>
                        {b.description && b.description.includes("[Khách hàng từ chối báo giá") ? (
                          <p className="text-slate-600 line-clamp-2 mt-0.5">
                            Lý do: {b.description.split("[Khách hàng từ chối báo giá").pop().replace(/^[^\]]*\]:\s*/, "")}
                          </p>
                        ) : (
                          <p className="text-slate-500 mt-0.5">Yêu cầu dịch vụ đã kết thúc.</p>
                        )}
                      </div>
                    )}

                    {/* Badge hoàn tất thi công & nghiệm thu */}
                    {["COMPLETED", "PAID_TO_STAFF"].includes(b.status) && (
                      <div className="pt-2 border-t border-emerald-100/80 text-[11px] text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl flex items-center justify-between">
                        {reviewsMap[b.id] ? (
                          <span className="font-bold flex items-center gap-1 text-emerald-800">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            <span>Đã đánh giá: <strong className="text-amber-700 font-black">{reviewsMap[b.id].rating}★</strong></span>
                          </span>
                        ) : (
                          <span className="font-bold flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Đã hoàn tất &amp; nghiệm thu</span>
                          </span>
                        )}
                        <span className="font-black text-emerald-700">{formatMoney(total)}</span>
                      </div>
                    )}

                    {/* Badge chờ duyệt báo giá */}
                    {["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(b.status) && (
                      <div className="pt-2 border-t border-amber-100/80 text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded-xl flex items-center justify-between">
                        <span className="font-bold">📄 Báo giá sẵn sàng ký</span>
                        <span className="font-black text-amber-700">{formatMoney(total)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Nút Xem chi tiết & Hủy đơn nếu PENDING */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {b.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(b.id);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Hủy đơn
                    </button>
                  )}

                  <div className="flex-1" />

                  {["COMPLETED", "PAID_TO_STAFF"].includes(b.status) && (
                    reviewsMap[b.id] ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewModalBooking(b);
                        }}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Bấm để xem lại hoặc sửa đánh giá"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Đánh giá lại ({reviewsMap[b.id].rating}★)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewModalBooking(b);
                        }}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Đánh giá thợ</span>
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customer/bookings/${b.id}`);
                    }}
                    className={`px-4 py-2 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer ${["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(b.status)
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                        : ["COMPLETED", "PAID_TO_STAFF"].includes(b.status)
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : b.status === "CANCELLED"
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                  >
                    <span>
                      {["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(b.status)
                        ? "Duyệt báo giá & Ký HĐ"
                        : "Xem chi tiết"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={Boolean(reviewModalBooking)}
        onClose={() => setReviewModalBooking(null)}
        booking={reviewModalBooking}
        existingReview={reviewModalBooking ? reviewsMap[reviewModalBooking.id] : null}
        showToast={showToast}
        onSuccess={() => {
          showToast?.("Đã lưu đánh giá thành công!", "success");
          loadBookings(true);
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
      />
    </div>
  );

}

