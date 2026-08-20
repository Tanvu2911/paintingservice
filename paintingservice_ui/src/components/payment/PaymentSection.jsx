import { useState } from "react";
import { CreditCard, CheckCircle2, ShieldCheck, ArrowRight, Lock, Clock } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";

export function getPaymentState(booking, contract) {
  if (!booking) {
    return {
      canPayDeposit: false,
      canPayFinal: false,
      isDepositPaid: false,
      isFinalPaid: false,
      isCancelled: false,
      isPendingConfirmation: false,
      isContractSigned: false,
    };
  }

  const isContractSigned = Boolean(
    contract?.customerSigned ||
    booking.contractSigned ||
    [
      "WAITING_DEPOSIT",
      "DEPOSIT_CONFIRMED",
      "ASSIGNED",
      "PROCESSING",
      "WORKER_COMPLETED",
      "WAITING_FINAL_PAYMENT",
      "COMPLETED",
    ].includes(booking.status)
  );

  const isDepositPaid = Boolean(
    booking.depositPaid ||
    booking.paymentStatus === "DEPOSIT_PAID" ||
    booking.paymentStatus === "FULLY_PAID" ||
    [
      "DEPOSIT_CONFIRMED",
      "ASSIGNED",
      "PROCESSING",
      "WORKER_COMPLETED",
      "WAITING_FINAL_PAYMENT",
      "COMPLETED",
    ].includes(booking.status)
  );

  const isPendingConfirmation = booking.paymentStatus === "PENDING_CONFIRMATION";

  const isFinalPaid = Boolean(
    booking.finalPaid ||
    booking.paymentStatus === "FULLY_PAID"
  );

  const isCancelled = booking.status === "CANCELLED";

  // 1. Chỉ được thanh toán cọc khi ĐÃ KÝ HỢP ĐỒNG (WAITING_DEPOSIT) và CHƯA CỌC
  const canPayDeposit =
    isContractSigned &&
    !isDepositPaid &&
    !isCancelled &&
    ["WAITING_DEPOSIT"].includes(booking.status);

  // 2. Chỉ được tất toán khi ĐÃ CỌC, ĐÃ NGHIỆM THU và CHƯA TẤT TOÁN
  // BẮT BUỘC: Phải nghiệm thu xong (customerAccepted = true hoặc WAITING_FINAL_PAYMENT) mới hiện tất toán
  const isAccepted = Boolean(booking.customerAccepted) || booking.status === "WAITING_FINAL_PAYMENT";

  const canPayFinal =
    isDepositPaid &&
    !isFinalPaid &&
    !isCancelled &&
    isAccepted;

  return {
    canPayDeposit,
    canPayFinal,
    isDepositPaid,
    isFinalPaid,
    isCancelled,
    isPendingConfirmation,
    isContractSigned,
    isAccepted,
  };
}

export default function PaymentSection({
  booking,
  contract,
  onOpenContract,
  showToast,
  compact = false,
}) {
  const [paying, setPaying] = useState(false);

  const {
    canPayDeposit,
    canPayFinal,
    isDepositPaid,
    isFinalPaid,
    isCancelled,
    isContractSigned,
    isAccepted,
  } = getPaymentState(booking, contract);

  const depositAmount =
    booking?.depositAmount && Number(booking.depositAmount) > 0
      ? Number(booking.depositAmount)
      : (Number(booking?.totalAmount) || 0) * 0.3;

  const remainingAmount =
    booking?.remainingAmount && Number(booking.remainingAmount) > 0
      ? Number(booking.remainingAmount)
      : Math.max(0, (Number(booking?.totalAmount) || 0) - depositAmount);

  // Thanh toán trực tuyến qua VNPay Sandbox
  const handlePayVNPay = async (type = "DEPOSIT") => {
    if (!booking) return;
    try {
      setPaying(true);
      const res = await AxiosConfig.post(
        `/payments/vnpay/create?bookingId=${booking.id}&paymentType=${type}`
      );
      if (res.data?.paymentUrl) {
        showToast?.("Đang chuyển hướng sang cổng thanh toán VNPay Sandbox...", "info");
        window.location.href = res.data.paymentUrl;
      } else {
        showToast?.("Không tạo được liên kết thanh toán VNPay Sandbox", "error");
      }
    } catch (error) {
      console.error("VNPay error:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi khởi tạo cổng thanh toán VNPay Sandbox";
      showToast?.(msg, "error");
    } finally {
      setPaying(false);
    }
  };

  if (!booking) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* 1. Trường hợp CHƯA KÝ HỢP ĐỒNG */}
      {!isContractSigned && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Chưa ký hợp đồng dịch vụ</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Vui lòng kiểm tra báo giá và thực hiện ký hợp đồng điện tử trước khi thanh toán cọc.
              </p>
            </div>
          </div>
          {onOpenContract && (
            <button
              type="button"
              onClick={onOpenContract}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shrink-0 shadow-xs cursor-pointer"
            >
              Xem &amp; Ký HĐ
            </button>
          )}
        </div>
      )}

      {/* 2. Trường hợp ĐÃ CỌC THÀNH CÔNG (Đang thi công, chưa báo hoàn thành) */}
      {isDepositPaid && !isFinalPaid && !canPayFinal && booking.status !== "WORKER_COMPLETED" && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm">Xác nhận thanh toán tiền cọc thành công</p>
              {booking.depositPaidAt && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {new Date(booking.depositPaidAt).toLocaleString("vi-VN")}
                </span>
              )}
            </div>
            <p className="text-emerald-700 text-xs mt-0.5">
              Hệ thống đã nhận thành công 30% tiền cọc qua VNPay Sandbox. Đội thợ đang tiến hành thi công. Quý khách sẽ thực hiện tất toán 70% sau khi nghiệm thu công trình.
            </p>
          </div>
        </div>
      )}

      {/* 2.2 Trường hợp ĐỘI THỢ ĐÃ BÁO XONG - CHƯA NGHIỆM THU */}
      {booking.status === "WORKER_COMPLETED" && !isAccepted && !isFinalPaid && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900">Đội thợ đã báo hoàn thành - Chờ khách nghiệm thu</p>
            <p className="text-blue-800 text-xs mt-0.5 font-medium">
              Quý khách vui lòng kiểm tra chất lượng công trình thực tế và xác nhận &quot;Nghiệm thu&quot; trước khi thực hiện thanh toán tất toán 70% còn lại.
            </p>
          </div>
        </div>
      )}

      {/* 2.5 Trường hợp ĐÃ NGHIỆM THU - CHỜ TẤT TOÁN 70% */}
      {canPayFinal && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-amber-900">✓ Đã nghiệm thu công trình đạt yêu cầu</p>
            <p className="text-amber-800 text-xs mt-0.5 font-medium">
              Công trình đã hoàn thành và được nghiệm thu. Quý khách vui lòng bấm nút bên dưới để thanh toán nốt 70% còn lại ({formatMoney(remainingAmount)}) qua cổng VNPay Sandbox.
            </p>
          </div>
        </div>
      )}

      {/* 3. Trường hợp ĐÃ TẤT TOÁN HOÀN TẤT 100% */}
      {isFinalPaid && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm">Đã tất toán 100% qua VNPay Sandbox</p>
              {booking.finalPaidAt && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {new Date(booking.finalPaidAt).toLocaleString("vi-VN")}
                </span>
              )}
            </div>
            <p className="text-emerald-700 text-xs mt-0.5">
              Công trình đã được hoàn tất và tất toán đầy đủ. Cảm ơn quý khách đã tin tưởng dịch vụ sơn nhà chuyên nghiệp!
            </p>
          </div>
        </div>
      )}

      {/* Bảng phân rã tài chính */}
      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"} gap-3`}>
        <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-200">
          <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
            Tổng giá trị hợp đồng
          </div>
          <div className="text-base font-black text-slate-900">
            {formatMoney(booking.totalAmount || booking.service?.basePrice)}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-200">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
            Tiền cọc (30%)
          </div>
          <div className="text-base font-black text-slate-900">
            {formatMoney(depositAmount)}
          </div>
          <div className="text-[10px] mt-1 font-semibold">
            {isDepositPaid ? (
              <span className="text-emerald-600">
                Đã thanh toán ✓ {booking.depositPaidAt ? `(${new Date(booking.depositPaidAt).toLocaleDateString("vi-VN")})` : ""}
              </span>
            ) : (
              <span className="text-amber-600">Chưa đặt cọc</span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-200">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
            Còn lại tất toán (70%)
          </div>
          <div className="text-base font-black text-slate-900">
            {formatMoney(remainingAmount)}
          </div>
          <div className="text-[10px] mt-1 font-semibold">
            {isFinalPaid ? (
              <span className="text-emerald-600">
                Đã tất toán ✓ {booking.finalPaidAt ? `(${new Date(booking.finalPaidAt).toLocaleDateString("vi-VN")})` : ""}
              </span>
            ) : (
              <span className="text-slate-400">Chưa tất toán</span>
            )}
          </div>
        </div>
      </div>

      {/* Nút hành động thanh toán VNPay Sandbox */}
      <div className="space-y-2 pt-1">
        {canPayDeposit && (
          <button
            type="button"
            onClick={() => handlePayVNPay("DEPOSIT")}
            disabled={paying}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-white" />
            <span>{paying ? "Đang xử lý..." : "Thanh toán Cọc (30%) qua VNPay Sandbox"}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>
        )}

        {canPayFinal && (
          <button
            type="button"
            onClick={() => handlePayVNPay("FINAL")}
            disabled={paying}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-white" />
            <span>{paying ? "Đang xử lý..." : "Tất toán hợp đồng (70%) qua VNPay Sandbox"}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>
        )}
      </div>
    </div>
  );
}