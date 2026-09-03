package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thực thể lưu trữ toàn bộ biên bản khảo sát thẩm định của Giám sát
 * và kết quả nghiệm thu hoàn thành của phiếu bảo hành.
 * Quan hệ 1-1 với WarrantyClaim.
 */
@Entity
@Table(name = "warranty_reports", indexes = {
        @Index(name = "idx_warranty_report_claim", columnList = "claim_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WarrantyReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private WarrantyClaim claim;

    // --- BÁO CÁO KHẢO SÁT & THẨM ĐỊNH CỦA GIÁM SÁT ---
    @Column(name = "fault_type", length = 50)
    private String faultType; // COMPANY_FAULT (Lỗi do mình) hoặc CUSTOMER_FAULT (Lỗi khách quan)

    @Column(name = "survey_note", columnDefinition = "TEXT")
    private String surveyNote; // Ghi chú hiện trạng khảo sát

    @Column(name = "material_note", columnDefinition = "TEXT")
    private String materialNote; // Ghi chú vật tư cần dùng

    @Column(name = "survey_images", columnDefinition = "TEXT")
    private String surveyImages; // Ảnh đo đạc hiện trường

    @Column(name = "suggested_price", precision = 12, scale = 2)
    private BigDecimal suggestedPrice; // Mức giá hỗ trợ do Giám sát đề xuất

    @Column(name = "final_support_price", precision = 12, scale = 2)
    private BigDecimal finalSupportPrice; // Mức giá hỗ trợ do Admin chốt gửi khách

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote; // Ghi chú của Admin

    // --- KẾT QUẢ NGHIỆM THU HOÀN THÀNH ---
    @Column(name = "resolved_image_urls", columnDefinition = "TEXT")
    private String resolvedImageUrls; // Ảnh sau khi hoàn thành sửa chữa

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "supervisor_accepted")
    @Builder.Default
    private Boolean supervisorAccepted = false; // Giám sát đã nghiệm thu

    @Column(name = "customer_accepted")
    @Builder.Default
    private Boolean customerAccepted = false; // Khách hàng đã nghiệm thu
}
