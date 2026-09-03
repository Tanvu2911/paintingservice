import React from "react";
import { AlertTriangle, Send } from "lucide-react";
import Modal from "../../../../components/common/Modal";

export default function WarrantyRejectSupportModal({
  isOpen,
  onClose,
  claim,
  supportPrice,
  setSupportPrice,
  rejectReason,
  setRejectReason,
  submittingReject,
  handleRejectSubmit,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Từ Chối Bảo Hành & Báo Giá Hỗ Trợ #${claim?.id}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 space-y-1">
          <div className="font-bold flex items-center gap-1 text-slate-900">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <span>Sự cố do lỗi khách quan (ngoài phạm vi bảo hành)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-900">
            Hệ thống sẽ gửi thông báo giải thích nguyên nhân kèm mức giá hỗ trợ dặm vá đặc biệt để khách hàng cân nhắc.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold text-slate-900">
            Mức Giá Hỗ Trợ Đề Xuất (VNĐ)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="10000"
              value={supportPrice}
              onChange={(e) => setSupportPrice(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono font-bold text-slate-900 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              VNĐ
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Để 0 nếu từ chối hoàn toàn không hỗ trợ giá.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold text-slate-900">
            Lý do từ chối &amp; Lời nhắn cho khách
          </label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Vết nứt do ngoại lực tác động bên ngoài tường không thuộc phạm vi bảo hành màng sơn..."
            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submittingReject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{submittingReject ? "Đang gửi..." : "Gửi Báo Giá & Từ Chối"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}


