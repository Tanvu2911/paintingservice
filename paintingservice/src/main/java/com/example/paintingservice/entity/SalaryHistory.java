package com.example.paintingservice.entity;


import com.example.paintingservice.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "role_in_booking", nullable = false, length = 20)
    private String roleInBooking; // SURVEYOR hoặc TECHNICIAN

    @Column(name = "amount_earned", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountEarned;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private SalaryStatus paymentStatus = SalaryStatus.UNPAID;

    @Column(name = "calculated_at", updatable = false)
    private LocalDateTime calculatedAt = LocalDateTime.now();

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}