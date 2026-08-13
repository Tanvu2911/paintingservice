package com.example.paintingservice.service;

import java.util.Map;

import com.example.paintingservice.entity.Payment;

public interface PaymentService extends BaseService<Payment, Long> {
    Map<String, Object> createMoMoPayment(Long bookingId, String paymentType) throws Exception;

    
    void processMoMoSuccessCallback(String orderId);
}