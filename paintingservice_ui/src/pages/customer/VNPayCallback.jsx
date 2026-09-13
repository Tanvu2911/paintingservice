import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ClipboardList, Home, ArrowRight, ShieldCheck, Clock, Check, Pause, Play } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";
import { useAuth } from "../../context/AuthContext";

export default function VNPayCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const isAdmin = auth.isAdmin;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);
  const timerRef = useRef(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processCallback = async () => {
      try {
        const query = location.search;
        if (!query) {
          setResult({
            success: false,
            message: "Không tìm thấy thông tin giao dịch phản hồi từ cổng VNPay",
          });
          setLoading(false);
          return;
        }

        const res = await AxiosConfig.get(`/payments/vnpay/return${query}`);
        setResult(res.data);
      } catch (err) {
        console.error("VNPay callback error:", err);
        setResult({
          success: false,
          message: err.response?.data?.message || "Lỗi khi đối soát giao dịch với hệ thống",
        });
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [location.search]);

  // Countdown timer 5s auto redirect (chỉ tự động chuyển tiếp khi thanh toán THÀNH CÔNG và không bị tạm dừng)
  useEffect(() => {
    if (loading || !result?.success || autoRedirectPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const target = result?.bookingId
            ? (isAdmin ? `/admin/orders/${result.bookingId}` : `/customer/bookings/${result.bookingId}`)
            : (isAdmin ? "/admin/orders" : "/customer/ongoing");
          navigate(target, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, result, autoRedirectPaused, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-100 max-w-md w-full text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-[#1E3A8A] animate-spin" />
            <ShieldCheck className="w-7 h-7 text-[#1E3A8A] absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-black text-[#1E3A8A] tracking-tight">
              Đang đối soát giao dịch VNPay...
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống đang kiểm tra chữ ký số an toàn và cập nhật trạng thái đơn hàng của bạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.success === true;
  const isDeposit = result?.paymentType === "DEPOSIT";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative navy gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 max-w-lg w-full text-center space-y-6 relative z-10">
        {/* Status Icon Badge */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="relative">
              <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-3xl flex items-center justify-center border-2 border-blue-200 shadow-md shadow-blue-500/10 animate-in zoom-in-50 duration-300">
                <Check className="w-10 h-10 text-[#1E3A8A] stroke-[3]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center border-2 border-rose-200 shadow-md shadow-rose-500/10">
              <XCircle className="w-10 h-10 text-rose-600" />
            </div>
          )}
        </div>

        {/* Title and Message */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
            {isSuccess
              ? isDeposit
                ? "Đặt cọc thành công"
                : result?.paymentType === "WARRANTY_SUPPORT" || result?.paymentType === "WARRANTY"
                ? "Thanh toán bảo hành thành công"
                : "Tất toán thành công"
              : "Thanh toán thất bại"}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isSuccess ? "Thanh Toán Thành Công!" : "Giao Dịch Chưa Hoàn Tất"}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {result?.message || (isSuccess ? "Hệ thống đã nhận được thanh toán và cập nhật tiến độ công trình của bạn." : "Đã có lỗi xảy ra hoặc bạn đã hủy giao dịch trên cổng thanh toán.")}
          </p>
        </div>

        {/* Transaction Receipt Card */}
        {result && (
          <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/80 text-left space-y-3 text-xs">
            {result.bookingId && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Mã đơn công trình:</span>
                <span className="font-black text-slate-900 font-mono text-sm">#{result.bookingId}</span>
              </div>
            )}

            {result.paymentType && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Hạng mục thanh toán:</span>
                <span className="font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {isDeposit
                    ? "Tiền cọc công trình (30%)"
                    : result?.paymentType === "WARRANTY_SUPPORT" || result?.paymentType === "WARRANTY"
                    ? "Phí hỗ trợ sửa chữa bảo hành"
                    : "Tất toán hợp đồng (70%)"}
                </span>
              </div>
            )}

            {result.amount && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Số tiền giao dịch:</span>
                <span className="font-black text-[#1E3A8A] text-base font-mono">
                  {formatMoney(result.amount)}
                </span>
              </div>
            )}

            {result.transactionNo && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mã giao dịch VNPay:</span>
                <span className="font-mono text-slate-700 font-semibold">{result.transactionNo}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-400">Thời gian thực hiện:</span>
              <span className="font-medium text-slate-600">{new Date().toLocaleString("vi-VN")}</span>
            </div>
          </div>
        )}

        {/* 5s Auto-redirect Countdown Indicator (Chỉ hiển thị khi thành công) */}
        {isSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#1E3A8A] font-medium">
              <Clock className="w-4 h-4 text-[#1E3A8A] shrink-0" />
              {autoRedirectPaused ? (
                <span className="text-slate-600">Đã tạm dừng tự động chuyển hướng.</span>
              ) : (
                <span>Tự động chuyển tiếp sau <strong>{countdown}s</strong>...</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoRedirectPaused((prev) => !prev)}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
              >
                {autoRedirectPaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-600" />
                    <span>Tiếp tục</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-600" />
                    <span>Dừng</span>
                  </>
                )}
              </button>
              {!autoRedirectPaused && (
                <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white font-black flex items-center justify-center text-xs shrink-0">
                  {countdown}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {result?.bookingId ? (
            <button
              type="button"
              onClick={() => {
                const target = isAdmin
                  ? `/admin/orders/${result.bookingId}`
                  : `/customer/bookings/${result.bookingId}`;
                navigate(target);
              }}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{isAdmin ? `Xem đơn hàng #${result.bookingId}` : `Xem tiến độ đơn #${result.bookingId}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to={isAdmin ? "/admin/orders" : "/customer/ongoing"}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20 text-center flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{isAdmin ? "Quản lý đơn hàng" : "Quản lý yêu cầu"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            to={isAdmin ? "/admin/dashboard" : "/customer/dashboard"}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
