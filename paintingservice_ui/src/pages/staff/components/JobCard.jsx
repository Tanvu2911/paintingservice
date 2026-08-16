import StatusBadge from "../../../components/common/StatusBadge";

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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group">
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md tracking-wider">
              #{job.id}
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-1.5 line-clamp-1 group-hover:text-blue-600 transition">
              {job.title || job.serviceName || "Dịch vụ sơn sửa nhà"}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-2 text-sm bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 mt-0.5">📍</span>
            <p className="text-slate-800 font-medium text-xs leading-relaxed">
              {job.address || "Địa chỉ theo đơn đăng ký"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">👤</span>
            <p className="text-slate-700 text-xs">
              Khách hàng: <strong className="text-slate-900">{job.customerName || job.customer?.username || "Chưa cập nhật"}</strong>
            </p>
          </div>
          {(job.appointmentDate || job.appointmentTime) && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 shrink-0">📅</span>
              <p className="text-slate-700 text-xs">
                Thời gian: <strong className="text-slate-900">{job.appointmentDate || "—"} {job.appointmentTime ? `(${job.appointmentTime})` : ""}</strong>
              </p>
            </div>
          )}
          {job.description && (
            <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
              <span className="text-slate-400 shrink-0 mt-0.5">📝</span>
              <p className="text-slate-600 text-xs line-clamp-2 italic">
                "{job.description}"
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        {canAccept && (
          <div className="flex gap-2 pt-2">
            {canReject && (
              <button
                type="button"
                onClick={() => onReject?.(job.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 border border-rose-200 transition text-xs flex items-center justify-center gap-1.5"
              >
                <span>✕</span> Từ chối
              </button>
            )}
            <button
              type="button"
              onClick={() => onAccept?.(job.id)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm transition text-xs flex items-center justify-center gap-1.5"
            >
              <span>✓</span> Nhận việc
            </button>
          </div>
        )}

        {status === "ACCEPTED" && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onStart?.(job)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm transition text-xs flex items-center justify-center gap-1.5"
            >
              <span>🚧</span> Bắt đầu thi công
            </button>
            {canReject && (
              <button
                type="button"
                onClick={() => onReject?.(job.id)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-rose-50 hover:text-rose-600 transition text-xs"
              >
                Hủy / Từ chối nhận
              </button>
            )}
          </div>
        )}

        {canComplete && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onComplete?.(job.id)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm transition text-xs flex items-center justify-center gap-1.5"
            >
              <span>🏁</span> Báo hoàn thành công trình
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-1.5">
              Đơn sẽ chuyển sang bước Nghiệm thu với Giám sát &amp; Khách hàng.
            </p>
          </div>
        )}

        {isWaitingAcceptance && (
          <div className="text-center text-purple-700 font-bold text-xs bg-purple-50 border border-purple-200 rounded-xl py-2.5">
            ⏳ Đã hoàn thành — Chờ nghiệm thu &amp; tất toán
          </div>
        )}

        {isDone && (
          <div className="text-center text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 rounded-xl py-2.5">
            🎉 Công trình đã hoàn thành xuất sắc
          </div>
        )}

        {isCancelled && (
          <div className="text-center text-slate-500 font-medium text-xs bg-slate-100 rounded-xl py-2">
            {status === "WORKER_REJECTED" ? "Đã từ chối công trình" : "Đơn đã hủy"}
          </div>
        )}
      </div>
    </div>
  );
}