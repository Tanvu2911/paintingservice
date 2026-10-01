package com.example.paintingservice.repository;

import com.example.paintingservice.entity.BookingServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingServiceItemRepository extends JpaRepository<BookingServiceItem, Long> {

    List<BookingServiceItem> findByBookingId(Long bookingId);

    List<BookingServiceItem> findByTechnician_Username(String username);

    List<BookingServiceItem> findByTechnician_Id(Long technicianId);

    void deleteByBookingId(Long bookingId);

    @Query("SELECT bsi FROM BookingServiceItem bsi JOIN FETCH bsi.service LEFT JOIN FETCH bsi.technician WHERE bsi.booking.id = :bookingId")
    List<BookingServiceItem> findAllByBookingIdWithDetails(@Param("bookingId") Long bookingId);
}
