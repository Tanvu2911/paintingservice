import React from "react";
import { Camera, X } from "lucide-react";

export default function SurveyReportModal({
  selectedJob,
  surveyNote,
  setSurveyNote,
  materialNote,
  setMaterialNote,
  surveyPreviewUrls,
  handleSelectImages,
  removeSurveyPreview,
  closeModal,
  submitting,
  handleSubmitSurveyReport,
}) {
  if (!selectedJob) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Báo Cáo Khảo Sát #{selectedJob.id}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedJob.serviceName} • {selectedJob.address}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-500 text-base transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Nội dung khảo sát hiện trạng *
            </label>
            <textarea
              value={surveyNote}
              onChange={(e) => setSurveyNote(e.target.value)}
              rows={4}
              placeholder="Mô tả hiện trạng công trình, diện tích, độ ẩm tường, các hạng mục cần khắc phục..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Vật tư &amp; Giá dự kiến
            </label>
            <textarea
              value={materialNote}
              onChange={(e) => setMaterialNote(e.target.value)}
              rows={3}
              placeholder="Liệt kê loại sơn, số lượng thùng/lon, bột bả, keo chống thấm..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-900" />
              <span>Ảnh chụp khảo sát hiện trường</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-600 hover:bg-slate-50 transition">
              <Camera className="w-6 h-6 text-slate-500 mb-1" />
              <p className="text-xs text-slate-500">
                Nhấp để chọn ảnh khảo sát hiện trường
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleSelectImages(e, "survey")}
              />
            </label>

            {surveyPreviewUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {surveyPreviewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group shadow-xs"
                  >
                    <img
                      src={url}
                      alt={`survey-preview-${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSurveyPreview(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={closeModal}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleSubmitSurveyReport}
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {submitting ? "Đang xử lý..." : "Lưu & Gửi Báo Cáo Khảo Sát"}
          </button>
        </div>
      </div>
    </div>
  );
}


