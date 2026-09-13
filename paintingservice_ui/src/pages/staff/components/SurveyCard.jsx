import React from "react";
import StatusBadge from "../../../components/common/StatusBadge";
import {
  MapPin,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  Phone,
  ArrowRight,
  Wallet,
  Eye,
  ShieldCheck,
  Camera,
  Award,
  Wrench,
} from "lucide-react";
import { formatMoney } from "../../../util/formatters";
import { formatDate } from "../../../util/orderFlowUtils";

export default function SurveyCard({
  job,
  detail,
  onAccept,
  onReject,
  onOpenReport,
  onOpenDailyReport,
  onSupervisorAccept,
  onViewDetail,
}) {
  const status = job.status || "PENDING";
  const totalAmount = Number(job.totalAmount) || 0;
  const supervisorPayout = totalAmount > 0 ? totalAmount * 0.1 : 0;

  // Supervisor Actions Permissions
  const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
  const canReject = ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED"].includes(status);
  const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
  const canDailyReport = ["CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(status);
  const canSupervisorAccept =
    status === "WORKER_COMPLETED" && (!detail || !detail.supervisorAccepted);

  const hasTeam = job.technicianName || job.preferredTechnicianName;

  return (
    <div
      onClick={() => onViewDetail?.(job)}
      className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-600 hover:shadow-md transition flex flex-col justify-between space-y-3.5 group cursor-pointer"
    >
      <div>
        {/* 1. Header: #ID, Gói sơn & StatusBadge */}
        <div className="flex justify-between items-start gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
              #{job.id}
            </span>
            <span className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
              {job.serviceName || "Khảo sát sơn"}
            </span>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* 2. Tiêu đề công trình */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-slate-900 transition">
          {job.serviceName ? `Công trình: ${job.serviceName}` : `Khảo sát công trình #${job.id}`}
        </h3>

        {/* 3. Khối thông tin cốt lõi (Gọn gàng trong 3-4 dòng) */}
        <div className="space-y-1.5 text-xs text-slate-500 mt-3 border-t border-slate-200/70 pt-2.5">
          {/* Địa chỉ rút gọn 1 dòng */}
          <div className="flex items-center gap-1.5 text-slate-900 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            <span className="truncate">{job.address || "Địa chỉ công trình"}</span>
          </div>

          {/* Khách hàng + Nút gọi điện thoại */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span className="font-semibold text-slate-900 truncate">
                {job.customerName || "Khách hàng"}
              </span>
            </div>
            {job.customerPhone && (
              <a
                href={`tel:${job.customerPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-slate-900 bg-slate-50 hover:bg-[#E2E8F0] hover:text-slate-900 rounded transition border border-slate-200"
                title="Gọi cho khách hàng"
              >
                <Phone className="w-3 h-3 text-slate-900" />
                <span>{job.customerPhone}</span>
              </a>
            )}
          </div>

          {/* Lịch hẹn khảo sát */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            <span className="text-slate-500">
              Lịch hẹn: <strong className="text-slate-900">{job.appointmentDate ? formatDate(job.appointmentDate) : "Chưa đặt lịch"}</strong>
            </span>
          </div>

          {/* Đội thợ phụ trách */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Wrench className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            <span className="text-slate-500">
              Đội thợ: <strong className="text-slate-900">{hasTeam || "Chưa phân công"}</strong>
            </span>
          </div>
        </div>

        {/* 4. Highlight thù lao giám sát (10%) */}
        <div className="mt-3 p-2 bg-[#E2E8F0] border border-slate-200 rounded-lg flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-slate-900" />
            <span>Thù lao GS (10%):</span>
          </span>
          <span className="text-xs font-black text-slate-900 font-mono">
            {formatMoney(supervisorPayout)}
          </span>
        </div>
      </div>

      {/* 5. Footer Buttons */}
      <div
        className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Chi Tiết */}
        <button
          type="button"
          onClick={() => onViewDetail?.(job)}
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition flex items-center gap-1 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-900" />
          <span>Chi tiết</span>
        </button>

        {/* Các nút hành động chính */}
        <div className="flex items-center gap-1.5">
          {canAccept && (
            <>
              {canReject && (
                <button
                  type="button"
                  onClick={() => onReject?.(job.id)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-50 text-slate-900 border border-slate-200 transition cursor-pointer"
                  title="Từ chối nhận việc"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onAccept?.(job.id)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Nhận việc</span>
              </button>
            </>
          )}

          {canReport && (
            <button
              type="button"
              onClick={() => onOpenReport?.(job)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Báo cáo KS</span>
            </button>
          )}

          {canDailyReport && (
            <button
              type="button"
              onClick={() => onOpenDailyReport?.(job)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Nhật ký</span>
            </button>
          )}

          {canSupervisorAccept && (
            <button
              type="button"
              onClick={() => onSupervisorAccept?.(job.id)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Nghiệm thu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
