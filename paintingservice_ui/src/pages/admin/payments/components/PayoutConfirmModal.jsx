import React from "react";
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import QRCodePayment from "../../../../components/common/QRCodePayment";
import { formatMoney } from "../../../../util/formatters";

export default function PayoutConfirmModal({
  payoutModal,
  setPayoutModal,
  submitting,
  confirmPayout,
}) {
  if (!payoutModal) return null;

  const isZeroAmount = (payoutModal.amount ?? 0) === 0;

  return (
    <Modal
      isOpen={!!payoutModal}
      onClose={() => setPayoutModal(null)}
      title={
        payoutModal.isWarranty
          ? `Thanh toán thù lao bảo hành — ${payoutModal.staffName || ""}`
          : `Thanh toán thù lao thi công — ${payoutModal.staffName || ""}`
      }
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
          {[
            [
              "Hạng mục",
              payoutModal.isWarranty
                ? `Tiền công bảo hành (Phiếu #${payoutModal.claimId} • ${
                    payoutModal.isCustomerFault
                      ? "Khách trả công thợ"
                      : "Hệ thống chịu tiền thợ"
                  })`
                : `Thù lao thi công đơn #${payoutModal.orderId}`,
            ],
            [
              "Nhân sự",
              `${payoutModal.staffName} (${
                payoutModal.role === "SURVEYOR"
                  ? "Giám sát viên"
                  : "Kỹ thuật viên"
              })`,
            ],
            ["Ngân hàng", payoutModal.bankName],
            ["Số tài khoản", payoutModal.bankAccountNumber],
            ["Chủ TK", payoutModal.bankAccountName],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-500">{k}:</span>
              <span className="font-bold text-slate-900">{v}</span>
            </div>
          ))}

          {/* Ô chỉnh sửa số tiền linh hoạt */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
            <div>
              <span className="text-slate-700 font-bold block">Số tiền quyết toán:</span>
              {payoutModal.isWarranty && (
                <span className="text-[11px] text-blue-700 font-medium block mt-0.5">
                  {payoutModal.payoutNote || (isZeroAmount ? "Bảo hành trách nhiệm (0đ)" : "Có thể gõ chỉnh sửa số tiền")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="10000"
                value={payoutModal.amount ?? 0}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setPayoutModal((prev) => ({
                    ...prev,
                    amount: val,
                  }));
                }}
                className="w-32 px-2.5 py-1.5 text-right bg-white rounded-lg border border-slate-300 font-bold font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <span className="text-slate-500 font-bold text-xs">VNĐ</span>
            </div>
          </div>
        </div>

        {payoutModal.isWarranty &&
          payoutModal.isCustomerFault &&
          !payoutModal.customerPaid && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Lưu ý: Khách hàng chưa hoàn tất đóng tiền hỗ trợ qua VNPay. Bạn vẫn có thể quyết toán trước nếu có chỉ đạo từ quản trị.
              </span>
            </div>
          )}

        {isZeroAmount ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="font-bold text-emerald-900 text-sm">Bảo Hành Trách Nhiệm (0 VNĐ)</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Thợ thi công chịu trách nhiệm sửa chữa khắc phục lỗi, không phát sinh chi phí thù lao. Không cần chuyển khoản ngân hàng.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayoutModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={confirmPayout}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
              >
                {submitting ? "Đang xác nhận..." : "Xác nhận hoàn tất thù lao (0 VNĐ)"}
              </button>
            </div>
          </div>
        ) : (
          <QRCodePayment
            amount={payoutModal.amount}
            orderId={payoutModal.orderId}
            bankId={payoutModal.bankCode}
            bankName={payoutModal.bankName}
            accountNo={payoutModal.bankAccountNumber}
            accountName={payoutModal.bankAccountName}
            addInfo={
              payoutModal.isWarranty
                ? `BH${payoutModal.claimId} ${
                    payoutModal.role === "SURVEYOR" ? "GS" : "THO"
                  }`
                : `LUONG DH${payoutModal.orderId} ${
                    payoutModal.role === "SURVEYOR" ? "GS" : "KT"
                  }`
            }
            title={`Quét mã VietQR trả thù lao cho ${payoutModal.staffName}`}
            subTitle={
              payoutModal.role === "SURVEYOR"
                ? "Giám sát viên"
                : "Kỹ thuật viên thi công"
            }
            note="Quét mã trên app ngân hàng rồi bấm Xác nhận để ghi nhận."
            confirmText={
              submitting
                ? "Đang xác nhận..."
                : `Xác nhận đã chuyển ${formatMoney(payoutModal.amount)}`
            }
            confirmColor="bg-blue-600 hover:bg-blue-600"
            onConfirm={confirmPayout}
            onClose={() => setPayoutModal(null)}
            loading={submitting}
          />
        )}
      </div>
    </Modal>
  );
}


