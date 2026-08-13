import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";

export default function SurveyDashboard() {
  // Lấy dữ liệu profile và showToast được truyền từ StaffLayout
  const { user, showToast } = useOutletContext();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 🛠️ Gọi API thực tế lấy thống kê của Khảo sát viên
        const res = await AxiosConfig.get("/staff/survey/dashboard-stats");
        setStats(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard:", err);
        showToast?.("Không thể tải dữ liệu thống kê", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-4 text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Xin chào user */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">
          Xin chào, {user?.fullName || user?.username}! 👋
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Chức vụ: Khảo sát viên | Email: {user?.email}
        </p>
      </div>

      {/* Hiển thị các con số thực từ API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Chờ khảo sát</p>
          <p className="text-2xl font-black text-amber-500 mt-2">{stats.pendingJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Đã hoàn thành</p>
          <p className="text-2xl font-black text-emerald-500 mt-2">{stats.completedJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Tổng thu nhập</p>
          <p className="text-2xl font-black text-blue-600 mt-2">
            {stats.totalEarnings?.toLocaleString("vi-VN")} đ
          </p>
        </div>
      </div>
    </div>
  );
}