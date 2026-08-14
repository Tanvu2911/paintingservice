import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import PaymentSection from "../../components/payment/PaymentSection";

function BookingDetail({ user, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBooking = async () => {
    try {
      const res = await AxiosConfig.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (error) {
      console.error(error);
      showToast?.("Không tải được thông tin đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    fetchBooking();
  }, [id, user, navigate, showToast]);

  const formatDate = (dateInput) => {
    if (Array.isArray(dateInput)) {
      const [year, month, day] = dateInput;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return dateInput || "—";
  };

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
            onClick={() => navigate("/home")}
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
          <PaymentSection booking={booking} showToast={showToast} onRefresh={fetchBooking} />
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
