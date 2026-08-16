package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.PaymentDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Payment;

public class PaymentMapper {
    public static PaymentDto toDto(Payment payment) {
        if (payment == null) {
            return null;
        }
        return PaymentDto.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking() != null ? payment.getBooking().getId() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .transactionCode(payment.getTransactionCode())
                .paidAt(payment.getPaidAt())
                .paymentType(payment.getPaymentType())
                .proofImage(payment.getProofImage())
                .note(payment.getNote())
                .build();
    }

    public static Payment toEntity(PaymentDto dto) {
        if (dto == null) {
            return null;
        }
        Payment payment = Payment.builder()
                .id(dto.getId())
                .amount(dto.getAmount())
                .paymentMethod(dto.getPaymentMethod())
                .paymentStatus(dto.getPaymentStatus())
                .transactionCode(dto.getTransactionCode())
                .paidAt(dto.getPaidAt())
                .paymentType(dto.getPaymentType())
                .proofImage(dto.getProofImage())
                .note(dto.getNote())
                .build();
        if (dto.getBookingId() != null) {
            payment.setBooking(Booking.builder().id(dto.getBookingId()).build());
        }
        return payment;
    }
}
