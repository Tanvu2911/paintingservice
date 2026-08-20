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
} from "lucide-react";

export default function CustomerOngoing() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await AxiosConfig.get("/bookings/me");
        const data = Array.isArray(response.data) ? response.data : [];
        // Lọc các đơn đang tiến hành (chưa hoàn thành và chưa hủy)
        const ongoing = data.filter(
          (b) => b.status !== "COMPLETED" && b.status !== "CANCELLED"
        );
        setBookings(ongoing);
        if (isRefresh) showToast?.("Đã làm mới danh sách đơn hàng!", "success");
      } catch (error) {
        console.error("Load ongoing bookings error:", error);
        showToast?.("Không thể tải danh sách yêu cầu đang thực hiện!", "error");
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
            "CUSTOMER_ACCEPTED_QUOTE",
            "WAITING_CONTRACT_APPROVAL",
            "WAITING_CUSTOMER_SIGNATURE",
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-black text-slate-900">
              Công Trình Đang Thực Hiện
            </h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {bookings.length} đơn
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi tiến độ khảo sát, ký hợp đồng, nhật ký thi công và nghiệm thu thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/customer/booking")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đặt dịch vụ mới</span>
          </button>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Status Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
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

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "SURVEY", label: "1. Khảo sát" },
              { key: "CONTRACT", label: "2. Hợp đồng & Cọc" },
              { key: "PROCESSING", label: "3. Đang thi công" },
              { key: "ACCEPTANCE", label: "4. Nghiệm thu & Tất toán" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customer/bookings/${b.id}`);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
                  >
                    <span>Xem chi tiết</span>
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
