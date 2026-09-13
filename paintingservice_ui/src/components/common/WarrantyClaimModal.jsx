import React, { useState } from "react";
import {
  ShieldAlert,
  X,
  Upload,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";

const ISSUE_TYPES = [
  { id: "BONG_TROC", label: "Bong tróc / Rộp sơn", icon: "🟧", desc: "Màng sơn bị phồng rộp hoặc bong từng mảng" },
  { id: "PHAI_MAU", label: "Phai màu / Ố vàng", icon: "🟨", desc: "Màu sơn loang lổ, bay màu không đều" },
  { id: "NUT_NE", label: "Nứt rạn chân chim", icon: "🟦", desc: "Bề mặt tường xuất hiện vết nứt rạn nhỏ" },
  { id: "THAM_NUOC", label: "Thấm dột / Ẩm mốc", icon: "💧", desc: "Tường bị ẩm mốc hoặc loang chân tường" },
  { id: "KHAC", label: "Sự cố khác", icon: "⚙️", desc: "Các vấn đề kỹ thuật khác cần kiểm tra" },
];

const TIME_SLOTS = [
  "Buổi Sáng (08:30 - 11:30)",
  "Buổi Chiều (13:30 - 17:00)",
  "Cuối tuần (Thứ 7 / CN)",
  "Linh hoạt theo sắp xếp của thợ",
];

export default function WarrantyClaimModal({
  isOpen,
  onClose,
  booking,
  showToast,
  onSuccess,
}) {
  const [issueType, setIssueType] = useState("BONG_TROC");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      showToast?.("Bạn chỉ có thể tải lên tối đa 5 hình ảnh hiện trường.", "warning");
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      showToast?.("Vui lòng mô tả chi tiết vị trí và tình trạng sự cố.", "warning");
      return;
    }

    if (selectedFiles.length === 0) {
      showToast?.("Vui lòng tải lên ít nhất 1 hình ảnh hiện trường để kỹ thuật viên thẩm định.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("issueType", issueType);
      formData.append("description", description.trim());
      if (preferredDate) {
        formData.append("preferredDate", preferredDate);
      }
      if (preferredTime) {
        formData.append("preferredTime", preferredTime);
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await AxiosConfig.post(`/warranty-claims/${booking.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast?.("Đã gửi yêu cầu bảo hành thành công! Kỹ thuật viên sẽ liên hệ trong 24-48h.", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi gửi bảo hành:", err.response?.data || err);
      const serverMsg = err.response?.data?.message || err.message;
      showToast?.(
        serverMsg || "Không thể gửi yêu cầu bảo hành, vui lòng thử lại sau!",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Chính sách bảo hành chính hãng</span>
          </div>

          <h2 className="text-lg font-bold text-white">
            Gửi Yêu Cầu Bảo Hành Công Trình
          </h2>

          <p className="text-xs text-slate-300 mt-1">
            Đơn hàng #{booking.id} • {booking.serviceName || booking.service?.name || "Dịch vụ sơn nhà"} ({booking.warrantyYears || 2} năm bảo hành)
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Chọn Loại sự cố */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 text-xs block">
              1. Loại sự cố bề mặt cần bảo hành <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ISSUE_TYPES.map((t) => {
                const isSelected = issueType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setIssueType(t.id)}
                    className={`p-3 rounded-xl text-left border transition flex items-start gap-2.5 cursor-pointer ${isSelected
                        ? "bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/30 text-blue-950 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                      }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold block text-xs leading-tight text-slate-900">{t.label}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">{t.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tải ảnh hiện trường */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Hình ảnh hiện trường thực tế <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-slate-500 font-normal">Tối đa 5 ảnh</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs">
                  <img src={url} alt="Hiện trường" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition shadow-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {previewUrls.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 transition flex flex-col items-center justify-center gap-1 cursor-pointer text-slate-500 hover:text-blue-600">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                  <span className="text-[10px] font-bold">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Chụp rõ nét khu vực bong tróc hoặc đổi màu để kỹ thuật viên chuẩn bị sẵn vật tư đúng loại sơn ban đầu.
            </p>
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Mô tả chi tiết vị trí sự cố <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Mảng tường phòng khách cạnh ban công bị rộp sơn khoảng 0.5m2 sau đợt mưa tuần trước..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              maxLength={1000}
            />
          </div>

          {/* Ngày & Giờ hẹn mong muốn */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Thời gian mong muốn thợ đến kiểm tra</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Ngày hẹn:</span>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Khung giờ:</span>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cam kết dịch vụ */}
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Cam kết miễn phí:</strong> Mọi chi phí nhân công cạo sủi, bột bả vá và sơn phủ lại do lỗi kỹ thuật thi công đều được bảo hành 100% miễn phí theo hợp đồng.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Xác Nhận Gửi Yêu Cầu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
