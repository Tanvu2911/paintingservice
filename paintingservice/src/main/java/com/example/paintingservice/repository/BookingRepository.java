package com.example.paintingservice.repository;

import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.enums.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Override
    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    List<Booking> findAll();

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    @Query("SELECT b FROM Booking b ORDER BY b.id DESC")
    List<Booking> findAllOrderByIdDesc();

    @Override
    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    Optional<Booking> findById(Long id);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    List<Booking> findAllByCustomer_Username(String username);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    List<Booking> findAllByCustomer_Id(Long customerId);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    List<Booking> findAllByTechnician_Username(String username);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    List<Booking> findAllBySurveyor_Id(Long surveyorId);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician", "preferredSupervisor", "bookingServices", "bookingServices.service", "bookingServices.technician"})
    @Query("SELECT b FROM Booking b WHERE b.surveyor.id = :staffId OR (b.surveyor IS NULL AND (b.preferredSupervisor.id = :staffId OR b.status = com.example.paintingservice.enums.BookingStatus.PENDING)) ORDER BY b.id DESC")
    List<Booking> findSurveyJobsForStaff(@Param("staffId") Long staffId);

    long countBySurveyor_IdAndStatusIn(Long surveyorId, Collection<BookingStatus> statuses);

    long countByTechnician_IdAndStatusIn(Long technicianId, Collection<BookingStatus> statuses);
}
