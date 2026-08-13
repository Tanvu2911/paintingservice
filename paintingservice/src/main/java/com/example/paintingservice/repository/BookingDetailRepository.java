package com.example.paintingservice.repository;

import com.example.paintingservice.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, Long> {
    List<BookingDetail> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    boolean existsByBookingId(Long bookingId);
}
