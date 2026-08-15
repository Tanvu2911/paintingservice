package com.example.paintingservice.service;

import java.util.List;
import java.util.Map;

import com.example.paintingservice.entity.Payment;

public interface PaymentService extends BaseService<Payment, Long> {
    Map<String, Object> createMoMoPayment(Long bookingId, String paymentType) throws Exception;

    void processMoMoSuccessCallback(String orderId);

    // QR Payment & Manual Admin Verification
    Map<String, Object> submitQrPayment(
            Long bookingId,
            String paymentType,
            String note,
            org.springframework.web.multipart.MultipartFile proofImage,
            String username);

    Map<String, Object> extendDepositDeadline(Long bookingId, Integer hours, String reason);

    Map<String, Object> confirmPayment(Long paymentId);

    Map<String, Object> rejectPayment(Long paymentId, String reason);

    List<Payment> getPendingPayments();

    List<Payment> getPaymentsByBooking(Long bookingId);

    Map<String, Object> payStaffPayout(Long bookingId, Long staffId, String roleInBooking);
}