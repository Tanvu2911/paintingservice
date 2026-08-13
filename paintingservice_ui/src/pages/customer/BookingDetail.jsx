import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/StatusBadge";

function BookingDetail({ user, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await AxiosConfig.get(`/bookings/${id}`);
        if (!cancelled) {
          setBooking(res.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          showToast("Không tải được thông tin đơn hàng", "error");
          navigate("/");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user, navigate, showToast]);

  const formatDate = (dateInput) => {
    if (Array.isArray(dateInput)) {
      const [year, month, day] = dateInput;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return dateInput || "—";
  };

  const formatMoney = (amount) => {
    if (amount == null) return "0 VNĐ";
    return Number(amount).toLocaleString("vi-VN") + " VNĐ";
  };

  // ===== THANH TOÁN ZALOPAY (khớp backend @RequestParam) =====
  const handlePayment = async (paymentType) => {
    if (!booking) return;

    const confirmMsg =
      paymentType === "DEPOSIT"
        ? "Xác nhận thanh toán tiền cọc?"
        : "Xác nhận thanh toán phần còn lại?";

    if (!window.confirm(confirmMsg)) return;

    try {
      setPaying(true);

      const res = await AxiosConfig.post(
        `/payments/zalopay/create?bookingId=${booking.id}&paymentType=${paymentType}`
      );

      const data = res.data;

      if (data?.order_url) {
        window.location.href = data.order_url;
      } else if (data?.qr_code) {
        showToast("Vui lòng quét mã QR để thanh toán", "info");
      } else {
        showToast("Không nhận được link thanh toán từ ZaloPay", "error");
      }
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi tạo đơn thanh toán";
      showToast(msg, "error");
    } finally {
      setPaying(false);
    }
  };

  const canPayDeposit =
    booking &&
    !booking.depositPaid &&
    [
      "WAITING_CUSTOMER_SIGNATURE",
      "ASSIGNED",
      "PROCESSING",
      "CONTRACT_APPROVED",
    ].includes(booking.status);

  const canPayFinal =
    booking &&
    booking.depositPaid &&
    !booking.finalPaid &&
    ["WORKER_COMPLETED", "COMPLETED", "WAITING_FINAL_PAYMENT"].includes(
      booking.status
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Đang tải chi tiết đơn...</div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            ← Quay lại
          </button>
          <h1 className="text-lg font-black text-slate-900">
            Chi tiết đơn #{booking.id}
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Trạng thái hiện tại
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Ngày tạo</div>
              <div className="font-semibold">
                {formatDate(booking.createdAt || booking.appointmentDate)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-500 mb-2">
                Thông tin công trình
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-slate-400">Hạng mục:</span>{" "}
                  <span className="font-semibold">
                    {booking.serviceName || booking.service?.name || "—"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Địa chỉ:</span>{" "}
                  <span className="font-semibold">{booking.address || "—"}</span>
                </p>
                <p>
                  <span className="text-slate-400">Ngày hẹn:</span>{" "}
                  <span className="font-semibold">
                    {formatDate(booking.appointmentDate)}{" "}
                    {booking.appointmentTime || ""}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Kỹ thuật viên:</span>{" "}
                  <span className="font-semibold text-blue-600">
                    {booking.technicianName ||
                      booking.preferredTechnicianName ||
                      "Chưa phân công"}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-500 mb-2">
                Mô tả yêu cầu
              </h3>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {booking.description || "Không có mô tả"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            💰 Thông tin thanh toán
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                Tổng giá trị
              </div>
              <div className="text-lg font-black text-slate-800">
                {formatMoney(booking.totalAmount || booking.service?.basePrice)}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-xs text-blue-500 font-bold uppercase mb-1">
                Tiền cọc
              </div>
              <div className="text-lg font-black text-blue-700">
                {formatMoney(
                  booking.depositAmount || (booking.totalAmount || 0) * 0.3
                )}
              </div>
              <div className="text-[10px] mt-1 font-semibold">
                {booking.depositPaid ? (
                  <span className="text-emerald-600">Đã thanh toán ✓</span>
                ) : (
                  <span className="text-amber-600">Chưa thanh toán</span>
                )}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-xs text-emerald-600 font-bold uppercase mb-1">
                Còn lại
              </div>
              <div className="text-lg font-black text-emerald-700">
                {formatMoney(
                  booking.remainingAmount ||
                    (booking.totalAmount || 0) - (booking.paidAmount || 0)
                )}
              </div>
              <div className="text-[10px] mt-1 font-semibold">
                {booking.finalPaid ? (
                  <span className="text-emerald-600">Đã thanh toán ✓</span>
                ) : (
                  <span className="text-amber-600">Chưa thanh toán</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {canPayDeposit && (
              <button
                onClick={() => handlePayment("DEPOSIT")}
                disabled={paying}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                {paying ? "Đang tạo đơn..." : "Thanh toán tiền cọc (ZaloPay)"}
              </button>
            )}

            {canPayFinal && (
              <button
                onClick={() => handlePayment("FINAL")}
                disabled={paying}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
              >
                {paying
                  ? "Đang tạo đơn..."
                  : "Thanh toán phần còn lại (ZaloPay)"}
              </button>
            )}

            {!canPayDeposit && !canPayFinal && (
              <div className="w-full text-center py-3 text-sm text-slate-400 bg-slate-50 rounded-xl">
                {booking.finalPaid
                  ? "Đơn hàng đã thanh toán đầy đủ"
                  : "Chưa đến giai đoạn thanh toán"}
              </div>
            )}
          </div>
        </div>

        {booking.notes && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 mb-2">Ghi chú</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {booking.notes}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default BookingDetail;