package com.example.paintingservice.enums;

public enum WarrantyStatus {
    PENDING,                    // Khách gửi yêu cầu, chờ Admin phân công Giám sát
    SURVEY_ASSIGNED,            // Admin đã phân công Giám sát đi khảo sát hiện trường
    SURVEYOR_ACCEPTED,          // Giám sát đã tiếp nhận việc khảo sát (chính thức nhận việc)
    SURVEYOR_REJECTED,          // Giám sát từ chối nhận việc, chờ Admin phân giám sát khác
    SURVEYED,                   // Giám sát đã khảo sát và gửi báo cáo thẩm định về Admin
    CUSTOMER_ACCEPTED_SUPPORT,  // Khách hàng đồng ý báo giá hỗ trợ & chọn ngày, chờ Admin phân Thợ
    ACCEPTED,                   // Admin đã duyệt và phân công Đội thợ khắc phục
    TECHNICIAN_REJECTED,        // Thợ từ chối nhận việc, chờ Admin phân thợ khác
    IN_PROGRESS,                // Đội thợ đang thi công khắc phục tại nhà khách
    WORKER_COMPLETED,           // Đội thợ đã báo làm xong, chờ Giám sát và Khách hàng nghiệm thu
    COMPLETED,                  // Giám sát đã nghiệm thu cùng khách và gửi ảnh báo cáo hoàn tất
    REJECTED,                   // Từ chối bảo hành (lỗi khách quan / Giám sát từ chối)
    CANCELLED                   // Khách từ chối sửa chữa hỗ trợ / Hủy yêu cầu
}




