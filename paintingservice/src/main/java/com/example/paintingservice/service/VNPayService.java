package com.example.paintingservice.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

public interface VNPayService {
    /**
     * Tạo URL thanh toán VNPay Sandbox
     * 
     * @param bookingId   Mã đơn hàng
     * @param paymentType DEPOSIT (cọc), FINAL (tất toán), hoặc WARRANTY_SUPPORT (phí hỗ trợ bảo hành)
     * @param request     HttpServletRequest để lấy địa chỉ IP
     * @return Map chứa paymentUrl và transactionCode
     */
    Map<String, Object> createVNPayPaymentUrl(Long bookingId, String paymentType, HttpServletRequest request)
            throws Exception;

    /**
     * Tạo URL thanh toán VNPay Sandbox kèm mã phiếu bảo hành
     */
    Map<String, Object> createVNPayPaymentUrl(Long bookingId, String paymentType, Long claimId, HttpServletRequest request)
            throws Exception;

    /**
     * Xác thực và xử lý kết quả callback từ VNPay
     * 
     * @param params Các tham số query gửi từ VNPay
     * @return Map kết quả xử lý
     */
    Map<String, Object> processVNPayCallback(Map<String, String> params);
}
