package com.example.paintingservice.repository;

import com.example.paintingservice.entity.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DailyReportRepository
        extends JpaRepository<DailyReport, Long> {

    List<DailyReport> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
}