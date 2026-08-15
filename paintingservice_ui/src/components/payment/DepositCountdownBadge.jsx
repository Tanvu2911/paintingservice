import { useState, useEffect } from "react";

/**
 * Component hiển thị đồng hồ đếm ngược 24 giờ chuyển tiền cọc
 * Tự động tính toán các mốc:
 * - > 12h: Bình thường (xanh lá / xanh dương)
 * - 2h - 12h: Nhắc nhở lần 1 (vàng cam)
 * - < 2h: Khẩn cấp lần cuối (đỏ nhấp nháy)
 * - <= 0: Đã quá hạn (hủy đơn)
 */
export default function DepositCountdownBadge({
  signedAt,
  deadline,
  isDepositPaid = false,
  isCancelled = false,
  onExpire,
  compact = false,
}) {
  // Tính thời điểm hết hạn (mặc định signedAt + 24h hoặc deadline truyền vào)
  const targetTime = deadline
    ? new Date(deadline).getTime()
    : signedAt
      ? new Date(signedAt).getTime() + 24 * 60 * 60 * 1000
      : Date.now() + 24 * 60 * 60 * 1000;

  const [timeLeft, setTimeLeft] = useState(Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    if (isDepositPaid || isCancelled) return;

    const timer = setInterval(() => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, isDepositPaid, isCancelled, onExpire]);

  if (isDepositPaid) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span>✓</span> Đã hoàn tất cọc
      </span>
    );
  }

  if (isCancelled || timeLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span>⚠️</span> Đã quá hạn 24h (Đơn hủy)
      </span>
    );
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  // Phân loại mức độ khẩn cấp
  const isUrgent = hours < 2; // Còn dưới 2 giờ
  const isWarning = hours >= 2 && hours < 12; // Đã qua 12h, còn dưới 12h

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${isUrgent
            ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-300"
            : isWarning
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
      >
        <span>⏳</span>
        <span>
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${isUrgent
          ? "bg-rose-50 border-rose-300 text-rose-900 shadow-sm shadow-rose-100"
          : isWarning
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : "bg-blue-50 border-blue-200 text-blue-900"
        }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${isUrgent
              ? "bg-rose-600 animate-ping"
              : isWarning
                ? "bg-amber-500"
                : "bg-blue-600"
            }`}
        />
        <div>
          <p className="font-bold">
            {isUrgent
              ? "⚠️ Khẩn cấp: Sắp hết hạn chuyển cọc (Nhắc nhở cuối)"
              : isWarning
                ? "🔔 Nhắc nhở lần 1: Vui lòng chuyển cọc sớm"
                : "⏱️ Thời hạn thanh toán cọc trong vòng 24 giờ"}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            {isUrgent
              ? "Đơn hàng sẽ tự động bị hủy nếu không nhận được tiền cọc trước khi hết giờ."
              : "Sau 24 giờ không nhận được cọc, hệ thống sẽ tự động hủy đơn."}
          </p>
        </div>
      </div>

      {/* Countdown display */}
      <div className="flex items-center gap-1 font-mono font-black text-sm bg-white/90 px-3 py-1.5 rounded-lg border border-inherit shadow-sm">
        <span className="text-base">{String(hours).padStart(2, "0")}</span>
        <span>:</span>
        <span className="text-base">{String(minutes).padStart(2, "0")}</span>
        <span>:</span>
        <span className="text-base">{String(seconds).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
