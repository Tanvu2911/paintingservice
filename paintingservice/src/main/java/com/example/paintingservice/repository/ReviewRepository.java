package com.example.paintingservice.repository;

import com.example.paintingservice.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByBooking_Id(Long bookingId);

    boolean existsByBooking_Id(Long bookingId);

    List<Review> findAllByCustomer_UsernameOrderByCreatedAtDesc(String username);

    List<Review> findAllByCustomer_IdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT r FROM Review r WHERE r.booking.technician.id = :technicianId OR (r.booking.technician IS NULL AND r.booking.preferredTechnician.id = :technicianId) ORDER BY r.createdAt DESC")
    List<Review> findAllByTechnicianId(@Param("technicianId") Long technicianId);

    @Query("SELECT r FROM Review r WHERE r.booking.technician.username = :username OR (r.booking.technician IS NULL AND r.booking.preferredTechnician.username = :username) ORDER BY r.createdAt DESC")
    List<Review> findAllByTechnicianUsername(@Param("username") String username);

    @Query("SELECT r FROM Review r WHERE r.booking.surveyor.username = :username ORDER BY r.createdAt DESC")
    List<Review> findAllBySurveyorUsername(@Param("username") String username);

    @Query("SELECT DISTINCT r FROM Review r WHERE " +
           "r.booking.technician.username = :username OR " +
           "(r.booking.technician IS NULL AND r.booking.preferredTechnician.username = :username) OR " +
           "r.booking.surveyor.username = :username " +
           "ORDER BY r.createdAt DESC")
    List<Review> findAllByStaffUsername(@Param("username") String username);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.booking.technician.id = :technicianId OR (r.booking.technician IS NULL AND r.booking.preferredTechnician.id = :technicianId)")
    Double findAverageRatingByTechnicianId(@Param("technicianId") Long technicianId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.booking.technician.id = :technicianId OR (r.booking.technician IS NULL AND r.booking.preferredTechnician.id = :technicianId)")
    Long countByTechnicianId(@Param("technicianId") Long technicianId);

    @Query("SELECT AVG(r.rating) FROM Review r")
    Double findOverallAverageRating();

    @Query("SELECT COUNT(r) FROM Review r WHERE r.rating = :rating")
    Long countByRating(@Param("rating") Integer rating);
}


