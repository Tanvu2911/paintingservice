/** Trạng thái cho phép gửi báo cáo tiến độ (thợ thi công) */
export const REPORT_ALLOWED_STATUSES = ["ACCEPTED", "PROCESSING"];

/** Trạng thái chặn gửi báo cáo */
export const REPORT_BLOCKED_STATUSES = [
  "CONTRACT_APPROVED",
  "ASSIGNED",
  "WORKER_REJECTED",
];

export function canTechnicianSubmitReport(status) {
  return REPORT_ALLOWED_STATUSES.includes(status);
}

export function getTechnicianReportBlockReason(status) {
  if (canTechnicianSubmitReport(status)) return null;

  if (["CONTRACT_APPROVED", "ASSIGNED"].includes(status)) {
    return "Bạn chưa nhận việc. Vui lòng nhận việc trước khi gửi báo cáo.";
  }
  if (status === "WORKER_REJECTED") {
    return "Bạn đã từ chối công trình này nên không thể gửi báo cáo.";
  }
  if (status === "WORKER_COMPLETED") {
    return "Công trình đã hoàn thành phần thi công, chờ nghiệm thu.";
  }
  if (status === "COMPLETED") {
    return "Công trình đã hoàn tất.";
  }
  if (status === "CANCELLED") {
    return "Đơn đã bị hủy.";
  }
  return "Chỉ được gửi báo cáo khi trạng thái là Đã nhận việc hoặc Đang thực hiện.";
}
