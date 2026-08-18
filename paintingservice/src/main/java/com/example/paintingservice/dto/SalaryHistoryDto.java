package com.example.paintingservice.dto;

import com.example.paintingservice.enums.SalaryStatus;
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
public class SalaryHistoryDto {
    private Long id;

    @NotNull(message = "workerId is required")
    private Long workerId;

    @NotNull(message = "bookingId is required")
    private Long bookingId;

    @NotBlank(message = "roleInBooking is required")
    private String roleInBooking;

    @NotNull(message = "amountEarned is required")
    private BigDecimal amountEarned;

    private SalaryStatus paymentStatus;
    private LocalDateTime calculatedAt;

    private String workerName;
    private String workerPhone;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
}
