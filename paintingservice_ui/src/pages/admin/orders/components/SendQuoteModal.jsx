import React, { useEffect, useRef, useState } from "react";
import Modal from "../../../../components/common/Modal";
import { formatMoney } from "../../../../util/formatters";
import { parseNegotiationInfo } from "../../../../util/orderFlowUtils";
import { PenTool, CheckCircle, RotateCcw } from "lucide-react";

export default function SendQuoteModal({
  quoteModalOpen,
  setQuoteModalOpen,
  order,
  contract,
  quoteTotal,
  setQuoteTotal,
  quoteDeposit,
  setQuoteDeposit,
  quoteEstimatedDays,
  setQuoteEstimatedDays,
  quoteWarrantyYears,
  setQuoteWarrantyYears,
  handleSendQuote,
  showToast,
}) {
  const canvasRef = useRef(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Lấy chữ ký đã lưu trong localStorage hoặc từ hợp đồng cũ
  const savedDefaultSig = typeof window !== "undefined"
    ? localStorage.getItem("admin_default_signature") || ""
    : "";
  const existingSig = contract?.adminSignatureImg || savedDefaultSig;

  const [useExisting, setUseExisting] = useState(Boolean(existingSig));

  // Reset hoặc khởi tạo canvas khi mở modal
  useEffect(() => {
    if (!quoteModalOpen) return;

    if (existingSig) {
      setUseExisting(true);
    } else {
      setUseExisting(false);
    }
    setHasDrawnSignature(false);
  }, [quoteModalOpen, existingSig]);

  // Init canvas drawing listeners
  useEffect(() => {
    if (!quoteModalOpen || useExisting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Thiết lập nét vẽ
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";

    let drawing = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startPos = (e) => {
      e.preventDefault();
      drawing = true;
      setHasDrawnSignature(true);
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopPos = () => {
      drawing = false;
      ctx.closePath();
    };

    canvas.addEventListener("mousedown", startPos);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopPos);
    canvas.addEventListener("mouseleave", stopPos);

    canvas.addEventListener("touchstart", startPos, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopPos);

    return () => {
      canvas.removeEventListener("mousedown", startPos);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopPos);
      canvas.removeEventListener("mouseleave", stopPos);
      canvas.removeEventListener("touchstart", startPos);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopPos);
    };
  }, [quoteModalOpen, useExisting]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  if (!quoteModalOpen) return null;

  const negInfo = parseNegotiationInfo(order?.description);
  const proposedRawNumber = negInfo.proposedPrice
    ? negInfo.proposedPrice.replace(/[^\d]/g, "")
    : null;

  const onSubmit = () => {
    let finalSignature = null;

    if (useExisting && existingSig) {
      finalSignature = existingSig;
    } else if (hasDrawnSignature && canvasRef.current) {
      try {
        finalSignature = canvasRef.current.toDataURL("image/png");
        if (saveAsDefault && finalSignature) {
          localStorage.setItem("admin_default_signature", finalSignature);
        }
      } catch (err) {
        console.error("Lỗi trích xuất chữ ký:", err);
      }
    }

    if (!finalSignature) {
      showToast?.("Vui lòng ký tên đại diện Công ty trước khi gửi báo giá!", "error");
      return;
    }

    handleSendQuote(finalSignature);
  };

  return (
    <Modal
      isOpen={quoteModalOpen}
      onClose={() => setQuoteModalOpen(false)}
      title={
        order?.status === "WAITING_CUSTOMER_SIGNATURE"
          ? "Điều chỉnh báo giá & Dự toán thi công"
          : "Lập báo giá & Ký duyệt hợp đồng"
      }
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {negInfo.hasNegotiation && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Đề xuất điều chỉnh từ Khách hàng
              </span>
              {negInfo.proposedPrice && (
                <span className="font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-mono">
                  {negInfo.proposedPrice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                  Báo giá hiện tại
                </span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5 font-mono">
                  {order?.totalAmount ? formatMoney(order.totalAmount) : "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-900 font-semibold block uppercase">
                  Mức giá đề xuất
                </span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5 font-mono">
                  {negInfo.proposedPrice || "Chưa ghi số tiền"}
                </span>
              </div>
            </div>

            {negInfo.message && (
              <div className="text-slate-900 text-xs bg-white p-2.5 rounded-lg border border-slate-200 font-medium leading-relaxed">
                <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                  Ghi chú từ khách hàng:
                </span>
                "{negInfo.message}"
              </div>
            )}

            {proposedRawNumber && (
              <button
                type="button"
                onClick={() => {
                  setQuoteTotal(proposedRawNumber);
                  setQuoteDeposit(String(Math.round(Number(proposedRawNumber) * 0.3)));
                  showToast?.(
                    `Đã áp dụng mức dự toán đề xuất: ${Number(
                      proposedRawNumber
                    ).toLocaleString("vi-VN")}đ`,
                    "success"
                  );
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>✨</span>
                <span>Áp dụng mức giá đề xuất ({negInfo.proposedPrice})</span>
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed">
          Admin nhập tổng dự toán, số ngày thi công, thời hạn bảo hành và ký tên đại diện Công ty (Bên B). Hợp đồng điện tử sẽ được tạo với chữ ký sẵn của Công ty để gửi khách hàng ký duyệt và thanh toán cọc.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1">
              Tổng giá trị dự toán (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={quoteTotal}
              onChange={(e) => {
                const val = e.target.value;
                setQuoteTotal(val);
                if (val && !isNaN(val)) {
                  setQuoteDeposit(String(Math.round(Number(val) * 0.3)));
                } else {
                  setQuoteDeposit("");
                }
              }}
              placeholder="Ví dụ: 15000000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1">
              Tiền cọc yêu cầu (30%)
            </label>
            <input
              type="number"
              value={quoteDeposit}
              readOnly
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono font-bold outline-none cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Số ngày làm việc dự kiến <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quoteEstimatedDays}
                onChange={(e) => setQuoteEstimatedDays(e.target.value)}
                placeholder="3"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Thời hạn bảo hành (năm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quoteWarrantyYears}
                onChange={(e) => setQuoteWarrantyYears(e.target.value)}
                placeholder="2"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Khung ký tên Admin Bên B (Pre-sign) */}
        <div className="pt-2 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-blue-600" />
              <span>Chữ ký đại diện Công ty (Bên B) <span className="text-rose-500">*</span></span>
            </label>
            {useExisting && (
              <button
                type="button"
                onClick={() => setUseExisting(false)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                ✍️ Ký nét mới
              </button>
            )}
            {!useExisting && existingSig && (
              <button
                type="button"
                onClick={() => setUseExisting(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                ↩️ Dùng chữ ký đã lưu
              </button>
            )}
          </div>

          {useExisting && existingSig ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Sử dụng chữ ký đại diện đã lưu</span>
                </span>
                <span className="text-[11px] text-slate-400">Đã xác thực</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center min-h-[90px]">
                <img
                  src={existingSig}
                  alt="Chữ ký Admin"
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Vẽ chữ ký của bạn vào khung bên dưới:</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Xóa nét ký
                </button>
              </div>
              <div className="border border-slate-300 rounded-xl bg-white overflow-hidden touch-none shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={130}
                  className="w-full cursor-crosshair block bg-slate-50/50"
                  style={{ touchAction: "none" }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Lưu làm chữ ký mặc định cho các đơn sau</span>
                </label>
                {hasDrawnSignature ? (
                  <span className="text-xs text-emerald-600 font-bold">✓ Đã ký</span>
                ) : (
                  <span className="text-xs text-amber-600">⚠️ Chưa ký</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setQuoteModalOpen(false)}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-200 cursor-pointer transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Ký &amp; Gửi Báo Giá Cho Khách</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}


