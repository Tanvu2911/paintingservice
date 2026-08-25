package com.example.paintingservice.service;

import com.example.paintingservice.dto.StaffProfileDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.StaffType;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.mapper.StaffProfileMapper;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffProfileService {

    private final StaffProfileRepository repository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;

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

    @Transactional(rollbackFor = Exception.class)
    public StaffProfileDto getMyProfile(String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + username));
        Optional<StaffProfile> profileOpt = repository.findByUser_Id(currentUser.getId());
        if (profileOpt.isEmpty()) {
            return StaffProfileDto.builder()
                    .userId(currentUser.getId())
                    .username(currentUser.getUsername())
                    .email(currentUser.getEmail())
                    .phoneNumber(currentUser.getPhoneNumber())
                    .address(currentUser.getAddress())
                    .avatar(currentUser.getAvatar())
                    .build();
        }
        return StaffProfileMapper.toDto(profileOpt.get());
    }

    @Transactional(rollbackFor = Exception.class)
    public StaffProfileDto updateMyProfile(String username, StaffProfileDto dto) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + username));

        if (dto.getEmail() != null) currentUser.setEmail(dto.getEmail());
        if (dto.getPhoneNumber() != null) currentUser.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAddress() != null) currentUser.setAddress(dto.getAddress());
        if (dto.getAvatar() != null) currentUser.setAvatar(dto.getAvatar());
        userRepository.save(currentUser);

        StaffProfile profile = repository.findByUser_Id(currentUser.getId())
                .orElseGet(() -> {
                    StaffProfile p = new StaffProfile();
                    p.setUser(currentUser);
                    p.setStaffType(StaffType.WORKER);
                    p.setRating(5.0);
                    p.setAvailable(true);
                    return p;
                });

        if (dto.getSpecialty() != null) profile.setSpecialty(dto.getSpecialty());
        if (dto.getExperienceYears() != null) profile.setExperienceYears(dto.getExperienceYears());
        if (dto.getAvailable() != null) profile.setAvailable(dto.getAvailable());
        if (dto.getServiceArea() != null) profile.setServiceArea(dto.getServiceArea());
        if (dto.getBankName() != null) profile.setBankName(dto.getBankName());
        if (dto.getBankAccountNumber() != null) profile.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getBankAccountName() != null) profile.setBankAccountName(dto.getBankAccountName());

        StaffProfile saved = repository.save(profile);
        return StaffProfileMapper.toDto(saved);
    }

    @Transactional(rollbackFor = Exception.class)
    public StaffProfileDto createStaff(StaffProfileDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }

        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new RuntimeException("Mật khẩu không được để trống!");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setAddress(dto.getAddress());
        user.setAvatar(dto.getAvatar());
        user.setStatus(UserStatus.ACTIVE);

        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quyền ROLE_STAFF"));
        user.setRole(staffRole);
        User savedUser = userRepository.save(user);

        StaffProfile profile = new StaffProfile();
        profile.setUser(savedUser);
        profile.setSpecialty(dto.getSpecialty());
        profile.setExperienceYears(dto.getExperienceYears() != null ? dto.getExperienceYears() : 0);
        profile.setRating(5.0);
        profile.setAvailable(dto.getAvailable() != null ? dto.getAvailable() : true);
        profile.setStaffType(dto.getStaffType());
        profile.setServiceArea(dto.getServiceArea());
        profile.setBankName(dto.getBankName());
        profile.setBankAccountNumber(dto.getBankAccountNumber());
        profile.setBankAccountName(dto.getBankAccountName());
        StaffProfile savedProfile = repository.save(profile);

        dto.setId(savedProfile.getId());
        dto.setUserId(savedUser.getId());
        dto.setPassword(null);

        return dto;
    }

    @Transactional(rollbackFor = Exception.class)
    public StaffProfileDto updateStaff(Long id, StaffProfileDto dto) {
        StaffProfile profile = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên #" + id));
        User user = profile.getUser();

        if (user != null) {
            if (dto.getEmail() != null) user.setEmail(dto.getEmail());
            if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
            if (dto.getAddress() != null) user.setAddress(dto.getAddress());
            if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
            if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(dto.getPassword()));
            }
            userRepository.save(user);
        }

        if (dto.getSpecialty() != null) profile.setSpecialty(dto.getSpecialty());
        if (dto.getExperienceYears() != null) profile.setExperienceYears(dto.getExperienceYears());
        if (dto.getAvailable() != null) profile.setAvailable(dto.getAvailable());
        if (dto.getStaffType() != null) profile.setStaffType(dto.getStaffType());
        if (dto.getServiceArea() != null) profile.setServiceArea(dto.getServiceArea());
        if (dto.getBankName() != null) profile.setBankName(dto.getBankName());
        if (dto.getBankAccountNumber() != null) profile.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getBankAccountName() != null) profile.setBankAccountName(dto.getBankAccountName());

        StaffProfile updatedProfile = repository.save(profile);
        dto.setId(updatedProfile.getId());
        if (user != null) dto.setUserId(user.getId());
        dto.setPassword(null);

        return dto;
    }

    @Transactional(rollbackFor = Exception.class)
    public String uploadAvatar(Long staffId, org.springframework.web.multipart.MultipartFile file) {
        StaffProfile profile = repository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên #" + staffId));
        User user = profile.getUser();
        if (user == null) {
            throw new RuntimeException("Không tìm thấy tài khoản người dùng của nhân viên #" + staffId);
        }

        try {
            String avatarUrl = cloudinaryService.uploadImage(file, "avatars");
            user.setAvatar(avatarUrl);
            userRepository.save(user);
            return avatarUrl;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Lỗi khi tải ảnh lên Cloudinary: " + e.getMessage(), e);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public String uploadMyAvatar(String username, org.springframework.web.multipart.MultipartFile file) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + username));

        try {
            String avatarUrl = cloudinaryService.uploadImage(file, "avatars");
            user.setAvatar(avatarUrl);
            userRepository.save(user);
            return avatarUrl;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Lỗi khi tải ảnh lên Cloudinary: " + e.getMessage(), e);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteStaff(Long id) {
        StaffProfile profile = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên #" + id));
        User user = profile.getUser();
        repository.delete(profile);
        if (user != null) {
            userRepository.delete(user);
        }
    }
}