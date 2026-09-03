import React from "react";
import { UserCheck } from "lucide-react";
import Modal from "../../../../components/common/Modal";

export default function AssignWarrantySurveyorModal({
  isOpen,
  onClose,
  claim,
  surveyors,
  supervisorModalTab,
  setSupervisorModalTab,
  supervisorSearch,
  setSupervisorSearch,
  filteredSupervisors,
  selectedSurveyorId,
  setSelectedSurveyorId,
  surveyorNote,
  setSurveyorNote,
  submittingSurveyor,
  handleAssignSurveyorSubmit,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phân Công Giám Sát Khảo Sát Ca Bảo Hành #${claim?.id}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleAssignSurveyorSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 space-y-1.5">
          <div className="font-bold flex items-center gap-1 text-slate-900">
            <UserCheck className="w-4 h-4 text-slate-900" />
            <span>Chỉ định Giám sát viên đến thẩm định hiện trường</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-900">
            Giám sát sẽ đến địa chỉ <strong>{claim?.address || "công trình"}</strong> để kiểm tra hiện trạng nứt/bong tróc và chụp ảnh báo cáo về cho Admin.
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: `Tất cả (${surveyors?.length || 0})` },
                { id: "district", label: "★ Cùng khu vực" },
                { id: "idle", label: "⚡ Đang rảnh / Hoạt động" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSupervisorModalTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    supervisorModalTab === tab.id
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
              value={supervisorSearch}
              onChange={(e) => setSupervisorSearch(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px] w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Danh sách giám sát dạng thẻ */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {filteredSupervisors.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Không tìm thấy giám sát phù hợp theo bộ lọc
              </div>
            ) : (
              filteredSupervisors.map((s) => {
                const sId = String(s.userId || s.id);
                const isSelected = selectedSurveyorId === sId;
                const claimAddress = (claim?.address || "").toLowerCase();
                const sArea = (s.serviceArea || s.address || "").toLowerCase();
                const isDistrictMatch =
                  sArea &&
                  claimAddress &&
                  (claimAddress.includes(sArea) ||
                    sArea.split(",").some((part) => claimAddress.includes(part.trim())));

                return (
                  <div
                    key={sId}
                    onClick={() => setSelectedSurveyorId(sId)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-blue-600 bg-slate-50 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {s.avatar ? (
                        <img
                          src={s.avatar}
                          alt={s.username}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-900"
                          }`}
                        >
                          {(s.username || s.fullName || "S").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            @{s.username} {s.fullName ? `(${s.fullName})` : ""}
                          </span>

                          <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 leading-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            Hoạt động
                          </span>

                          {isDistrictMatch && (
                            <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0 leading-none">
                              ★ Cùng khu vực
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>SĐT: <strong className="text-slate-900">{s.phoneNumber || "Chưa có"}</strong></span>
                          <span>Chuyên môn: <strong className="text-slate-900">{s.specialty || "Giám sát & Thẩm định sơn"}</strong></span>
                          <span>
                            Khu vực: <strong className="text-slate-900">{s.serviceArea || "Toàn khu vực"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <input
                        type="radio"
                        name="surveyorSelect"
                        checked={isSelected}
                        onChange={() => setSelectedSurveyorId(sId)}
                        className="w-4 h-4 text-slate-900 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ghi chú giao việc */}
        <div className="space-y-1">
          <label className="block font-semibold text-slate-900 text-xs">
            Ghi chú hướng dẫn cho Giám Sát (Tùy chọn)
          </label>
          <textarea
            rows={2}
            value={surveyorNote}
            onChange={(e) => setSurveyorNote(e.target.value)}
            placeholder="Ví dụ: Khách báo bong tróc khu vực trần thạch cao phòng khách, mang theo thước đo và bảng màu Dulux..."
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
            disabled={submittingSurveyor}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5 text-center leading-normal"
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{submittingSurveyor ? "Đang gán..." : "Xác Nhận Phân Công"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}


