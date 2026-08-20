import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Calendar, Clock, CheckCircle2, Wallet, Search } from "lucide-react";
import AxiosConfig from "../../../util/AxiosConfig";
import { formatMoney } from "../../../util/formatters";

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

    const fetchStaffProfile = async () => {
      try {
        const res = await AxiosConfig.get("/staff/me");
        if (res.data && res.data.available !== undefined) {
          setAvailable(res.data.available);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin staff:", err);
      }
    };

    fetchDashboardData();
    fetchStaffProfile();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mr-3"></div>
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-slate-800 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/10">
              <Search className="w-3.5 h-3.5 text-slate-300" />
              <span>Bảng điều khiển Khảo sát &amp; Giám sát</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Xin chào, {user?.fullName || user?.username || "Giám sát viên"}!
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Theo dõi lịch khảo sát công trình, lập báo cáo hiện trạng kỹ thuật và nghiệm thu đơn hàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Nút Gạt Trạng Thái Hoạt Động (Toggle Switch) */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
              <div className="text-left">
                <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Trạng thái</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${available ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                  <span>{available ? "Sẵn sàng nhận việc" : "Tạm nghỉ nhận việc"}</span>
                </div>
              </div>

              {/* Nút Gạt Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={available}
                disabled={toggling}
                onClick={handleToggleAvailability}
                title={available ? "Gạt để tắt nhận việc" : "Gạt để bật nhận việc"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  available ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    available ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Nút Lịch khảo sát */}
            <Link
              to="/staff/survey/jobs"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 border border-white/10 backdrop-blur-md cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-300" />
              <span>Lịch khảo sát</span>
              {Number(stats.pendingJobs) > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-slate-900 rounded-full text-[10px] font-black">
                  {stats.pendingJobs}
                </span>
              )}
            </Link>
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
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-900" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">
            {formatMoney(stats.totalEarnings || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Tổng thu nhập từ phí khảo sát</p>
        </div>
      </div>
    </div>
  );
}