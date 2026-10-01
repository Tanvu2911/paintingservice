package com.example.paintingservice.entity;

import com.example.paintingservice.enums.*;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_booking_customer", columnList = "customer_id"),
        @Index(name = "idx_booking_technician", columnList = "technician_id"),
        @Index(name = "idx_booking_surveyor", columnList = "surveyor_id"),
        @Index(name = "idx_booking_status", columnList = "status"),
        @Index(name = "idx_booking_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Booking extends BaseEntity {
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



    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false, length = 20)
    private String appointmentTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "survey_fee", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal surveyFee = new BigDecimal("50000.00");

    @Column(name = "total_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = new BigDecimal("50000.00");

    // ========== THÊM CÁC FIELD CHO THANH TOÁN ==========
    @Column(name = "deposit_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO; // Tiền cọc (VD: 30% tổng tiền)

    @Column(name = "remaining_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal remainingAmount = BigDecimal.ZERO; // Tiền còn lại phải thu

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Trạng thái thanh toán
    // ==========================================================

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<BookingDetail> details;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookingServiceItem> bookingServices = new java.util.ArrayList<>();

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_technician_id")
    private User preferredTechnician; // Đội thợ mà khách hàng chọn khi tạo đơn hoặc chốt báo giá

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_supervisor_id")
    private User preferredSupervisor; // Giám sát viên cũ mà khách hàng chọn khi tạo đơn

    @Column(name = "estimated_days")
    private Integer estimatedDays;

    @Column(name = "warranty_years")
    private Integer warrantyYears;

    @Column(name = "expected_start_date")
    private LocalDate expectedStartDate;

    @Column(name = "deposit_paid_at")
    private LocalDateTime depositPaidAt;

    @Column(name = "final_paid_at")
    private LocalDateTime finalPaidAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
