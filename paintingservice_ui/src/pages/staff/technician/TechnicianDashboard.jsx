import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Wrench,
  Clock,
  CheckCircle2,
  Wallet,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import useBookingHistory from "../../../hooks/useBookingHistory";
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mr-3"></div>
        Đang tải dữ liệu thi công...
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
              <Wrench className="w-3.5 h-3.5 text-slate-300" />
              <span>Bảng điều khiển Đội Thợ Thi Công</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Xin chào, {user?.fullName || user?.username || "Đội thợ"}!
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Quản lý các công trình được phân công, tiếp nhận việc, thi công và báo cáo hoàn thành công trình.
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

            {/* Nút Xem công trình */}
            <Link
              to="/staff/technician/jobs"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 border border-white/10 backdrop-blur-md cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-slate-300" />
              <span>Xem công trình</span>
              {Number(stats?.inProgress) > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-slate-900 rounded-full text-[10px] font-black">
                  {stats.inProgress}
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
              Đang thi công
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 mt-3">{stats.inProgress || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Công trình đang trong giai đoạn triển khai</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đã hoàn thành
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{stats.completed || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Công trình hoàn thành bàn giao</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng giá trị nhận
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-900" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">
            {formatMoney(stats.totalRevenue || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Tổng doanh số công trình phụ trách</p>
        </div>
      </div>

      {/* Safety Alert */}
      <div className="bg-white border border-slate-200 text-slate-800 p-5 rounded-2xl text-xs space-y-2 shadow-xs">
        <p className="font-bold flex items-center gap-2 text-slate-900">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Nguyên tắc an toàn lao động &amp; bảo vệ tài sản:</span>
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
          <li>Luôn che bạt, lót sàn và bảo vệ nội thất khách hàng trước khi bả matit/xả nhám.</li>
          <li>Đeo khẩu trang, kính bảo hộ và kiểm tra giàn giáo/thang chữ A chắc chắn trước khi leo trèo.</li>
          <li>Dọn dẹp mặt bằng sạch sẽ sau mỗi ca thi công, xếp gọn đồ nghề và lau sạch bụi sơn bám dính.</li>
        </ul>
      </div>
    </div>
  );
}
