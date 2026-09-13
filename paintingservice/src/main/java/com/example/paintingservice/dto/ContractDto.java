package com.example.paintingservice.dto;

// import jakarta.validation.constraints.NotBlank;
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
    private String customerSignatureImg;
    private LocalDateTime customerSignedAt;
    private String customerIp;

    private Boolean adminSigned;
    private String adminSignatureImg;
    private LocalDateTime adminSignedAt;
    private String adminIp;

    private String pdfUrl;
    private LocalDateTime createdAt;
}
