import React from "react";
import { ClipboardCheck, Search, Image as ImageIcon } from "lucide-react";
import { parseImageUrls } from "../../util/orderFlowUtils";

export default function SurveyReportCard({
  surveyDetail,
  supervisorName,
  onPreviewImage,
  className = "",
}) {
  if (!surveyDetail) return null;

  const surveyImages = parseImageUrls(surveyDetail.surveyImages);

  return (
    <div className={`p-5 rounded-3xl bg-blue-50/40 border border-blue-200/80 space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
            📋
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm">
              Báo Cáo Khảo Sát Hiện Trạng
            </h4>
            <span className="text-[11px] text-blue-800 font-semibold">
              Lập bởi Giám sát: @{supervisorName || "Giám sát viên"}
            </span>
          </div>
        </div>

        {surveyDetail.supervisorAccepted && (
          <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ✓ Đã duyệt hiện trạng
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Ghi chú tường */}
        <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1.5 shadow-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-blue-900">
            <span>🔍</span> Hiện trạng tường &amp; bề mặt:
          </span>
          <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
            {surveyDetail.surveyNote || "Đã kiểm tra bề mặt tường đạt yêu cầu."}
          </p>
        </div>

        {/* Đề xuất vật tư */}
        <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1.5 shadow-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-blue-900">
            <span>🧱</span> Đề xuất vật tư &amp; kỹ thuật:
          </span>
          <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
            {surveyDetail.materialNote || "Sơn chính hãng cao cấp chống thấm."}
          </p>
        </div>
      </div>

      {/* Vật tư phát sinh / thiếu hụt */}
      {surveyDetail.materialShortage && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
          <span className="font-bold text-amber-900 flex items-center gap-1.5">
            <span>⚠️</span> Báo cáo thiếu hụt / phát sinh vật tư:
          </span>
          <p className="text-amber-800 leading-relaxed font-medium whitespace-pre-wrap">
            {surveyDetail.materialShortage}
          </p>
        </div>
      )}

      {/* Album ảnh khảo sát */}
      {surveyImages.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Hình ảnh chụp hiện trạng ({surveyImages.length} ảnh):</span>
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {surveyImages.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => onPreviewImage?.(imgUrl)}
                className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white hover:opacity-90 hover:scale-105 transition cursor-pointer shadow-xs group relative"
              >
                <img
                  src={imgUrl}
                  alt={`Ảnh khảo sát ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/150x150?text=Anh+KS";
                  }}
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                  🔍 Xem
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
