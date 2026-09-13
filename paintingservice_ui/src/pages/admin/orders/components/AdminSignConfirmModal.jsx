import React from "react";
import Modal from "../../../../components/common/Modal";
import { formatMoney } from "../../../../util/formatters";

export default function AdminSignConfirmModal({
  confirmDepositModal,
  setConfirmDepositModal,
  isDepositPaid,
  order,
  contract,
  adminSigCanvasRef,
  hasAdminSignature,
  clearAdminSignature,
  handleConfirmDeposit,
}) {
  if (!confirmDepositModal) return null;

  const hasExistingSig = Boolean(contract?.adminSignatureImg);

  return (
    <Modal
      isOpen={confirmDepositModal}
      onClose={() => setConfirmDepositModal(false)}
      title="Ký duyệt hợp đồng &amp; Xác nhận cọc"
    >
      <div className="space-y-4">
        {isDepositPaid ? (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 leading-relaxed font-medium">
            <span className="font-bold block text-slate-900 mb-0.5">
              ✓ Khách hàng đã chuyển cọc 30% thành công qua VNPay Sandbox!
            </span>
            Số tiền cọc:{" "}
            <strong className="text-slate-900 font-mono">
              {order?.depositAmount ? formatMoney(order.depositAmount) : "—"}
            </strong>.
            <br />
            Hệ thống sẽ ghi nhận cọc và phân công đội thợ thi công tối ưu nhất cho công trình.
          </div>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Khách hàng thực hiện nộp cọc 30% trực tuyến qua cổng VNPay Sandbox hoặc tiền mặt. Sau khi xác nhận tiền cọc, hợp đồng có đầy đủ hiệu lực và hệ thống sẽ tự động phân công đội thợ thi công phù hợp.
          </p>
        )}

        {hasExistingSig && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-blue-900">
              ✓ Chữ ký đại diện Công ty đã có từ bước gửi báo giá:
            </span>
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-lg border border-blue-200 max-w-[160px]">
                <img
                  src={contract.adminSignatureImg}
                  alt="Chữ ký đã lưu"
                  className="max-h-12 object-contain mx-auto"
                />
              </div>
              <span className="text-[11px] text-blue-700 leading-tight">
                (Bạn có thể giữ chữ ký này hoặc vẽ nét mới vào khung bên dưới để cập nhật lại)
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-slate-900">
              Chữ ký Admin (Đại diện công ty) {hasExistingSig ? "(Tùy chọn ký lại)" : <span className="text-rose-500">*</span>}
            </label>
            <button
              type="button"
              onClick={clearAdminSignature}
              className="text-xs text-slate-500 hover:underline font-semibold cursor-pointer"
            >
              Xóa chữ ký
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden touch-none">
            <canvas
              ref={adminSigCanvasRef}
              width={500}
              height={130}
              className="w-full cursor-crosshair block bg-slate-50"
              style={{ touchAction: "none" }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {hasAdminSignature ? (
              <span className="text-emerald-700 font-semibold">✓ Đã ký nét mới xác nhận</span>
            ) : hasExistingSig ? (
              <span className="text-blue-700 font-semibold">
                ✓ Sẽ sử dụng chữ ký đã có từ bước gửi báo giá
              </span>
            ) : (
              <span className="text-amber-700 font-semibold">
                ⚠️ Vui lòng ký tên vào khung trước khi xác nhận
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setConfirmDepositModal(false)}
            className="flex-1 py-2 bg-slate-50 text-slate-500 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmDeposit}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            Xác Nhận Cọc &amp; Ký Hợp Đồng
          </button>
        </div>
      </div>
    </Modal>
  );
}


