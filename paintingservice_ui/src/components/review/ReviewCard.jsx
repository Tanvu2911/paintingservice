import React from "react";
import { Star, Edit3, Trash2, User, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "../../util/orderFlowUtils";

export default function ReviewCard({ review, onEdit, onDelete }) {
  if (!review) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 rounded-3xl border border-emerald-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header: Title & Actions */}
      <div className="flex items-center justify-between border-b border-emerald-100/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
            ⭐
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Đánh Giá &amp; Góp Ý Của Bạn</h3>
            <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Đã đánh giá vào {formatDate(review.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Chỉnh sửa đánh giá"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Sửa</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200/80 transition flex items-center gap-1 cursor-pointer"
              title="Xóa đánh giá"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Review Content */}
      <div className="space-y-3">
        {/* Star Rating Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200 fill-slate-100"
                }`}
              />
            ))}
          </div>
          <span className="font-black text-slate-900 text-base">
            {review.rating}/5 sao
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {review.rating === 5
              ? "Rất tuyệt vời"
              : review.rating === 4
              ? "Hài lòng"
              : review.rating === 3
              ? "Bình thường"
              : review.rating === 2
              ? "Chưa hài lòng"
              : "Rất không hài lòng"}
          </span>
        </div>

        {/* Technician info tag if available */}
        {review.technicianUsername && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thợ thi công: <strong className="text-slate-900">@{review.technicianUsername}</strong></span>
          </div>
        )}

        {/* Comment text */}
        {review.comment ? (
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-2">
            <p className="whitespace-pre-wrap font-medium">{review.comment}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Khách hàng không để lại bình luận chữ.</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-100/60 px-3 py-2 rounded-xl">
        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
        <span>Đánh giá của bạn đã được ghi nhận và cập nhật vào hồ sơ chất lượng của đội thợ!</span>
      </div>
    </div>
  );
}
