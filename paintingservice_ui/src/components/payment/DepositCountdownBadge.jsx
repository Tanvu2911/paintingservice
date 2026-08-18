import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Check } from "lucide-react";

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
        <Check className="w-3.5 h-3.5" />
        <span>Đã hoàn tất cọc</span>
      </span>
    );
  }

  if (isCancelled || timeLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Đã quá hạn 24h (Đơn hủy)</span>
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
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
          isUrgent
            ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-300"
            : isWarning
            ? "bg-amber-100 text-amber-800 border border-amber-300"
            : "bg-slate-100 text-slate-800 border border-slate-300"
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
        isUrgent
          ? "bg-rose-50 border-rose-300 text-rose-900 shadow-xs"
          : isWarning
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-slate-50 border-slate-200 text-slate-900"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Clock className="w-5 h-5 text-slate-700 shrink-0" />
        <div>
          <p className="font-bold">
            {isUrgent
              ? "Khẩn cấp: Sắp hết hạn chuyển cọc (Nhắc nhở cuối)"
              : isWarning
              ? "Nhắc nhở: Vui lòng thanh toán cọc sớm"
              : "Thời hạn thanh toán cọc trong vòng 24 giờ"}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            {isUrgent
              ? "Đơn hàng sẽ tự động bị hủy nếu không nhận được tiền cọc trước khi hết giờ."
              : "Sau 24 giờ không nhận được cọc, hệ thống sẽ tự động hủy đơn để nhường lịch thợ."}
          </p>
        </div>
      </div>

      {/* Countdown display */}
      <div className="flex items-center gap-1 font-mono font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
        <span>{String(hours).padStart(2, "0")}</span>
        <span>:</span>
        <span>{String(minutes).padStart(2, "0")}</span>
        <span>:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
