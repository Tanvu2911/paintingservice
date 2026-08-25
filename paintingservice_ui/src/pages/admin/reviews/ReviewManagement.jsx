import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatDate } from "../../../util/orderFlowUtils";
import { formatMoney } from "../../../util/formatters";
import {
  Star,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  MessageSquare,
  User,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  X,
  ExternalLink,
  ThumbsUp,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function ReviewManagement() {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [starFilter, setStarFilter] = useState("ALL"); // ALL, 5, 4, 3, 2, 1
  const [sortBy, setSortBy] = useState("NEWEST"); // NEWEST, OLDEST, RATING_DESC, RATING_ASC

  // Modals
  const [selectedReview, setSelectedReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [revRes, statsRes] = await Promise.all([
        AxiosConfig.get("/reviews"),
        AxiosConfig.get("/reviews/stats").catch(() => ({ data: null })),
      ]);

      const data = Array.isArray(revRes.data) ? revRes.data : [];
      setReviews(data);
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
      showToast?.("Lỗi khi tải danh sách đánh giá", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Tính toán số liệu thống kê
  const computedStats = useMemo(() => {
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
        lowRatings: 0,
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
    const lowRatings = two + one;

    return {
      total,
      average,
      fiveStars: five,
      fourStars: four,
      threeStars: three,
      twoStars: two,
      oneStar: one,
      fiveStarPct,
      lowRatings,
    };
  }, [reviews]);

  // Lọc và sắp xếp đánh giá
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Filter by Star
        if (starFilter !== "ALL" && r.rating !== Number(starFilter)) {
          return false;
        }

        // Search Keyword
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchId = String(r.id).includes(q) || String(r.bookingId).includes(q);
          const matchCustomer = (r.customerUsername || "").toLowerCase().includes(q) || (r.customerPhone || "").includes(q);
          const matchTech = (r.technicianUsername || "").toLowerCase().includes(q);
          const matchService = (r.serviceName || "").toLowerCase().includes(q);
          const matchComment = (r.comment || "").toLowerCase().includes(q);
          if (!matchId && !matchCustomer && !matchTech && !matchService && !matchComment) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "OLDEST") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "RATING_DESC") {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === "RATING_ASC") {
          return (a.rating || 0) - (b.rating || 0);
        }
        return 0;
      });
  }, [reviews, starFilter, searchTerm, sortBy]);

  // Xóa / Kiểm duyệt đánh giá
  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    try {
      setActionLoading(true);
      await AxiosConfig.delete(`/reviews/${deletingReview.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
      showToast?.(`Đã xóa đánh giá #${deletingReview.id} thành công`, "success");
      setDeletingReview(null);
      if (selectedReview?.id === deletingReview.id) {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error(err);
      showToast?.("Không thể xóa đánh giá này", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getRatingBadge = (rating) => {
    if (rating >= 5) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>5 Sao • Tuyệt vời</span>
        </span>
      );
    }
    if (rating === 4) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
          <span>4 Sao • Hài lòng</span>
        </span>
      );
    }
    if (rating === 3) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <Star className="w-3.5 h-3.5 fill-slate-400 text-slate-400" />
          <span>3 Sao • Bình thường</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
        <span>{rating} Sao • Cần cải thiện</span>
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Quản Lý Đánh Giá &amp; Góp Ý Khách Hàng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {reviews.length} Đánh giá
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chất lượng dịch vụ, phản hồi từ khách hàng và uy tín của đội thợ thi công.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReviews}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Điểm trung bình */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Điểm Đánh Giá Trung Bình
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-slate-900">{computedStats.average}</h3>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= Math.round(Number(computedStats.average))
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200"
                  }`}
              />
            ))}
            <span className="text-[11px] font-bold text-slate-500 ml-1.5">
              Từ {computedStats.total} lượt đánh giá
            </span>
          </div>
        </div>

        {/* Card 2: Tổng số đánh giá */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng Số Đánh Giá
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {computedStats.total}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Đã hoàn thành công trình</span>
            <span className="font-bold text-blue-600">100% chính chủ</span>
          </div>
        </div>

        {/* Card 3: Tỷ lệ 5 sao */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tỷ Lệ Đánh Giá 5 Sao
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {computedStats.fiveStarPct}%
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>{computedStats.fiveStars} lượt đánh giá xuất sắc</span>
            <span className="font-bold text-emerald-600">Tuyệt vời</span>
          </div>
        </div>

        {/* Card 4: Cần chú ý (1-2 sao) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cần Cải Thiện (1-2 Sao)
              </p>
              <h3 className={`text-2xl font-black mt-1 ${computedStats.lowRatings > 0 ? "text-rose-600" : "text-slate-800"}`}>
                {computedStats.lowRatings}
              </h3>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${computedStats.lowRatings > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
              }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Khách chưa hài lòng</span>
            <span className={`font-bold ${computedStats.lowRatings > 0 ? "text-rose-600" : "text-slate-400"}`}>
              {computedStats.lowRatings > 0 ? "Cần liên hệ hỗ trợ" : "Tất cả hài lòng"}
            </span>
          </div>
        </div>
      </div>

      {/* ── BỘ LỌC SAO TRỰC QUAN & THANH TÌM KIẾM ── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-5">
        {/* Phân bổ tỷ lệ sao (Click to Filter) */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Lọc Nhanh Theo Mức Đánh Giá
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={() => setStarFilter("ALL")}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${starFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border-slate-200/80"
                }`}
            >
              <div className="text-[11px] font-semibold opacity-80">Tất cả</div>
              <div className="text-lg font-black mt-0.5">{computedStats.total}</div>
            </button>

            {[5, 4, 3, 2, 1].map((s) => {
              const count =
                s === 5
                  ? computedStats.fiveStars
                  : s === 4
                    ? computedStats.fourStars
                    : s === 3
                      ? computedStats.threeStars
                      : s === 2
                        ? computedStats.twoStars
                        : computedStats.oneStar;

              const isSelected = starFilter === String(s);

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStarFilter(isSelected ? "ALL" : String(s))}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${isSelected
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-400/40"
                      : "bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border-slate-200/80"
                    }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>{s} Sao</span>
                    <Star className={`w-3 h-3 ${isSelected ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
                  </div>
                  <div className="text-lg font-black mt-0.5">{count}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thanh tìm kiếm & Sắp xếp */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo khách, thợ, mã đơn (#id) hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="RATING_DESC">Điểm sao cao nhất (5★ - 1★)</option>
              <option value="RATING_ASC">Điểm sao thấp nhất (1★ - 5★)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH ĐÁNH GIÁ ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">
              Danh Sách Đánh Giá Khách Hàng
            </h2>
            <span className="text-xs text-slate-400">
              ({filteredReviews.length} kết quả)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Mã Đơn / Ngày</th>
                <th className="py-3.5 px-6">Khách Hàng</th>
                <th className="py-3.5 px-6">Thợ Thi Công</th>
                <th className="py-3.5 px-6">Mức Đánh Giá</th>
                <th className="py-3.5 px-6">Nhận Xét / Góp Ý</th>
                <th className="py-3.5 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Star className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Không tìm thấy đánh giá nào</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi bộ lọc sao hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const customerName = r.customerUsername || "Khách hàng";
                  const techName = r.technicianUsername || "Chưa gán";

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReview(r)}
                      className="hover:bg-slate-50/70 transition cursor-pointer group"
                    >
                      {/* Đơn hàng & Ngày */}
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/orders/${r.bookingId}`)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] cursor-pointer"
                            title="Xem chi tiết đơn hàng"
                          >
                            <span>#{r.bookingId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(r.createdAt)}
                          </p>
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition leading-tight">{customerName}</p>
                            {r.customerPhone && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{r.customerPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Thợ thi công */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{techName}</p>
                            <p className="text-[10.5px] text-slate-400 truncate max-w-[130px]">
                              {r.serviceName || "Gói sơn sửa"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Mức sao */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {getRatingBadge(r.rating)}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-slate-200 text-slate-200"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Lời bình luận / Góp ý */}
                      <td className="py-4 px-6 max-w-xs">
                        {r.comment ? (
                          <p className="text-slate-700 line-clamp-2 leading-relaxed font-medium">
                            "{r.comment}"
                          </p>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            (Khách hàng không để lại nhận xét chữ)
                          </span>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedReview(r)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết đánh giá"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingReview(r)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Xóa đánh giá này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL XEM CHI TIẾT ĐÁNH GIÁ ── */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Chi Tiết Đánh Giá #{selectedReview.id}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Đơn hàng #{selectedReview.bookingId}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Star Display */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                  Điểm Đánh Giá
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {selectedReview.rating} / 5 Sao
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= selectedReview.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-200"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {getRatingBadge(selectedReview.rating)}
            </div>

            {/* Detailed Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Khách hàng</span>
                <p className="font-bold text-slate-900">{selectedReview.customerUsername || "Khách hàng"}</p>
                {selectedReview.customerPhone && (
                  <p className="text-slate-500 font-mono text-[11px]">{selectedReview.customerPhone}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Thợ thi công</span>
                <p className="font-bold text-slate-900">{selectedReview.technicianUsername || "Chưa gán"}</p>
                <p className="text-slate-500 text-[11px]">{selectedReview.serviceName || "Dịch vụ sơn"}</p>
              </div>

              {selectedReview.bookingAddress && (
                <div className="col-span-2 p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Địa chỉ công trình
                  </span>
                  <p className="font-medium text-slate-700">{selectedReview.bookingAddress}</p>
                </div>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Nội dung nhận xét &amp; Góp ý
              </span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium">
                {selectedReview.comment ? (
                  <p className="whitespace-pre-wrap">{selectedReview.comment}</p>
                ) : (
                  <p className="text-slate-400 italic">Khách hàng không để lại nhận xét chữ.</p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigate(`/admin/orders/${selectedReview.bookingId}`);
                  setSelectedReview(null);
                }}
                className="px-4 py-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xem đơn hàng #{selectedReview.bookingId}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA / KIỂM DUYỆT ĐÁNH GIÁ ── */}
      <ConfirmDialog
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteReview}
        title="Xóa đánh giá"
        message={`Đánh giá #${deletingReview?.id} của đơn #${deletingReview?.bookingId} sẽ bị xóa vĩnh viễn khỏi hệ thống.`}
        confirmText="Xóa vĩnh viễn"
        confirmColor="bg-rose-600 hover:bg-rose-700"
        submitting={actionLoading}
      />
    </div>
  );
}
