package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Thực thể trung gian biểu diễn quan hệ Nhiều - Nhiều (N - N)
 * giữa Booking và ServiceEntity, đồng thời liên kết đội thợ phụ trách
 * riêng cho từng hạng mục dịch vụ trong đơn đặt.
 */
@Entity
@Table(name = "booking_services", indexes = {
        @Index(name = "idx_booking_service_booking", columnList = "booking_id"),
        @Index(name = "idx_booking_service_service", columnList = "service_id"),
        @Index(name = "idx_booking_service_technician", columnList = "technician_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingServiceItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    /**
     * Đội thợ / Kỹ thuật viên phụ trách riêng cho hạng mục dịch vụ này.
     * (Quan hệ N - N giữa Booking - Service và Đội thợ)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;

    @Column(name = "estimated_area")
    private Double estimatedArea;

    @Column(name = "price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String note;

    /**
     * Trạng thái Đội thợ phụ trách hạng mục này đã nhận việc hay chưa
     */
    @Column(name = "technician_accepted")
    @Builder.Default
    private Boolean technicianAccepted = false;

    @Column(name = "technician_accepted_at")
    private java.time.LocalDateTime technicianAcceptedAt;

    /**
     * Trạng thái Đội thợ phụ trách hạng mục này đã bắt đầu thi công hay chưa
     */
    @Column(name = "technician_started")
    @Builder.Default
    private Boolean technicianStarted = false;

    @Column(name = "technician_started_at")
    private java.time.LocalDateTime technicianStartedAt;

    /**
     * Trạng thái Đội thợ phụ trách hạng mục này đã bấm báo hoàn thành hay chưa
     */
    @Column(name = "technician_completed")
    @Builder.Default
    private Boolean technicianCompleted = false;

    @Column(name = "technician_completed_at")
    private java.time.LocalDateTime technicianCompletedAt;

    @Column(name = "technician_note", columnDefinition = "TEXT")
    private String technicianNote;

    /**
     * Trạng thái Giám sát viên đã nghiệm thu đạt chuẩn cho riêng hạng mục này hay chưa
     */
    @Column(name = "supervisor_accepted")
    @Builder.Default
    private Boolean supervisorAccepted = false;

    @Column(name = "supervisor_accepted_at")
    private java.time.LocalDateTime supervisorAcceptedAt;

    @Column(name = "supervisor_note", columnDefinition = "TEXT")
    private String supervisorNote;

    /**
     * Đánh dấu gói dịch vụ này đã bị khách hủy (không xóa khỏi DB để giữ lịch sử)
     */
    @Column(name = "cancelled")
    @Builder.Default
    private Boolean cancelled = false;

    @Column(name = "cancelled_at")
    private java.time.LocalDateTime cancelledAt;
}
