package com.example.paintingservice.entity;

import com.example.paintingservice.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surveyor_id")
    private User surveyor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false, length = 20)
    private String appointmentTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "survey_fee", precision = 10, scale = 2)
    private BigDecimal surveyFee = new BigDecimal("50000.00");

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount = new BigDecimal("50000.00");

    // ... các code cũ ...

    // ========== THÊM CÁC FIELD CHO THANH TOÁN ZALOPAY ==========
    @Column(name = "deposit_amount", precision = 10, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO; // Tiền cọc (VD: 30% tổng tiền)

    @Column(name = "remaining_amount", precision = 10, scale = 2)
    private BigDecimal remainingAmount = BigDecimal.ZERO; // Tiền còn lại phải thu

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Trạng thái thanh toán
    // ==========================================================

    // ... các code cũ ...

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<BookingDetail> details;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Contract contract;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_technician_id")
    private User preferredTechnician; // Đội thợ mà khách hàng chọn khi tạo đơn

    private LocalDateTime depositDeadline;
}
