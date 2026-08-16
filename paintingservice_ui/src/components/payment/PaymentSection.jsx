import { useState, useRef } from "react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";
import Modal from "../common/Modal";
import QRCodePayment from "../common/QRCodePayment";
import DepositPaymentProofModal from "./DepositPaymentProofModal";
import DepositCountdownBadge from "./DepositCountdownBadge";

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
      "COMPLETED",
      "WAITING_FINAL_PAYMENT",
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
      "COMPLETED",
    ].includes(booking.status)
  );

  const isPendingConfirmation = booking.paymentStatus === "PENDING_CONFIRMATION";

  const isFinalPaid = Boolean(
    booking.finalPaid ||
    booking.paymentStatus === "FULLY_PAID"
  );

  const isCancelled = booking.status === "CANCELLED";

  // 1. Chỉ được thanh toán cọc khi ĐÃ KÝ HỢP ĐỒNG (WAITING_DEPOSIT) và CHƯA CỌC và CHƯA GỬI ẢNH CHỜ DUYỆT
  const canPayDeposit =
    isContractSigned &&
    !isDepositPaid &&
    !isPendingConfirmation &&
    !isCancelled &&
    ["WAITING_DEPOSIT"].includes(booking.status);

  // 2. Chỉ được thanh toán phần còn lại khi ĐÃ CỌC, ĐÃ HOÀN THÀNH THI CÔNG, ĐÃ NGHIỆM THU và CHƯA TẤT TOÁN
  const canPayFinal =
    isDepositPaid &&
    !isFinalPaid &&
    !isPendingConfirmation &&
    !isCancelled &&
    ["WORKER_COMPLETED", "COMPLETED", "WAITING_FINAL_PAYMENT"].includes(booking.status) &&
    Boolean(booking.customerAccepted);

  return {
    canPayDeposit,
    canPayFinal,
    isDepositPaid,
    isFinalPaid,
    isCancelled,
    isPendingConfirmation,
    isContractSigned,
  };
}

export default function PaymentSection({
  booking,
  contract,
  onOpenContract,
  showToast,
  onRefresh,
  compact = false,
}) {
  const [paying, setPaying] = useState(false);
  const [openDepositModal, setOpenDepositModal] = useState(false);
  const [openFinalModal, setOpenFinalModal] = useState(false);

  // State cho modal thanh toán hoàn thành (giống như deposit)
  const [finalProofImage, setFinalProofImage] = useState(null);
  const [finalProofPreview, setFinalProofPreview] = useState("");
  const [finalCustomerNote, setFinalCustomerNote] = useState("");
  const [finalErrorMsg, setFinalErrorMsg] = useState("");
  const finalFileInputRef = useRef(null);

  const {
    canPayDeposit,
    canPayFinal,
    isDepositPaid,
    isFinalPaid,
    isCancelled,
    isPendingConfirmation,
    isContractSigned,
  } = getPaymentState(booking, contract);

  const depositAmount =
    booking?.depositAmount && Number(booking.depositAmount) > 0
      ? Number(booking.depositAmount)
      : (Number(booking?.totalAmount) || 0) * 0.3;

  const remainingAmount =
    booking?.remainingAmount && Number(booking.remainingAmount) > 0
      ? Number(booking.remainingAmount)
      : Math.max(0, (Number(booking?.totalAmount) || 0) - depositAmount);

  // Xử lý nộp ảnh chuyển khoản cọc
  const handleDepositProofSubmit = async ({ image, note }) => {
    if (!booking) return;

    try {
      setPaying(true);

      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("paymentType", "DEPOSIT");
      if (note) formData.append("note", note);
      if (image) {
        formData.append("proofImage", image);
      }

      const res = await AxiosConfig.post("/payments/qr-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast?.(
        res.data?.message ||
        "Đã gửi ảnh thanh toán cọc thành công! Vui lòng chờ Admin xác nhận.",
        "success"
      );

      setOpenDepositModal(false);
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

  // 👇 Xử lý nộp ảnh thanh toán hoàn thành (GIỐNG HỆT cọc)
  const handleFinalProofSubmit = async () => {
    if (!booking) return;

    if (!finalProofImage) {
      setFinalErrorMsg("Vui lòng tải lên ảnh chụp biên lai chuyển khoản thành công");
      return;
    }

    try {
      setPaying(true);

      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("paymentType", "FINAL");
      if (finalCustomerNote.trim()) formData.append("note", finalCustomerNote.trim());
      if (finalProofImage) {
        formData.append("proofImage", finalProofImage);
      }

      const res = await AxiosConfig.post("/payments/qr-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast?.(
        res.data?.message ||
        "Đã gửi ảnh thanh toán tất toán thành công! Vui lòng chờ Admin xác nhận.",
        "success"
      );

      // Reset state
      setFinalProofImage(null);
      setFinalProofPreview("");
      setFinalCustomerNote("");
      setFinalErrorMsg("");
      if (finalFileInputRef.current) finalFileInputRef.current.value = "";

      setOpenFinalModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi khi gửi xác nhận thanh toán";
      setFinalErrorMsg(msg);
      showToast?.(msg, "error");
    } finally {
      setPaying(false);
    }
  };

  // Xử lý chọn file ảnh cho thanh toán hoàn thành
  const handleFinalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFinalErrorMsg("Vui lòng chỉ tải lên file hình ảnh (JPG, PNG, JPEG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFinalErrorMsg("Kích thước ảnh tối đa 10MB");
      return;
    }

    setFinalErrorMsg("");
    setFinalProofImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFinalProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalRemoveImage = () => {
    setFinalProofImage(null);
    setFinalProofPreview("");
    if (finalFileInputRef.current) finalFileInputRef.current.value = "";
  };

  if (!booking) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Countdown 24h nếu đang ở bước cọc WAITING_DEPOSIT */}
      {booking.status === "WAITING_DEPOSIT" && !isDepositPaid && !isCancelled && !isPendingConfirmation && (
        <DepositCountdownBadge
          signedAt={booking.createdAt || booking.appointmentDate}
          deadline={booking.depositDeadline}
          isDepositPaid={isDepositPaid}
          isCancelled={isCancelled}
        />
      )}

      {/* 1. Trường hợp CHƯA KÝ HỢP ĐỒNG */}
      {!isContractSigned && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">✍️</span>
            <div>
              <p className="font-bold text-sm text-blue-950">Chưa ký hợp đồng dịch vụ</p>
              <p className="text-blue-700 text-xs mt-0.5">
                Quý khách vui lòng kiểm tra báo giá và ký hợp đồng điện tử trước khi tiến hành thanh toán đặt cọc.
              </p>
            </div>
          </div>
          {onOpenContract && (
            <button
              type="button"
              onClick={onOpenContract}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shrink-0 shadow-sm"
            >
              Xem &amp; Ký HĐ
            </button>
          )}
        </div>
      )}

      {/* 2. Trường hợp ĐÃ GỬI ẢNH CHỜ DUYỆT CỌC / TẤT TOÁN */}
      {isPendingConfirmation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-3 shadow-xs">
          <span className="text-2xl shrink-0">⏳</span>
          <div>
            <p className="font-bold text-sm text-amber-950">
              Đã gửi biên lai – Đang chờ Admin xác nhận thanh toán
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              Hệ thống đã ghi nhận ảnh biên lai chuyển khoản. Mã VietQR tạm ẩn để tránh thanh toán trùng lặp.
            </p>
          </div>
        </div>
      )}

      {/* 3. Trường hợp ĐÃ CỌC THÀNH CÔNG */}
      {isDepositPaid && !isFinalPaid && !canPayFinal && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center gap-3 shadow-xs">
          <span className="text-2xl shrink-0">✅</span>
          <div>
            <p className="font-bold text-sm text-emerald-950">
              Đã xác nhận tiền cọc thành công
            </p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Admin đã duyệt tiền cọc. Đội thợ đang triển khai thi công. Quý khách sẽ thanh toán phần còn lại sau khi nghiệm thu hoàn tất.
            </p>
          </div>
        </div>
      )}

      {/* 4. Trường hợp ĐÃ HOÀN TẤT 100% */}
      {isFinalPaid && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center gap-3 shadow-xs">
          <span className="text-2xl shrink-0">🎉</span>
          <div>
            <p className="font-bold text-sm text-emerald-950">
              Đã hoàn tất thanh toán 100%
            </p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Đơn hàng đã được thanh toán đầy đủ. Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Sơn Sửa 247!
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
            ) : isPendingConfirmation && isDepositPaid ? (
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
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
          >
            <span>📱 Quét VietQR &amp; Gửi ảnh chuyển cọc (24h)</span>
          </button>
        )}

        {canPayFinal && (
          <button
            type="button"
            onClick={() => setOpenFinalModal(true)}
            disabled={paying}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <span>📱 Quét VietQR &amp; Gửi ảnh thanh toán hoàn thành</span>
          </button>
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

      {/* 👇 Modal tất toán cuối - GIỐNG HỆT MODAL CỌC (inline) */}
      <Modal
        isOpen={openFinalModal}
        onClose={() => {
          setOpenFinalModal(false);
          setFinalProofImage(null);
          setFinalProofPreview("");
          setFinalCustomerNote("");
          setFinalErrorMsg("");
          if (finalFileInputRef.current) finalFileInputRef.current.value = "";
        }}
        title={`Thanh toán hoàn tất đơn hàng #${booking.id}`}
        size="lg"
      >
        <div className="space-y-4 max-h-[85vh] overflow-y-auto px-1">
          {/* Countdown đếm ngược 24h */}
          <DepositCountdownBadge
            signedAt={booking.createdAt || booking.appointmentDate}
            isDepositPaid={booking.depositPaid || booking.paymentStatus === "DEPOSIT_PAID"}
            isCancelled={booking.status === "CANCELLED"}
          />

          <div className="space-y-5">
            {/* Thông tin VietQR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <QRCodePayment
                amount={remainingAmount}
                orderId={booking.id}
                addInfo={`TT DH${booking.id}`}
                accountNo="0355880362"
                accountName="VU VIET TAN"
                title="Quét mã VietQR thanh toán phần còn lại"
                subTitle="Mở ứng dụng ngân hàng bất kỳ để quét mã chuyển nhanh"
                readOnly={true}
              />
            </div>

            {/* Form upload ảnh biên lai */}
            <form onSubmit={(e) => { e.preventDefault(); handleFinalProofSubmit(); }} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  📸 Tải lên ảnh chuyển khoản thành công <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Chụp ảnh màn hình giao dịch chuyển khoản thành công trên App ngân hàng để gửi cho Admin đối soát.
                </p>

                {finalProofPreview ? (
                  <div className="relative border-2 border-emerald-400 bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center group">
                    <img
                      src={finalProofPreview}
                      alt="Biên lai chuyển khoản"
                      className="max-h-64 max-w-full rounded-xl object-contain shadow-sm"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleFinalRemoveImage}
                        className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md transition"
                      >
                        ✕ Chọn ảnh khác
                      </button>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold mt-2">
                      ✓ Đã chọn ảnh biên lai thành công
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => finalFileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
                      📁
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 hover:underline">
                        Bấm vào đây để tải ảnh biên lai lên
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hỗ trợ định dạng JPG, PNG (Dung lượng tối đa 10MB)
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={finalFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFinalFileChange}
                  className="hidden"
                />
              </div>

              {/* Ô ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú thêm cho Admin (tùy chọn)
                </label>
                <textarea
                  value={finalCustomerNote}
                  onChange={(e) => setFinalCustomerNote(e.target.value)}
                  placeholder="VD: Em đã chuyển khoản từ ngân hàng Vietcombank lúc 14h30..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none resize-none"
                />
              </div>

              {finalErrorMsg && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {finalErrorMsg}
                </p>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenFinalModal(false);
                    setFinalProofImage(null);
                    setFinalProofPreview("");
                    setFinalCustomerNote("");
                    setFinalErrorMsg("");
                    if (finalFileInputRef.current) finalFileInputRef.current.value = "";
                  }}
                  disabled={paying}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Hủy &amp; Đóng
                </button>
                <button
                  type="submit"
                  disabled={paying || !finalProofPreview}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  {paying ? "Đang gửi ảnh..." : "📤 Gửi ảnh xác nhận tất toán cho Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}