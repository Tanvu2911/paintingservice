package com.example.paintingservice.repository;

import com.example.paintingservice.entity.SalaryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryHistoryRepository extends JpaRepository<SalaryHistory, Long> {
    List<SalaryHistory> findAllByBooking_Id(Long bookingId);
    List<SalaryHistory> findAllByWorker_Id(Long workerId);
    Optional<SalaryHistory> findByBooking_IdAndWorker_IdAndRoleInBooking(Long bookingId, Long workerId, String roleInBooking);
    List<SalaryHistory> findByWarrantyClaimId(Long warrantyClaimId);
    Optional<SalaryHistory> findByWarrantyClaimIdAndRoleInBooking(Long warrantyClaimId, String roleInBooking);
}
