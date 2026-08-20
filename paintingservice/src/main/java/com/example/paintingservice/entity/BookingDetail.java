package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "survey_note", columnDefinition = "TEXT")
    private String surveyNote;

    @Column(name = "material_note", columnDefinition = "TEXT")
    private String materialNote;

    @Column(name = "survey_images", columnDefinition = "TEXT")
    private String surveyImages;

    @Column(name = "material_shortage", columnDefinition = "TEXT")
    private String materialShortage;

    @Column(name = "supervisor_accepted", nullable = false)
    @Builder.Default
    private Boolean supervisorAccepted = false;

    @Column(name = "customer_accepted", nullable = false)
    @Builder.Default
    private Boolean customerAccepted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = createdAt == null ? now : createdAt;
        updatedAt = now;
        supervisorAccepted = Boolean.TRUE.equals(supervisorAccepted);
        customerAccepted = Boolean.TRUE.equals(customerAccepted);
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
