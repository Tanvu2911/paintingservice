import React from "react";
import { Wrench, DollarSign, Sparkles } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { formatMoney } from "../../../../util/formatters";

export default function AssignWarrantyTechnicianModal({
  isOpen,
  onClose,
  claim,
  technicians,
  techTab,
  setTechTab,
  techSearch,
  setTechSearch,
  filteredTechnicians,
  selectedTechnicianId,
  setSelectedTechnicianId,
  technicianNote,
  setTechnicianNote,
  workerSalary,
  setWorkerSalary,
  submittingTechnician,
  handleAssignTechnicianSubmit,
}) {
  if (!isOpen) return null;

  const isCustomerFault = claim?.faultType === "CUSTOMER_FAULT" || Number(claim?.finalSupportPrice) > 0;
  const supportPrice = Number(claim?.finalSupportPrice) || Number(claim?.suggestedPrice) || 0;

  const isPrevWorker = (tid) => {
    if (!tid) return false;
    if (claim?.previousTechnicianId && String(claim.previousTechnicianId) === String(tid)) return true;
    return (claim?.previousTechnicians || []).some((pt) => String(pt.technicianId) === String(tid));
  };

  const isSelectedPreviousTech = Boolean(isPrevWorker(selectedTechnicianId));

  const handleSelectTech = (tid) => {
    setSelectedTechnicianId(tid);
    const isPrev = isPrevWorker(tid);
    if (isCustomerFault) {
      if (supportPrice > 0) {
        setWorkerSalary(String(Math.round(supportPrice * 0.6)));
      } else {
        setWorkerSalary("200000");
      }
    } else if (isPrev) {
      setWorkerSalary("0");
    } else {
      setWorkerSalary("200000");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phân Công Đội Thợ Khắc Phục #${claim?.id}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleAssignTechnicianSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 space-y-1.5">
          <div className="font-bold flex items-center gap-1 text-slate-900">
            <Wrench className="w-4 h-4 text-slate-500" />
            <span>Chọn Đội Thợ Khắc Phục (Ưu tiên đội thợ cũ)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-900">
            Vật tư dặm vá đã được Giám sát chuẩn bị. Đội thợ chỉ việc nhận việc, đến thi công và 1-click báo hoàn thành.
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: `Tất cả (${technicians?.length || 0})` },
                { id: "area", label: "★ Cùng khu vực" },
                { id: "available", label: "⚡ Đang rảnh / Hoạt động" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTechTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    techTab === tab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Tìm tên, SĐT..."
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px] w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Danh sách thợ dạng thẻ (Card list) */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {filteredTechnicians.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Không tìm thấy đội thợ phù hợp theo bộ lọc
              </div>
            ) : (
              filteredTechnicians.map((t) => {
                const tid = String(t.userId || t.id);
                const isSelected = selectedTechnicianId === tid;
                const claimAddress = (claim?.address || "").toLowerCase();
                const tArea = (t.serviceArea || t.address || "").toLowerCase();
                const isDistrictMatch =
                  tArea &&
                  claimAddress &&
                  (claimAddress.includes(tArea) ||
                    tArea.split(",").some((part) => claimAddress.includes(part.trim())));
                const prevTechMatch = (claim?.previousTechnicians || []).find(
                  (pt) => String(pt.technicianId) === tid
                );
                const isPreviousTech = isPrevWorker(tid);

                return (
                  <div
                    key={tid}
                    onClick={() => handleSelectTech(tid)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-blue-600 bg-slate-50 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.username}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-900"
                          }`}
                        >
                          {(t.username || t.fullName || "T").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            @{t.username} {t.fullName ? `(${t.fullName})` : ""}
                          </span>

                          {isPreviousTech && (
                            <span className="text-[10px] font-semibold bg-emerald-600 text-white px-1.5 py-0.5 rounded shrink-0 leading-none">
                              ★ Thợ đã thi công {prevTechMatch?.serviceName ? `: ${prevTechMatch.serviceName}` : "công trình"}
                            </span>
                          )}

                          <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 leading-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            Hoạt động
                          </span>

                          {isDistrictMatch && !isPreviousTech && (
                            <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0 leading-none">
                              ★ Cùng khu vực
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>SĐT: <strong className="text-slate-900">{t.phoneNumber || "Chưa có"}</strong></span>
                          <span>Chuyên môn: <strong className="text-slate-900">{t.specialty || "Thợ sơn & Hoàn thiện"}</strong></span>
                          <span>
                            Khu vực: <strong className="text-slate-900">{t.serviceArea || "Toàn khu vực"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <input
                        type="radio"
                        name="technicianSelect"
                        checked={isSelected}
                        onChange={() => handleSelectTech(tid)}
                        className="w-4 h-4 text-slate-900 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ô nhập số tiền công cho Thợ */}
        <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Số Tiền Công Cho Thợ Thi Công (VNĐ)</span>
            </label>
            {isCustomerFault && supportPrice > 0 && (
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Giá khách đóng: {formatMoney(supportPrice)}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                step="10000"
                value={workerSalary}
                onChange={(e) => setWorkerSalary(e.target.value)}
                placeholder="Nhập số tiền công..."
                className="w-full pl-3 pr-12 py-2 bg-white rounded-lg border border-slate-300 font-bold font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                VNĐ
              </span>
            </div>

            {/* Các nút chọn nhanh */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isCustomerFault && supportPrice > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setWorkerSalary(String(Math.round(supportPrice * 0.6)))}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                    title="Gợi ý hưởng 60% tiền khách"
                  >
                    60% ({formatMoney(Math.round(supportPrice * 0.6))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerSalary(String(Math.round(supportPrice * 0.7)))}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                    title="Gợi ý hưởng 70% tiền khách"
                  >
                    70% ({formatMoney(Math.round(supportPrice * 0.7))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerSalary(String(Math.round(supportPrice * 0.5)))}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    50%
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setWorkerSalary("0")}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    0đ (Trách nhiệm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerSalary("200000")}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    200.000đ
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerSalary("300000")}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    300.000đ
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {isCustomerFault
              ? "Lỗi khách quan: Tiền công trích từ khoản phí hỗ trợ khách đóng. Admin có thể nhập bất kỳ số tiền nào phù hợp với công việc."
              : isSelectedPreviousTech
              ? "★ Thợ cũ chịu trách nhiệm bảo hành: Gợi ý 0đ (không phát sinh thù lao). Admin có thể hỗ trợ thêm tiền xăng xe nếu muốn."
              : "Thợ mới thi công: Công ty thanh toán thù lao theo định mức thỏa thuận (mặc định 200.000đ hoặc gõ số tiền khác)."}
          </p>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold text-slate-900 text-xs">Ghi chú &amp; Chỉ dẫn cho Thợ (Tùy chọn)</label>
          <textarea
            rows={2}
            value={technicianNote}
            onChange={(e) => setTechnicianNote(e.target.value)}
            placeholder="Liên hệ Giám sát để nhận vật tư sơn đúng mã màu trước khi qua..."
            className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submittingTechnician}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5 text-center leading-normal"
          >
            <Wrench className="w-4 h-4 shrink-0" />
            <span>{submittingTechnician ? "Đang gán..." : "Xác Nhận Phân Thợ & Tiền Công"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}


