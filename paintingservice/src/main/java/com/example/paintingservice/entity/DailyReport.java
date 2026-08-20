package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "daily_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReport {

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

    /**
     * Thời gian tạo báo cáo.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}