import React from "react";
import { AlertTriangle } from "lucide-react";
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
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs space-y-2">
          {[
            [
              "Hạng mục",
              payoutModal.isWarranty
                ? `Tiền công bảo hành (Phiếu #${payoutModal.claimId} &bull; ${
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
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-bold">Số tiền quyết toán:</span>
            <span className="font-black text-slate-900 text-sm font-mono">
              {formatMoney(payoutModal.amount)}
            </span>
          </div>
        </div>

        {payoutModal.isWarranty &&
          payoutModal.isCustomerFault &&
          !payoutModal.customerPaid && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0" />
              <span>
                Lưu ý: Khách hàng chưa hoàn tất đóng tiền hỗ trợ qua VNPay. Bạn vẫn có thể quyết toán trước nếu có chỉ đạo từ quản trị.
              </span>
            </div>
          )}

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
      </div>
    </Modal>
  );
}


