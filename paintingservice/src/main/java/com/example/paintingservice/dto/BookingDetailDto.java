package com.example.paintingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Request/response model for the survey and acceptance data of one booking detail. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetailDto {
    private Long id;
    private Long bookingId;
    private String surveyNote;
    private String materialNote;
    private String surveyImages;
    private String materialShortage;
    private Boolean supervisorAccepted;
    private Boolean customerAccepted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
