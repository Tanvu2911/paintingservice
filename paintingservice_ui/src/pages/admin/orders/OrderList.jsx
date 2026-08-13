import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatCard from "../../../components/common/StatCard";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

export default function OrderList() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await AxiosConfig.get("/bookings");
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        const filtered = filterStatus ? data.filter((o) => o.status === filterStatus) : data;
        setOrders(filtered);
      } catch {
        showToast?.("Không tải được danh sách đơn hàng", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filterStatus, showToast]);

  const statusCounts = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    inProgress: orders.filter((o) => ["ASSIGNED", "ACCEPTED", "PROCESSING"].includes(o.status)).length,
    completed: orders.filter((o) => ["COMPLETED", "FULLY_PAID", "PAID_TO_STAFF"].includes(o.status)).length,
  };

  return (
    <div>
      <DashboardHeader
        title="Quản Lý Yêu Cầu / Đơn Hàng"
        subtitle="Theo dõi và xử lý toàn bộ đơn hàng của khách hàng."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Tổng đơn" value={statusCounts.total} />
        <StatCard label="Chờ xử lý" value={statusCounts.pending} colorClass="text-amber-600" borderClass="border-l-4 border-l-amber-500" />
        <StatCard label="Đang thi công" value={statusCounts.inProgress} colorClass="text-orange-600" borderClass="border-l-4 border-l-orange-500" />
        <StatCard label="Hoàn thành" value={statusCounts.completed} colorClass="text-emerald-600" borderClass="border-l-4 border-l-emerald-500" />
      </div>

      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="ASSIGNED">Đã phân công</option>
          <option value="ACCEPTED">Đã tiếp nhận</option>
          <option value="PROCESSING">Đang thi công</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

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
                  <th className="py-4 px-6">Địa chỉ</th>
                  <th className="py-4 px-6">Giám sát</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Thời gian khảo sát</th>
                  <th className="py-4 px-6 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-8 text-slate-400">Không có đơn hàng</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-bold text-slate-800">#{o.id}</td>
                      <td className="py-4 px-6">{o.customerName || o.customer?.username || "-"}</td>
                      <td className="py-4 px-6 max-w-xs truncate">{o.address}</td>
                      <td className="py-4 px-6">{o.supervisorName || o.supervisor?.username || "-"}</td>
                      <td className="py-4 px-6"><StatusBadge status={o.status} /></td>
                      <td className="py-4 px-6 text-slate-500">
                        {o.appointmentDate ? (
                          <>
                            <div>
                              {new Date(o.appointmentDate).toLocaleDateString("vi-VN")}
                            </div>
                            <div className="text-xs text-slate-400">
                              {o.appointmentTime || "--"}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/admin/bookings/${o.id}`)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold rounded-lg text-xs hover:bg-blue-100"
                        >
                          Xem
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