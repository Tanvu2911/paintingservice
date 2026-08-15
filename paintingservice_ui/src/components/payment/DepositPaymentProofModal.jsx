import { useState, useRef } from "react";
import QRCodePayment from "../common/QRCodePayment";
import DepositCountdownBadge from "./DepositCountdownBadge";
import { formatMoney } from "../../util/formatters";

/**
 * Modal dành cho Khách hàng:
 * - Xem mã VietQR thanh toán cọc
 * - Xem đồng hồ đếm ngược 24h còn lại
 * - Tải ảnh hóa đơn / bill chuyển khoản thành công
 * - Preview ảnh + ô ghi chú + nút gửi
 */
export default function DepositPaymentProofModal({
  booking,
  onClose,
  onSubmitProof,
  loading = false,
}) {
  const [activeView, setActiveView] = useState("qr_and_upload"); // 'qr_and_upload' | 'success'
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!booking) return null;

  const depositAmount =
    booking.depositAmount && Number(booking.depositAmount) > 0
      ? Number(booking.depositAmount)
      : (Number(booking.totalAmount) || 0) * 0.3;

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Vui lòng chỉ tải lên file hình ảnh (JPG, PNG, JPEG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Kích thước ảnh tối đa 10MB");
      return;
    }

    setErrorMsg("");
    setProofImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    setProofPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ... giữ nguyên phần import và state

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofImage) {   // dùng proofImage (File), không dùng proofPreview
      setErrorMsg("Vui lòng tải lên ảnh chụp biên lai chuyển khoản thành công");
      return;
    }

    try {
      if (onSubmitProof) {
        await onSubmitProof({
          bookingId: booking.id,
          image: proofImage,          // ← File object
          note: customerNote.trim(),
          amount: depositAmount,
        });
      }
      setActiveView("success");
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Lỗi khi gửi ảnh thanh toán"
      );
    }
  };

  return (
    <div className="space-y-4 max-h-[85vh] overflow-y-auto px-1">
      {/* 1. Countdown đếm ngược 24h */}
      <DepositCountdownBadge
        signedAt={booking.createdAt || booking.appointmentDate}
        isDepositPaid={booking.depositPaid || booking.paymentStatus === "DEPOSIT_PAID"}
        isCancelled={booking.status === "CANCELLED"}
      />

      {activeView === "success" ? (
        <div className="text-center py-8 px-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-inner">
            ✓
          </div>
          <h3 className="text-lg font-black text-emerald-900">
            Đã gửi ảnh thanh toán cọc thành công!
          </h3>
          <p className="text-xs text-emerald-700 mt-2 max-w-sm mx-auto leading-relaxed">
            Hệ thống đã nhận được biên lai chuyển khoản của bạn. Admin sẽ kiểm tra và xác nhận trong ít phút để tiến hành bàn giao cho Đội thi công.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Hoàn tất &amp; Đóng
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Thông tin VietQR */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <QRCodePayment
              amount={depositAmount}
              orderId={booking.id}
              addInfo={`COC DH${booking.id}`}
              accountNo="0355880362"
              accountName="VU VIET TAN"
              title="Quét mã VietQR chuyển tiền cọc"
              subTitle="Mở ứng dụng ngân hàng bất kỳ để quét mã chuyển nhanh"
              readOnly={true}
            />
          </div>

          {/* Form upload ảnh biên lai */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                📸 Tải lên ảnh chuyển khoản thành công <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Chụp ảnh màn hình giao dịch chuyển cọc thành công trên App ngân hàng để gửi cho Admin đối soát.
              </p>

              {proofPreview ? (
                <div className="relative border-2 border-emerald-400 bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center group">
                  <img
                    src={proofPreview}
                    alt="Biên lai chuyển khoản"
                    className="max-h-64 max-w-full rounded-xl object-contain shadow-sm"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
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
                  onClick={() => fileInputRef.current?.click()}
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Ô ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú thêm cho Admin (tùy chọn)
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="VD: Em đã chuyển khoản từ ngân hàng Vietcombank lúc 14h30..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {errorMsg}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Hủy &amp; Đóng
              </button>
              <button
                type="submit"
                disabled={loading || !proofPreview}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
              >
                {loading ? "Đang gửi ảnh..." : "📤 Gửi ảnh xác nhận cho Admin"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
