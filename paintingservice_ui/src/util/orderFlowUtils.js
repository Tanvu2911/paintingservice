/**
 * Bộ tiện ích và cấu hình dùng chung cho vòng đời tiến trình đơn hàng (Order Lifecycle)
 */

export const ORDER_STAGES = [
  {
    id: 1,
    number: 1,
    title: "1. Khảo sát",
    fullName: "1. Khảo sát & Tư vấn",
    desc: "Khảo sát hiện trạng & đo đạc",
    statuses: ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "SURVEY_REJECTED", "SURVEYING"],
  },
  {
    id: 2,
    number: 2,
    title: "2. Báo giá & HĐ",
    fullName: "2. Báo giá & Hợp đồng",
    desc: "Duyệt dự toán & ký hợp đồng",
    statuses: [
      "WAITING_ADMIN_QUOTE",
      "CUSTOMER_ACCEPTED_QUOTE",
      "WAITING_CONTRACT_APPROVAL",
      "WAITING_CUSTOMER_SIGNATURE",
    ],
  },
  {
    id: 3,
    number: 3,
    title: "3. Đặt cọc (30%)",
    fullName: "3. Đặt cọc (30%)",
    desc: "Khách cọc & Admin ký duyệt",
    statuses: ["WAITING_DEPOSIT", "DEPOSIT_CONFIRMED", "CONTRACT_APPROVED"],
  },
  {
    id: 4,
    number: 4,
    title: "4. Thi công",
    fullName: "4. Thi công sơn sửa",
    desc: "Đội thợ thi công & cập nhật nhật ký",
    statuses: ["ASSIGNED", "PROCESSING", "WORKER_REJECTED"],
  },
  {
    id: 5,
    number: 5,
    title: "5. Nghiệm thu",
    fullName: "5. Nghiệm thu công trình",
    desc: "Thợ báo xong & khách nghiệm thu",
    statuses: ["WORKER_COMPLETED"],
  },
  {
    id: 6,
    number: 6,
    title: "6. Tất toán",
    fullName: "6. Tất toán & Hoàn tất",
    desc: "Thanh toán 70% & bảo hành",
    statuses: ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"],
  },
];

/**
 * Lấy chỉ số giai đoạn hiện tại (0-5)
 */
export function getActiveStageIndex(currentStatus) {
  if (!currentStatus || currentStatus === "CANCELLED") return 0;
  if (["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "SURVEY_REJECTED", "SURVEYING"].includes(currentStatus)) return 0;
  if (["WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE", "WAITING_CONTRACT_APPROVAL", "WAITING_CUSTOMER_SIGNATURE"].includes(currentStatus)) return 1;
  if (["WAITING_DEPOSIT", "DEPOSIT_CONFIRMED", "CONTRACT_APPROVED"].includes(currentStatus)) return 2;
  if (["ASSIGNED", "PROCESSING", "WORKER_REJECTED"].includes(currentStatus)) return 3;
  if (["WORKER_COMPLETED"].includes(currentStatus)) return 4;
  if (["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(currentStatus)) return 5;
  return 0;
}

/**
 * Format ngày hiển thị chuẩn tiếng Việt
 */
export function formatDate(dateInput) {
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  }
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("vi-VN");
    }
  } catch (e) { }
  return String(dateInput).split("T")[0];
}

/**
 * Phân tích danh sách URL ảnh an toàn từ chuỗi JSON hoặc mảng
 */
export function parseImageUrls(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [str];
  } catch (e) {
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

/**
 * Tính toán nhanh các số liệu tài chính của đơn hàng
 */
export function calculateFinancials(booking) {
  const total = Number(booking?.totalAmount) || 0;
  const deposit =
    booking?.depositAmount && Number(booking.depositAmount) > 0
      ? Number(booking.depositAmount)
      : total * 0.3;
  const remaining =
    booking?.remainingAmount && Number(booking.remainingAmount) > 0
      ? Number(booking.remainingAmount)
      : Math.max(0, total - deposit);

  const isDepositPaid = Boolean(
    booking?.depositPaid ||
    booking?.paymentStatus === "DEPOSIT_PAID" ||
    booking?.paymentStatus === "FULLY_PAID" ||
    ["DEPOSIT_CONFIRMED", "CONTRACT_APPROVED", "ASSIGNED", "PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(booking?.status)
  );

  const isFinalPaid = Boolean(
    booking?.finalPaid ||
    booking?.paymentStatus === "FULLY_PAID" ||
    booking?.status === "PAID_TO_STAFF" ||
    booking?.status === "COMPLETED"
  );

  let collected = 0;
  if (isFinalPaid) {
    collected = total;
  } else if (isDepositPaid) {
    collected = deposit;
  }

  const uncollected = Math.max(0, total - collected);

  return {
    total,
    deposit,
    remaining,
    isDepositPaid,
    isFinalPaid,
    collected,
    uncollected,
  };
}

export const VIETNAMESE_BANK_CODES = {
  MB: "MB",
  "MB BANK": "MB",
  VCB: "VCB",
  VIETCOMBANK: "VCB",
  CTG: "CTG",
  VIETINBANK: "CTG",
  BIDV: "BIDV",
  TCB: "TCB",
  TECHCOMBANK: "TCB",
  VPB: "VPB",
  VPBANK: "VPB",
  ACB: "ACB",
  TPB: "TPB",
  TPBANK: "TPB",
  STB: "STB",
  SACOMBANK: "STB",
  HDB: "HDB",
  HDBANK: "HDB",
  SHB: "SHB",
  MSB: "MSB",
  VIB: "VIB",
  VBA: "VBA",
  AGRIBANK: "VBA",
};

/**
 * Trích xuất mã ngân hàng chuẩn VietQR từ tên hoặc mã nhập vào
 */
export function getVietQRBankCode(bankNameOrCode) {
  if (!bankNameOrCode) return "MB";
  const clean = String(bankNameOrCode).toUpperCase().trim();
  for (const [key, code] of Object.entries(VIETNAMESE_BANK_CODES)) {
    if (clean.includes(key)) return code;
  }
  return clean.length <= 6 ? clean : "MB";
}
