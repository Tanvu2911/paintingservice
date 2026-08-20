import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ClipboardList, Home, ArrowRight, ShieldCheck, Clock, Check } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";

export default function VNPayCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);

  useEffect(() => {
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

  // Countdown timer 5s auto redirect
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const target = result?.bookingId
            ? `/customer/bookings/${result.bookingId}`
            : "/customer/ongoing";
          navigate(target, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, result, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-100 max-w-md w-full text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            <ShieldCheck className="w-7 h-7 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-black text-slate-800 tracking-tight">
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
      {/* Decorative emerald gradient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 max-w-lg w-full text-center space-y-6 relative z-10">
        {/* Status Icon Badge */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center border-2 border-emerald-200 shadow-md shadow-emerald-500/10 animate-in zoom-in-50 duration-300">
                <Check className="w-10 h-10 text-emerald-600 stroke-[3]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {isSuccess ? (isDeposit ? "Đặt cọc thành công" : "Tất toán thành công") : "Thanh toán thất bại"}
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
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {isDeposit ? "Tiền cọc công trình (30%)" : "Tất toán hợp đồng (70%)"}
                </span>
              </div>
            )}

            {result.amount && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Số tiền giao dịch:</span>
                <span className="font-black text-emerald-700 text-base font-mono">
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

        {/* 5s Auto-redirect Countdown Indicator */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tự động chuyển tiếp sau <strong>{countdown}s</strong>...</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
            {countdown}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {result?.bookingId ? (
            <button
              type="button"
              onClick={() => navigate(`/customer/bookings/${result.bookingId}`)}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Xem tiến độ đơn #{result.bookingId}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/customer/ongoing"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 text-center flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Về Quản lý yêu cầu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            to="/customer/dashboard"
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
