import { useState } from "react";
import ImageUpload from "../common/ImageUpload";

export default function DailyReportForm({ onSubmit, submitting = false, showToast }) {
  const [dailyContent, setDailyContent] = useState("");
  const [dailyProgress, setDailyProgress] = useState("");
  const [dailyMaterialShortage, setDailyMaterialShortage] = useState("");
  const [dailyMaterialCost, setDailyMaterialCost] = useState("");

  const [progressImages, setProgressImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleSelectImages = (imageFiles) => {
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setProgressImages((prev) => [...prev, ...imageFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setPreviewUrls((prev) => {
      if (prev[index] && prev[index].startsWith("blob:")) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
    setProgressImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!dailyContent.trim()) {
      showToast?.("Vui lòng nhập nội dung báo cáo ngày", "error");
      return;
    }

    let progress = null;
    if (dailyProgress !== "" && dailyProgress != null) {
      progress = Number(dailyProgress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        showToast?.("Tiến độ phải từ 0 đến 100%", "error");
        return;
      }
    }

    const materialCostNum = dailyMaterialCost !== "" ? Number(dailyMaterialCost) : 0;
    if (isNaN(materialCostNum) || materialCostNum < 0) {
      showToast?.("Số tiền vật tư phát sinh không hợp lệ", "error");
      return;
    }

    onSubmit?.({
      content: dailyContent.trim(),
      progressPercentage: progress,
      materialShortage: dailyMaterialShortage.trim() || null,
      materialCost: materialCostNum,
      progressImages,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
        <p className="font-semibold text-orange-800 text-sm">
          📅 Báo cáo mới cho ngày hôm nay
        </p>
        <p className="text-xs text-orange-700 mt-1">
          Ghi nhận tiến độ công việc, vật liệu phát sinh và chi phí mua bổ sung để Admin quyết toán.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nội dung báo cáo ngày *
        </label>
        <textarea
          value={dailyContent}
          onChange={(e) => setDailyContent(e.target.value)}
          rows={4}
          placeholder="Hôm nay đã thực hiện công việc gì? Tiến độ thực tế, vấn đề phát sinh..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tiến độ tổng thể (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={dailyProgress}
            onChange={(e) => setDailyProgress(e.target.value)}
            placeholder="Ví dụ: 60"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-xs text-slate-400 mt-1">Nhập từ 0 đến 100.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số tiền vật tư phát sinh (VNĐ)
          </label>
          <input
            type="number"
            min="0"
            step="10000"
            value={dailyMaterialCost}
            onChange={(e) => setDailyMaterialCost(e.target.value)}
            placeholder="Ví dụ: 500000"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-xs text-slate-400 mt-1">Admin sẽ hoàn tiền vào thù lao khi hoàn thành.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Chi tiết vật liệu thiếu / bổ sung
        </label>
        <textarea
          value={dailyMaterialShortage}
          onChange={(e) => setDailyMaterialShortage(e.target.value)}
          rows={2}
          placeholder="Ví dụ: Mua thêm 2 lon sơn lót chống thấm Kova, 1 cuộn băng keo..."
          className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <ImageUpload
        label="📷 Ảnh báo cáo tiến độ"
        previewUrls={previewUrls}
        onSelectImages={handleSelectImages}
        onRemoveImage={handleRemoveImage}
      />

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-semibold shadow transition"
        >
          {submitting ? "Đang gửi..." : "Gửi báo cáo ngày"}
        </button>
      </div>
    </form>
  );
}
