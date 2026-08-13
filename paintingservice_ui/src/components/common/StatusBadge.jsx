const STATUS_MAP = {
  // Booking & Survey Statuses
  PENDING: { label: "Chờ nhận việc", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  SURVEY_ASSIGNED: { label: "Đã phân công khảo sát", className: "bg-blue-100 text-blue-800 border-blue-200" },
  SURVEY_REJECTED: { label: "Từ chối khảo sát", className: "bg-rose-100 text-rose-800 border-rose-200" },
  ACCEPTED: { label: "Đã nhận việc", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  SURVEYING: { label: "Đang khảo sát", className: "bg-purple-100 text-purple-800 border-purple-200" },
  WAITING_CONTRACT_APPROVAL: { label: "Chờ duyệt HĐ", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  WAITING_CUSTOMER_SIGNATURE: { label: "Chờ khách ký HĐ", className: "bg-amber-100 text-amber-800 border-amber-200" },
  CONTRACT_APPROVED: { label: "HĐ đã duyệt", className: "bg-green-100 text-green-800 border-green-200" },
  ASSIGNED: { label: "Đã phân công thợ", className: "bg-teal-100 text-teal-800 border-teal-200" },
  PROCESSING: { label: "Đang thi công", className: "bg-orange-100 text-orange-800 border-orange-200" },
  WORKER_REJECTED: { label: "Thợ từ chối", className: "bg-red-100 text-red-800 border-red-200" },
  WORKER_COMPLETED: { label: "Thợ hoàn thành", className: "bg-purple-100 text-purple-800 border-purple-200" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "Đã hủy", className: "bg-rose-100 text-rose-800 border-rose-200" },

  // Contract Specific Statuses
  WORKER_SIGNED: { label: "Giám sát đã ký", className: "bg-blue-100 text-blue-800 border-blue-200" },
  CUSTOMER_SIGNED: { label: "Khách hàng đã ký", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CONTRACT_CONFIRMED: { label: "Hợp đồng hoàn tất", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function StatusBadge({ status, className = "" }) {
  const info = STATUS_MAP[status] || {
    label: status || "Không xác định",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.className} ${className}`}
    >
      {info.label}
    </span>
  );
}
