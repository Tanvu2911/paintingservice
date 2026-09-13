import { Link, useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import {
  CalendarPlus,
  ClipboardList,
  Wallet,
  User,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Paintbrush,
  ShieldCheck,
  Phone,
  Calendar,
  Layers,
  ChevronRight,
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
        desc: "Dự toán chi tiết đã sẵn sàng. Mời bạn kiểm tra báo giá vật tư, nhân công và ký hợp đồng trực tuyến.",
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
        desc: "Đội thợ đang triển khai thi công tại công trình. Bạn có thể theo dõi tiến độ hình ảnh hàng ngày.",
      };
    }
    if (s === "WORKER_COMPLETED") {
      return {
        label: "Nghiệm thu & Tất toán",
        badge: "Đã xong thi công",
        badgeCls: "bg-emerald-100 text-emerald-900 border-emerald-300",
        btnCls: "bg-emerald-600 hover:bg-emerald-700 text-white",
        desc: "Đội thợ đã hoàn thành công việc. Mời bạn kiểm tra chất lượng thực tế và nghiệm thu công trình.",
      };
    }
    if (s === "PENDING") {
      return {
        label: "Xem chi tiết yêu cầu",
        badge: "Chờ tiếp nhận",
        badgeCls: "bg-amber-100 text-amber-900 border-amber-200",
        btnCls: "bg-[#1E3A8A] hover:bg-[#1e40af] text-white",
        desc: "Hệ thống đã nhận yêu cầu và đang phân bổ chuyên viên khảo sát phù hợp nhất cho bạn.",
      };
    }
    return {
      label: "Xem chi tiết tiến độ",
      badge: "Đang xử lý",
      badgeCls: "bg-slate-100 text-slate-800 border-slate-200",
      btnCls: "bg-[#1E3A8A] hover:bg-[#1e40af] text-white",
      desc: "Chuyên viên đang phụ trách khảo sát và lên phương án thi công tối ưu cho ngôi nhà của bạn.",
    };
  };

  const activeAction = getActionForBooking(primaryActiveBooking);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#2563eb] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-[#1E3A8A]/15">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold backdrop-blur-xs text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chào mừng trở lại Precision Paint</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Xin chào, {user?.fullName || user?.username}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Theo dõi tiến độ đo đạc, duyệt dự toán, ký hợp đồng điện tử và nhật ký thi công sơn nhà của bạn tại đây.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/customer/booking"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Đăng Ký Khảo Sát Mới</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Active Project Spotlight Card (Nổi bật công trình đang triển khai) */}
      {primaryActiveBooking && (
        <div className="bg-white rounded-3xl border-2 border-amber-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Tiêu điểm công trình đang thực hiện
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeAction.badgeCls}`}>
                {activeAction.badge}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Mã công trình:</span>
              <span className="text-xs font-black text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                #{primaryActiveBooking.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {primaryActiveBooking.serviceName || primaryActiveBooking.service?.name || "Dịch vụ sơn sửa nhà trọn gói"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                    <span className="font-medium text-slate-700 truncate max-w-lg">
                      {primaryActiveBooking.address || "Địa chỉ công trình tại Hà Nội"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={primaryActiveBooking.status} />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                <span className="font-bold text-amber-950 block">Bước tiếp theo cho bạn:</span>
                <p className="text-amber-900 leading-relaxed font-medium">
                  {activeAction.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Hẹn khảo sát:{" "}
                    <strong className="text-slate-900">
                      {formatDate(primaryActiveBooking.appointmentDate)} ({primaryActiveBooking.appointmentTime || "08:00"})
                    </strong>
                  </span>
                </div>

                {primaryActiveBooking.totalAmount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">Tổng dự toán:</span>
                    <strong className="text-emerald-700 font-black text-sm">
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

            {/* Quick CTA Box */}
            <div className="flex flex-col gap-2.5 justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => navigate(`/customer/bookings/${primaryActiveBooking.id}`)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${activeAction.btnCls}`}
              >
                <span>{activeAction.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/customer/ongoing"
                className="w-full py-2.5 px-4 text-center rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
              >
                Xem tất cả công trình ({bookings.length})
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Metric Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Thống kê công trình của bạn
          </h2>
          <Link
            to="/customer/ongoing"
            className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
          >
            <span>Chi tiết danh sách</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-[#1E3A8A]/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tổng yêu cầu
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total || bookings.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Toàn bộ hồ sơ đã tạo</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Chờ tiếp nhận
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.pending}</p>
            <p className="text-[11px] text-slate-400 mt-1">Đang sắp xếp giám sát</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Đang thực hiện
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Paintbrush className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">{stats.inProgress}</p>
            <p className="text-[11px] text-slate-400 mt-1">Khảo sát &amp; thi công</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Hoàn thành
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.completed}</p>
            <p className="text-[11px] text-slate-400 mt-1">Đã nghiệm thu trọn vẹn</p>
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Snapshot (Nếu có) */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Yêu cầu công trình gần đây
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
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-2xl transition cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                    #{b.id}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm group-hover:text-[#1E3A8A] transition-colors">
                        {b.serviceName || b.service?.name || "Sơn sửa nhà"}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-sm sm:max-w-md text-slate-600 font-medium">
                        {b.address || "Địa chỉ Hà Nội"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(b.createdAt || b.appointmentDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                  {b.totalAmount > 0 && (
                    <span className="font-black text-slate-900 text-xs sm:text-sm">
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

      {/* 5. 4-Step Transparent Process Guide */}
      <div className="bg-gradient-to-br from-slate-900 to-[#0f172a] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Quy trình chuẩn 4 bước Precision Paint
            </span>
            <h3 className="text-lg font-black text-white mt-1">
              Trải nghiệm dịch vụ sơn nhà chuyên nghiệp &amp; minh bạch
            </h3>
          </div>
          <Link
            to="/customer/booking"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition whitespace-nowrap self-start sm:self-auto"
          >
            Đăng ký khảo sát 0đ →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Khảo sát &amp; Tư vấn 0đ</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Kỹ thuật viên đến tận nơi đo đạc diện tích thực tế, kiểm tra độ ẩm tường và tư vấn màu sắc phong thủy hoàn toàn miễn phí.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dự toán &amp; Hợp đồng</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Báo giá chi tiết từng mã sơn, khối lượng và tiến độ. Khách hàng ký hợp đồng điện tử online và thanh toán cọc 30% minh bạch.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Thi công &amp; Nhật ký ảnh</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Đội thợ tay nghề cao thi công chuẩn kỹ thuật. Giám sát viên cập nhật báo cáo tiến độ và hình ảnh thực tế mỗi ngày trên hệ thống.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              4
            </span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nghiệm thu &amp; Bảo hành</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Khách hàng kiểm tra hài lòng trước khi tất toán 70% còn lại. Kích hoạt bảo hành chính hãng từ 2 đến 5 năm với dịch vụ hỗ trợ tận tâm.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Quick Shortcuts */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Lối tắt chức năng nhanh
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickShortcut
            to="/customer/booking"
            title="Đăng ký khảo sát mới"
            desc="Kỹ thuật viên đến đo đạc và tư vấn bảng màu hoàn toàn miễn phí"
            Icon={CalendarPlus}
            badge="Miễn phí 100%"
          />
          <QuickShortcut
            to="/customer/ongoing"
            title="Quản lý công trình"
            desc="Theo dõi tiến độ khảo sát, hợp đồng, cọc, nhật ký ảnh và nghiệm thu"
            Icon={ClipboardList}
            badge={`${bookings.length} công trình`}
          />
          <QuickShortcut
            to="/customer/wallet"
            title="Ví &amp; Thanh toán"
            desc="Quản lý lịch sử các khoản đặt cọc 30% và thanh toán tất toán 70%"
            Icon={Wallet}
            badge="An toàn VNPay"
          />
        </div>
      </div>
    </div>
  );
}

function QuickShortcut({ to, title, desc, Icon, badge }) {
  return (
    <Link
      to={to}
      className="bg-white border border-slate-200/80 rounded-3xl p-5 hover:border-[#1E3A8A] hover:shadow-md transition-all duration-200 flex items-start gap-4 group cursor-pointer"
    >
      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#1E3A8A] transition-colors truncate">
            {title}
          </p>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
          {desc}
        </p>
        {badge && (
          <span className="inline-block mt-2 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}
