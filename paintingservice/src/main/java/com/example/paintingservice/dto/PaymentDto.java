package com.example.paintingservice.dto;

import com.example.paintingservice.enums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private Long id;

    @NotNull(message = "bookingId is required")
    private Long bookingId;

    @NotNull(message = "amount is required")
    private BigDecimal amount;

    @NotBlank(message = "paymentMethod is required")
    private String paymentMethod;

    private PaymentStatus paymentStatus;
    private String transactionCode;
    private LocalDateTime paidAt;



    private String paymentType; // DEPOSIT hoặc FINAL
    private String proofImage;
    private String note;
}
