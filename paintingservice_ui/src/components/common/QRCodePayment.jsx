import { useState } from "react";
import { formatMoney } from "../../util/formatters";

/**
 * Component hiển thị mã VietQR thanh toán chuyên nghiệp
 * Hỗ trợ Khách hàng quét mã trả cọc / tất toán, và Admin quét mã trả lương nhân viên
 */
export default function QRCodePayment({
    amount = 0,
    orderId,
    addInfo,
    bankId = "MB",
    bankName,
    accountNo = "0355880362",
    accountName = "VU VIET TAN",
    title = "Quét mã VietQR để thanh toán",
    subTitle = "Sử dụng App Ngân hàng hoặc ví điện tử bất kỳ để quét mã thanh toán 24/7",
    note = "* Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống ghi nhận và xác nhận nhanh nhất.",
    confirmText = "Tôi đã chuyển khoản thành công",
    confirmColor = "bg-emerald-600 hover:bg-emerald-700",
    onConfirm,
    onClose,
    loading = false,
    readOnly = false,
}) {
    const [copiedField, setCopiedField] = useState(null);

    // Chuẩn hóa nội dung chuyển khoản
    const transferContent = addInfo || (orderId ? `TT DH${orderId}` : "THANH TOAN DICH VU");
    const numAmount = Number(amount) || 0;

    // Tạo URL ảnh VietQR
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${numAmount}&addInfo=${encodeURIComponent(
        transferContent
    )}&accountName=${encodeURIComponent(accountName)}`;

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(String(text));
        setCopiedField(fieldName);
        setTimeout(() => {
            setCopiedField(null);
        }, 2000);
    };

    return (
        <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full mx-auto">
            {/* Header */}
            <div className="text-center pb-3">
                <h3 className="text-lg font-black text-slate-800">{title}</h3>
                {subTitle && (
                    <p className="text-xs text-slate-500 mt-1">{subTitle}</p>
                )}
            </div>

            {/* QR Code Container */}
            <div className="bg-gradient-to-b from-blue-50/50 to-indigo-50/40 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center my-3 relative shadow-inner">
                <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                    <img
                        src={qrUrl}
                        alt="Mã VietQR Thanh Toán"
                        className="w-56 h-56 object-contain rounded-lg"
                    />
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Hỗ trợ quét qua mọi ứng dụng ngân hàng & Ví điện tử</span>
                </div>
            </div>

            {/* Thông tin chuyển khoản chi tiết */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5">
                {/* Số tiền */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Số tiền cần thanh toán:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-rose-600">
                            {formatMoney(numAmount)}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopy(numAmount, "amount")}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 transition"
                        >
                            {copiedField === "amount" ? "✓ Đã chép" : "Chép"}
                        </button>
                    </div>
                </div>

                {/* Ngân hàng */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Ngân hàng thụ hưởng:</span>
                    <span className="font-bold text-slate-800">{bankName || bankId}</span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-slate-800 text-sm">
                            {accountNo}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopy(accountNo, "acc")}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 transition"
                        >
                            {copiedField === "acc" ? "✓ Đã chép" : "Chép"}
                        </button>
                    </div>
                </div>

                {/* Tên chủ tài khoản */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Người thụ hưởng:</span>
                    <span className="font-bold text-slate-800 uppercase">{accountName}</span>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {transferContent}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopy(transferContent, "content")}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 font-semibold text-blue-800 transition"
                        >
                            {copiedField === "content" ? "✓ Đã chép" : "Chép"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Ghi chú */}
            {note && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-3 leading-relaxed">
                    {note}
                </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 mt-4 pt-2">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                        Đóng
                    </button>
                )}

                {!readOnly && onConfirm && (
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 shadow-sm ${confirmColor}`}
                    >
                        {loading ? "Đang xử lý..." : confirmText}
                    </button>
                )}
            </div>
        </div>
    );
}