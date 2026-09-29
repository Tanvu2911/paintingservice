import React from "react";
import { formatMoney } from "../../util/formatters";
import { formatDate, parseNegotiationInfo } from "../../util/orderFlowUtils";
import {
  FileSignature,
  CreditCard,
  Check,
  UserCheck,
  Send,
  PenTool,
  Printer,
  FileText,
  Phone,
  DollarSign,
  Search,
  RotateCcw,
  Paintbrush,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Wallet,
  Sparkles,
  Star,
  MessageSquare,
} from "lucide-react";


export default function OrderActionBanner({
  role = "customer",
  booking,
  contract,
  review = null,
  canAcceptQuote = false,
  canCustomerConfirmAcceptance = false,
  canChangeSupervisor = false,
  dailyReportsCount = 0,
  onAction,
}) {

  if (!booking) return null;

  const s = booking.status;
  const total = Number(booking.totalAmount) || 0;
  const deposit = booking.depositAmount ? Number(booking.depositAmount) : total * 0.3;
  const remaining = Math.max(0, total - deposit);
  const isFinalPaid = Boolean(booking.finalPaid || booking.paymentStatus === "FULLY_PAID");

  /* ========================================================================= */
  /* 1. CUSTOMER BANNER                                                        */
  /* ========================================================================= */
  if (role === "customer") {
    if (s === "SURVEY_REJECTED") {
      return (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Đang phân công chuyên viên khảo sát mới</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Chuyên viên khảo sát trước đó bận lịch đột xuất. Đội ngũ quản trị đang phân công chuyên viên khác để đảm bảo đúng lịch hẹn của bạn.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onAction && onAction("cancel_survey")}
              className="px-3.5 py-2 bg-white hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Hủy yêu cầu khảo sát</span>
            </button>
          </div>
        </div>
      );
    }

    if (s === "WORKER_REJECTED") {
      return (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Đang phân bổ đội thợ thi công mới</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Đơn vị thi công đang phân bổ đội thợ tay nghề cao khác để đảm bảo tiến độ công trình cho bạn.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (["PENDING", "SURVEY_ASSIGNED", "ACCEPTED"].includes(s)) {
      return (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <Search className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Chuyên viên đang chuẩn bị khảo sát tại công trình</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Lịch hẹn: <strong className="text-slate-900 font-semibold">{booking.appointmentTime || "08:00"} ngày {formatDate(booking.appointmentDate)}</strong>. Khảo sát và tư vấn phương án hoàn toàn miễn phí.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onAction && onAction("cancel_survey")}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Hủy yêu cầu khảo sát</span>
            </button>
            <a
              href="tel:19006868"
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200 flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Tổng đài 1900 6868</span>
            </a>
          </div>
        </div>
      );
    }

    if (s === "WAITING_ADMIN_QUOTE") {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Đã tiếp nhận số liệu đo đạc - Admin đang lập dự toán</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Báo cáo hiện trường đã được nộp. Đội ngũ kỹ thuật đang bóc tách khối lượng và thiết lập bảng giá kèm hợp đồng điện tử cho bạn.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (s === "CANCELLED") {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Yêu cầu công trình này đã kết thúc / Hủy bỏ</h4>
              <p className="text-slate-500 mt-0.5 leading-relaxed">
                Nếu bạn cần hỗ trợ hoặc muốn đặt dịch vụ mới, vui lòng liên hệ hotline hoặc tạo yêu cầu mới.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(s) && canAcceptQuote) {
      const negInfo = parseNegotiationInfo(booking?.description);
      const hasNegotiation = negInfo.hasNegotiation;

      if (hasNegotiation) {
        return (
          <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Đề xuất thương lượng giá đang chờ Admin phản hồi
                  </h4>
                  {negInfo.proposedPrice && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      Đề xuất: {negInfo.proposedPrice}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Báo giá gốc: <strong className="text-slate-900">{formatMoney(total)}</strong>. Bạn có thể bấm nút để xem lại, chỉnh sửa hoặc hủy đề xuất bất kỳ lúc nào.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAction?.("respond_quote")}
              className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Xem / Sửa / Hủy Đề Xuất</span>
            </button>
          </div>
        );
      }

      return (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <FileSignature className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Báo giá dịch vụ &amp; Dự toán thi công đã sẵn sàng ({formatMoney(total)})
              </h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Thời gian thi công dự kiến: <strong className="text-slate-900 font-semibold">{booking.estimatedDays || 3} ngày</strong>. Bấm nút bên phải để ký hợp đồng hoặc đề xuất thương lượng.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("respond_quote")}
            className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <FileSignature className="w-4 h-4" />
            <span>Phản Hồi Báo Giá</span>
          </button>
        </div>
      );
    }

    if (s === "WAITING_DEPOSIT" && !booking.depositPaid && booking.paymentStatus !== "DEPOSIT_PAID") {
      return (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <CreditCard className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Hợp đồng đã ký! Quý khách vui lòng đặt cọc 30% ({formatMoney(deposit)})
              </h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Sau khi thanh toán cọc qua VNPay Sandbox, công ty sẽ chỉ định đội thợ thi công đúng ngày {formatDate(booking.expectedStartDate)}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("pay_deposit")}
            className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Thanh toán Cọc 30% (VNPay)</span>
          </button>
        </div>
      );
    }

    if (["DEPOSIT_CONFIRMED", "ASSIGNED"].includes(s)) {
      return (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Đã xác nhận cọc 30% - Đội thợ đang chuẩn bị thi công
              </h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Đội thợ {booking.technicianName ? `@${booking.technicianName}` : ""} sẽ có mặt lúc 08:00 sáng ngày {formatDate(booking.expectedStartDate)} để bắt đầu công trình.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (s === "PROCESSING") {
      return (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Paintbrush className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Công trình đang trong quá trình thi công sơn sửa</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Giám sát và đội thợ sẽ cập nhật nhật ký, tỷ lệ % hoàn thành và hình ảnh thực tế mỗi ngày tại tab bên dưới.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (s === "WORKER_COMPLETED" && !booking.customerAccepted) {
      return (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Đội thợ đã báo hoàn thành - Mời quý khách nghiệm thu</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Vui lòng kiểm tra thực tế chất lượng bề mặt sơn tại công trình và bấm nút Nghiệm thu để xác nhận bàn giao.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("customer_accept")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận Nghiệm thu</span>
          </button>
        </div>
      );
    }

    if (s === "WAITING_FINAL_PAYMENT" || (booking.customerAccepted && !isFinalPaid)) {
      return (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Đã nghiệm thu công trình đạt chuẩn - Mời tất toán 70% còn lại
              </h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Số tiền cần thanh toán: <strong className="text-slate-900 font-semibold">{formatMoney(remaining)}</strong>. Sau khi tất toán qua VNPay Sandbox, hợp đồng bảo hành chính hãng {booking.warrantyYears || 2} năm sẽ được kích hoạt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("pay_final")}
            className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Tất toán 70% qua VNPay</span>
          </button>
        </div>
      );
    }

    if (["COMPLETED", "PAID_TO_STAFF"].includes(s) || isFinalPaid) {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Công trình đã hoàn thành xuất sắc &amp; Kích hoạt bảo hành chính hãng
              </h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Cảm ơn quý khách đã tin tưởng dịch vụ. Hợp đồng bảo hành {booking.warrantyYears || 2} năm có hiệu lực từ hôm nay.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAction?.("open_review")}
              className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>{review ? `Đánh Giá Lại (${review.rating}★)` : "Đánh Giá Thợ"}</span>
            </button>
            {contract && (
              <button
                type="button"
                onClick={() => onAction?.("export_pdf")}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất File PDF</span>
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  /* ========================================================================= */
  /* 2. ADMIN BANNER                                                           */
  /* ========================================================================= */
  if (role === "admin") {
    if (s === "SURVEY_REJECTED") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-rose-500/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 px-2.5 py-0.5 rounded-full border border-rose-400/30">
                Hành động cần làm
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Giám sát viên đã từ chối nhận khảo sát - Cần gán Giám sát khác
              </h3>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed max-w-2xl">
                Giám sát viên trước đó đã từ chối nhận đơn này. Vui lòng bấm nút bên phải để chọn Giám sát viên khác thay thế.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("assign_supervisor")}
            className="px-5 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Phân Công Lại Giám Sát</span>
          </button>
        </div>
      );
    }

    if (s === "WORKER_REJECTED") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-rose-500/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 px-2.5 py-0.5 rounded-full border border-rose-400/30">
                Hành động cần làm
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đội thợ đã từ chối nhận việc - Cần phân công Đội thợ khác
              </h3>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed max-w-2xl">
                Đội thợ trước đó đã từ chối công trình. Vui lòng bấm nút bên phải để phân công Đội thợ khác.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("assign_worker")}
            className="px-5 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Phân Công Lại Đội Thợ</span>
          </button>
        </div>
      );
    }

    if (s === "PENDING" || !booking.supervisorId) {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Hành động cần làm ngay
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đơn mới đăng ký - Cần phân công Giám sát viên khảo sát
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Khách hàng hẹn khảo sát lúc {booking.appointmentTime || "08:00"} ngày {formatDate(booking.appointmentDate)} tại {booking.address || "Hà Nội"}. Vui lòng chọn Giám sát viên phù hợp theo khu vực.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("assign_supervisor")}
            className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Phân Công Giám Sát Ngay</span>
          </button>
        </div>
      );
    }

    if (["SURVEY_ASSIGNED", "ACCEPTED", "SURVEYING"].includes(s)) {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Bước 1: Đang khảo sát
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đã phân công Giám sát viên @{booking.supervisorName || booking.surveyorName || "Giám sát"}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Giám sát viên đang liên hệ khách hàng để đo đạc hiện trạng. Sau khi khảo sát xong, báo cáo kèm ảnh chụp sẽ tự động hiển thị tại đây.
              </p>
            </div>
          </div>
          {canChangeSupervisor && (
            <button
              type="button"
              onClick={() => onAction?.("assign_supervisor")}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Đổi Giám Sát</span>
            </button>
          )}
        </div>
      );
    }

    if (s === "WAITING_ADMIN_QUOTE") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-sky-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/30 text-sky-200 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                Hành động Admin
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Giám sát đã nộp báo cáo - Admin cần gửi báo giá &amp; lập hợp đồng
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Kiểm tra ghi chú tường, vật tư đề xuất và ảnh khảo sát bên dưới. Bấm nút bên phải để nhập tổng kinh phí, ngày thi công và gửi báo giá cho khách.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("quote")}
            className="px-5 py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span>Duyệt &amp; Gửi Báo Giá Ngay</span>
          </button>
        </div>
      );
    }

    if (["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(s)) {
      const negInfo = parseNegotiationInfo(booking?.description);
      const hasNegotiation = negInfo.hasNegotiation;

      if (hasNegotiation) {
        return (
          <div className="space-y-3">
            {/* Negotiation Alert - Hiển thị giá khách mong muốn nổi bật */}
            <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 animate-bounce shadow-sm">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                        ⚠️ Khách Hàng Yêu Cầu Thương Lượng Giá
                      </span>
                      {negInfo.proposedPrice && (
                        <span className="text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full">
                          Khách muốn giá: <strong className="text-emerald-700 font-black">{negInfo.proposedPrice}</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Báo giá gốc hiện tại</span>
                        <span className="font-black text-slate-900 text-sm block mt-0.5">{formatMoney(total)}</span>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 font-bold block uppercase">Mức giá khách đề xuất</span>
                        <span className="font-black text-emerald-700 text-sm block mt-0.5">{negInfo.proposedPrice || "Không nêu mức giá cụ thể"}</span>
                      </div>
                    </div>

                    {negInfo.message && (
                      <p className="text-xs text-amber-950 font-medium leading-relaxed bg-white/90 p-2.5 rounded-xl border border-amber-300 italic">
                        💬 Lý do từ khách: "{negInfo.message}"
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAction?.("quote")}
                  className="w-full sm:w-auto px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-105 duration-150"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Cập Nhật Báo Giá</span>
                </button>
              </div>
            </div>
            {/* Normal waiting state */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    Bước 2: Chờ phản hồi
                  </span>
                  <p className="text-xs text-slate-400 mt-1">Khách đang yêu cầu thương lượng lại mức giá.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAction?.("open_contract")}
                className="px-4 py-2.5 bg-white/10 text-white font-bold rounded-xl text-xs border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xem HĐ</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Bước 2: Chờ khách ký HĐ
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đã gửi báo giá ({formatMoney(total)}) - Đang chờ khách phản hồi
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Khách hàng đang xem bảng dự toán. Họ sẽ chấp nhận, thương lượng hoặc từ chối.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("open_contract")}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xem Hợp Đồng</span>
          </button>
        </div>
      );
    }

    if (s === "WAITING_DEPOSIT") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <PenTool className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Hành động Admin
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Khách hàng đã ký HĐ - Chờ đặt cọc 30% ({formatMoney(deposit)}) &amp; Admin ký duyệt
              </h3>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed max-w-2xl">
                Khách có thể thanh toán trực tiếp qua VNPay Sandbox hoặc chuyển khoản. Admin ký duyệt vào hợp đồng để hoàn tất giai đoạn đặt cọc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("confirm_deposit")}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <PenTool className="w-4 h-4 text-slate-950" />
            <span>Ký Duyệt HĐ &amp; Xác Nhận Cọc</span>
          </button>
        </div>
      );
    }

    if (s === "DEPOSIT_CONFIRMED") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-emerald-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Hành động Admin
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đã xác nhận cọc 30% &amp; Hợp đồng 2 chữ ký - Tiến hành phân công Đội thợ
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed max-w-2xl">
                Đơn hàng đủ điều kiện thi công. Vui lòng phân công Đội thợ chuyên nghiệp để chuẩn bị thi công.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("assign_worker")}
            className="px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Phân Công Đội Thợ Thi Công</span>
          </button>
        </div>
      );
    }

    if (["ASSIGNED", "PROCESSING"].includes(s)) {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-300 flex items-center justify-center shrink-0">
              <Paintbrush className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/30 text-orange-200 px-2.5 py-0.5 rounded-full border border-orange-400/30">
                Bước 4: Đang thi công
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đội thợ @{booking.technicianName || "Đội thợ"} đang tiến hành thi công sơn sửa
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Nhật ký công trình, vật tư và ảnh chụp hàng ngày được cập nhật liên tục từ hiện trường.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("view_reports")}
            className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-900" />
            <span>Xem Nhật Ký Thi Công ({dailyReportsCount})</span>
          </button>
        </div>
      );
    }

    if (s === "WORKER_COMPLETED") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/30 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                Bước 5: Chờ khách nghiệm thu
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Đội thợ đã báo hoàn thành - Đang chờ Khách hàng nghiệm thu
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Đội thợ đã gửi xác nhận hoàn thành công trình. Khách hàng đang kiểm tra thực tế để xác nhận nghiệm thu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction?.("view_reports")}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xem Nhật Ký ({dailyReportsCount})</span>
          </button>
        </div>
      );
    }

    if (s === "WAITING_FINAL_PAYMENT") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Bước 6: Chờ tất toán 70%
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Khách đã nghiệm thu đạt yêu cầu - Chờ khách tất toán 70% ({formatMoney(remaining)})
              </h3>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed max-w-2xl">
                Khách hàng đã nghiệm thu công trình. Đang chờ khách hàng thanh toán nốt 70% còn lại qua cổng VNPay Sandbox.
              </p>
            </div>
          </div>
          {contract && (
            <button
              type="button"
              onClick={() => onAction?.("export_pdf")}
              className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>Xuất File PDF HĐ</span>
            </button>
          )}
        </div>
      );
    }

    if (s === "COMPLETED" || (isFinalPaid && s !== "PAID_TO_STAFF")) {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-2 ring-emerald-500/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Bước 7: Quyết toán nhân sự
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Khách đã tất toán 100% — Admin cần thanh toán thù lao cho Nhân viên &amp; Đội thợ
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed max-w-2xl">
                Công trình đã nghiệm thu và nhận đủ kinh phí. Admin thực hiện quét mã VietQR để thanh toán thù lao cho Giám sát viên và Đội thợ thi công.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAction?.("pay_staff")}
              className="px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-2xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-slate-950" />
              <span>Quyết Toán Thù Lao Ngay</span>
            </button>
            {contract && (
              <button
                type="button"
                onClick={() => onAction?.("export_pdf")}
                className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xuất PDF</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    if (s === "PAID_TO_STAFF") {
      return (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Đơn hàng hoàn tất 100%
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                Công trình đã hoàn tất &amp; Đã quyết toán toàn bộ thù lao cho nhân viên
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed max-w-2xl">
                Khách hàng đã nhận bàn giao, tất toán 100% và thù lao đã được thanh toán đầy đủ cho Giám sát viên và Đội thợ.
              </p>
            </div>
          </div>
          {contract && (
            <button
              type="button"
              onClick={() => onAction?.("export_pdf")}
              className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>Xuất File PDF / In HĐ</span>
            </button>
          )}
        </div>
      );
    }
  }

  return null;
}

