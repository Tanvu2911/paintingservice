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
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 md:p-8 rounded-3xl text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
              <span>📋</span> Bảng điều khiển Khảo sát &amp; Giám sát
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Xin chào, {user?.fullName || user?.username || "Giám sát viên"}! 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Theo dõi lịch khảo sát công trình, lập báo cáo hiện trạng kỹ thuật và nghiệm thu đơn hàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/staff/survey/jobs"
              className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl text-xs transition shadow-md flex items-center gap-2"
            >
              <span>📋</span> Lịch khảo sát ({stats.pendingJobs})
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chờ khảo sát
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
              ⏳
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-3">{stats.pendingJobs}</p>
          <p className="text-[11px] text-slate-400 mt-1">Đơn đang chờ tiếp nhận &amp; khảo sát</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đã hoàn thành
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              ✅
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{stats.completedJobs}</p>
          <p className="text-[11px] text-slate-400 mt-1">Công trình khảo sát thành công</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng thu nhập
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              💰
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 mt-3">
            {stats.totalEarnings?.toLocaleString("vi-VN")} đ
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Thù lao khảo sát đã được thanh toán</p>
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 p-5 rounded-2xl text-xs space-y-2">
        <p className="font-bold text-blue-900 flex items-center gap-2">
          <span>💡</span> Quy trình chuẩn dành cho Giám sát viên:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 pt-1">
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
            <strong className="text-blue-800">1. Khảo sát hiện trạng:</strong> Đến công trình đo đạc diện tích m², kiểm tra độ ẩm tường và gửi báo cáo cho Admin.
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
            <strong className="text-blue-800">2. Giám sát thi công:</strong> Theo dõi tiến độ nhật ký ngày và hỗ trợ thợ xử lý phát sinh tại hiện trường.
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
            <strong className="text-blue-800">3. Nghiệm thu bàn giao:</strong> Kiểm tra chất lượng màng sơn cùng khách hàng và xác nhận nghiệm thu.
          </div>
        </div>
      </div>
    </div>
  );
}