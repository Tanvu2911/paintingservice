import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Wrench,
  Clock,
  CheckCircle2,
  Wallet,
  AlertTriangle,
  Briefcase,
  Star,
  ChevronRight,
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
  const [ratingStats, setRatingStats] = useState({ average: 5.0, count: 0 });

  useEffect(() => {
    const fetchProfileAndRating = async () => {
      try {
        const [profRes, revRes] = await Promise.all([
          AxiosConfig.get("/staff/me").catch(() => null),
          AxiosConfig.get("/reviews/staff/me").catch(() => null),
        ]);

        if (profRes?.data && profRes.data.available !== undefined) {
          setAvailable(profRes.data.available);
        }

        const revs = Array.isArray(revRes?.data) ? revRes.data : [];
        if (revs.length > 0) {
          const sum = revs.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
          setRatingStats({
            average: (sum / revs.length).toFixed(1),
            count: revs.length,
          });
        } else if (profRes?.data?.rating) {
          setRatingStats({
            average: Number(profRes.data.rating).toFixed(1),
            count: 0,
          });
        }
      } catch (err) {
        console.error("Load staff profile/review error:", err);
      }
    };
    fetchProfileAndRating();
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
      <div className="bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#090D1A] p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/15">
              <Wrench className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bảng điều khiển Đội Thợ Thi Công</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Xin chào, {user?.fullName || user?.username || "Đội thợ"}!
            </h1>
            <p className="text-emerald-100/70 text-xs mt-1 max-w-xl">
              Quản lý tiến độ công trình thi công, báo cáo nhật ký sơn hàng ngày và theo dõi thù lao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Trạng thái Bật/Tắt Nhận Đơn */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
              <div className="text-left">
                <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider">
                  Trạng thái hoạt động
                </p>
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
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 border border-emerald-400/30 shadow-md cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-white" />
              <span>Xem công trình</span>
              {Number(stats?.inProgress) > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-emerald-900 rounded-full text-[10px] font-black">
                  {stats.inProgress}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 rounded-3xl border border-emerald-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Đang thi công
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-xs shadow-emerald-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{stats?.inProgress || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Công trình đang triển khai</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50/70 via-white to-white p-5 rounded-3xl border border-teal-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Đã hoàn thành
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white shadow-xs shadow-teal-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-teal-600 mt-3">{stats?.completed || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Công trình đã bàn giao</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 via-white to-white p-5 rounded-3xl border border-amber-100 shadow-xs hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Đánh giá khách hàng
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white shadow-xs shadow-amber-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 fill-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-3xl font-black text-amber-600">{ratingStats.average}</span>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">{ratingStats.count} lượt đánh giá</span>
            <Link
              to="/staff/technician/reviews"
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5"
            >
              <span>Xem góp ý</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 rounded-3xl border border-emerald-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Tổng thù lao nhận
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-xs shadow-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3 truncate font-mono">
            {formatMoney(stats?.totalRevenue || 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Tổng thù lao công trình</p>
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
