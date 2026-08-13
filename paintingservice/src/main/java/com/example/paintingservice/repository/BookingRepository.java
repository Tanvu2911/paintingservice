package com.example.paintingservice.repository;

import com.example.paintingservice.entity.Booking;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
	// java.util.List<Booking> findAllByCustomer_Username(String username);
	// Tìm các booking theo username của khách hàng (đã có)
    List<Booking> findAllByCustomer_Username(String username);

    // Bổ sung phương thức này để tìm booking theo username của kỹ thuật viên
    List<Booking> findAllByTechnician_Username(String username);

    List<Booking> findAllBySurveyor_Id(Long surveyorId);
}
