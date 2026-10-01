package com.example.paintingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingServiceItemDto {
    private Long id;
    private Long bookingId;
    private Long serviceId;
    private String serviceName;
    private BigDecimal servicePrice;
    private String serviceDescription;

    private Long technicianId;
    private String technicianName;
    private String technicianPhone;
    private String technicianAvatar;
    private String technicianEmail;
    private String technicianAddress;
    private String technicianSpecialty;
    private Integer technicianExperienceYears;
    private Double technicianRating;
    private String technicianServiceArea;

    private Double estimatedArea;
    private BigDecimal price;
    private String note;

    private Boolean technicianAccepted;
    private java.time.LocalDateTime technicianAcceptedAt;

    private Boolean technicianStarted;
    private java.time.LocalDateTime technicianStartedAt;

    private Boolean technicianCompleted;
    private java.time.LocalDateTime technicianCompletedAt;
    private String technicianNote;

    private Boolean supervisorAccepted;
    private java.time.LocalDateTime supervisorAcceptedAt;
    private String supervisorNote;

    private Boolean cancelled;
    private java.time.LocalDateTime cancelledAt;
}
