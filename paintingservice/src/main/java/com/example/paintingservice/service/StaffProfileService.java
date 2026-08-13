package com.example.paintingservice.service;

import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.enums.StaffType;
import com.example.paintingservice.repository.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StaffProfileService {

    private final StaffProfileRepository repository;

    public List<StaffProfile> findAll() {
        return repository.findAll();
    }

    public Optional<StaffProfile> findById(Long id) {
        return repository.findById(id);
    }
   public List<StaffProfile> findByStaffType(String staffType) {
        StaffType type = StaffType.valueOf(staffType.toUpperCase());

        return repository.findByStaffTypeAndAvailableTrue(type);
    }

    public Optional<StaffProfile> findByUserId(Long userId) {
        return repository.findByUserId(userId);
    }

    public StaffProfile save(StaffProfile staffProfile) {
        return repository.save(staffProfile);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public boolean existsByUserId(Long userId) {
        return repository.existsByUserId(userId);
    }

}