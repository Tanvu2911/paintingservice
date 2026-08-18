import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";

export default function SurveyDashboard() {
  const { user, showToast } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
  });

  const [available, setAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await AxiosConfig.get("/staff/survey/dashboard-stats");
        setStats(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await AxiosConfig.get("/staff/me");
        if (res.data && res.data.available !== undefined) {
          setAvailable(res.data.available);
        }
      } catch (err) {
        console.error("Load staff profile error:", err);
      }
    };

    fetchDashboardData();
    fetchProfile();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      setToggling(true);
      const nextStatus = !available;
      await AxiosConfig.put("/staff/me", { available: nextStatus });
      setAvailable(nextStatus);
      showToast?.(
        nextStatus
          ? "Đã bật trạng thái sẵn sàng nhận lịch khảo sát mới!"
          : "Đã tạm tắt nhận lịch khảo sát!",
        "success"
      );
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi cập nhật trạng thái hoạt động", "error");
    } finally {
      setToggling(false);
    }
  };

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

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Trạng Thái Nhận Việc */}
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              <span className="text-xs font-semibold text-white/90">Trạng thái:</span>
              <button
                type="button"
                disabled={toggling}
                onClick={handleToggleAvailability}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  available
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    available ? "bg-white animate-pulse" : "bg-rose-400"
                  }`}
                ></span>
                <span>{available ? "🟢 Đang nhận đơn" : "🔴 Tạm nghỉ nhận đơn"}</span>
              </button>
            </div>

            <a
              href="/staff/survey/jobs"
              className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-2xl text-xs transition shadow-md flex items-center gap-2"
            >
              <span>📋</span> Lịch khảo sát ({stats.pendingJobs || 0})
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Khảo sát cần thực hiện
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
              ⏳
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-3">{stats.pendingJobs || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Đơn đang chờ tiếp nhận và đến đo đạc</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Khảo sát hoàn tất
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              ✅
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{stats.completedJobs || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Hồ sơ khảo sát đã gửi báo cáo cho Admin</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Thù lao khảo sát
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              💵
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 mt-3">
            {(stats.totalEarnings || 0).toLocaleString("vi-VN")} đ
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Tổng thu nhập từ phí khảo sát</p>
        </div>
      </div>
    </div>
  );
}