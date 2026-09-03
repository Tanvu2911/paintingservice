import React from "react";
import Modal from "../../../../components/common/Modal";
import { parseImageUrls } from "../../../../util/orderFlowUtils";

export default function OrderDailyReportsModal({
  reportsModalOpen,
  setReportsModalOpen,
  dailyReports,
  setPreviewImage,
}) {
  if (!reportsModalOpen) return null;

  return (
    <Modal
      isOpen={reportsModalOpen}
      onClose={() => setReportsModalOpen(false)}
      title={`Nhật Ký & Báo Cáo Tiến Độ Thi Công (${dailyReports.length})`}
      size="lg"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {dailyReports.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center font-medium">
            Chưa có báo cáo nhật ký thi công nào.
          </p>
        ) : (
          dailyReports.map((report, index) => {
            const reportImages = parseImageUrls(report.progressImages);
            return (
              <div
                key={report.id || index}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">
                      📅 Báo cáo ngày #{dailyReports.length - index}
                    </span>
                    <span className="text-slate-500 font-medium">
                      Lập bởi: <strong className="text-slate-900">@{report.reporterName || "Thợ thi công"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.progressPercentage != null && (
                      <span className="font-semibold text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                        {report.progressPercentage}% hoàn thành
                      </span>
                    )}
                    {report.createdAt && (
                      <span className="text-[11px] text-slate-500">
                        {new Date(report.createdAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>

                {report.progressPercentage != null && (
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                    />
                  </div>
                )}

                <div className="text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {report.content}
                </div>

                {report.materialShortage && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium">
                    <span className="font-bold block mb-1">⚠️ Vật tư phát sinh / thiếu hụt:</span>
                    {report.materialShortage}
                  </div>
                )}

                {reportImages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="font-semibold text-slate-900 block">
                      📸 Hình ảnh thi công thực tế ({reportImages.length} ảnh):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {reportImages.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setPreviewImage(imgUrl)}
                          className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white hover:opacity-90 transition cursor-pointer shadow-xs relative group"
                        >
                          <img
                            src={imgUrl}
                            alt={`Tiến độ ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/150x150?text=Anh+TD";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                            🔍 Xem
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => setReportsModalOpen(false)}
            className="px-5 py-2 bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

