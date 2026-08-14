import { useState } from "react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";
import Modal from "../common/Modal";
import QRCodePayment from "../common/QRCodePayment";
import DepositPaymentProofModal from "./DepositPaymentProofModal";
import DepositCountdownBadge from "./DepositCountdownBadge";

export function getPaymentState(booking) {
  if (!booking) return { canPayDeposit: false, canPayFinal: false };

  const isDepositPaid =
    booking.depositPaid ||
    booking.paymentStatus === "DEPOSIT_PAID" ||
    booking.paymentStatus === "FULLY_PAID";

  const isFinalPaid =
    booking.finalPaid || booking.paymentStatus === "FULLY_PAID";

  const isCancelled = booking.status === "CANCELLED";

  const canPayDeposit =
    !isDepositPaid &&
    !isCancelled &&
    [
      "PENDING",
      "SURVEY_ASSIGNED",
      "WAITING_CUSTOMER_SIGNATURE",
      "ASSIGNED",
      "PROCESSING",
      "CONTRACT_APPROVED",
    ].includes(booking.status);

  const canPayFinal =
    isDepositPaid &&
    !isFinalPaid &&
    !isCancelled &&
    ["WORKER_COMPLETED", "COMPLETED", "WAITING_FINAL_PAYMENT"].includes(
      booking.status
    );

  return { canPayDeposit, canPayFinal, isDepositPaid, isFinalPaid, isCancelled };
}

export default function PaymentSection({ booking, showToast, onRefresh, compact = false }) {
  const [paying, setPaying] = useState(false);
  const [openDepositModal, setOpenDepositModal] = useState(false);
  const [openFinalQrModal, setOpenFinalQrModal] = useState(false);

  const { canPayDeposit, canPayFinal, isDepositPaid, isFinalPaid, isCancelled } = getPaymentState(booking);

  const depositAmount =
    booking?.depositAmount && Number(booking.depositAmount) > 0
      ? Number(booking.depositAmount)
      : (Number(booking?.totalAmount) || 0) * 0.3;

  const remainingAmount =
    booking?.remainingAmount && Number(booking.remainingAmount) > 0
      ? Number(booking.remainingAmount)
      : Math.max(0, (Number(booking?.totalAmount) || 0) - depositAmount);

  const isPendingConfirmation = booking?.paymentStatus === "PENDING_CONFIRMATION";

  // Xử lý nộp ảnh chuyển khoản cọc
  const handleDepositProofSubmit = async ({ image, note }) => {
    if (!booking) return;
    try {
      setPaying(true);
      const res = await AxiosConfig.post(
        `/payments/qr-submit?bookingId=${booking.id}&paymentType=DEPOSIT&note=${encodeURIComponent(
          note || ""
        )}`
      );
      showToast?.(
        res.data?.message || "Đã gửi ảnh thanh toán cọc thành công! Vui lòng chờ Admin xác nhận.",
        "success"
      );
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi khi gửi xác nhận thanh toán";
      showToast?.(msg, "error");
      throw error;
    } finally {
      setPaying(false);
    }
  };

  // Xử lý nộp thanh toán phần còn lại (FINAL)
  const handleFinalPaymentSubmit = async () => {
    if (!booking) return;
    try {
      setPaying(true);
      const res = await AxiosConfig.post(
        `/payments/qr-submit?bookingId=${booking.id}&paymentType=FINAL`
      );
      showToast?.(
        res.data?.message || "Đã gửi thông tin tất toán! Vui lòng chờ Admin xác nhận.",
        "success"
      );
      setOpenFinalQrModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg =
        error.response?.data?.message || "Lỗi khi gửi xác nhận thanh toán";
      showToast?.(msg, "error");
    } finally {
      setPaying(false);
    }
  };

  if (!booking) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Countdown 24h nếu chưa đóng cọc */}
      {!isDepositPaid && !isCancelled && (
        <DepositCountdownBadge
          signedAt={booking.createdAt || booking.appointmentDate}
          deadline={booking.depositDeadline}
          isDepositPaid={isDepositPaid}
          isCancelled={isCancelled}
        />
      )}

      {/* Banner chờ duyệt */}
      {isPendingConfirmation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2.5">
          <span className="text-lg animate-spin">⏳</span>
          <div>
            <p className="font-bold">Đang chờ Admin kiểm tra và xác nhận chuyển khoản</p>
            <p className="text-[11px] text-amber-600">
              Bạn đã gửi ảnh/biên lai chuyển khoản. Đội thi công sẽ được bàn giao ngay khi Admin duyệt cọc.
            </p>
          </div>
        </div>
      )}

      {/* Bảng tóm tắt số tiền */}
      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"} gap-3`}>
        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
            Tổng giá trị HĐ
          </div>
          <div className="text-base font-black text-slate-800">
            {formatMoney(booking.totalAmount || booking.service?.basePrice)}
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">
            Phí cọc (24h)
          </div>
          <div className="text-base font-black text-blue-700">
            {formatMoney(depositAmount)}
          </div>
          <div className="text-[10px] mt-1 font-semibold">
            {isDepositPaid ? (
              <span className="text-emerald-600">Đã thanh toán ✓</span>
            ) : isPendingConfirmation ? (
              <span className="text-amber-600">Chờ duyệt ⏳</span>
            ) : (
              <span className="text-rose-500">Chưa cọc</span>
            )}
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-xl p-3 text-center border border-emerald-100">
          <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
            Còn lại sau hoàn thành
          </div>
          <div className="text-base font-black text-emerald-700">
            {formatMoney(remainingAmount)}
          </div>
          <div className="text-[10px] mt-1 font-semibold">
            {isFinalPaid ? (
              <span className="text-emerald-600">Đã thanh toán ✓</span>
            ) : isDepositPaid && isPendingConfirmation ? (
              <span className="text-amber-600">Chờ duyệt ⏳</span>
            ) : (
              <span className="text-slate-500">Chưa thanh toán</span>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {canPayDeposit && (
          <button
            type="button"
            onClick={() => setOpenDepositModal(true)}
            disabled={paying}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
          >
            <span>📱 Quét VietQR &amp; Gửi ảnh chuyển cọc (24h)</span>
          </button>
        )}

        {canPayFinal && (
          <button
            type="button"
            onClick={() => setOpenFinalQrModal(true)}
            disabled={paying}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <span>📱 Quét VietQR thanh toán phần còn lại</span>
          </button>
        )}

        {!canPayDeposit && !canPayFinal && (
          <div className="w-full text-center py-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
            {isFinalPaid
              ? "Đã hoàn tất thanh toán 100% ✓"
              : isDepositPaid
              ? "Đã cọc thành công ✓ – Đội thợ đang tiến hành thi công"
              : isPendingConfirmation
              ? "Đã gửi thông tin chuyển khoản – Vui lòng chờ Admin xác nhận"
              : isCancelled
              ? "Đơn hàng đã bị hủy"
              : "Chưa đến giai đoạn thanh toán"}
          </div>
        )}
      </div>

      {/* Modal nộp ảnh cọc + VietQR */}
      <Modal
        isOpen={openDepositModal}
        onClose={() => setOpenDepositModal(false)}
        title={`Thanh toán tiền cọc đơn hàng #${booking.id}`}
        size="lg"
      >
        <DepositPaymentProofModal
          booking={booking}
          onClose={() => setOpenDepositModal(false)}
          onSubmitProof={handleDepositProofSubmit}
          loading={paying}
        />
      </Modal>

      {/* Modal tất toán cuối */}
      <Modal
        isOpen={openFinalQrModal}
        onClose={() => setOpenFinalQrModal(false)}
        title={`Thanh toán hoàn tất đơn hàng #${booking.id}`}
        size="md"
      >
        <QRCodePayment
          amount={remainingAmount}
          orderId={booking.id}
          addInfo={`TT DH${booking.id}`}
          accountNo="0355880362"
          accountName="VU VIET TAN"
          title="Quét mã VietQR thanh toán phần còn lại"
          subTitle="Mở ứng dụng ngân hàng bất kỳ để quét mã và chuyển khoản nhanh"
          confirmText="Tôi đã chuyển khoản tất toán thành công"
          confirmColor="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={handleFinalPaymentSubmit}
          onClose={() => setOpenFinalQrModal(false)}
          loading={paying}
        />
      </Modal>
    </div>
  );
}
