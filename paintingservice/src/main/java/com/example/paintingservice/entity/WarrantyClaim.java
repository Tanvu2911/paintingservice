package com.example.paintingservice.entity;

import com.example.paintingservice.enums.WarrantyStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

/**
 * Thực thể quản lý yêu cầu bảo hành của khách hàng.
 * Đã được chuẩn hóa quan hệ (3NF):
 * - Biên bản khảo sát & nghiệm thu được lưu riêng trong WarrantyReport (1-1).
 * - Lịch sử thù lao/tiền công được quy hoạch tập trung vào SalaryHistory.
 */
@Entity
@Table(name = "warranty_claims", indexes = {
        @Index(name = "idx_warranty_booking", columnList = "booking_id"),
        @Index(name = "idx_warranty_customer", columnList = "customer_id"),
        @Index(name = "idx_warranty_surveyor", columnList = "surveyor_id"),
        @Index(name = "idx_warranty_technician", columnList = "technician_id"),
        @Index(name = "idx_warranty_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WarrantyClaim extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surveyor_id")
    private User surveyor; // Giám sát được phân công kiểm tra hiện trường

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician; // Thợ được phân công khắc phục

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_service_id")
    private BookingServiceItem bookingService; // Hạng mục dịch vụ cụ thể phát sinh bảo hành

    @Column(name = "issue_type", nullable = false, length = 100)
    private String issueType; // BONG_TROC, PHAI_MAU, NUT_NE, THAM_NUOC, KHAC

    @Column(name = "issue_title", length = 255)
    private String issueTitle; // Tiêu đề sự cố bảo hành

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description; // Mô tả ban đầu của khách hàng

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls; // Link ảnh sự cố khách gửi

    @Column(name = "preferred_date")
    private LocalDate preferredDate; // Ngày khách mong muốn kiểm tra

    @Column(name = "preferred_time", length = 50)
    private String preferredTime; // Khung giờ khách mong muốn

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private WarrantyStatus status = WarrantyStatus.PENDING;

    /**
     * Báo cáo khảo sát & nghiệm thu của Giám sát (Quan hệ 1-1).
     */
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private WarrantyReport report;
}
