package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
// import java.time.LocalDateTime;

@Entity
@Table(name = "booking_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingDetail extends BaseEntity {
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

    @PrePersist
    void onCreate() {
        supervisorAccepted = Boolean.TRUE.equals(supervisorAccepted);
        customerAccepted = Boolean.TRUE.equals(customerAccepted);
    }
}
