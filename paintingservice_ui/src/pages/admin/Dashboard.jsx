import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import DashboardHeader from "../../components/layout/DashboardHeader";
import StatCard from "../../components/common/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";

export default function Dashboard() {
  const { user, showToast } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [bookingsRes, contractsRes, usersRes, staffRes] = await Promise.all([
          AxiosConfig.get("/bookings").catch(() => ({ data: [] })),
          AxiosConfig.get("/contracts").catch(() => ({ data: [] })),
          AxiosConfig.get("/users").catch(() => ({ data: [] })),
          AxiosConfig.get("/staff").catch(() => ({ data: [] })),
        ]);

        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data?.content || [];
        const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : contractsRes.data?.content || [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.content || [];
        const staff = Array.isArray(staffRes.data) ? staffRes.data : staffRes.data?.content || [];

        setStats({
          totalOrders: bookings.length,
          pendingOrders: bookings.filter((b) => b.status === "PENDING").length,
          inProgressOrders: bookings.filter((b) => ["ASSIGNED", "ACCEPTED", "PROCESSING"].includes(b.status)).length,
          monthlyRevenue: contracts.reduce((sum, c) => sum + (Number(c.amount || c.totalAmount || 0) || 0), 0),
        });
        setRecentOrders(bookings.slice(0, 5));
        setStats((prev) => ({ ...prev, totalCustomers: users.filter((u) => u.role?.name === "ROLE_CUSTOMER" || u.role === "ROLE_CUSTOMER").length, totalStaff: staff.length }));
      } catch (err) {
        console.error(err);
        showToast?.("Không tải được dữ liệu dashboard", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <DashboardHeader
        title="Tổng quan hệ thống"
        subtitle="Thống kê nhanh về đơn hàng, nhân viên và doanh thu."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Tổng đơn hàng" value={stats?.totalOrders ?? 0} />
        <StatCard
          label="Đơn chờ xử lý"
          value={stats?.pendingOrders ?? 0}
          colorClass="text-amber-600"
          borderClass="border-l-4 border-l-amber-500"
        />
        <StatCard
          label="Đang thi công"
          value={stats?.inProgressOrders ?? 0}
          colorClass="text-orange-600"
          borderClass="border-l-4 border-l-orange-500"
        />
        <StatCard
          label="Khách hàng / Nhân viên"
          value={`${stats?.totalCustomers ?? 0} / ${stats?.totalStaff ?? 0}`}
          colorClass="text-emerald-600"
          borderClass="border-l-4 border-l-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Đơn hàng gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-4 px-6">Mã đơn</th>
                <th className="py-4 px-6">Khách hàng</th>
                <th className="py-4 px-6">Địa chỉ</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-800">#{o.id}</td>
                    <td className="py-4 px-6">{o.customerName || o.customer?.username}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{o.address}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}