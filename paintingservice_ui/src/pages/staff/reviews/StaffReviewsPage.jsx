import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatDate } from "../../../util/orderFlowUtils";
import {
  Star,
  Search,
  RefreshCw,
  MessageSquare,
  User,
  CheckCircle2,
  ThumbsUp,
  Award,
  Calendar,
  Filter,
  X,
  ExternalLink,
  Sparkles,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function StaffReviewsPage() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isTechnician = location.pathname.includes("/staff/technician");
  const roleTitle = isTechnician ? "Đội Thợ Thi Công" : "Nhân Viên Khảo Sát";

  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [viewScope, setViewScope] = useState("MY_REVIEWS"); // 'MY_REVIEWS' | 'ALL_REVIEWS'
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [starFilter, setStarFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("NEWEST");

  const fetchStaffReviews = async () => {
    setLoading(true);
    try {
      const [staffRes, allRes] = await Promise.all([
        AxiosConfig.get("/reviews/staff/me").catch(() => null),
        AxiosConfig.get("/reviews").catch(() => null),
      ]);

      const staffData = Array.isArray(staffRes?.data) ? staffRes.data : [];
      const allData = Array.isArray(allRes?.data) ? allRes.data : [];

      setMyReviews(staffData);
      setAllReviews(allData);

      if (staffData.length > 0) {
        setReviews(staffData);
        setViewScope("MY_REVIEWS");
      } else {
        setReviews(allData);
        setViewScope("ALL_REVIEWS");
      }
    } catch (err) {
      console.error("Lỗi tải đánh giá staff:", err);
      showToast?.("Không tải được dữ liệu đánh giá", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope) => {
    setViewScope(scope);
    if (scope === "MY_REVIEWS") {
      setReviews(myReviews);
    } else {
      setReviews(allReviews);
    }
  };

  useEffect(() => {
    fetchStaffReviews();
  }, [user]);

  // Thống kê cá nhân
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        total: 0,
        average: 5.0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
        fiveStarPct: 0,
      };
    }

    let sum = 0;
    let five = 0;
    let four = 0;
    let three = 0;
    let two = 0;
    let one = 0;

    reviews.forEach((r) => {
      const rate = Number(r.rating) || 5;
      sum += rate;
      if (rate === 5) five++;
      else if (rate === 4) four++;
      else if (rate === 3) three++;
      else if (rate === 2) two++;
      else if (rate === 1) one++;
    });

    const average = (sum / total).toFixed(1);
    const fiveStarPct = Math.round((five / total) * 100);

    return {
      total,
      average,
      fiveStars: five,
      fourStars: four,
      threeStars: three,
      twoStars: two,
      oneStar: one,
      fiveStarPct,
    };
  }, [reviews]);

  // Lọc và sắp xếp
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (starFilter !== "ALL" && r.rating !== Number(starFilter)) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchId = String(r.bookingId).includes(q);
          const matchCustomer = (r.customerUsername || "").toLowerCase().includes(q);
          const matchService = (r.serviceName || "").toLowerCase().includes(q);
          const matchComment = (r.comment || "").toLowerCase().includes(q);
          if (!matchId && !matchCustomer && !matchService && !matchComment) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === "OLDEST") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === "RATING_DESC") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "RATING_ASC") return (a.rating || 0) - (b.rating || 0);
        return 0;
      });
  }, [reviews, starFilter, searchTerm, sortBy]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/10 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hồ sơ Chất Lượng Dịch Vụ • {roleTitle}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Đánh Giá &amp; Nhận Xét Của Khách Hàng
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Xem toàn bộ lời khen, đánh giá sao và góp ý chân thành từ khách hàng sau khi hoàn tất công trình.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStaffReviews}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 border border-white/10 backdrop-blur-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 THẺ TỔNG KẾT CHỈ SỐ UY TÍN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Điểm sao trung bình */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Điểm Đánh Giá Của Bạn
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-black text-slate-900">{stats.average}</p>
            <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(Number(stats.average))
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200"
                }`}
              />
            ))}
            <span className="text-[11px] text-slate-400 ml-1">({stats.total} lượt đánh giá)</span>
          </div>
        </div>

        {/* Lời khen 5 sao */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đánh Giá Xuất Sắc (5 Sao)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{stats.fiveStars}</p>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Tỷ lệ hài lòng tuyệt đối:</span>
            <span className="font-bold text-emerald-600">{stats.fiveStarPct}%</span>
          </div>
        </div>

        {/* Tổng số công trình đã nghiệm thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cấp Bậc Uy Tín
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-3">
            {Number(stats.average) >= 4.8
              ? "Thợ Tay Nghề Vàng"
              : Number(stats.average) >= 4.0
              ? "Thợ Chuyên Nghiệp"
              : "Thợ Tiêu Chuẩn"}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            Duy trì 5 sao để nhận thêm nhiều công trình lớn!
          </div>
        </div>
      </div>

      {/* ── BỘ LỌC & TÌM KIẾM ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Chuyển đổi phạm vi đánh giá */}
        <div className="flex border-b border-slate-100 pb-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleScopeChange("MY_REVIEWS")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              viewScope === "MY_REVIEWS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Công trình của tôi ({myReviews.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange("ALL_REVIEWS")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              viewScope === "ALL_REVIEWS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tất cả đánh giá khách hàng ({allReviews.length})</span>
          </button>
        </div>

        {/* Nút lọc theo sao */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStarFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              starFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Tất cả ({reviews.length})
          </button>

          {[5, 4, 3, 2, 1].map((s) => {
            const count =
              s === 5
                ? stats.fiveStars
                : s === 4
                ? stats.fourStars
                : s === 3
                ? stats.threeStars
                : s === 2
                ? stats.twoStars
                : stats.oneStar;

            const isSelected = starFilter === String(s);

            return (
              <button
                key={s}
                type="button"
                onClick={() => setStarFilter(isSelected ? "ALL" : String(s))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{s}</span>
                <Star className={`w-3 h-3 ${isSelected ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
                <span className="opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Thanh tìm kiếm & Sắp xếp */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo khách, mã đơn, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="RATING_DESC">Điểm sao cao nhất</option>
              <option value="RATING_ASC">Điểm sao thấp nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── DANH SÁCH THẺ ĐÁNH GIÁ ── */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Chưa có đánh giá nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Khi khách hàng hoàn tất nghiệm thu công trình và gửi đánh giá, các phản hồi sẽ hiển thị chi tiết tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((r) => {
            const customerName = r.customerUsername || "Khách hàng";
            const initial = customerName.charAt(0).toUpperCase();

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition duration-200 flex flex-col justify-between space-y-3"
              >
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{customerName}</h4>
                      <p className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Stars Badge */}
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-black text-amber-800 text-xs ml-0.5">{r.rating}/5</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed font-medium">
                  {r.comment ? (
                    <p className="whitespace-pre-wrap">"{r.comment}"</p>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">(Khách hàng gửi đánh giá {r.rating} sao không kèm nhận xét)</p>
                  )}
                </div>

                {/* Footer Info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                    <span>Đơn công trình: #{r.bookingId}</span>
                  </div>
                  <span className="font-medium text-slate-600 truncate max-w-[150px]">
                    {r.serviceName || "Gói sơn sửa"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
