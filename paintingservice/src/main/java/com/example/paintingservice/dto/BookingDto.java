package com.example.paintingservice.dto;

import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDto {
    private Long id;

    @NotNull(message = "customerId is required")
    private Long customerId;
    private String customerName;
    private String customerPhone;

    private Long surveyorId;
    private String surveyorName;
    private String surveyorPhone;
    private String surveyorAvatar;

    private Long supervisorId;
    private String supervisorName;
    private String supervisorPhone;
    private String supervisorAvatar;

    private Long technicianId;
    private String technicianName;
    private String technicianPhone;
    private String technicianAvatar;

    private Long preferredTechnicianId;
    private String preferredTechnicianName;

    @NotNull(message = "serviceId is required")
    private Long serviceId;
    private String serviceName;

    @NotNull(message = "appointmentDate is required")
    private LocalDate appointmentDate;

    @NotBlank(message = "appointmentTime is required")
    private String appointmentTime;

    private BookingStatus status;
    private BigDecimal surveyFee;
    private BigDecimal totalAmount;
    private String address;
    private String description;

    // ========== THANH TOÁN ==========
    private BigDecimal depositAmount;
    private BigDecimal remainingAmount;
    private PaymentStatus paymentStatus;

    private Integer estimatedDays;
    private Integer warrantyYears;
    private LocalDate expectedStartDate;

    /** Tiện cho frontend BookingDetail */
    private Boolean depositPaid;
    private Boolean finalPaid;
    private LocalDateTime depositPaidAt;
    private LocalDateTime finalPaidAt;
    private LocalDateTime completedAt;
    // ================================

    private LocalDateTime createdAt;
}
