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
  Sparkles,
  Phone,
  ArrowRight,
  Wallet,
  Eye,
} from "lucide-react";
import { formatMoney } from "../../../util/formatters";
import { formatDate } from "../../../util/orderFlowUtils";

/**
 * Luồng đội thợ thi công:
 * CONTRACT_APPROVED / DEPOSIT_CONFIRMED / ASSIGNED  → Nhận việc / Từ chối
 * ACCEPTED                                          → Bắt đầu thi công
 * PROCESSING                                        → Báo hoàn thành
 */
export default function JobCard({
  job,
  onAccept,
  onReject,
  onStart,
  onComplete,
  onViewDetail,
}) {
  const status = job.status || "";
  const canAccept = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED"].includes(status);
  const canReject = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED", "ACCEPTED"].includes(status);
  const canStart = status === "ACCEPTED";
  const canComplete = status === "PROCESSING";

  const isWaitingAcceptance = status === "WORKER_COMPLETED";
  const isDone = ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(status);
  const isCancelled = status === "CANCELLED" || status === "WORKER_REJECTED";

  return (
    <div
      onClick={() => onViewDetail?.(job)}
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between space-y-4 group cursor-pointer"
    >
      <div>
        {/* Card Header: Mã đơn, Dịch vụ & Status */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-black rounded-lg tracking-wider">
                #{job.id}
              </span>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 truncate max-w-[140px]">
                {job.serviceName || job.service?.name || "Sơn sửa nhà"}
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base mt-2 line-clamp-1 group-hover:text-emerald-700 transition">
              {job.title || job.serviceName || `Công trình #${job.id}`}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Thông tin chính ngắn gọn */}
        <div className="space-y-2.5 text-xs bg-slate-50/90 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-slate-800 font-bold leading-relaxed">
              {job.address || "Địa chỉ theo công trình"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                Khách: <strong className="text-slate-900">{job.customerName || job.customer?.username || "Khách hàng"}</strong>
              </span>
            </div>
            {job.customerPhone && (
              <a
                href={`tel:${job.customerPhone}`}
                className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3 h-3" />
                <span>{job.customerPhone}</span>
              </a>
            )}
          </div>

          {(job.expectedStartDate || job.appointmentDate) && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Ngày thi công: <strong className="text-slate-900">{formatDate(job.expectedStartDate || job.appointmentDate)}</strong>
              </span>
            </div>
          )}

          {job.totalAmount && Number(job.totalAmount) > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thù lao nhận được:</span>
                </span>
                <span className="font-black text-emerald-700 text-sm font-mono">
                  {formatMoney(Number(job.totalAmount) * 0.60)}
                </span>
              </div>
            </div>
          )}

          {job.description && (
            <div className="pt-2 border-t border-slate-100 text-slate-500 line-clamp-2 italic text-[11px]">
              &ldquo;{job.description}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        {canAccept && (
          <div className="flex gap-2">
            {canReject && (
              <button
                type="button"
                onClick={() => onReject?.(job.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Từ chối</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onAccept?.(job.id)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Nhận việc</span>
            </button>
          </div>
        )}

        {canStart && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onStart?.(job)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Bắt đầu thi công ngay</span>
            </button>
            {canReject && (
              <button
                type="button"
                onClick={() => onReject?.(job.id)}
                className="w-full py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-rose-50 hover:text-rose-600 transition text-xs cursor-pointer"
              >
                Hủy / Trả lại đơn
              </button>
            )}
          </div>
        )}

        {canComplete && (
          <button
            type="button"
            onClick={() => onComplete?.(job.id)}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs transition text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Báo Hoàn Thành Thi Công</span>
          </button>
        )}

        {isWaitingAcceptance && (
          <div className="text-center text-teal-700 font-bold text-xs bg-teal-50 border border-teal-200 rounded-2xl py-2.5 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Đã báo xong — Chờ nghiệm thu &amp; tất toán</span>
          </div>
        )}

        {isDone && (
          <div className="text-center text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 rounded-2xl py-2.5 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Công trình hoàn tất 100%</span>
          </div>
        )}

        {isCancelled && (
          <div className="text-center text-slate-500 font-semibold text-xs bg-slate-100 rounded-2xl py-2">
            {status === "WORKER_REJECTED" ? "Đã từ chối đơn này" : "Đơn đã hủy"}
          </div>
        )}

        {/* Nút Xem chi tiết công trình */}
        <button
          type="button"
          onClick={() => onViewDetail?.(job)}
          className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Xem chi tiết công trình</span>
        </button>
      </div>
    </div>
  );
}