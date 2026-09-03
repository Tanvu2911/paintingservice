package com.example.paintingservice.service;

import java.util.List;
import java.util.Map;

import com.example.paintingservice.entity.Payment;

public interface PaymentService extends BaseService<Payment, Long> {
    List<Payment> getPaymentsByBooking(Long bookingId);

    Map<String, Object> payStaffPayout(Long bookingId, Long staffId, String roleInBooking);
}