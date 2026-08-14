package com.example.paintingservice.enums;

public enum BookingStatus {
    // === 6 GIÁ TRỊ GỐC CỦA BẠN ===
    PENDING,                   // 1. Khách đặt lịch (đã chọn đội thợ sẵn sàng)
    ASSIGNED,                  // Admin giao việc
    ACCEPTED,                  // Đã tiếp nhận
    PROCESSING,                // 5. Đang thi công (Đội thợ đang làm & NV Giám sát gửi Daily Report)
    COMPLETED,                 // 7. NV Giám sát & Khách nghiệm thu xong -> Hoàn tất công trình
    CANCELLED,                 // Hủy đơn (Khách hủy hoặc khảo sát xong không đồng ý)

    // === BỔ SUNG THÊM CHO LUỒNG MỚI ===
    SURVEY_ASSIGNED,           // 2. Admin phân công NV Giám sát đến khảo sát
    SURVEY_REJECTED,
    WAITING_CONTRACT_APPROVAL, // 3. Chủ nhà đồng ý, NV Giám sát lập hợp đồng -> Chờ Admin duyệt
    WAITING_CUSTOMER_SIGNATURE,
    CONTRACT_APPROVED,         // 4. Admin duyệt hợp đồng -> Bàn giao đội thợ (khách chọn)
    WORKER_REJECTED,
    WORKER_COMPLETED,          // 6. Đội thợ bấm "Xác nhận hoàn thành" -> Chờ nghiệm thu thực tế
    PAID_TO_STAFF             // 8. Admin đã hoàn tất thanh toán thù lao cho giám sát và đội thợ
}