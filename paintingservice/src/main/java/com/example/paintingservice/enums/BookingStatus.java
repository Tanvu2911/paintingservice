package com.example.paintingservice.enums;

public enum BookingStatus {
    // === 6 GIÁ TRỊ GỐC CỦA BẠN ===
    PENDING, // 1. Khách đặt lịch (đã chọn đội thợ sẵn sàng)
    ASSIGNED, // Admin giao việc
    ACCEPTED, // Đã tiếp nhận
    PROCESSING, // 5. Đang thi công (Đội thợ đang làm & NV Giám sát gửi Daily Report)
    COMPLETED, // 7. NV Giám sát & Khách nghiệm thu xong -> Hoàn tất công trình
    CANCELLED, // Hủy đơn (Khách hủy hoặc khảo sát xong không đồng ý)

    // === BỔ SUNG THÊM CHO LUỒNG MỚI ===
    SURVEY_ASSIGNED, // 2. Admin phân công NV Giám sát đến khảo sát
    SURVEY_REJECTED,
    WAITING_ADMIN_QUOTE, // Giám sát gửi báo cáo, chờ Admin duyệt và gửi báo giá
    WAITING_CONTRACT_APPROVAL, // [OLD] Giữ lại để không lỗi DB cũ
    WAITING_CUSTOMER_QUOTE_APPROVAL, // Admin đã duyệt, chờ Khách đồng ý báo giá
    CUSTOMER_ACCEPTED_QUOTE, // Khách hàng đồng ý báo giá
    WAITING_CUSTOMER_SIGNATURE, // Admin tạo hợp đồng, chờ khách ký
    WAITING_DEPOSIT, // Khách ký xong, chờ thanh toán cọc
    DEPOSIT_CONFIRMED, // Admin xác nhận cọc - đủ điều kiện phân việc
    CONTRACT_APPROVED, // Admin duyệt hợp đồng
    WORKER_REJECTED,
    WORKER_COMPLETED, // 6. Đội thợ bấm "Xác nhận hoàn thành" -> Chờ nghiệm thu thực tế
    WAITING_FINAL_PAYMENT, // 6.5. Khách hàng đã nghiệm thu -> Chờ tất toán 70% còn lại qua VNPay
    PAID_TO_STAFF // 8. Admin đã hoàn tất thanh toán thù lao cho giám sát và đội thợ
}