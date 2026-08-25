import React, { useState, useEffect } from "react";
import {
  X,
  FileSignature,
  MessageSquare,
  XCircle,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowLeft,
  Trash2,
  Edit3,
} from "lucide-react";
import { formatMoney } from "../../util/formatters";
import { parseNegotiationInfo } from "../../util/orderFlowUtils";

const STEPS = {
  CHOOSE: "choose",
  ACCEPT: "accept",
  NEGOTIATE: "negotiate",
  REJECT: "reject",
  VIEW_NEGOTIATION: "view_negotiation",
};

export default function QuoteResponseModal({
  isOpen,
  onClose,
  booking,
  onAccept,
  onNegotiate,
  onCancelNegotiation,
  onReject,
}) {
  const negInfo = parseNegotiationInfo(booking?.description);
  const hasActiveNeg = negInfo.hasNegotiation;

  const [step, setStep] = useState(hasActiveNeg ? STEPS.VIEW_NEGOTIATION : STEPS.CHOOSE);
  const [selectedStartDate, setSelectedStartDate] = useState(
    booking?.expectedStartDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [proposedPrice, setProposedPrice] = useState("");
  const [negotiateMsg, setNegotiateMsg] = useState("");
  const [submittingNeg, setSubmittingNeg] = useState(false);
  const [cancellingNeg, setCancellingNeg] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (hasActiveNeg) {
        setStep(STEPS.VIEW_NEGOTIATION);
        const cleanPrice = (negInfo.proposedPrice || "").replace(/[^\d]/g, "");
        setProposedPrice(cleanPrice);
        setNegotiateMsg(negInfo.message || "");
      } else {
        setStep(STEPS.CHOOSE);
        setProposedPrice("");
        setNegotiateMsg("");
      }
      setRejectReason("");
    }
  }, [isOpen, hasActiveNeg, booking?.description]);

  const total = Number(booking?.totalAmount) || 0;
  const deposit = booking?.depositAmount ? Number(booking.depositAmount) : total * 0.3;
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const handleClose = () => {
    setStep(hasActiveNeg ? STEPS.VIEW_NEGOTIATION : STEPS.CHOOSE);
    onClose?.();
  };

  const handleAccept = () => {
    if (!selectedStartDate) return;
    onAccept?.(selectedStartDate);
    handleClose();
  };

  const handleNegotiate = async () => {
    if (!negotiateMsg.trim()) return;
    setSubmittingNeg(true);
    try {
      await onNegotiate?.(proposedPrice, negotiateMsg);
      handleClose();
    } finally {
      setSubmittingNeg(false);
    }
  };

  const handleCancelNeg = async () => {
    setCancellingNeg(true);
    try {
      await onCancelNegotiation?.();
      handleClose();
    } finally {
      setCancellingNeg(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSubmittingReject(true);
    try {
      await onReject?.(rejectReason);
      handleClose();
    } finally {
      setSubmittingReject(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1e40a6] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-200 mb-1">
                Phản Hồi Báo Giá
              </p>
              <h2 className="text-lg font-black leading-tight">
                {step === STEPS.CHOOSE && "Chọn hành động"}
                {step === STEPS.VIEW_NEGOTIATION && "Đề xuất thương lượng đã gửi"}
                {step === STEPS.ACCEPT && "Chấp nhận báo giá"}
                {step === STEPS.NEGOTIATE && (hasActiveNeg ? "Chỉnh sửa đề xuất thương lượng" : "Đề xuất thương lượng")}
                {step === STEPS.REJECT && "Từ chối báo giá"}
              </h2>
              <p className="text-xs text-blue-200/80 mt-1">
                Đơn #{booking?.id} • Báo giá:{" "}
                <strong className="text-amber-300 font-black text-sm">
                  {formatMoney(total)}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer shrink-0 mt-0.5"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* 1. Màn hình chi tiết đề xuất thương lượng khi khách đã gửi trước đó */}
          {step === STEPS.VIEW_NEGOTIATION && (
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Đề xuất thương lượng đang chờ xử lý
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    ⏳ Chờ Admin phản hồi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Báo giá gốc</span>
                    <span className="font-black text-slate-900 text-sm block mt-0.5">{formatMoney(total)}</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Giá bạn đề xuất</span>
                    <span className="font-black text-emerald-700 text-sm block mt-0.5">{negInfo.proposedPrice || "Chưa ghi số tiền"}</span>
                  </div>
                </div>

                {negInfo.message && (
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs text-slate-700 font-medium leading-relaxed">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Lý do / Ghi chú đã gửi:</span>
                    "{negInfo.message}"
                  </div>
                )}

                <p className="text-[11px] text-amber-800 leading-relaxed italic">
                  Bạn đã gửi đề xuất thương lượng. Bạn có thể chỉnh sửa lại nội dung hoặc hủy đề xuất để quay lại báo giá ban đầu.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(STEPS.NEGOTIATE)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs transition cursor-pointer shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Sửa Đề Xuất
                </button>
                <button
                  type="button"
                  onClick={handleCancelNeg}
                  disabled={cancellingNeg}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-2xl text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {cancellingNeg ? "Đang hủy..." : "Hủy Thương Lượng"}
                </button>
              </div>
            </div>
          )}

          {/* 2. Màn hình chọn phương án (Chấp nhận / Thương lượng / Từ chối) khi chưa có thương lượng active */}
          {step === STEPS.CHOOSE && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tổng dự toán là{" "}
                <strong className="text-slate-800">{formatMoney(total)}</strong>
                , đặt cọc <strong className="text-emerald-700">{formatMoney(deposit)}</strong> (30%).
                Vui lòng chọn phương án phản hồi bên dưới.
              </p>

              <button
                type="button"
                onClick={() => setStep(STEPS.ACCEPT)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 transition cursor-pointer text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-emerald-800 text-sm">Chấp nhận báo giá</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Đồng ý dự toán và tiến hành ký hợp đồng điện tử
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setStep(STEPS.NEGOTIATE)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100 transition cursor-pointer text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-amber-800 text-sm">Thương lượng giá</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Đề xuất mức giá khác để thương thảo với Admin
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setStep(STEPS.REJECT)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-rose-200 bg-rose-50 hover:border-rose-400 hover:bg-rose-100 transition cursor-pointer text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-rose-800 text-sm">Từ chối báo giá</p>
                  <p className="text-xs text-rose-600 mt-0.5">
                    Hủy yêu cầu và không tiếp tục dịch vụ
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
              </button>
            </div>
          )}

          {/* 3. Màn hình Chấp nhận */}
          {step === STEPS.ACCEPT && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Xác nhận chấp nhận báo giá
                </p>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Sau khi ký hợp đồng, bạn sẽ cần đặt cọc{" "}
                  <strong className="text-emerald-700">{formatMoney(deposit)}</strong> để bắt đầu thi công.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Ngày bắt đầu thi công mong muốn
                </label>
                <input
                  type="date"
                  value={selectedStartDate}
                  min={today}
                  max={maxDate}
                  onChange={(e) => setSelectedStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">Chọn ngày trong vòng 30 ngày tới</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(STEPS.CHOOSE)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={!selectedStartDate}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <FileSignature className="w-4 h-4" />
                  Xác nhận & Ký HĐ
                </button>
              </div>
            </div>
          )}

          {/* 4. Màn hình Thương lượng / Sửa thương lượng */}
          {step === STEPS.NEGOTIATE && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  {hasActiveNeg ? "Chỉnh sửa mức giá đề xuất" : "Đề xuất thương lượng giá"}
                </p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Admin sẽ nhận được thông báo ngay và liên hệ phản hồi. Báo giá gốc:{" "}
                  <strong className="text-amber-800">{formatMoney(total)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Mức giá bạn đề xuất (VNĐ) — Không bắt buộc
                </label>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder={`Ví dụ: ${Math.round(total * 0.85).toLocaleString("vi-VN")}`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Lý do / Ghi chú thương lượng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={negotiateMsg}
                  onChange={(e) => setNegotiateMsg(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Tôi muốn thương lượng vì diện tích thực tế nhỏ hơn dự toán..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(hasActiveNeg ? STEPS.VIEW_NEGOTIATION : STEPS.CHOOSE)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleNegotiate}
                  disabled={submittingNeg || !negotiateMsg.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  {submittingNeg ? "Đang gửi..." : (hasActiveNeg ? "Lưu Thay Đổi" : "Gửi Đề Xuất")}
                </button>
              </div>
            </div>
          )}

          {/* 5. Màn hình Từ chối */}
          {step === STEPS.REJECT && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Cảnh báo: Hành động không thể hoàn tác
                </p>
                <p className="text-xs text-rose-600 leading-relaxed">
                  Từ chối báo giá sẽ hủy toàn bộ yêu cầu dịch vụ này. Bạn có thể tạo yêu cầu
                  mới nếu muốn tiếp tục sau.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Giá báo cao hơn ngân sách, tôi sẽ cân nhắc lại..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none transition leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(STEPS.CHOOSE)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submittingReject || !rejectReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {submittingReject ? "Đang hủy..." : "Xác nhận Từ Chối"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
