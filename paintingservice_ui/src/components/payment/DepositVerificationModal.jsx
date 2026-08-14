import { useState } from "react";
import DepositCountdownBadge from "./DepositCountdownBadge";
import { formatMoney } from "../../util/formatters";

/**
 * Modal dành cho Admin:
 * - Xem ảnh biên lai chuyển khoản phóng to
 * - Xem ghi chú của khách hàng
 * - Nút "Xác nhận đã nhận tiền cọc"
 * - Nút "Gia hạn thêm 24 giờ"
 */
export default function DepositVerificationModal({
  payment,
  booking,
  onClose,
  onConfirmDeposit,
  onExtendDeadline,
  onReject,
  loading = false,
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [extendReason, setExtendReason] = useState("");
  const [showExtendInput, setShowExtendInput] = useState(false);

  if (!payment && !booking) return null;

  const currentBooking = booking || payment?.booking;
  const depositAmount =
    payment?.amount ||
    currentBooking?.depositAmount ||
    (Number(currentBooking?.totalAmount) || 0) * 0.3;

  const proofImg = payment?.proofImage || payment?.receiptImage || currentBooking?.depositProofImage;

  return (
    <div className="space-y-5 max-h-[85vh] overflow-y-auto px-1">
      {/* 1. Countdown đếm ngược 24h */}
      {currentBooking && (
        <DepositCountdownBadge
          signedAt={currentBooking.createdAt || currentBooking.appointmentDate}
          deadline={currentBooking.depositDeadline}
          isDepositPaid={currentBooking.paymentStatus === "DEPOSIT_PAID"}
          isCancelled={currentBooking.status === "CANCELLED"}
        />
      )}

      {/* 2. Thông tin đơn & khách hàng */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 font-medium">Mã đơn hàng:</span>
          <p className="font-bold text-slate-800 text-sm">#{currentBooking?.id || payment?.bookingId}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Khách hàng:</span>
          <p className="font-bold text-slate-800">
            {currentBooking?.customerName || currentBooking?.customer?.username || "—"}
          </p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Số tiền cọc cần thu:</span>
          <p className="font-black text-rose-600 text-sm">
            {formatMoney(depositAmount)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200">
          <span className="text-slate-400 font-medium">Địa chỉ công trình:</span>
          <p className="font-semibold text-slate-700">{currentBooking?.address || "Chưa có địa chỉ"}</p>
        </div>
      </div>

      {/* 3. Ảnh biên lai chuyển khoản */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            📸 Ảnh biên lai khách gửi
          </span>
          {proofImg && (
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              {isZoomed ? "Thu nhỏ 🔍" : "Phóng to toàn màn hình 🔍"}
            </button>
          )}
        </div>

        {proofImg ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 p-2 flex items-center justify-center">
            <img
              src={proofImg}
              alt="Ảnh biên lai"
              onClick={() => setIsZoomed(true)}
              className={`object-contain rounded-lg transition-all cursor-zoom-in ${
                isZoomed ? "max-h-[70vh] w-full" : "max-h-72"
              }`}
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            Khách hàng chưa tải lên ảnh chụp bill chuyển khoản (đã quét mã chuyển khoản trực tiếp).
          </div>
        )}

        {/* Ghi chú của khách */}
        {payment?.note && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
            <span className="font-bold">Ghi chú từ khách: </span>
            <span>{payment.note}</span>
          </div>
        )}
      </div>

      {/* 4. Form gia hạn thời gian 24h nếu khách có lý do */}
      {showExtendInput && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900">⏱️ Gia hạn thêm 24 giờ nộp cọc</span>
            <button
              type="button"
              onClick={() => setShowExtendInput(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-700 text-[11px]">
            Hệ thống sẽ cộng thêm +24 giờ vào thời hạn thanh toán cọc cho đơn hàng này.
          </p>
          <input
            type="text"
            value={extendReason}
            onChange={(e) => setExtendReason(e.target.value)}
            placeholder="Nhập lý do gia hạn (VD: Khách đi công tác, chuyển khoản chậm do bảo trì...)"
            className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => {
              if (onExtendDeadline) onExtendDeadline(currentBooking?.id, extendReason);
              setShowExtendInput(false);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
          >
            Xác nhận gia hạn +24h
          </button>
        </div>
      )}

      {/* 5. Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          Đóng
        </button>

        {!showExtendInput && (
          <button
            type="button"
            onClick={() => setShowExtendInput(true)}
            disabled={loading}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition"
          >
            ⏳ Gia hạn +24h
          </button>
        )}

        {onReject && (
          <button
            type="button"
            onClick={() => onReject(payment?.id)}
            disabled={loading}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition"
          >
            ❌ Từ chối
          </button>
        )}

        <button
          type="button"
          onClick={() => onConfirmDeposit(payment?.id || currentBooking?.id)}
          disabled={loading}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
        >
          {loading ? "Đang xử lý..." : "✓ Xác nhận đã nhận tiền cọc"}
        </button>
      </div>
    </div>
  );
}
