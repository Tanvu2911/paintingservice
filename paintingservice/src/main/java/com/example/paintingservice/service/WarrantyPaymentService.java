package com.example.paintingservice.service;

import com.example.paintingservice.entity.WarrantyClaim;

import java.math.BigDecimal;

/**
 * Service chịu trách nhiệm duy nhất về thanh toán thù lao nhân sự
 * và ghi nhận Payment khi khách trả phí hỗ trợ bảo hành.
 */
public interface WarrantyPaymentService {

    /**
     * Admin thanh toán thù lao cho Giám sát hoặc Thợ thi công bảo hành.
     *
     * @param claim         phiếu bảo hành
     * @param staffId       ID nhân sự (null → lấy từ claim)
     * @param role          "SURVEYOR" | "TECHNICIAN"
     * @param amount        số tiền (null → dùng mặc định)
     * @param adminUsername người thực hiện
     */
    void payStaff(WarrantyClaim claim, Long staffId, String role, BigDecimal amount, String adminUsername);

    /**
     * Khách hàng thanh toán phí hỗ trợ sửa chữa bảo hành (ghi Payment record).
     *
     * @param claim phiếu bảo hành
     * @return số tiền đã thanh toán
     */
    BigDecimal recordCustomerPayment(WarrantyClaim claim);
}
