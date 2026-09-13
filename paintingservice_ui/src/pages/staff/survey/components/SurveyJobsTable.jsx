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

export default function SurveyJobsTable({
  paginatedJobs,
  detailsMap,
  openModal,
  handleAcceptJob,
  handleRejectJob,
  handleSupervisorAccept,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
              <th className="py-3.5 px-4">Mã &amp; Dịch vụ</th>
              <th className="py-3.5 px-4">Khách hàng</th>
              <th className="py-3.5 px-4">Địa chỉ &amp; Khu vực</th>
              <th className="py-3.5 px-4">Thù lao giám sát</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                <tr
                  key={job.id}
                  className="hover:bg-slate-50/80 transition group cursor-pointer"
                  onClick={() => openModal(job, "view")}
                >
                  {/* 1. Mã đơn & Dịch vụ */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-[11px] group-hover:bg-blue-100 transition">
                        #{job.id}
                      </span>
                      <span className="text-slate-800 truncate max-w-[150px]" title={job.serviceName || "Khảo sát sơn"}>
                        {job.serviceName || "Khảo sát sơn"}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {job.appointmentDate ? (
                          <>
                            <span>{formatDate(job.appointmentDate)}</span>
                            {job.appointmentTime && (
                              <span className="text-blue-700 font-mono ml-1 font-bold bg-blue-50 px-1 py-0.2 rounded text-[10px]">
                                {job.appointmentTime.slice(0, 5)}
                              </span>
                            )}
                          </>
                        ) : (
                          "Chưa đặt lịch hẹn"
                        )}
                      </span>
                    </div>
                    {hasSurveyReport && (
                      <div className="inline-flex items-center gap-1 text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 border border-indigo-200">
                        <FileText className="w-2.5 h-2.5" />
                        <span>Đã có báo cáo KS</span>
                      </div>
                    )}
                  </td>

                  {/* 2. Khách hàng */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.customerName || "Khách hàng"}</span>
                    </div>
                    {job.customerPhone && (
                      <div className="text-[10.5px] text-slate-600 mt-1 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                        <a
                          href={`tel:${job.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-blue-700 hover:underline font-bold"
                        >
                          {job.customerPhone}
                        </a>
                      </div>
                    )}
                    {hasTeam && (
                      <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[130px]" title={job.technicianName || job.preferredTechnicianName}>
                          Thợ: {job.technicianName || job.preferredTechnicianName}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* 3. Địa chỉ & Khu vực */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-start gap-1 text-slate-700 max-w-[220px]" title={job.address}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed text-[11.5px]">
                        {job.address || "—"}
                      </span>
                    </div>
                    {job.description && (
                      <div className="mt-1 text-[10.5px] text-slate-500 italic line-clamp-1 max-w-[220px]" title={job.description}>
                        Ghi chú: "{job.description}"
                      </div>
                    )}
                    {parsed.district && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        {parsed.district}
                      </span>
                    )}
                  </td>

                  {/* 4. Thù lao giám sát */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold text-xs font-mono border border-blue-100 shadow-2xs">
                      <Wallet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{formatMoney(supervisorPayout)}</span>
                    </div>
                    {Number(job.totalAmount) > 0 ? (
                      <div className="text-[10.5px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                        <span>Dự toán:</span>
                        <span className="font-mono font-semibold text-slate-700">{formatMoney(job.totalAmount)}</span>
                      </div>
                    ) : (
                      <div className="text-[10.5px] text-slate-400 italic mt-1">Chưa có dự toán</div>
                    )}
                  </td>

                  {/* 5. Trạng thái */}
                  <td className="py-3.5 px-4 align-middle">
                    <StatusBadge status={status} />
                  </td>

                  {/* 6. Thao tác */}
                  <td className="py-3.5 px-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {canAccept && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptJob(job.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                            title="Nhận việc khảo sát"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Nhận việc</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectJob(job.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer flex items-center gap-1 text-xs"
                            title="Từ chối nhận việc"
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
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Báo cáo KS</span>
                        </button>
                      )}

                      {canDailyReport && (
                        <button
                          type="button"
                          onClick={() => openModal(job, "daily")}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Nhật ký</span>
                        </button>
                      )}

                      {canSupervisorAccept && (
                        <button
                          type="button"
                          onClick={() => handleSupervisorAccept(job.id)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Nghiệm thu</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openModal(job, "view")}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition cursor-pointer shadow-xs flex items-center gap-1 text-xs"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chi tiết</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
