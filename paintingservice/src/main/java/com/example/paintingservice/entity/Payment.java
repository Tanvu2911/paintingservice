package com.example.paintingservice.entity;

import com.example.paintingservice.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod; // CASH, VNPAY, MOMO, WALLET

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "transaction_code", length = 100)
    private String transactionCode;

    // ... các trường cũ ...

    @Column(name = "payment_type", length = 20)
    private String paymentType; // DEPOSIT hoặc FINAL

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "proof_image", length = 255)
    private String proofImage;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}
