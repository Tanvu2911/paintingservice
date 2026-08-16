package com.example.paintingservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractDto {
    private Long id;

    @NotNull(message = "bookingId is required")
    private Long bookingId;

    private String contractCode;

    private String content;
    private Boolean customerSigned;
    private Boolean surveySigned;

    private Boolean adminSigned;
    private LocalDateTime adminSignedAt;
    private String adminSignatureImg;

    private String customerSignatureImg;
    private String surveySignatureImg;
    private LocalDateTime customerSignedAt;
    private LocalDateTime surveySignedAt;
    private String customerIp;
    private String surveyIp;
    private String pdfUrl;
    private LocalDateTime createdAt;

}
