import React from "react";
import Modal from "../../../../components/common/Modal";
import { formatMoney } from "../../../../util/formatters";
import { parseNegotiationInfo } from "../../../../util/orderFlowUtils";

export default function SendQuoteModal({
  quoteModalOpen,
  setQuoteModalOpen,
  order,
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
  if (!quoteModalOpen) return null;

  const negInfo = parseNegotiationInfo(order?.description);
  const proposedRawNumber = negInfo.proposedPrice
    ? negInfo.proposedPrice.replace(/[^\d]/g, "")
    : null;

  return (
    <Modal
      isOpen={quoteModalOpen}
      onClose={() => setQuoteModalOpen(false)}
      title={
        order?.status === "WAITING_CUSTOMER_SIGNATURE"
          ? "Điều chỉnh báo giá & Dự toán thi công"
          : "Lập báo giá & Dự toán thi công"
      }
    >
      <div className="space-y-4">
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
          Dựa trên khảo sát thực tế và thỏa thuận với khách hàng, Admin cập nhật lại tổng dự toán, số ngày thi công và thời hạn bảo hành. Hợp đồng điện tử sẽ tự động đồng bộ theo mức giá mới.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1">
              Tổng giá trị dự toán (VNĐ) <span className="text-slate-500">*</span>
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
                Số ngày làm việc dự kiến <span className="text-slate-500">*</span>
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
                Thời hạn bảo hành (năm) <span className="text-slate-500">*</span>
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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setQuoteModalOpen(false)}
            className="flex-1 py-2 bg-slate-50 text-slate-500 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSendQuote}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            Gửi Báo Giá &amp; Sinh Hợp Đồng
          </button>
        </div>
      </div>
    </Modal>
  );
}


