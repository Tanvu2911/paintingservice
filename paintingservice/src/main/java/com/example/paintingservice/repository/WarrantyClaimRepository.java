package com.example.paintingservice.repository;

import com.example.paintingservice.entity.WarrantyClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, Long> {
    List<WarrantyClaim> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
    List<WarrantyClaim> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<WarrantyClaim> findBySurveyorIdOrderByCreatedAtDesc(Long surveyorId);
    List<WarrantyClaim> findByTechnicianIdOrderByCreatedAtDesc(Long technicianId);
    List<WarrantyClaim> findAllByOrderByCreatedAtDesc();
}

