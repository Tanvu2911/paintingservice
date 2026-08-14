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
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div>
          <span className="text-xs font-bold text-slate-400">ĐƠN #{job.id}</span>
          <h3 className="font-bold text-slate-800 mt-1">
            {job.title || job.serviceName || "Công trình"}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-400">📍 Địa chỉ:</span>{" "}
          {job.address || "—"}
        </p>
        <p>
          <span className="font-semibold text-slate-400">👤 Khách hàng:</span>{" "}
          {job.customerName || job.customer?.username || "Không xác định"}
        </p>
        <p>
          <span className="font-semibold text-slate-400">📅 Ngày khảo sát:</span>{" "}
          {job.appointmentDate || "—"}
        </p>
        <p>
          <span className="font-semibold text-slate-400">🕒 Giờ khảo sát:</span>{" "}
          {job.appointmentTime || "—"}
        </p>
        <p>
          <span className="font-semibold text-slate-400">📝 Mô tả:</span>{" "}
          {job.description || "Không có mô tả"}
        </p>
        {(job.preferredTechnicianName || job.technicianName) && (
          <p>
            <span className="font-semibold text-slate-400">👷 Thợ:</span>{" "}
            {job.technicianName || job.preferredTechnicianName}
          </p>
        )}
      </div>

      {/* Đã xóa toàn bộ block "Báo cáo tiến độ" */}

      {canAccept && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          {canReject && (
            <button
              type="button"
              onClick={() => onReject?.(job.id)}
              className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition text-sm"
            >
              ❌ Từ chối
            </button>
          )}
          <button
            type="button"
            onClick={() => onAccept?.(job.id)}
            className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition text-sm"
          >
            ✅ Nhận việc
          </button>
        </div>
      )}

      {status === "ACCEPTED" && (
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onStart?.(job)}
            className="w-full py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm"
          >
            🚧 Bắt đầu thi công
          </button>
          {canReject && (
            <button
              type="button"
              onClick={() => onReject?.(job.id)}
              className="w-full py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition text-sm"
            >
              ❌ Từ chối
            </button>
          )}
        </div>
      )}

      {canComplete && (
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onComplete?.(job.id)}
            className="w-full py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition text-sm"
          >
            ✅ Hoàn thành công trình
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Sau khi xác nhận, đơn chờ giám sát và chủ nhà nghiệm thu.
          </p>
        </div>
      )}

      {isWaitingAcceptance && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-center text-purple-600 font-semibold text-sm bg-purple-50 rounded-xl py-2">
            🏁 Đã xong — chờ giám sát & chủ nhà nghiệm thu
          </div>
        </div>
      )}

      {isDone && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-center text-green-600 font-semibold text-sm">
            🎉 Công trình đã hoàn thành
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-center text-slate-400 font-semibold text-sm">
            {status === "WORKER_REJECTED" ? "Đã từ chối công trình" : "Đơn đã hủy"}
          </div>
        </div>
      )}
    </div>
  );
}