import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import useBookingHistory from "../../hooks/useBookingHistory";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatMoney } from "../../util/formatters";
import { formatDate } from "../../util/orderFlowUtils";
import StatusBadge from "../../components/common/StatusBadge";
import {
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  HelpCircle,
} from "lucide-react";

export default function CustomerWallet() {
  const { showToast } = useOutletContext();
  const { bookings, loading } = useBookingHistory("customer", showToast);

  const totalPaid = bookings.reduce((s, b) => {
    let paid = 0;
    if (b.depositPaid) paid += Number(b.depositAmount) || 0;
    if (b.finalPaid) paid += Number(b.remainingAmount) || 0;
    return s + paid;
  }, 0);

  const totalPending = bookings.reduce((s, b) => {
    if (b.finalPaid) return s;
    let pending = 0;
    if (!b.depositPaid && b.depositAmount) pending += Number(b.depositAmount) || 0;
    if (b.depositPaid && !b.finalPaid && b.remainingAmount)
      pending += Number(b.remainingAmount) || 0;
    return s + pending;
  }, 0);

  if (loading) return <LoadingSpinner message="Đang tải dữ liệu ví và lịch sử thanh toán..." />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ví &amp; Lịch Sử Thanh Toán
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-11.5">
            Quản lý minh bạch từng đợt giải ngân: Đặt cọc 30% khởi công và Tất toán 70% sau khi nghiệm thu công trình.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cổng thanh toán VNPay Bảo mật</span>
        </div>
      </div>

      {/* 2. Payment Balance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-md shadow-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-amber-100">
            <span className="text-xs font-bold uppercase tracking-wider">
              Số tiền cần thanh toán
            </span>
            <Clock className="w-5 h-5 text-amber-200" />
          </div>
          <p className="text-2xl sm:text-3xl font-black">{formatMoney(totalPending)}</p>
          <p className="text-[11px] text-amber-100/90 leading-relaxed">
            Các khoản cọc 30% chờ duyệt hợp đồng hoặc tất toán 70% khi hoàn thành nghiệm thu.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-blue-700 text-white rounded-3xl p-6 shadow-md shadow-[#1E3A8A]/20 space-y-2">
          <div className="flex items-center justify-between text-blue-200">
            <span className="text-xs font-bold uppercase tracking-wider">
              Đã thanh toán thành công
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{formatMoney(totalPaid)}</p>
          <p className="text-[11px] text-blue-100/90 leading-relaxed">
            Tổng số tiền đã giao dịch và đối soát hợp lệ qua cổng thanh toán điện tử.
          </p>
        </div>
      </div>

      {/* 3. Transparent 2-Stage Payment Policy Info */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <h4 className="font-black text-slate-900 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#1E3A8A]" />
            <span>Chính sách giải ngân 2 đợt minh bạch của Precision Paint</span>
          </h4>
          <p className="text-slate-500 leading-relaxed">
            • <strong>Đợt 1 (30%)</strong>: Thanh toán khi ký hợp đồng để giữ giá vật tư và điều phối đội thợ.
            <br />
            • <strong>Đợt 2 (70%)</strong>: Chỉ thanh toán sau khi bạn đã kiểm tra và hài lòng với chất lượng công trình.
          </p>
        </div>
      </div>

      {/* 4. Transactions List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Danh Sách Công Trình &amp; Trạng Thái Thanh Toán
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {bookings.length} công trình
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Wallet className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">Chưa có giao dịch thanh toán nào.</p>
            <p>Khi bạn tạo yêu cầu và duyệt dự toán, thông tin thanh toán sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((b) => {
              const isDepositDone =
                b.depositPaid ||
                b.paymentStatus === "DEPOSIT_PAID" ||
                b.paymentStatus === "FULLY_PAID" ||
                ["DEPOSIT_CONFIRMED", "ASSIGNED", "PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(b.status);
              const isFinalDone = Boolean(b.finalPaid || b.paymentStatus === "FULLY_PAID");

              return (
                <div
                  key={b.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">
                        #{b.id}
                      </span>
                      <span className="font-bold text-[#1E3A8A] text-xs">
                        {b.serviceName || b.service?.name || "Sơn sửa nhà"}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate max-w-lg">
                      {b.address || "Địa chỉ Hà Nội"} • Khởi tạo {formatDate(b.createdAt || b.appointmentDate)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs shrink-0">
                    {/* Deposit info */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Đợt 1 (Cọc 30%)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 font-black">
                          {formatMoney(b.depositAmount)}
                        </strong>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isDepositDone
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isDepositDone ? "✓ Đã cọc" : "Chưa cọc"}
                        </span>
                      </div>
                    </div>

                    {/* Final payment info */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Đợt 2 (Còn 70%)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 font-black">
                          {formatMoney(b.remainingAmount)}
                        </strong>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isFinalDone
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isFinalDone ? "✓ Đã tất toán" : "Chưa tất toán"}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/customer/bookings/${b.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <span>Chi tiết / Thanh toán</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
