package com.example.paintingservice.repository;

import com.example.paintingservice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionCode(String transactionCode);
    List<Payment> findAllByBooking_IdOrderByIdDesc(Long bookingId);
}
