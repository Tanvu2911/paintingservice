package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Contract extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(name = "contract_code", nullable = false, unique = true, length = 50)
    private String contractCode;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    // Bên A: Khách hàng
    @Column(name = "customer_signed")
    @Builder.Default
    private Boolean customerSigned = false;

    @Lob
    @Column(name = "customer_signature_img", columnDefinition = "LONGTEXT")
    private String customerSignatureImg; // Lưu URL từ Cloudinary (hoặc chuỗi Base64)

    @Column(name = "customer_signed_at")
    private LocalDateTime customerSignedAt;

    @Column(name = "customer_ip", length = 45)
    private String customerIp;

    // Bên B: Đại diện Công ty (Admin)
    @Column(name = "admin_signed")
    @Builder.Default
    private Boolean adminSigned = false;

    @Lob
    @Column(name = "admin_signature_img", columnDefinition = "LONGTEXT")
    private String adminSignatureImg;

    @Column(name = "admin_signed_at")
    private LocalDateTime adminSignedAt;

    @Column(name = "admin_ip", length = 45)
    private String adminIp;

    @Column(name = "pdf_url")
    private String pdfUrl;
}