import React from "react";
import {
  Calendar,
  FileText,
  User,
  Phone,
  Wrench,
  MapPin,
  Wallet,
  Check,
  X,
  Award,
  Eye,
} from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatMoney } from "../../../../util/formatters";
import { formatDate } from "../../../../util/orderFlowUtils";
import { parseHanoiAddress } from "../../../../data/hanoiLocations";

export default function SurveyJobsGrid({
  paginatedJobs,
  detailsMap,
  openModal,
  handleAcceptJob,
  handleRejectJob,
  handleSupervisorAccept,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {paginatedJobs.map((job) => {
        const detail = detailsMap[job.id] || null;
        const status = job.status || "PENDING";
        const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
        const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
        const hasSurveyReport = Boolean(
          detail?.surveyNote || detail?.materialNote || detail?.materialShortage
        );
        const canDailyReport = ["CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(status);
        const canSupervisorAccept =
          status === "WORKER_COMPLETED" && (!detail || !detail.supervisorAccepted);
        const hasTeam = job.technicianName || job.preferredTechnicianName;
        const parsed = parseHanoiAddress(job.address);
        const supervisorPayout =
          Number(job.totalAmount) > 0 ? Number(job.totalAmount) * 0.1 : 0;

        return (
          <div
            key={job.id}
            onClick={() => openModal(job, "view")}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-3">
              {/* Top: Code, Service name & Status */}
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-xs">
                      #{job.id}
                    </span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {job.serviceName || "Khảo sát sơn"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Body Info Box */}
              <div className="space-y-2.5 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                {/* Địa chỉ */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-slate-800 font-semibold leading-relaxed line-clamp-2" title={job.address}>
                      {job.address || "Chưa có địa chỉ"}
                    </p>
                    {parsed.district && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {parsed.district}
                      </span>
                    )}
                  </div>
                </div>

                {/* Khách hàng */}
                <div className="flex items-center justify-between gap-2 text-slate-600 pt-1 border-t border-slate-200/50">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Khách: <strong className="text-slate-900">{job.customerName || "Khách hàng"}</strong></span>
                  </div>
                  {job.customerPhone && (
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0 flex items-center gap-1 font-mono transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                      <span>{job.customerPhone}</span>
                    </a>
                  )}
                </div>

                {/* Lịch hẹn & Thợ */}
                <div className="flex items-center justify-between gap-2 text-slate-600">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Hẹn:{" "}
                      <strong className="text-slate-800">
                        {job.appointmentDate ? (
                          <>
                            <span>{formatDate(job.appointmentDate)}</span>
                            {job.appointmentTime && (
                              <span className="text-blue-700 font-mono ml-1 font-bold bg-blue-50 px-1 py-0.2 rounded">
                                {job.appointmentTime.slice(0, 5)}
                              </span>
                            )}
                          </>
                        ) : (
                          "Chưa đặt"
                        )}
                      </strong>
                    </span>
                  </div>
                  {hasTeam ? (
                    <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                      @{hasTeam}
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic shrink-0">Chưa gán thợ</span>
                  )}
                </div>

                {/* Yêu cầu từ khách */}
                {job.description && (
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-slate-700 not-italic">Yêu cầu: </span>
                    <span className="italic">"{job.description}"</span>
                  </div>
                )}

                {/* Báo cáo KS badge if available */}
                {hasSurveyReport && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    <FileText className="w-3 h-3" />
                    <span>Đã có báo cáo khảo sát</span>
                  </div>
                )}

                {/* Thù lao & Dự toán */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-800 bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-100">
                    <Wallet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-[11px] font-semibold">Thù lao:</span>
                    <strong className="font-mono text-xs text-blue-900">{formatMoney(supervisorPayout)}</strong>
                  </div>
                  {Number(job.totalAmount) > 0 ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Tổng dự toán</span>
                      <span className="font-bold text-slate-900 text-xs font-mono">{formatMoney(job.totalAmount)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Chưa lập dự toán</span>
                  )}
                </div>
              </div>
            </div>

            {/* Grid Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
              {canAccept && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAcceptJob(job.id)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Nhận việc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectJob(job.id)}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    title="Từ chối việc"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                </>
              )}

              {canReport && (
                <button
                  type="button"
                  onClick={() => openModal(job, "report")}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Báo cáo KS</span>
                </button>
              )}

              {canDailyReport && (
                <button
                  type="button"
                  onClick={() => openModal(job, "daily")}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Nhật ký</span>
                </button>
              )}

              {canSupervisorAccept && (
                <button
                  type="button"
                  onClick={() => handleSupervisorAccept(job.id)}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Nghiệm thu</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => openModal(job, "view")}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 border border-slate-200 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Chi tiết</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
