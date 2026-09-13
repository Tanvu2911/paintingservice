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
  XCircle,
  AlertTriangle,
  Layers,
  Paintbrush,
  FileSignature,
  CheckCircle2,
  Star,
  Check,
  Phone,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import ReviewModal from "../../components/review/ReviewModal";

const STAGE_TABS = [
  { key: "ALL", label: "Tất cả", icon: Layers },
  { key: "SURVEY", label: "1. Khảo sát", icon: Calendar },
  { key: "CONTRACT", label: "2. Ký HĐ & Cọc", icon: FileSignature, alertKey: "contract" },
  { key: "PROCESSING", label: "3. Đang thi công", icon: Paintbrush },
  { key: "ACCEPTANCE", label: "4. Chờ nghiệm thu", icon: ShieldCheck },
  { key: "COMPLETED", label: "5. Hoàn thành", icon: CheckCircle2 },
  { key: "CANCELLED", label: "Đã hủy", icon: XCircle },
];

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
      message: "Bạn có chắc chắn muốn hủy yêu cầu khảo sát công trình này không?",
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
    return {
      ALL: list.length,
      SURVEY: survey,
      CONTRACT: contract,
      PROCESSING: processing,
      ACCEPTANCE: acceptance,
      COMPLETED: completed,
      CANCELLED: cancelled,
    };
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

  // Helper tính giai đoạn 1 -> 4 cho thanh tiến trình
  const getStageNumber = (status) => {
    if (["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "WAITING_ADMIN_QUOTE"].includes(status)) return 1;
    if (["WAITING_CUSTOMER_SIGNATURE", "WAITING_CUSTOMER_QUOTE_APPROVAL", "CUSTOMER_ACCEPTED_QUOTE", "WAITING_CONTRACT_APPROVAL", "WAITING_DEPOSIT", "DEPOSIT_CONFIRMED"].includes(status)) return 2;
    if (["ASSIGNED", "PROCESSING"].includes(status)) return 3;
    if (["WORKER_COMPLETED", "WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(status)) return 4;
    return 0; // Cancelled
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Công Trình &amp; Lịch Sử
            </h1>
            <span className="text-xs font-black text-[#1E3A8A] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {bookings.length} hồ sơ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10.5">
            Theo dõi chặt chẽ từng chặng: Khảo sát tận nơi → Ký hợp đồng &amp; cọc 30% → Nhật ký thi công → Nghiệm thu &amp; Bảo hành.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate("/customer/booking")}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl text-xs transition shadow-sm shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Đăng ký mới</span>
          </button>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#1E3A8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Unified Stage Tabs Navigation */}
      <div className="bg-white p-2 sm:p-2.5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {STAGE_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            const count = counts[tab.key] || 0;
            const Icon = tab.icon;
            const showAlert = tab.alertKey === "contract" && count > 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative shrink-0 ${
                  isActive
                    ? "bg-[#1E3A8A] text-white shadow-sm shadow-[#1E3A8A]/30 font-black"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : count > 0
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {count}
                </span>

                {showAlert && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-2 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Quick Info Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo #Mã đơn, dịch vụ, địa chỉ, tên thợ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition font-medium"
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
            Tìm thấy: <strong className="text-slate-900">{filteredBookings.length}</strong> công trình
          </span>
          {(statusFilter !== "ALL" || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer ml-1"
            >
              (Xem tất cả)
            </button>
          )}
        </div>
      </div>

      {/* 4. Projects Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Đang tải danh sách công trình..." />
      ) : paginatedBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#1E3A8A] rounded-3xl flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h3 className="font-black text-slate-900 text-base">Không có công trình nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Bạn hiện chưa có yêu cầu nào trong danh mục này hoặc không khớp với từ khóa tìm kiếm.
          </p>
          <button
            type="button"
            onClick={() => navigate("/customer/booking")}
            className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Đăng ký khảo sát công trình mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBookings.map((b) => {
            const total = Number(b.totalAmount) || 0;
            const deposit = b.depositAmount ? Number(b.depositAmount) : total * 0.3;
            const stage = getStageNumber(b.status);

            const isPendingSignature = ["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(b.status);
            const isWaitingDeposit = b.status === "WAITING_DEPOSIT";
            const isCompleted = ["COMPLETED", "PAID_TO_STAFF"].includes(b.status);
            const isCancelled = ["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"].includes(b.status);
            const isProcessing = ["PROCESSING", "ASSIGNED"].includes(b.status);

            return (
              <div
                key={b.id}
                onClick={() => navigate(`/customer/bookings/${b.id}`)}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between p-5 shadow-xs hover:shadow-md cursor-pointer group relative ${
                  isPendingSignature
                    ? "border-amber-300 ring-2 ring-amber-400/20"
                    : isProcessing
                      ? "border-blue-200"
                      : "border-slate-200/90 hover:border-[#1E3A8A]/40"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Code, Service, Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm group-hover:text-[#1E3A8A] transition-colors">
                          #{b.id}
                        </span>
                        <span className="text-[11px] font-bold text-[#1E3A8A] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 truncate max-w-[150px]">
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

                  {/* 4-Stage Mini Progress Indicator */}
                  {!isCancelled && (
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                        <span className={stage >= 1 ? "text-[#1E3A8A] font-black" : ""}>1. Khảo sát</span>
                        <span className={stage >= 2 ? "text-[#1E3A8A] font-black" : ""}>2. Ký HĐ &amp; Cọc</span>
                        <span className={stage >= 3 ? "text-[#1E3A8A] font-black" : ""}>3. Thi công</span>
                        <span className={stage >= 4 ? "text-emerald-600 font-black" : ""}>4. Hoàn tất</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-colors ${
                              step < stage
                                ? "bg-[#1E3A8A]"
                                : step === stage
                                  ? "bg-amber-400"
                                  : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Information Box */}
                  <div className="space-y-2 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0 mt-0.5" />
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
                        <span className="text-slate-500 font-medium">Tổng chi phí thi công:</span>
                        <span className="font-black text-slate-900 text-sm">
                          {formatMoney(total)}
                        </span>
                      </div>
                    )}

                    {/* Assigned Personnel */}
                    {(b.supervisorName || b.technicianName) && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px]">
                        {b.supervisorName && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Giám sát viên:</span>
                            <span className="font-bold text-[#1E3A8A]">@{b.supervisorName}</span>
                          </div>
                        )}
                        {b.technicianName && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Đội thợ thi công:</span>
                            <span className="font-bold text-emerald-800">@{b.technicianName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion or Review Highlight */}
                    {isCompleted && (
                      <div className="pt-2 border-t border-emerald-100 text-[11px] text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl flex items-center justify-between">
                        {reviewsMap[b.id] ? (
                          <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                            <span>Đã đánh giá: <strong className="text-amber-700 font-black">{reviewsMap[b.id].rating}★</strong></span>
                          </span>
                        ) : (
                          <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Đã nghiệm thu hoàn tất</span>
                          </span>
                        )}
                        <span className="font-black text-emerald-700">{formatMoney(total)}</span>
                      </div>
                    )}

                    {/* Cancelled Notice */}
                    {isCancelled && (
                      <div className="pt-2 border-t border-rose-100 text-[11px] text-rose-700 bg-rose-50/80 p-2.5 rounded-xl space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Yêu cầu đã kết thúc</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action CTA */}
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-3">
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

                  {isCompleted && (
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
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Xem đánh giá ({reviewsMap[b.id].rating}★)</span>
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
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
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
                    className={`px-4 py-2 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      isPendingSignature
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20"
                        : isWaitingDeposit
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : isProcessing
                            ? "bg-[#1E3A8A] hover:bg-[#1e40af] text-white"
                            : isCompleted
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    <span>
                      {isPendingSignature
                        ? "Duyệt báo giá & Ký HĐ"
                        : isWaitingDeposit
                          ? "Thanh toán cọc 30%"
                          : isProcessing
                            ? "Xem tiến độ thi công"
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

      {/* 5. Pagination */}
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
