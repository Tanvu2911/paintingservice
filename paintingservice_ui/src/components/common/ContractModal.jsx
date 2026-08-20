import React, { useRef, useState } from "react";
import Modal from "./Modal";
import { formatMoney } from "../../util/formatters";
import { formatDate } from "../../util/orderFlowUtils";
import { exportContractPDF } from "../../util/contractPdfExport";
import { FileSignature, ShieldCheck, Printer, CheckCircle2 } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";

export default function ContractModal({
  isOpen,
  onClose,
  contract,
  booking,
  role = "customer", // "customer" | "admin"
  showToast,
  onSuccess,
  onRejectQuote,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSignAsCustomer =
    role === "customer" &&
    contract &&
    !contract.customerSigned &&
    ["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(booking?.status);

  const getCanvasPosition = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getCanvasPosition(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleCustomerSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !contract?.id) return;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = pixels.some((value, index) => index % 4 === 3 && value > 0);

    if (!hasInk) {
      showToast?.("Vui lòng ký tên vào khung trước khi xác nhận!", "warning");
      return;
    }

    try {
      setSaving(true);
      const signatureBase64 = canvas.toDataURL("image/png");

      let signSuccess = false;
      try {
        await AxiosConfig.post(`/contracts/${contract.id}/sign`, {
          signatureImage: signatureBase64,
          role: "CUSTOMER",
        });
        signSuccess = true;
      } catch (err) {
        // Fallback to PUT /contracts/${contract.id}
        await AxiosConfig.put(`/contracts/${contract.id}`, {
          ...contract,
          customerSigned: true,
          customerSignatureImg: signatureBase64,
        });
        signSuccess = true;
      }

      // Đảm bảo đơn sang trạng thái WAITING_DEPOSIT
      if (booking?.id && booking.status !== "WAITING_DEPOSIT") {
        try {
          await AxiosConfig.put(`/bookings/${booking.id}`, {
            ...booking,
            status: "WAITING_DEPOSIT",
          });
        } catch (e) {
          // ignore if already updated by backend
        }
      }

      showToast?.("Ký hợp đồng thành công! Vui lòng tiến hành đặt cọc 30%.", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      showToast?.(error.response?.data?.message || "Không thể lưu chữ ký!", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const total = Number(booking?.totalAmount) || 0;
  const deposit = booking?.depositAmount ? Number(booking?.depositAmount) : total * 0.3;
  const remaining = Math.max(0, total - deposit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hợp Đồng Dịch Vụ Sơn Sửa Điện Tử"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-xs text-slate-700">
        {/* Header Thông Tin Hợp Đồng */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Mã số hợp đồng
            </span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {contract?.contractCode || `HD-2026-${booking?.id || "000"}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {contract?.adminSigned && contract?.customerSigned
                ? "✓ Đã có đủ 2 chữ ký pháp lý"
                : contract?.customerSigned
                ? "Chờ Admin ký duyệt cọc"
                : "Chờ Khách hàng ký"}
            </span>
          </div>
        </div>

        {/* Nội dung Hợp đồng */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 max-h-80 overflow-y-auto leading-relaxed shadow-inner">
          <div className="text-center border-b border-slate-100 pb-3 space-y-1">
            <h4 className="font-black text-slate-900 text-sm uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p className="text-[11px] font-bold text-slate-500">Độc lập - Tự do - Hạnh phúc</p>
            <h3 className="font-black text-slate-800 text-base pt-2">
              HỢP ĐỒNG KINH TẾ DỊCH VỤ SƠN SỬA CÔNG TRÌNH
            </h3>
          </div>

          <div className="space-y-2">
            <p>
              <strong>Bên A (Khách hàng):</strong> {booking?.customerName || "Chủ công trình"} • SĐT: {booking?.customerPhone || "—"}
            </p>
            <p>
              <strong>Bên B (Đơn vị thi công):</strong> Công Ty Dịch Vụ Sơn Sửa Nhà 247 Hà Nội
            </p>
            <p>
              <strong>Địa điểm thi công:</strong> {booking?.address || "Hà Nội"}
            </p>
            <p>
              <strong>Ngày bắt đầu thi công:</strong> {formatDate(booking?.expectedStartDate)} • Dự kiến: {booking?.estimatedDays || 3} ngày
            </p>
            <p>
              <strong>Tổng giá trị hợp đồng:</strong> <strong className="text-slate-900">{formatMoney(total)}</strong>
            </p>
            <p>
              - Đợt 1 (Đặt cọc 30%): <strong>{formatMoney(deposit)}</strong> khi ký hợp đồng.
            </p>
            <p>
              - Đợt 2 (Tất toán 70%): <strong>{formatMoney(remaining)}</strong> sau khi nghiệm thu đạt yêu cầu.
            </p>
            <p>
              <strong>Thời hạn bảo hành:</strong> {booking?.warrantyYears || 2} năm cam kết chính hãng.
            </p>
          </div>
        </div>

        {/* Khu vực 2 Chữ Ký Pháp Lý */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bên A: Khách hàng */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
            <span className="font-bold text-slate-800 uppercase block">ĐẠI DIỆN BÊN A (KHÁCH HÀNG)</span>
            {contract?.customerSignatureImg || contract?.customerSigned ? (
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[90px]">
                {contract?.customerSignatureImg ? (
                  <img
                    src={contract.customerSignatureImg}
                    alt="Chữ ký khách hàng"
                    className="max-h-20 object-contain"
                  />
                ) : (
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã ký điện tử</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1">
                  Đã xác thực • {formatDate(contract.customerSignedAt || booking?.updatedAt)}
                </span>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-slate-400 min-h-[90px] flex items-center justify-center">
                Chưa có chữ ký Bên A
              </div>
            )}
          </div>

          {/* Bên B: Đơn vị thi công */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
            <span className="font-bold text-slate-800 uppercase block">ĐẠI DIỆN BÊN B (CÔNG TY SƠN 247)</span>
            {contract?.adminSignatureImg || contract?.adminSigned ? (
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[90px]">
                {contract?.adminSignatureImg ? (
                  <img
                    src={contract.adminSignatureImg}
                    alt="Chữ ký Admin"
                    className="max-h-20 object-contain"
                  />
                ) : (
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã ký &amp; Đóng dấu điện tử</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1">
                  Xác nhận cọc • {formatDate(contract.adminSignedAt || booking?.updatedAt)}
                </span>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-slate-400 min-h-[90px] flex items-center justify-center">
                Admin sẽ ký duyệt sau khi nhận cọc 30%
              </div>
            )}
          </div>
        </div>

        {/* Khung vẽ chữ ký cho Khách hàng khi cần ký */}
        {canSignAsCustomer && (
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-amber-700" />
                <span>Ký tên của bạn vào khung bên dưới:</span>
              </span>
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Xóa chữ ký
              </button>
            </div>

            <div className="bg-white rounded-xl border border-amber-300 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={650}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 cursor-crosshair touch-none"
              />
            </div>

            <button
              type="button"
              onClick={handleCustomerSaveSignature}
              disabled={saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <FileSignature className="w-4 h-4 text-white" />
              <span>{saving ? "Đang lưu chữ ký..." : "✓ Xác nhận & Lưu Chữ Ký Hợp Đồng"}</span>
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                exportContractPDF(contract, booking);
                showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Xuất File PDF</span>
            </button>

            {canSignAsCustomer && onRejectQuote && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRejectQuote();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 cursor-pointer"
              >
                ✕ Từ chối báo giá
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
