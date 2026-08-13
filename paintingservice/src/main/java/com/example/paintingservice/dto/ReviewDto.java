package com.example.paintingservice.dto;

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

    @NotNull(message = "bookingId is required")
    private Long bookingId;

    @NotNull(message = "customerId is required")
    private Long customerId;

    @NotNull(message = "rating is required")
    private Integer rating;

    private String comment;
    private LocalDateTime createdAt;
}
