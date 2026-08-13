// staff/components/JobCard.jsx

import StatusBadge from "../../../components/common/StatusBadge";

/**
 * Nút theo status (luồng đội thợ):
 * - CONTRACT_APPROVED / ASSIGNED  → Nhận việc + Từ chối
 * - ACCEPTED                      → Bắt đầu thi công (+ tùy chọn Từ chối)
 * - PROCESSING                    → Hoàn thành công trình
 * - WORKER_COMPLETED              → Chờ nghiệm thu (không nút)
 * - COMPLETED / CANCELLED         → Chỉ hiển thị
 */
export default function JobCard({
  job,
  onAccept,
  onReject,
  onStart,
  onComplete,
}) {
  const status = job.status || "";

  // Trạng thái có thể nhận việc
  const canAccept = ["CONTRACT_APPROVED", "ASSIGNED"].includes(status);

  // Có thể từ chối (trước khi bắt đầu làm)
  const canReject = ["CONTRACT_APPROVED", "ASSIGNED", "ACCEPTED"].includes(
    status
  );

  // Đang thi công → hoàn thành
  const canComplete = status === "PROCESSING";

  const isWaitingAcceptance = status === "WORKER_COMPLETED";
  const isDone = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div>
          <span className="text-xs font-bold text-slate-400">
            ĐƠN #{job.id}
          </span>
          <h3 className="font-bold text-slate-800 mt-1">
            {job.title || job.serviceName || "Công trình"}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Nội dung */}
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

      {/* ===== Nhận việc / Từ chối (CONTRACT_APPROVED | ASSIGNED) ===== */}
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

      {/* ===== Đã nhận (ACCEPTED) → Bắt đầu (+ Từ chối) ===== */}
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

      {/* ===== CONTRACT_APPROVED đã hiện block nhận việc ở trên.
          Nếu backend cho start trực tiếp khi CONTRACT_APPROVED (không bắt accept):
          bỏ comment block dưới và tắt canAccept cho CONTRACT_APPROVED nếu cần. ===== */}

      {/* ===== Đang thi công → Hoàn thành ===== */}
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

      {/* ===== Chờ nghiệm thu ===== */}
      {isWaitingAcceptance && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-center text-purple-600 font-semibold text-sm bg-purple-50 rounded-xl py-2">
            🏁 Đã xong — chờ giám sát & chủ nhà nghiệm thu
          </div>
        </div>
      )}

      {/* ===== Hoàn tất ===== */}
      {isDone && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-center text-green-600 font-semibold text-sm">
            🎉 Công trình đã hoàn thành
          </div>
        </div>
      )}

      {/* ===== Đã hủy ===== */}
      {isCancelled && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-center text-slate-400 font-semibold text-sm">
            Đơn đã hủy
          </div>
        </div>
      )}
    </div>
  );
}