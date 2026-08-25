import React, { useState } from "react";
import Modal from "./Modal";
import { AlertTriangle, XCircle, FileText, CheckCircle2 } from "lucide-react";
import { formatMoney } from "../../util/formatters";

const REJECT_REASONS = [
  "Chi phí báo giá vượt quá ngân sách dự kiến của gia đình",
  "Thời gian thi công dự kiến không phù hợp với kế hoạch",
  "Phương án kỹ thuật hoặc chủng loại vật tư chưa đúng mong muốn",
  "Tôi đã tìm được phương án / đơn vị thi công khác",
  "Thay đổi kế hoạch gia đình, tạm hoãn việc sơn sửa",
  "Lý do khác (ghi rõ bên dưới)",
];

export default function RejectQuoteModal({
  isOpen,
  onClose,
  booking,
  onConfirmReject,
  loading = false,
}) {
  const [selectedReason, setSelectedReason] = useState(REJECT_REASONS[0]);
  const [customNote, setCustomNote] = useState("");

  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalReason = selectedReason;
    if (selectedReason === "Lý do khác (ghi rõ bên dưới)") {
      finalReason = customNote.trim() || "Khách hàng từ chối báo giá (Lý do khác)";
    } else if (customNote.trim()) {
      finalReason = `${selectedReason} - Ghi chú thêm: ${customNote.trim()}`;
    }
    onConfirmReject(finalReason);
  };

  const total = Number(booking.totalAmount) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title="Từ Chối Báo Giá Dịch Vụ"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Tóm tắt báo giá hiện tại */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500">Đơn hàng #{booking.id}</span>
            <span className="font-bold text-slate-800">
              {booking.serviceName || booking.service?.name || "Sơn sửa nhà"}
            </span>
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-medium text-slate-600">Tổng báo giá của công ty:</span>
              <span className="font-black text-slate-900 text-sm">{formatMoney(total)}</span>
            </div>
          )}
        </div>

        {/* Cảnh báo hủy */}
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-xs">Lưu ý khi từ chối báo giá:</p>
            <p className="text-[11.5px] text-rose-800 leading-relaxed">
              Sau khi xác nhận từ chối, yêu cầu thi công sẽ được chuyển sang trạng thái{" "}
              <strong>Đã hủy</strong>. Đội ngũ tư vấn sẽ nhận được phản hồi của bạn để nâng cao chất lượng dịch vụ.
            </p>
          </div>
        </div>

        {/* Chọn lý do từ chối */}
        <div className="space-y-2.5">
          <label className="font-bold text-slate-800 block">
            Vui lòng cho chúng tôi biết lý do bạn từ chối báo giá: <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-2">
            {REJECT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedReason === reason
                    ? "bg-rose-50/60 border-rose-300 text-rose-950 font-semibold ring-1 ring-rose-400/30"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <input
                  type="radio"
                  name="reject_reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="w-4 h-4 text-rose-600 accent-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs leading-snug">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ghi chú thêm */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 block">
            Ghi chú / Đóng góp ý kiến thêm (nếu có):
          </label>
          <textarea
            rows={3}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Bạn có thể góp ý thêm về giá cả, thời gian hoặc đề xuất mức giá mong muốn..."
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Quay lại suy nghĩ thêm
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-white" />
            <span>{loading ? "Đang xử lý..." : "Xác nhận Từ Chối Báo Giá"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
