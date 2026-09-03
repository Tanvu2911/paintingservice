import React from "react";
import Modal from "../../../../components/common/Modal";

export default function AssignStaffModal({
  assignModal,
  setAssignModal,
  projectDistrict,
  orderServiceName,
  supervisorModalTab,
  setSupervisorModalTab,
  workerModalTab,
  setWorkerModalTab,
  eligibleSupervisors,
  districtSupervisors,
  idleSupervisors,
  displaySupervisors,
  eligibleWorkers,
  districtWorkers,
  idleWorkers,
  displayWorkers,
  selectedId,
  setSelectedId,
  activeSupervisorJobs,
  activeWorkerJobs,
  handleAssign,
}) {
  if (!assignModal) return null;

  return (
    <Modal
      isOpen={!!assignModal}
      onClose={() => setAssignModal(null)}
      title={
        assignModal === "supervisor"
          ? "Phân công Giám sát khảo sát"
          : "Phân công Đội thợ thi công"
      }
      size="lg"
    >
      <div className="space-y-4">
        {assignModal === "supervisor" ? (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 leading-relaxed">
              <span className="font-bold block text-slate-900">💡 Hướng dẫn phân công Giám Sát:</span>
              • Hệ thống hiển thị các Giám sát viên đang <strong>BẬT trạng thái hoạt động</strong>.
              <br />
              • Ưu tiên chọn giám sát cùng khu vực <strong>{projectDistrict || "Hà Nội"}</strong> hoặc đang rảnh để khảo sát nhanh nhất.
            </div>

            <div className="flex border-b border-slate-200 gap-1 pb-2">
              <button
                type="button"
                onClick={() => setSupervisorModalTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  supervisorModalTab === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                Tất cả ({eligibleSupervisors.length})
              </button>
              <button
                type="button"
                onClick={() => setSupervisorModalTab("district")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  supervisorModalTab === "district"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                ★ Cùng khu vực ({districtSupervisors.length})
              </button>
              <button
                type="button"
                onClick={() => setSupervisorModalTab("idle")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  supervisorModalTab === "idle"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                ⚡ Đang rảnh ({idleSupervisors.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 leading-relaxed">
              <span className="font-bold block text-slate-900">💡 Hướng dẫn phân công Đội Thợ:</span>
              • Dịch vụ yêu cầu: <strong className="text-slate-900">{orderServiceName || "Tất cả"}</strong>.
              <br />
              • Hệ thống <strong>chỉ hiển thị thợ cùng chuyên môn dịch vụ</strong> và đang <strong>BẬT trạng thái hoạt động</strong>.
            </div>

            <div className="flex border-b border-slate-200 gap-1 pb-2">
              <button
                type="button"
                onClick={() => setWorkerModalTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  workerModalTab === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                Tất cả ({eligibleWorkers.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkerModalTab("district")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  workerModalTab === "district"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                ★ Cùng khu vực ({districtWorkers.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkerModalTab("idle")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  workerModalTab === "idle"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                ⚡ Đang rảnh ({idleWorkers.length})
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {((assignModal === "supervisor" ? displaySupervisors : displayWorkers).length === 0) ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Không tìm thấy nhân viên phù hợp với tiêu chí này
            </p>
          ) : (
            (assignModal === "supervisor" ? displaySupervisors : displayWorkers).map((s) => {
              const sId = String(s.userId || s.id);
              const isSelected = selectedId === sId;

              const isDistrictMatch =
                projectDistrict &&
                s.serviceArea?.toLowerCase().includes(projectDistrict.replace("Quận ", "").replace("Huyện ", "").toLowerCase());

              const currentLoad =
                assignModal === "supervisor"
                  ? (activeSupervisorJobs[sId] || 0)
                  : (activeWorkerJobs[sId] || 0);

              return (
                <div
                  key={sId}
                  onClick={() => setSelectedId(sId)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
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
                          assignModal === "supervisor"
                            ? "bg-slate-50 text-slate-900"
                            : "bg-slate-50 text-slate-900"
                        }`}
                      >
                        {(s.username || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          @{s.username} {s.fullName ? `(${s.fullName})` : ""}
                        </span>

                        <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Hoạt động
                        </span>

                        {isDistrictMatch && (
                          <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                            ★ Cùng khu vực
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Chuyên môn: <strong className="text-slate-900">{s.specialty || "Sơn nhà"}</strong></span>
                        <span>
                          Khu vực: <strong className="text-slate-900">{s.serviceArea || "Toàn Hà Nội"}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg block ${
                        currentLoad === 0
                          ? "bg-slate-50 text-slate-900 border border-slate-200"
                          : "bg-slate-50 text-slate-900"
                      }`}
                    >
                      {currentLoad === 0 ? "⚡ Đang rảnh (0 đơn)" : `Đang làm: ${currentLoad} đơn`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setAssignModal(null)}
            className="flex-1 py-2 bg-slate-50 text-slate-500 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedId}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            Xác Nhận Phân Công
          </button>
        </div>
      </div>
    </Modal>
  );
}

