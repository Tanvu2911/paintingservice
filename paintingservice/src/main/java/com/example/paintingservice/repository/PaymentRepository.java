package com.example.paintingservice.repository;

import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.enums.PaymentStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionCode(String transactionCode);
    List<Payment> findAllByBooking_IdOrderByIdDesc(Long bookingId);
    List<Payment> findAllByPaymentStatusOrderByIdDesc(PaymentStatus paymentStatus);
    Optional<Payment> findTopByBooking_IdAndPaymentTypeOrderByIdDesc(Long bookingId, String paymentType);
}
