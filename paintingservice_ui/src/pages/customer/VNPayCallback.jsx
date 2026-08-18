import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ClipboardList, Home } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";

export default function VNPayCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const query = location.search;
        if (!query) {
          setResult({
            success: false,
            message: "Không tìm thấy thông tin giao dịch phản hồi từ VNPay",
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
          message: err.response?.data?.message || "Lỗi khi xác thực giao dịch với hệ thống",
        });
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Đang đối soát giao dịch VNPay...</h2>
          <p className="text-xs text-slate-500">
            Hệ thống đang kiểm tra chữ ký số và cập nhật trạng thái đơn hàng của bạn. Vui lòng đợi trong giây lát!
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = result?.success === true;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs border border-slate-200 max-w-lg w-full text-center space-y-6">
        {/* Status Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-slate-900" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-xs">
              <XCircle className="w-8 h-8 text-rose-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-slate-900">
            {isSuccess ? "Thanh Toán VNPay Thành Công!" : "Thanh Toán Chưa Thành Công"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {result?.message || (isSuccess ? "Giao dịch đã được hệ thống xác nhận tự động." : "Đã có lỗi xảy ra trong quá trình thanh toán.")}
          </p>
        </div>

        {/* Details Card */}
        {result && (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-2.5 text-xs">
            {result.bookingId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-bold text-slate-900">#{result.bookingId}</span>
              </div>
            )}
            {result.paymentType && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Loại thanh toán:</span>
                <span className="font-bold text-slate-900">
                  {result.paymentType === "DEPOSIT" ? "Đặt cọc (30%)" : "Tất toán (70%)"}
                </span>
              </div>
            )}
            {result.amount && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatMoney(result.amount)}
                </span>
              </div>
            )}
            {result.transactionNo && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã GD VNPay:</span>
                <span className="font-mono text-slate-700 font-semibold">{result.transactionNo}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cổng thanh toán:</span>
              <span className="font-bold text-slate-800">VNPay Sandbox</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {result?.bookingId ? (
            <button
              onClick={() => navigate(`/customer/bookings/${result.bookingId}`)}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Xem chi tiết đơn hàng #{result.bookingId}</span>
            </button>
          ) : (
            <Link
              to="/customer/ongoing"
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs text-center flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Về Quản lý yêu cầu</span>
            </Link>
          )}

          <Link
            to="/customer/dashboard"
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Về Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
