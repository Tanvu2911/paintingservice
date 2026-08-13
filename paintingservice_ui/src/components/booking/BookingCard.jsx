import StatusBadge from "../common/StatusBadge";
import { formatMoney } from "../../util/formatters";

export default function BookingCard({
  job,
  detail,
  actions,
  className = "",
}) {
  if (!job) return null;

  const status = job.status || "PENDING";
  const hasTeam = job.technicianName || job.teamName;
  const hasQuote = job.totalAmount != null && Number(job.totalAmount) > 0;

  return (
    <div
      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-800 text-base">
              {job.title || job.serviceName || `Đơn hàng #${job.id}`}
            </p>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-slate-600">
            📍 {job.address || "Chưa có địa chỉ"}
          </p>
          <p className="text-xs text-slate-400">
            📅{" "}
            {job.appointmentDate || job.bookingDate
              ? new Date(
                  job.appointmentDate || job.bookingDate
                ).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Chưa có thời gian"}
          </p>
          {job.customerName && (
            <p className="text-xs text-slate-500">
              👤 Khách hàng: {job.customerName}
            </p>
          )}
          {(job.preferredTechnicianName ||
            job.preferredTechnician?.username) && (
            <p className="text-xs text-blue-600 font-medium">
              👷 Đội thợ khách chọn:{" "}
              {job.preferredTechnicianName || job.preferredTechnician?.username}
            </p>
          )}
          {hasQuote && (
            <p className="text-xs text-emerald-700 font-semibold">
              💰 Tổng: {formatMoney(job.totalAmount)}
              {" · "}
              Cọc: {formatMoney(job.depositAmount)}
              {" · "}
              Còn lại: {formatMoney(job.remainingAmount)}
            </p>
          )}
        </div>
      </div>

      {hasTeam && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm">
          <p className="font-semibold text-emerald-800 mb-1">
            Thông tin đội thợ
          </p>
          <p className="text-emerald-700">
            👷 {job.technicianName || job.teamName}
            {job.technicianPhone && ` • ${job.technicianPhone}`}
          </p>
        </div>
      )}

      {status === "WAITING_CONTRACT_APPROVAL" && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-sm text-cyan-800">
          <p className="font-semibold">
            📄 Đã gửi hợp đồng – đang chờ Admin duyệt
          </p>
        </div>
      )}

      {status === "CONTRACT_APPROVED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
          <p className="font-semibold">✅ Hợp đồng đã được duyệt</p>
          <p className="text-xs mt-1">Đang chờ khách hàng ký điện tử.</p>
        </div>
      )}

      {/* Trạng thái nghiệm thu đọc từ BookingDetail */}
      {status === "WORKER_COMPLETED" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-800 space-y-1">
          <p className="font-semibold">
            ⏳ Thợ đã hoàn thành – đang chờ nghiệm thu
          </p>
          <p className="text-xs">
            Giám sát:{" "}
            {detail?.supervisorAccepted ? (
              <span className="text-emerald-600 font-semibold">
                Đã xác nhận ✓
              </span>
            ) : (
              <span className="text-amber-600">Chưa xác nhận</span>
            )}
            {" · "}
            Khách hàng:{" "}
            {detail?.customerAccepted ? (
              <span className="text-emerald-600 font-semibold">
                Đã xác nhận ✓
              </span>
            ) : (
              <span className="text-amber-600">Chưa xác nhận</span>
            )}
          </p>
        </div>
      )}

      {/* Custom Action buttons passed from parent */}
      {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
    </div>
  );
}
