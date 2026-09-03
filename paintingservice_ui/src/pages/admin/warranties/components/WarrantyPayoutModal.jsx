import React from "react";
import Modal from "../../../../components/common/Modal";
import QRCodePayment from "../../../../components/common/QRCodePayment";
import { formatMoney } from "../../../../util/formatters";

export default function WarrantyPayoutModal({
  payoutModalData,
  setPayoutModalData,
  submittingPayout,
  handleConfirmStaffPayout,
}) {
  if (!payoutModalData) return null;

  return (
    <Modal
      isOpen={Boolean(payoutModalData)}
      onClose={() => setPayoutModalData(null)}
      title="Thanh Toán Thù Lao Bảo Hành (VietQR)"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Nhân sự nhận thù lao:</span>
            <span className="font-bold text-slate-900">
              {payoutModalData.staffName} (
              {payoutModalData.role === "SURVEYOR"
                ? "Giám sát viên"
                : "Đội thợ thi công"}
              )
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ngân hàng của nhân viên:</span>
            <span className="font-bold text-slate-900">
              {payoutModalData.bankName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số tài khoản:</span>
            <span className="font-bold font-mono text-slate-900">
              {payoutModalData.bankAccountNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Chủ tài khoản:</span>
            <span className="font-bold uppercase text-slate-900">
              {payoutModalData.bankAccountName}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
            <span className="text-slate-500 font-bold">Mức thù lao chi trả:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="50000"
                step="10000"
                value={payoutModalData.amount}
                onChange={(e) =>
                  setPayoutModalData((prev) => ({
                    ...prev,
                    amount: Number(e.target.value) || 0,
                  }))
                }
                className="w-28 px-2 py-1 text-right bg-white rounded-lg border border-slate-200 font-bold font-mono text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <span className="text-slate-500 font-bold">VNĐ</span>
            </div>
          </div>
        </div>

        <QRCodePayment
          amount={payoutModalData.amount}
          orderId={payoutModalData.orderId}
          bankId={payoutModalData.bankCode}
          bankName={payoutModalData.bankName}
          accountNo={payoutModalData.bankAccountNumber}
          accountName={payoutModalData.bankAccountName}
          addInfo={`BAO HANH DH${payoutModalData.orderId} ${
            payoutModalData.role === "SURVEYOR" ? "GS" : "THO"
          }`}
          title={`Quét mã VietQR trả thù lao cho ${payoutModalData.staffName}`}
          subTitle="Admin dùng App Ngân hàng quét mã chuyển khoản trực tiếp về tài khoản nhân viên"
          confirmText={
            submittingPayout
              ? "Đang xác nhận..."
              : `Xác Nhận Đã Chuyển ${formatMoney(payoutModalData.amount)}`
          }
          confirmColor="bg-blue-600 hover:bg-blue-600"
          onConfirm={handleConfirmStaffPayout}
          onClose={() => setPayoutModalData(null)}
          loading={submittingPayout}
        />
      </div>
    </Modal>
  );
}


