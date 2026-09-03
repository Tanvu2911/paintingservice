import React from "react";
import Modal from "../../../../components/common/Modal";
import { formatMoney } from "../../../../util/formatters";

export default function AdminSignConfirmModal({
  confirmDepositModal,
  setConfirmDepositModal,
  isDepositPaid,
  order,
  adminSigCanvasRef,
  hasAdminSignature,
  clearAdminSignature,
  handleConfirmDeposit,
}) {
  if (!confirmDepositModal) return null;

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
            Admin tiến hành ký chữ ký điện tử đại diện Công ty vào khung bên dưới để hợp đồng có đầy đủ pháp lý và kích hoạt quyền phân công thợ.
          </div>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Khách hàng thực hiện nộp cọc 30% trực tuyến qua cổng VNPay Sandbox. Sau khi xác nhận tiền cọc, Admin tiến hành ký chữ ký điện tử đóng dấu hợp đồng.
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-slate-900">
              Chữ ký Admin (Đại diện công ty) <span className="text-slate-500">*</span>
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
              height={150}
              className="w-full cursor-crosshair block bg-slate-50"
              style={{ touchAction: "none" }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {hasAdminSignature ? (
              <span className="text-slate-900 font-semibold">✓ Đã ký tên xác nhận</span>
            ) : (
              <span className="text-slate-900 font-semibold">
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
            Ký Hợp Đồng &amp; Xác Nhận Cọc
          </button>
        </div>
      </div>
    </Modal>
  );
}


