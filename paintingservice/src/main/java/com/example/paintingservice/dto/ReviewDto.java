package com.example.paintingservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class ReviewDto {
    private Long id;

    @NotNull(message = "bookingId không được để trống")
    private Long bookingId;

    private Long customerId;
    private String customerUsername;
    private String customerPhone;

    private Long technicianId;
    private String technicianUsername;

    private Long surveyorId;
    private String surveyorUsername;

    private String serviceName;
    private String bookingAddress;
    private Double bookingTotalAmount;

    @NotNull(message = "rating không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    private Integer rating;

    private String comment;
    private LocalDateTime createdAt;
}

