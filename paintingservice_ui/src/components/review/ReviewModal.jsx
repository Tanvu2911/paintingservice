import React, { useState, useEffect } from "react";
import { Star, X, Sparkles, User, MessageSquare, Check, AlertCircle } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";

const RATING_DESCRIPTIONS = {
  1: { label: "Rất không hài lòng", color: "text-rose-600 bg-rose-50 border-rose-200", emoji: "😞" },
  2: { label: "Chưa hài lòng, cần cải thiện", color: "text-orange-600 bg-orange-50 border-orange-200", emoji: "😐" },
  3: { label: "Tạm ổn, đúng yêu cầu cơ bản", color: "text-amber-600 bg-amber-50 border-amber-200", emoji: "🙂" },
  4: { label: "Hài lòng, chất lượng tốt", color: "text-blue-600 bg-blue-50 border-blue-200", emoji: "😊" },
  5: { label: "Rất tuyệt vời, vượt mong đợi!", color: "text-emerald-700 bg-emerald-50 border-emerald-200", emoji: "🤩" },
};

const QUICK_TAGS = [
  "⚡ Thi công đúng tiến độ",
  "🎨 Nước sơn mịn & đều màu",
  "🧹 Dọn dẹp công trình sạch sẽ",
  "🤝 Thợ lịch sự & nhiệt tình",
  "🛡️ Che chắn nội thất cẩn thận",
  "💯 Đúng mã màu yêu cầu",
];

export default function ReviewModal({
  isOpen,
  onClose,
  booking,
  existingReview = null,
  showToast,
  onSuccess,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      let rawComment = existingReview.comment || "";
      let extractedTags = [];
      if (rawComment.includes("[Điểm nổi bật]:")) {
        const parts = rawComment.split("[Điểm nổi bật]:");
        rawComment = parts[0].trim();
        const tagStr = parts[1] || "";
        extractedTags = tagStr
          .split("•")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      setRating(existingReview.rating || 5);
      setComment(rawComment);
      setSelectedTags(extractedTags);
    } else {
      setRating(5);
      setComment("");
      setSelectedTags([]);
    }
  }, [existingReview, isOpen]);


  if (!isOpen || !booking) return null;

  const activeRating = hoverRating || rating;
  const currentDesc = RATING_DESCRIPTIONS[activeRating] || RATING_DESCRIPTIONS[5];
  const technicianName = booking.technicianName || booking.preferredTechnicianName || "Đội thợ thi công";
  const serviceName = booking.serviceName || booking.service?.name || "Dịch vụ sơn sửa nhà";

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      showToast?.("Vui lòng chọn số sao đánh giá (1 - 5 sao)", "warning");
      return;
    }

    setSubmitting(true);
    try {
      // Ghép quick tags vào comment nếu có
      let fullComment = comment.trim();
      if (selectedTags.length > 0) {
        const tagsString = selectedTags.join(" • ");
        if (fullComment) {
          fullComment = `${fullComment}\n[Điểm nổi bật]: ${tagsString}`;
        } else {
          fullComment = `[Điểm nổi bật]: ${tagsString}`;
        }
      }

      if (existingReview && existingReview.id) {
        // Cập nhật đánh giá
        await AxiosConfig.put(`/reviews/${existingReview.id}`, {
          rating,
          comment: fullComment,
        });
        showToast?.("Đã cập nhật đánh giá & góp ý thành công!", "success");
      } else {
        // Tạo mới đánh giá
        await AxiosConfig.post("/reviews", {
          bookingId: booking.id,
          rating,
          comment: fullComment,
        });
        showToast?.("Cảm ơn bạn đã gửi đánh giá cho đội thợ!", "success");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Submit review error:", error);
      showToast?.(
        error.response?.data?.message || "Không thể gửi đánh giá, vui lòng thử lại sau!",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative bg-linear-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-6 pb-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{existingReview ? "Chỉnh sửa đánh giá" : "Đánh giá dịch vụ & thợ"}</span>
          </div>

          <h2 className="text-xl font-black text-white">
            {existingReview ? "Cập nhật đánh giá công trình" : "Góp ý & Đánh giá chất lượng"}
          </h2>

          <p className="text-xs text-emerald-100/80 mt-1">
            Đơn hàng #{booking.id} • {serviceName}
          </p>

          {/* Card thợ phụ trách */}
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-200 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-emerald-200 font-semibold uppercase block">
                Đội thợ thi công trực tiếp
              </span>
              <span className="font-bold text-sm text-white truncate block">
                @{technicianName}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Star Rating Section */}
          <div className="text-center space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <label className="font-bold text-slate-800 text-sm block">
              Mức độ hài lòng của bạn <span className="text-rose-500">*</span>
            </label>

            {/* 5 Stars */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-125 transition-transform duration-150 cursor-pointer outline-none"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= activeRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "text-slate-300 fill-slate-100"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Description Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all">
              <span className="text-base">{currentDesc.emoji}</span>
              <span className={currentDesc.color}>{currentDesc.label}</span>
            </div>
          </div>

          {/* Quick Tags Suggestions */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block flex items-center justify-between">
              <span>Điểm bạn ấn tượng nhất (chọn nhanh):</span>
              <span className="text-[11px] text-slate-400 font-normal">Tùy chọn</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment & Feedback Textarea */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Góp ý &amp; Nhận xét chi tiết cho thợ:</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm thực tế của bạn về thái độ làm việc, tay nghề thợ sơn, độ sạch sẽ..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-[10.5px] text-slate-400">
              <span>Ý kiến của bạn giúp chúng tôi nâng cao chất lượng dịch vụ</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span>{existingReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
