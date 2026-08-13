package com.example.paintingservice.repository;

import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.StaffType;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {

    Optional<StaffProfile> findByUserId(Long userId);
    Optional<StaffProfile> findByUser(User user);

   List<StaffProfile> findByStaffTypeAndAvailableTrue(StaffType staffType);

    boolean existsByUserId(Long userId);

}