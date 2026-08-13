import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

export default function PaymentToStaff() {
  const { user, showToast } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await AxiosConfig.get("/bookings");
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setOrders(data.filter((o) => ["COMPLETED", "FULLY_PAID", "PAID_TO_STAFF"].includes(o.status)));
    } catch {
      showToast?.("Không tải được dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await AxiosConfig.get("/bookings");
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        if (isMounted) {
          setOrders(data.filter((o) => ["COMPLETED", "FULLY_PAID", "PAID_TO_STAFF"].includes(o.status)));
        }
      } catch {
        if (isMounted) {
          showToast?.("Không tải được dữ liệu", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handlePay = async (orderId) => {
    if (!window.confirm("Xác nhận đã trả tiền cho giám sát và đội thợ của đơn này?")) return;
    try {
      await AxiosConfig.put(`/bookings/${orderId}`, { status: "PAID_TO_STAFF" });
      showToast?.("Đã xác nhận trả tiền");
      fetchOrders();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi", "error");
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Thanh Toán Nhân Viên"
        subtitle="Các đơn đã thanh toán đủ – chờ admin trả tiền cho giám sát và đội thợ."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-4 px-6">Mã đơn</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Giám sát</th>
                  <th className="py-4 px-6">Giá trị HĐ</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-400">Không có đơn nào cần trả lương</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-bold">#{o.id}</td>
                      <td className="py-4 px-6">{o.customerName || o.customer?.username || "-"}</td>
                      <td className="py-4 px-6">{o.surveyorName || o.surveyor?.username || "-"}</td>
                      <td className="py-4 px-6 font-semibold text-blue-600">
                        {(o.totalAmount || o.surveyFee || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-4 px-6"><StatusBadge status={o.status} /></td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handlePay(o.id)}
                          className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg text-xs hover:bg-emerald-700"
                        >
                          Xác nhận đã trả
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}