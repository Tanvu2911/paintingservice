package com.example.paintingservice.service;

import java.util.List;
import java.util.Map;

import com.example.paintingservice.entity.Payment;

public interface PaymentService extends BaseService<Payment, Long> {
    List<Payment> getPendingPayments();

    List<Payment> getPaymentsByBooking(Long bookingId);

    Map<String, Object> confirmPayment(Long paymentId);

    Map<String, Object> rejectPayment(Long paymentId, String reason);

    Map<String, Object> payStaffPayout(Long bookingId, Long staffId, String roleInBooking);
}