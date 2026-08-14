package com.example.paintingservice.enums;

public enum PaymentStatus {
    UNPAID,               // Chưa thanh toán gì cả
    PENDING_CONFIRMATION, // Khách hàng đã quét mã và bấm xác nhận chuyển khoản, chờ Admin duyệt
    DEPOSIT_PAID,         // Đã thanh toán cọc (ví dụ: 30%)
    FULLY_PAID            // Đã thanh toán phần còn lại (Hoàn tất)
}