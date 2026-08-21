package com.example.paintingservice.repository;

import com.example.paintingservice.entity.Booking;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Override
    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician"})
    List<Booking> findAll();

    @Override
    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician"})
    Optional<Booking> findById(Long id);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician"})
    List<Booking> findAllByCustomer_Username(String username);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician"})
    List<Booking> findAllByTechnician_Username(String username);

    @EntityGraph(attributePaths = {"customer", "service", "technician", "surveyor", "preferredTechnician"})
    List<Booking> findAllBySurveyor_Id(Long surveyorId);
}
