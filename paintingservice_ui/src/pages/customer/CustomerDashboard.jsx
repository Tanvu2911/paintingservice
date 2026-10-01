import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarPlus,
  ClipboardList,
  Wallet,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  Paintbrush,
  Calendar,
  Layers,
  ChevronRight,
  User,
} from "lucide-react";
import useBookingHistory from "../../hooks/useBookingHistory";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import { formatMoney } from "../../util/formatters";
import { formatDate } from "../../util/orderFlowUtils";

export default function CustomerDashboard() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();
  const { bookings, stats, loading } = useBookingHistory("customer", showToast);

  if (loading) return <LoadingSpinner message="Đang tải dữ liệu tổng quan..." />;

  // Tìm công trình đang hoạt động (chưa hoàn thành hoặc chưa hủy)
  const activeBookings = bookings.filter(
    (b) => !["COMPLETED", "PAID_TO_STAFF", "CANCELLED"].includes(b.status)
  );
  // Sắp xếp đơn mới nhất lên đầu
  const primaryActiveBooking = activeBookings.length > 0 ? activeBookings[0] : null;

  // Lấy 3 công trình gần nhất
  const recentBookings = [...bookings].slice(0, 3);

  // Helper gợi ý hành động tiếp theo cho đơn hàng chính
  const getActionForBooking = (booking) => {
    if (!booking) return null;
    const s = booking.status;

    if (["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(s)) {
      return {
        label: "Duyệt báo giá & Ký hợp đồng",
        badge: "Cần bạn xử lý",
        badgeCls: "bg-amber-100 text-amber-900 border-amber-300",
        btnCls: "bg-amber-500 hover:bg-amber-600 text-white",
        desc: "Dự toán chi tiết đã sẵn sàng. Mời bạn kiểm tra báo giá và ký hợp đồng trực tuyến.",
      };
    }
    if (s === "WAITING_DEPOSIT") {
      return {
        label: "Thanh toán cọc 30%",
        badge: "Chờ thanh toán cọc",
        badgeCls: "bg-amber-100 text-amber-900 border-amber-300",
        btnCls: "bg-amber-500 hover:bg-amber-600 text-white",
        desc: "Hợp đồng đã ký. Vui lòng thanh toán cọc 30% để ban quản lý điều phối đội thợ thi công.",
      };
    }
    if (["PROCESSING", "ASSIGNED"].includes(s)) {
      return {
        label: "Xem nhật ký thi công hôm nay",
        badge: "Đang thi công",
        badgeCls: "bg-blue-100 text-blue-900 border-blue-200",
        btnCls: "bg-[#1E3A8A] hover:bg-[#1e40af] text-white",
        desc: "Đội thợ đang triển khai thi công. Bạn có thể theo dõi tiến độ và hình ảnh cập nhật.",
      };
    }
    if (s === "WORKER_COMPLETED") {
      return {
        label: "Nghiệm thu & Tất toán",
        badge: "Đã xong thi công",
        badgeCls: "bg-emerald-100 text-emerald-900 border-emerald-300",
        btnCls: "bg-emerald-600 hover:bg-emerald-700 text-white",
        desc: "Đội thợ đã hoàn thành công việc. Mời bạn kiểm tra chất lượng thực tế và nghiệm thu.",
      };
    }
    if (s === "PENDING") {
      return {
        label: "Xem chi tiết yêu cầu",
        badge: "Chờ tiếp nhận",
        badgeCls: "bg-amber-100 text-amber-900 border-amber-200",
        btnCls: "bg-[#1E3A8A] hover:bg-[#1e40af] text-white",
        desc: "Hệ thống đang phân bổ chuyên viên giám sát khảo sát phù hợp nhất cho bạn.",
      };
    }
    return {
      label: "Xem chi tiết tiến độ",
      badge: "Đang xử lý",
      badgeCls: "bg-slate-100 text-slate-800 border-slate-200",
      btnCls: "bg-[#1E3A8A] hover:bg-[#1e40af] text-white",
      desc: "Chuyên viên đang phụ trách khảo sát và lên phương án thi công cho ngôi nhà của bạn.",
    };
  };

  const activeAction = getActionForBooking(primaryActiveBooking);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Greeting Banner - Clean & Focused */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E3A8A] to-[#2563eb] rounded-3xl p-6 sm:p-7 text-white shadow-md shadow-[#1E3A8A]/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-semibold text-amber-300">
              <Sparkles className="w-3 h-3" />
              <span>Dịch vụ sơn nhà chuyên nghiệp</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Xin chào, {user?.fullName || user?.username}!
            </h1>
            <p className="text-xs text-blue-100">
              Quản lý tiến độ khảo sát, hợp đồng và nhật ký thi công công trình của bạn.
            </p>
          </div>

          <Link
            to="/customer/booking"
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs rounded-2xl transition shadow-md shadow-amber-500/20 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Đăng Ký Khảo Sát Mới</span>
          </Link>
        </div>
      </div>

      {/* 2. Tiêu điểm công trình đang thực hiện (Nếu có) */}
      {primaryActiveBooking && activeAction && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Công trình đang tiến hành
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeAction.badgeCls}`}>
                {activeAction.badge}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Mã đơn:</span>
              <span className="font-mono font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                #{primaryActiveBooking.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {primaryActiveBooking.serviceName || primaryActiveBooking.service?.name || "Dịch vụ sơn sửa nhà"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                    <span className="font-medium text-slate-700 truncate max-w-lg">
                      {primaryActiveBooking.address || "Hà Nội"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={primaryActiveBooking.status} />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
                <span className="font-bold text-amber-950 block">Hành động tiếp theo:</span>
                <p className="text-amber-900 leading-relaxed font-medium mt-0.5">
                  {activeAction.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Khảo sát:{" "}
                    <strong className="text-slate-900">
                      {formatDate(primaryActiveBooking.appointmentDate)}
                    </strong>
                  </span>
                </div>

                {primaryActiveBooking.totalAmount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Dự toán:</span>
                    <strong className="text-emerald-700 font-bold font-mono">
                      {formatMoney(primaryActiveBooking.totalAmount)}
                    </strong>
                  </div>
                )}

                {primaryActiveBooking.supervisorName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>
                      Giám sát: <strong className="text-[#1E3A8A]">@{primaryActiveBooking.supervisorName}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/customer/bookings/${primaryActiveBooking.id}`)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${activeAction.btnCls}`}
              >
                <span>{activeAction.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/customer/ongoing"
                className="w-full py-2 px-3 text-center rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Xem tất cả ({bookings.length})
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Metric Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng yêu cầu
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total || bookings.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Toàn bộ hồ sơ</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Chờ tiếp nhận
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Đang sắp xếp giám sát</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
              Đang thực hiện
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Paintbrush className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">{stats.inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Khảo sát &amp; thi công</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Hoàn thành
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Đã nghiệm thu</p>
        </div>
      </div>

      {/* 4. Recent Orders Snapshot */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Yêu cầu gần đây
              </h3>
            </div>
            <Link
              to="/customer/ongoing"
              className="text-xs font-bold text-[#1E3A8A] hover:underline"
            >
              Xem tất cả ({bookings.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/customer/bookings/${b.id}`)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-2xl transition cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                    #{b.id}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#1E3A8A] transition-colors">
                        {b.serviceName || b.service?.name || "Sơn sửa nhà"}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-sm sm:max-w-md text-slate-600 font-medium">
                        {b.address || "Hà Nội"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(b.createdAt || b.appointmentDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {b.totalAmount > 0 && (
                    <span className="font-bold text-slate-900 text-xs font-mono">
                      {formatMoney(b.totalAmount)}
                    </span>
                  )}
                  <span className="text-xs font-bold text-[#1E3A8A] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    <span>Chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Quick Shortcuts */}
      <div className="grid sm:grid-cols-3 gap-3.5">
        <Link
          to="/customer/booking"
          className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-[#1E3A8A] hover:shadow-xs transition flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#1E3A8A] transition-colors truncate">
                Đăng ký khảo sát mới
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1E3A8A] transition-all shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Miễn phí 100% đo đạc &amp; tư vấn
            </p>
          </div>
        </Link>

        <Link
          to="/customer/ongoing"
          className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-[#1E3A8A] hover:shadow-xs transition flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#1E3A8A] transition-colors truncate">
                Quản lý công trình
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1E3A8A] transition-all shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {bookings.length} hồ sơ yêu cầu
            </p>
          </div>
        </Link>

        <Link
          to="/customer/wallet"
          className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-[#1E3A8A] hover:shadow-xs transition flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#1E3A8A] transition-colors truncate">
                Ví &amp; Lịch sử thanh toán
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1E3A8A] transition-all shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Theo dõi tiền cọc 30% &amp; tất toán
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
