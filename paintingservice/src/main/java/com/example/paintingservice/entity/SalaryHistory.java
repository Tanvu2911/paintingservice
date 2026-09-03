package com.example.paintingservice.entity;


import com.example.paintingservice.enums.*;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_histories", indexes = {
        @Index(name = "idx_salary_worker_status", columnList = "worker_id, payment_status"),
        @Index(name = "idx_salary_warranty_claim", columnList = "warranty_claim_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SalaryHistory extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warranty_claim_id")
    private WarrantyClaim warrantyClaim;

    @Column(name = "role_in_booking", nullable = false, length = 20)
    private String roleInBooking; // SURVEYOR hoặc TECHNICIAN

    @Column(name = "amount_earned", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountEarned;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    @Builder.Default
    private SalaryStatus paymentStatus = SalaryStatus.UNPAID;

    @Column(name = "calculated_at", updatable = false)
    @Builder.Default
    private LocalDateTime calculatedAt = LocalDateTime.now();

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}