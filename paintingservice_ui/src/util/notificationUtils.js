import { isAdmin, isSurveyStaff, isTechnicianStaff, isCustomer } from "./roleUtils";

/**
 * Trả về đường dẫn điều hướng phù hợp khi click vào một thông báo
 * Dựa trên nội dung thông báo (mã đơn hàng #id, từ khóa) và vai trò của người dùng
 */
export function getNotificationDestination(notification, user) {
  if (!notification) return null;
  const fullText = `${notification.title || ""} ${notification.content || ""} ${notification.message || ""}`;

  // Tìm mã đơn hàng / yêu cầu / hợp đồng dạng: #123, đơn hàng #123, yêu cầu #123, đơn 123, công trình #123...
  const bookingMatch = fullText.match(/(?:#|đơn hàng\s*#?|yêu cầu\s*#?|đơn\s*#?|công trình\s*#?|hợp đồng.*#)(\d+)/i);
  const bookingId = bookingMatch ? bookingMatch[1] : null;

  let currentUser = user;
  if (!currentUser) {
    try {
      const saved = localStorage.getItem("user");
      if (saved) currentUser = JSON.parse(saved);
    } catch (e) {}
  }

  // 1. Quản trị viên (Admin)
  if (isAdmin(currentUser)) {
    if (bookingId) return `/admin/bookings/${bookingId}`;
    if (/hợp đồng|contract/i.test(fullText)) return "/admin/contracts";
    if (/nhân viên|thợ|giám sát|staff/i.test(fullText)) return "/admin/employees";
    if (/khách hàng/i.test(fullText)) return "/admin/customers";
    if (/dịch vụ/i.test(fullText)) return "/admin/services";
    if (/doanh thu|thống kê|báo cáo doanh thu/i.test(fullText)) return "/admin/revenue";
    if (/thanh toán|ví|thù lao|chuyển tiền/i.test(fullText)) return "/admin/payments";
    return "/admin/bookings";
  }

  // 2. Nhân viên Giám sát (Survey Staff)
  if (isSurveyStaff(currentUser)) {
    if (bookingId) return `/staff/survey/jobs`;
    if (/lịch sử/i.test(fullText)) return "/staff/survey/history";
    if (/ví|thù lao|rút tiền|tiền/i.test(fullText)) return "/staff/survey/wallet";
    if (/thống kê/i.test(fullText)) return "/staff/survey/statistics";
    if (/hồ sơ|tài khoản/i.test(fullText)) return "/staff/survey/profile";
    return "/staff/survey/jobs";
  }

  // 3. Thợ thi công (Technician Staff)
  if (isTechnicianStaff(currentUser)) {
    if (bookingId) return `/staff/technician/jobs`;
    if (/lịch sử/i.test(fullText)) return "/staff/technician/history";
    if (/ví|thù lao|rút tiền|tiền/i.test(fullText)) return "/staff/technician/wallet";
    if (/thống kê/i.test(fullText)) return "/staff/technician/statistics";
    if (/hồ sơ|tài khoản/i.test(fullText)) return "/staff/technician/profile";
    return "/staff/technician/jobs";
  }

  // 4. Khách hàng (Customer)
  if (bookingId) return `/customer/bookings/${bookingId}`;
  if (/ví|nạp tiền|thanh toán/i.test(fullText)) return "/customer/wallet";
  if (/lịch sử/i.test(fullText)) return "/customer/history";
  if (/đặt lịch|tạo yêu cầu/i.test(fullText)) return "/customer/booking";
  if (/hồ sơ|thông tin/i.test(fullText)) return "/customer/profile";
  return "/customer/ongoing";
}
