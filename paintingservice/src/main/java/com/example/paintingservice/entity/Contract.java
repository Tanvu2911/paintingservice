package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {
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

    @Column(name = "customer_signed")
    private Boolean customerSigned = false;

    // @Column(name = "worker_signed")
    // private Boolean workerSigned = false;
    @Column(name = "survey_signed")
    private Boolean surveySigned = false;

    @Lob
    @Column(name = "customer_signature_img", columnDefinition = "LONGTEXT")
    private String customerSignatureImg; // Lưu chuỗi Base64 từ canvas vẽ tay

    @Lob
    @Column(name = "survey_signature_img", columnDefinition = "LONGTEXT")
    private String surveySignatureImg;

    @Column(name = "customer_signed_at")
    private LocalDateTime customerSignedAt;

    @Column(name = "survey_signed_at")
    private LocalDateTime surveySignedAt;

    @Column(name = "customer_ip", length = 45)
    private String customerIp;

    @Column(name = "survey_ip", length = 45)
    private String surveyIp;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}