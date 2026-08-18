const STATUS_MAP = {
  // Booking & Survey Statuses
  PENDING: { label: "Chờ tiếp nhận", className: "bg-amber-50 text-amber-700 border-amber-200" },
  SURVEY_ASSIGNED: { label: "Đã phân công khảo sát", className: "bg-blue-50 text-blue-700 border-blue-200" },
  SURVEY_REJECTED: { label: "Từ chối khảo sát", className: "bg-rose-50 text-rose-700 border-rose-200" },
  ACCEPTED: { label: "Đã nhận khảo sát", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  SURVEYING: { label: "Đang khảo sát", className: "bg-purple-50 text-purple-700 border-purple-200" },
  WAITING_ADMIN_QUOTE: { label: "Chờ duyệt báo giá", className: "bg-sky-50 text-sky-700 border-sky-200" },
  WAITING_CUSTOMER_QUOTE_APPROVAL: { label: "Chờ khách duyệt giá", className: "bg-sky-50 text-sky-700 border-sky-200" },
  CUSTOMER_ACCEPTED_QUOTE: { label: "Đã chốt báo giá", className: "bg-teal-50 text-teal-700 border-teal-200" },
  WAITING_CONTRACT_APPROVAL: { label: "Chờ duyệt hợp đồng", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  WAITING_CUSTOMER_SIGNATURE: { label: "Chờ khách ký HĐ", className: "bg-amber-50 text-amber-700 border-amber-200" },
  WAITING_DEPOSIT: { label: "Chờ thanh toán cọc", className: "bg-amber-50 text-amber-700 border-amber-200" },
  DEPOSIT_CONFIRMED: { label: "Đã xác nhận cọc", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CONTRACT_APPROVED: { label: "Hợp đồng đã duyệt", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ASSIGNED: { label: "Đã phân công thợ", className: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCESSING: { label: "Đang thi công", className: "bg-orange-50 text-orange-700 border-orange-200" },
  WORKER_COMPLETED: { label: "Chờ nghiệm thu", className: "bg-purple-50 text-purple-700 border-purple-200" },
  WAITING_FINAL_PAYMENT: { label: "Chờ tất toán (70%)", className: "bg-amber-50 text-amber-800 border-amber-300 font-bold" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Đã hủy", className: "bg-rose-50 text-rose-700 border-rose-200" },
  PAID_TO_STAFF: { label: "Đã quyết toán", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },

  // Contract Specific Statuses
  WORKER_SIGNED: { label: "Giám sát đã ký", className: "bg-blue-50 text-blue-700 border-blue-200" },
  CUSTOMER_SIGNED: { label: "Khách hàng đã ký", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CONTRACT_CONFIRMED: { label: "Hợp đồng hoàn tất", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },

  // Payment Statuses
  UNPAID: { label: "Chưa thanh toán", className: "bg-slate-100 text-slate-700 border-slate-200" },
  PENDING_CONFIRMATION: { label: "Chờ duyệt thanh toán", className: "bg-amber-50 text-amber-700 border-amber-200" },
  DEPOSIT_PAID: { label: "Đã thanh toán cọc", className: "bg-blue-50 text-blue-700 border-blue-200" },
  FULLY_PAID: { label: "Đã thanh toán 100%", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },

  // User / Account Statuses
  ACTIVE: { label: "Đang hoạt động", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RESTRICTED: { label: "Đang bị khóa", className: "bg-rose-50 text-rose-700 border-rose-200" },

  // Salary Statuses
  PAID: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
