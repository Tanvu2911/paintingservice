package com.example.paintingservice.service;

import com.example.paintingservice.dto.FormerStaffDto;
import com.example.paintingservice.dto.StaffProfileDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.StaffType;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.mapper.StaffProfileMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StaffProfileService {

    private final StaffProfileRepository repository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;
    private final BookingRepository bookingRepository;

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

        if (dto.getEmail() != null)
            currentUser.setEmail(dto.getEmail());
        if (dto.getPhoneNumber() != null)
            currentUser.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAddress() != null)
            currentUser.setAddress(dto.getAddress());
        if (dto.getAvatar() != null)
            currentUser.setAvatar(dto.getAvatar());
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

        if (dto.getSpecialty() != null)
            profile.setSpecialty(dto.getSpecialty());
        if (dto.getExperienceYears() != null)
            profile.setExperienceYears(dto.getExperienceYears());
        if (dto.getAvailable() != null)
            profile.setAvailable(dto.getAvailable());
        if (dto.getServiceArea() != null)
            profile.setServiceArea(dto.getServiceArea());
        if (dto.getBankName() != null)
            profile.setBankName(dto.getBankName());
        if (dto.getBankAccountNumber() != null)
            profile.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getBankAccountName() != null)
            profile.setBankAccountName(dto.getBankAccountName());

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
            if (dto.getEmail() != null)
                user.setEmail(dto.getEmail());
            if (dto.getPhoneNumber() != null)
                user.setPhoneNumber(dto.getPhoneNumber());
            if (dto.getAddress() != null)
                user.setAddress(dto.getAddress());
            if (dto.getAvatar() != null)
                user.setAvatar(dto.getAvatar());
            if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(dto.getPassword()));
            }
            userRepository.save(user);
        }

        if (dto.getSpecialty() != null)
            profile.setSpecialty(dto.getSpecialty());
        if (dto.getExperienceYears() != null)
            profile.setExperienceYears(dto.getExperienceYears());
        if (dto.getAvailable() != null)
            profile.setAvailable(dto.getAvailable());
        if (dto.getStaffType() != null)
            profile.setStaffType(dto.getStaffType());
        if (dto.getServiceArea() != null)
            profile.setServiceArea(dto.getServiceArea());
        if (dto.getBankName() != null)
            profile.setBankName(dto.getBankName());
        if (dto.getBankAccountNumber() != null)
            profile.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getBankAccountName() != null)
            profile.setBankAccountName(dto.getBankAccountName());

        StaffProfile updatedProfile = repository.save(profile);
        dto.setId(updatedProfile.getId());
        if (user != null)
            dto.setUserId(user.getId());
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

    /**
     * Lấy danh sách Giám sát viên cũ đã từng phụ trách các đơn hàng của khách hàng này.
     */
    public List<FormerStaffDto> getFormerSupervisorsForCustomer(String username) {
        User customer = userRepository.findByUsername(username).orElse(null);
        if (customer == null) {
            return Collections.emptyList();
        }

        List<Booking> bookings = bookingRepository.findAllByCustomer_Id(customer.getId());
        if (bookings == null || bookings.isEmpty()) {
            return Collections.emptyList();
        }

        // Nhóm các đơn theo Giám sát viên
        Map<Long, List<Booking>> supervisorBookings = new LinkedHashMap<>();
        Map<Long, User> supervisorMap = new LinkedHashMap<>();

        for (Booking b : bookings) {
            User surveyor = b.getSurveyor();
            if (surveyor != null && (surveyor.getStatus() == null || surveyor.getStatus() == UserStatus.ACTIVE)) {
                supervisorBookings.computeIfAbsent(surveyor.getId(), k -> new ArrayList<>()).add(b);
                supervisorMap.putIfAbsent(surveyor.getId(), surveyor);
            }
        }

        List<FormerStaffDto> result = new ArrayList<>();
        for (Map.Entry<Long, List<Booking>> entry : supervisorBookings.entrySet()) {
            Long supId = entry.getKey();
            List<Booking> bList = entry.getValue();
            User supUser = supervisorMap.get(supId);
            Optional<StaffProfile> profileOpt = repository.findByUserId(supId);

            String lastServiceName = bList.stream()
                    .filter(b -> b.getBookingServices() != null && !b.getBookingServices().isEmpty())
                    .map(b -> b.getBookingServices().stream()
                            .map(bs -> (bs != null && bs.getService() != null) ? bs.getService().getName() : "")
                            .filter(s -> !s.isEmpty())
                            .findFirst().orElse(""))
                    .filter(s -> !s.isEmpty())
                    .reduce((first, second) -> second)
                    .orElse("Sơn sửa nhà");

            result.add(FormerStaffDto.builder()
                    .userId(supUser.getId())
                    .username(supUser.getUsername())
                    .fullName(supUser.getUsername())
                    .phoneNumber(supUser.getPhoneNumber())
                    .avatar(supUser.getAvatar())
                    .staffType("SUPERVISOR")
                    .specialty(profileOpt.map(StaffProfile::getSpecialty).orElse("Giám sát thi công"))
                    .serviceArea(profileOpt.map(StaffProfile::getServiceArea).orElse(null))
                    .experienceYears(profileOpt.map(StaffProfile::getExperienceYears).orElse(3))
                    .rating(profileOpt.map(StaffProfile::getRating).orElse(5.0))
                    .available(profileOpt.map(StaffProfile::getAvailable).orElse(true))
                    .bookingCountWithCustomer((long) bList.size())
                    .lastServiceName(lastServiceName)
                    .build());
        }

        // Sắp xếp: Ai đang sẵn sàng trước -> Sau đó số lượng công trình nhiều hơn -> Đánh giá cao hơn
        result.sort(Comparator.comparing(FormerStaffDto::getAvailable, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(FormerStaffDto::getBookingCountWithCustomer, Comparator.reverseOrder())
                .thenComparing(FormerStaffDto::getRating, Comparator.nullsLast(Comparator.reverseOrder())));

        return result;
    }

    /**
     * Lấy danh sách Đội thợ thi công cũ đã từng làm việc trên các đơn hàng của khách hàng này.
     */
    public List<FormerStaffDto> getFormerTechniciansForCustomer(String username) {
        User customer = userRepository.findByUsername(username).orElse(null);
        if (customer == null) {
            return Collections.emptyList();
        }

        List<Booking> bookings = bookingRepository.findAllByCustomer_Id(customer.getId());
        if (bookings == null || bookings.isEmpty()) {
            return Collections.emptyList();
        }

        // Nhóm các đơn theo Đội thợ
        Map<Long, List<Booking>> techBookings = new LinkedHashMap<>();
        Map<Long, User> techMap = new LinkedHashMap<>();

        for (Booking b : bookings) {
            User tech = b.getTechnician();
            if (tech != null && (tech.getStatus() == null || tech.getStatus() == UserStatus.ACTIVE)) {
                techBookings.computeIfAbsent(tech.getId(), k -> new ArrayList<>()).add(b);
                techMap.putIfAbsent(tech.getId(), tech);
            }
        }

        List<FormerStaffDto> result = new ArrayList<>();
        for (Map.Entry<Long, List<Booking>> entry : techBookings.entrySet()) {
            Long techId = entry.getKey();
            List<Booking> bList = entry.getValue();
            User techUser = techMap.get(techId);
            Optional<StaffProfile> profileOpt = repository.findByUserId(techId);

            String lastServiceName = bList.stream()
                    .filter(b -> b.getBookingServices() != null && !b.getBookingServices().isEmpty())
                    .map(b -> b.getBookingServices().stream()
                            .map(bs -> (bs != null && bs.getService() != null) ? bs.getService().getName() : "")
                            .filter(s -> !s.isEmpty())
                            .findFirst().orElse(""))
                    .filter(s -> !s.isEmpty())
                    .reduce((first, second) -> second)
                    .orElse("Sơn sửa nhà");

            result.add(FormerStaffDto.builder()
                    .userId(techUser.getId())
                    .username(techUser.getUsername())
                    .fullName(techUser.getUsername())
                    .phoneNumber(techUser.getPhoneNumber())
                    .avatar(techUser.getAvatar())
                    .staffType("WORKER")
                    .specialty(profileOpt.map(StaffProfile::getSpecialty).orElse("Thợ sơn chuyên nghiệp"))
                    .serviceArea(profileOpt.map(StaffProfile::getServiceArea).orElse(null))
                    .experienceYears(profileOpt.map(StaffProfile::getExperienceYears).orElse(3))
                    .rating(profileOpt.map(StaffProfile::getRating).orElse(5.0))
                    .available(profileOpt.map(StaffProfile::getAvailable).orElse(true))
                    .bookingCountWithCustomer((long) bList.size())
                    .lastServiceName(lastServiceName)
                    .build());
        }

        // Sắp xếp: Ai đang sẵn sàng trước -> Sau đó số lượng công trình nhiều hơn -> Đánh giá cao hơn
        result.sort(Comparator.comparing(FormerStaffDto::getAvailable, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(FormerStaffDto::getBookingCountWithCustomer, Comparator.reverseOrder())
                .thenComparing(FormerStaffDto::getRating, Comparator.nullsLast(Comparator.reverseOrder())));

        return result;
    }
}