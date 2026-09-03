package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "daily_reports", indexes = {
        @Index(name = "idx_daily_report_booking_created", columnList = "booking_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DailyReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Booking / công trình.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    /**
     * Nhân viên giám sát tạo báo cáo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /**
     * Nội dung báo cáo trong ngày.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Tiến độ tổng thể công trình.
     */
    @Column(name = "progress_percentage")
    private Integer progressPercentage;

    /**
     * Ảnh tiến độ của RIÊNG báo cáo này.
     *
     * Nhiều ảnh cách nhau bằng dấu phẩy.
     */
    @Column(name = "progress_images", columnDefinition = "TEXT")
    private String progressImages;

    /**
     * Vật liệu thiếu / phát sinh trong ngày.
     */
    @Column(name = "material_shortage", columnDefinition = "TEXT")
    private String materialShortage;

    /**
     * Số tiền vật tư phát sinh trong ngày (nếu có).
     */
    @Column(name = "material_cost", precision = 15, scale = 2)
    @Builder.Default
    private java.math.BigDecimal materialCost = java.math.BigDecimal.ZERO;
}