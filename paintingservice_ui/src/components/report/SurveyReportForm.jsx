import { useState } from "react";
import ImageUpload from "../common/ImageUpload";

export default function SurveyReportForm({
  initialData = {},
  onSubmit,
  submitting = false,
  showToast,
}) {
  const [surveyNote, setSurveyNote] = useState(initialData.surveyNote || "");
  const [materialNote, setMaterialNote] = useState(initialData.materialNote || "");
  const [totalAmount, setTotalAmount] = useState(
    initialData.totalAmount != null ? String(initialData.totalAmount) : ""
  );
  const [depositAmount, setDepositAmount] = useState(
    initialData.depositAmount != null ? String(initialData.depositAmount) : ""
  );
  const [materialShortage, setMaterialShortage] = useState(
    initialData.materialShortage || ""
  );

  const [surveyImages, setSurveyImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleSelectImages = (imageFiles) => {
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setSurveyImages((prev) => [...prev, ...imageFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setPreviewUrls((prev) => {
      if (prev[index] && prev[index].startsWith("blob:")) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
    setSurveyImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!surveyNote.trim() && !materialNote.trim() && !materialShortage.trim()) {
      showToast?.("Vui lòng nhập ít nhất một ghi chú", "error");
      return;
    }

    const total = Number(totalAmount);
    if (!totalAmount || isNaN(total) || total <= 0) {
      showToast?.("Vui lòng nhập tổng báo giá hợp lệ (> 0)", "error");
      return;
    }

    let deposit = null;
    if (depositAmount !== "" && depositAmount != null) {
      deposit = Number(depositAmount);
      if (isNaN(deposit) || deposit <= 0) {
        showToast?.("Tiền cọc không hợp lệ", "error");
        return;
      }
      if (deposit > total) {
        showToast?.("Tiền cọc không được lớn hơn tổng báo giá", "error");
        return;
      }
    }

    onSubmit?.({
      surveyNote: surveyNote.trim(),
      materialNote: materialNote.trim(),
      materialShortage: materialShortage.trim(),
      totalAmount: total,
      depositAmount: deposit,
      surveyImages,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Ghi chú khảo sát (BookingDetail) *
        </label>
        <textarea
          value={surveyNote}
          onChange={(e) => setSurveyNote(e.target.value)}
          rows={4}
          placeholder="Mô tả tình trạng hiện trường, kích thước, vấn đề phát hiện..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Ghi chú vật liệu / giá cần mua (BookingDetail)
        </label>
        <textarea
          value={materialNote}
          onChange={(e) => setMaterialNote(e.target.value)}
          rows={3}
          placeholder="Liệt kê vật liệu cần mua, số lượng, giá ước tính..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tổng báo giá (VNĐ - Booking) *
          </label>
          <input
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="Ví dụ: 5000000"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tiền cọc (VNĐ - Booking)
          </label>
          <input
            type="number"
            min="0"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Để trống = 30%"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Phát sinh thiếu vật liệu (BookingDetail)
        </label>
        <textarea
          value={materialShortage}
          onChange={(e) => setMaterialShortage(e.target.value)}
          rows={3}
          placeholder="Vật liệu còn thiếu / cần bổ sung thêm..."
          className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <ImageUpload
        label="📷 Ảnh khảo sát hiện trường (BookingDetail)"
        previewUrls={previewUrls}
        onSelectImages={handleSelectImages}
        onRemoveImage={handleRemoveImage}
      />

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold shadow transition"
        >
          {submitting ? "Đang gửi..." : "Gửi báo cáo"}
        </button>
      </div>
    </form>
  );
}
