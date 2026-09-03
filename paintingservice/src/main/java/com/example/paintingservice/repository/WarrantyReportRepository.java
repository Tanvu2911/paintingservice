package com.example.paintingservice.repository;

import com.example.paintingservice.entity.WarrantyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarrantyReportRepository extends JpaRepository<WarrantyReport, Long> {
    Optional<WarrantyReport> findByClaimId(Long claimId);
}
