const COMPLETED_STATUSES = ["COMPLETED", "PAID_TO_STAFF", "WORKER_COMPLETED"];
const CANCELLED_STATUSES = ["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"];

export function normalizeBookingDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d] = value;
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function filterBookings(bookings, filters = {}) {
  const {
    searchText = "",
    statusFilter = "ALL",
    startDate = "",
    endDate = "",
    technicianName = "",
    customerName = "",
  } = filters;

  let result = [...(bookings || [])];

  if (statusFilter === "PENDING") {
    result = result.filter((b) =>
      [
        "PENDING",
        "SURVEY_ASSIGNED",
        "ACCEPTED",
        "WAITING_ADMIN_QUOTE",
        "WAITING_CUSTOMER_QUOTE_APPROVAL",
        "CUSTOMER_ACCEPTED_QUOTE",
        "WAITING_CUSTOMER_SIGNATURE",
        "WAITING_DEPOSIT",
        "DEPOSIT_CONFIRMED",
        "CONTRACT_APPROVED",
        "ASSIGNED",
      ].includes(b.status)
    );
  } else if (statusFilter === "IN_PROGRESS") {
    result = result.filter((b) =>
      ["PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT"].includes(b.status)
    );
  } else if (statusFilter === "COMPLETED") {
    result = result.filter((b) => COMPLETED_STATUSES.includes(b.status));
  } else if (statusFilter === "CANCELLED") {
    result = result.filter((b) => CANCELLED_STATUSES.includes(b.status));
  } else if (statusFilter !== "ALL") {
    result = result.filter((b) => b.status === statusFilter);
  }

  if (searchText.trim()) {
    const q = searchText.toLowerCase().trim();
    result = result.filter(
      (b) =>
        String(b.id).includes(q) ||
        (b.address || "").toLowerCase().includes(q) ||
        (b.serviceName || "").toLowerCase().includes(q) ||
        (b.customerName || b.customer?.username || "")
          .toLowerCase()
          .includes(q) ||
        (b.technicianName || b.preferredTechnicianName || "")
          .toLowerCase()
          .includes(q)
    );
  }

  if (technicianName.trim()) {
    const q = technicianName.toLowerCase().trim();
    result = result.filter((b) =>
      (b.technicianName || b.preferredTechnicianName || "")
        .toLowerCase()
        .includes(q)
    );
  }

  if (customerName.trim()) {
    const q = customerName.toLowerCase().trim();
    result = result.filter((b) =>
      (b.customerName || b.customer?.username || "")
        .toLowerCase()
        .includes(q)
    );
  }

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    result = result.filter((b) => {
      const d = normalizeBookingDate(b.appointmentDate || b.createdAt);
      return d && d >= start;
    });
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter((b) => {
      const d = normalizeBookingDate(b.appointmentDate || b.createdAt);
      return d && d <= end;
    });
  }

  return result;
}

export function sortBookings(bookings, sortOrder = "newest") {
  return [...bookings].sort((a, b) => {
    const dateA = normalizeBookingDate(a.appointmentDate || a.createdAt)?.getTime() || 0;
    const dateB = normalizeBookingDate(b.appointmentDate || b.createdAt)?.getTime() || 0;
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });
}

export function computeBookingStats(bookings) {
  const list = bookings || [];
  return {
    total: list.length,
    pending: list.filter((b) =>
      [
        "PENDING",
        "SURVEY_ASSIGNED",
        "ACCEPTED",
        "WAITING_ADMIN_QUOTE",
        "WAITING_CUSTOMER_QUOTE_APPROVAL",
        "CUSTOMER_ACCEPTED_QUOTE",
        "WAITING_CUSTOMER_SIGNATURE",
        "WAITING_DEPOSIT",
        "DEPOSIT_CONFIRMED",
        "CONTRACT_APPROVED",
        "ASSIGNED",
      ].includes(b.status)
    ).length,
    inProgress: list.filter((b) =>
      ["PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT"].includes(b.status)
    ).length,
    completed: list.filter((b) => COMPLETED_STATUSES.includes(b.status)).length,
    cancelled: list.filter((b) => CANCELLED_STATUSES.includes(b.status)).length,
    totalRevenue: list.reduce(
      (sum, b) => sum + (Number(b.totalAmount) || 0),
      0
    ),
  };
}
