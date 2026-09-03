import React from "react";
import { Check, X } from "lucide-react";

export default function SurveyAgreementModal({
  selectedJob,
  customerAgreed,
  setCustomerAgreed,
  contractContent,
  setContractContent,
  rejectReason,
  setRejectReason,
  surveySigCanvasRef,
  hasSurveySignature,
  clearSurveySignature,
  closeModal,
  submitting,
  handleSubmitAgreement,
}) {
  if (!selectedJob) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Kết Quả Thỏa Thuận &amp; Lập Hợp Đồng #{selectedJob.id}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedJob.serviceName} • {selectedJob.address}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-500 text-base transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Khách hàng có đồng ý phương án &amp; báo giá không?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomerAgreed(true)}
                className={`py-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-2 ${
                  customerAgreed
                    ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Khách đồng ý làm</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerAgreed(false)}
                className={`py-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-2 ${
                  !customerAgreed
                    ? "border-blue-600 bg-slate-50 text-slate-900 shadow-xs"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <X className="w-4 h-4" />
                <span>Khách không đồng ý</span>
              </button>
            </div>
          </div>

          {customerAgreed ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Nội dung hợp đồng thi công:
                </label>
                <textarea
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  rows={10}
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-900">
                    Chữ ký Giám sát / Khảo sát viên *
                  </label>
                  <button
                    type="button"
                    onClick={clearSurveySignature}
                    className="text-xs text-slate-500 hover:underline font-semibold cursor-pointer"
                  >
                    Xóa chữ ký
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-lg bg-white overflow-hidden touch-none">
                  <canvas
                    ref={surveySigCanvasRef}
                    className="w-full cursor-crosshair block"
                    style={{ height: 150, touchAction: "none" }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {hasSurveySignature ? (
                    <span className="text-slate-900 font-semibold">
                      Đã ký tên xác nhận
                    </span>
                  ) : (
                    <span className="text-slate-900 font-medium">
                      Vui lòng ký tên vào khung trước khi gửi hợp đồng
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Lý do khách hàng không đồng ý / Hủy đơn:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Nhập lý do khách hàng từ chối (giá cao, thay đổi kế hoạch...)"
                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={closeModal}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleSubmitAgreement}
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {submitting
              ? "Đang xử lý..."
              : customerAgreed
              ? "Lập Hợp Đồng & Gửi Admin Duyệt"
              : "Xác Nhận Hủy Đơn"}
          </button>
        </div>
      </div>
    </div>
  );
}


