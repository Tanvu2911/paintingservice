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
  ArrowRight,
} from "lucide-react";
import { formatMoney } from "../../../util/formatters";

/**
 * Luồng đội thợ:
 * CONTRACT_APPROVED / ASSIGNED  → Nhận việc + Từ chối
 * ACCEPTED                      → Bắt đầu thi công
 * PROCESSING                    → Hoàn thành
 */
export default function JobCard({
  job,
  onAccept,
  onReject,
  onStart,
  onComplete,
}) {
  const status = job.status || "";
  const canAccept = ["CONTRACT_APPROVED", "ASSIGNED"].includes(status);
  const canReject = ["CONTRACT_APPROVED", "ASSIGNED", "ACCEPTED"].includes(status);
  const canComplete = status === "PROCESSING";

  const isWaitingAcceptance = status === "WORKER_COMPLETED";
  const isDone = status === "COMPLETED";
  const isCancelled = status === "CANCELLED" || status === "WORKER_REJECTED";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between space-y-4 group">
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-lg tracking-wider">
                #{job.id}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {job.serviceName || job.service?.name || "Sơn nhà"}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1 group-hover:text-emerald-700 transition">
              {job.title || job.serviceName || `Công trình #${job.id}`}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-2.5 text-xs bg-slate-50/90 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-slate-800 font-bold leading-relaxed">
              {job.address || "Địa chỉ theo đơn đăng ký"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-slate-600">
              Khách hàng: <strong className="text-slate-900">{job.customerName || job.customer?.username || "Chưa cập nhật"}</strong>
            </p>
          </div>

          {(job.expectedStartDate || job.appointmentDate) && (
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-slate-600">
                Ngày thi công: <strong className="text-slate-900">{job.expectedStartDate || job.appointmentDate}</strong>
              </p>
            </div>
          )}

          {job.totalAmount && Number(job.totalAmount) > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Giá trị công trình:</span>
              <span className="font-black text-slate-900 text-sm">
                {formatMoney(job.totalAmount)}
              </span>
            </div>
          )}

          {job.description && (
            <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-500 line-clamp-2 italic">
                "{job.description}"
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        {canAccept && (
          <div className="flex gap-2.5 pt-2">
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

        {status === "ACCEPTED" && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onStart?.(job)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt đầu thi công</span>
            </button>
            {canReject && (
              <button
                type="button"
                onClick={() => onReject?.(job.id)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-rose-50 hover:text-rose-600 transition text-xs cursor-pointer"
              >
                Hủy / Trả lại đơn
              </button>
            )}
          </div>
        )}

        {canComplete && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onComplete?.(job.id)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Báo Hoàn Thành Công Trình</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Đơn sẽ chuyển sang giai đoạn nghiệm thu với Giám sát &amp; Khách hàng.
            </p>
          </div>
        )}

        {isWaitingAcceptance && (
          <div className="text-center text-purple-700 font-bold text-xs bg-purple-50 border border-purple-200 rounded-2xl py-3 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Đã hoàn thành — Chờ nghiệm thu &amp; tất toán</span>
          </div>
        )}

        {isDone && (
          <div className="text-center text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 rounded-2xl py-3 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Công trình đã hoàn tất &amp; bàn giao</span>
          </div>
        )}

        {isCancelled && (
          <div className="text-center text-slate-500 font-semibold text-xs bg-slate-100 rounded-2xl py-2.5">
            {status === "WORKER_REJECTED" ? "Đã từ chối công trình này" : "Đơn đã hủy"}
          </div>
        )}
      </div>
    </div>
  );
}