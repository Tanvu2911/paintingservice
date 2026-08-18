import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import useBookingHistory from "../../../hooks/useBookingHistory";
import StatisticCards from "../components/StatisticCards";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";
import AxiosConfig from "../../../util/AxiosConfig";

export default function TechnicianDashboard() {
  const { user, showToast } = useOutletContext();
  const { stats, loading } = useBookingHistory("technician", showToast);

  const [available, setAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
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
          ? "Đã bật trạng thái sẵn sàng nhận đơn thi công mới!"
          : "Đã tạm tắt nhận đơn thi công!",
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mr-3"></div>
        Đang tải dữ liệu thi công...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 p-6 md:p-8 rounded-3xl text-white shadow-lg shadow-amber-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
              <span>🛠️</span> Bảng điều khiển Đội Thợ Thi Công
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Xin chào, {user?.fullName || user?.username || "Đội thợ"}! 👋
            </h1>
            <p className="text-amber-100 text-sm mt-1 max-w-xl">
              Quản lý các công trình được phân công, tiếp nhận việc, thi công và báo cáo hoàn thành công trình.
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
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
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
              href="/staff/technician/jobs"
              className="px-5 py-2.5 bg-white text-amber-800 hover:bg-amber-50 font-bold rounded-2xl text-xs transition shadow-md flex items-center gap-2"
            >
              <span>🛠️</span> Xem công trình ({stats.inProgress || 0})
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đang thi công
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              🏗️
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 mt-3">{stats.inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-1">Công trình đang trong giai đoạn triển khai</p>
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
          <p className="text-3xl font-black text-emerald-600 mt-3">{stats.completed}</p>
          <p className="text-[11px] text-slate-400 mt-1">Công trình hoàn thành bàn giao</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng giá trị nhận
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
              💰
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-3">
            {formatMoney(stats.totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Tổng doanh số công trình phụ trách</p>
        </div>
      </div>

      {/* Safety Alert */}
      <div className="bg-amber-50/80 border border-amber-200/80 text-amber-900 p-5 rounded-2xl text-xs space-y-2">
        <p className="font-bold flex items-center gap-2 text-amber-800">
          <span>⚠️</span> Nguyên tắc an toàn lao động &amp; bảo vệ tài sản:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
          <li>Luôn che bạt, lót sàn và bảo vệ nội thất khách hàng trước khi bả matit/xả nhám.</li>
          <li>Đeo khẩu trang, kính bảo hộ và kiểm tra giàn giáo/thang chữ A chắc chắn trước khi leo trèo.</li>
          <li>Dọn dẹp mặt bằng sạch sẽ sau mỗi ca thi công, xếp gọn đồ nghề và lau sạch bụi sơn bám dính.</li>
        </ul>
      </div>
    </div>
  );
}
