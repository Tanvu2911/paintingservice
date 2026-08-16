package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.StaffProfileDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.mapper.StaffProfileMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.BookingDetailRepository;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BookingService;
import com.example.paintingservice.service.StaffProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class StaffProfileController {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final StaffProfileService staffProfileService;
    private final BookingService bookingService;
    private final BookingDetailRepository bookingDetailRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // 1. READ: Lấy danh sách tất cả Staff kèm thông tin profile
    // @GetMapping
    // @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    // public List<StaffProfileDto> getAllStaff() {
    // List<StaffProfile> staffs = staffProfileService.findAll();
    // return
    // staffs.stream().map(StaffProfileMapper::toDto).collect(Collectors.toList());
    // }
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public List<StaffProfileDto> getAllStaff(@RequestParam(required = false) String staffType) {
        List<StaffProfile> staffs;
        if (staffType != null && !staffType.isBlank()) {
            staffs = staffProfileService.findByStaffType(staffType);
        } else {
            staffs = staffProfileService.findAll();
        }
        return staffs.stream().map(StaffProfileMapper::toDto).collect(Collectors.toList());
    }

    // 2. READ: Lấy thông tin Staff theo ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<StaffProfileDto> getStaffById(@PathVariable Long id) {
        Optional<StaffProfile> profileOpt = staffProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StaffProfile profile = profileOpt.get();
        User user = profile.getUser();

        StaffProfileDto dto = StaffProfileDto.builder()
                .id(profile.getId())
                .userId(user != null ? user.getId() : null)
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : null)
                .phoneNumber(user != null ? user.getPhoneNumber() : null)
                .address(user != null ? user.getAddress() : null)
                .specialty(profile.getSpecialty())
                .experienceYears(profile.getExperienceYears())
                .rating(profile.getRating())
                .available(profile.getAvailable())
                .staffType(profile.getStaffType())
                .build();

        return ResponseEntity.ok(dto);
    }

    // 3. CREATE: Tạo mới Staff (Tạo cả User và StaffProfile)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStaff(@Valid @RequestBody StaffProfileDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Tên đăng nhập đã tồn tại!"));
        }

        // Tạo User
        User user = new User();
        user.setUsername(dto.getUsername());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu không được để trống!"));
        }
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setAddress(dto.getAddress());
        user.setStatus(UserStatus.ACTIVE);

        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quyền ROLE_STAFF"));
        user.setRole(staffRole);
        User savedUser = userRepository.save(user);

        // Tạo StaffProfile
        StaffProfile profile = new StaffProfile();
        profile.setUser(savedUser);
        profile.setSpecialty(dto.getSpecialty());
        profile.setExperienceYears(dto.getExperienceYears() != null ? dto.getExperienceYears() : 0);
        profile.setRating(5.0);
        profile.setAvailable(dto.getAvailable() != null ? dto.getAvailable() : true);
        profile.setStaffType(dto.getStaffType());
        StaffProfile savedProfile = staffProfileRepository.save(profile);

        dto.setId(savedProfile.getId());
        dto.setUserId(savedUser.getId());
        dto.setPassword(null); // Không trả về password

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // 4. UPDATE: Cập nhật thông tin Staff và User liên quan
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffProfileDto dto) {
        Optional<StaffProfile> profileOpt = staffProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StaffProfile profile = profileOpt.get();
        User user = profile.getUser();

        // Cập nhật thông tin User
        if (dto.getEmail() != null)
            user.setEmail(dto.getEmail());
        if (dto.getPhoneNumber() != null)
            user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAddress() != null)
            user.setAddress(dto.getAddress());

        // Cập nhật mật khẩu nếu có truyền lên
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        userRepository.save(user);

        // Cập nhật thông tin StaffProfile
        if (dto.getSpecialty() != null)
            profile.setSpecialty(dto.getSpecialty());
        if (dto.getExperienceYears() != null)
            profile.setExperienceYears(dto.getExperienceYears());
        if (dto.getAvailable() != null)
            profile.setAvailable(dto.getAvailable());
        if (dto.getStaffType() != null)
            profile.setStaffType(dto.getStaffType());

        StaffProfile updatedProfile = staffProfileRepository.save(profile);

        dto.setId(updatedProfile.getId());
        dto.setUserId(user.getId());
        dto.setPassword(null);

        return ResponseEntity.ok(dto);
    }

    // 5. DELETE: Xóa Staff (Xóa Profile và User tương ứng)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        Optional<StaffProfile> profileOpt = staffProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StaffProfile profile = profileOpt.get();
        User user = profile.getUser();

        // Xóa StaffProfile trước
        staffProfileRepository.delete(profile);

        // Xóa User liên quan (nếu muốn xóa tài khoản đăng nhập luôn)
        if (user != null) {
            userRepository.delete(user);
        }

        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    // ==================== SURVEY APIs ====================

    @GetMapping("/survey/dashboard-stats")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> getSurveyDashboardStats(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<Booking> myJobs = bookingService.findAllBySurveyor_Id(currentUser.getId());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalJobs", myJobs.size());

        // Chờ nhận: SURVEY_ASSIGNED
        stats.put("pendingJobs", myJobs.stream()
                .filter(b -> b.getStatus() == BookingStatus.SURVEY_ASSIGNED)
                .count());

        // Đang làm
        stats.put("processingJobs", myJobs.stream()
                .filter(b -> b.getStatus() == BookingStatus.ACCEPTED
                        || b.getStatus() == BookingStatus.WAITING_ADMIN_QUOTE
                        || b.getStatus() == BookingStatus.CUSTOMER_ACCEPTED_QUOTE
                        || b.getStatus() == BookingStatus.WAITING_CUSTOMER_SIGNATURE
                        || b.getStatus() == BookingStatus.WAITING_DEPOSIT
                        || b.getStatus() == BookingStatus.DEPOSIT_CONFIRMED
                        || b.getStatus() == BookingStatus.CONTRACT_APPROVED
                        || b.getStatus() == BookingStatus.PROCESSING)
                .count());

        // Hoàn thành
        stats.put("completedJobs", myJobs.stream()
                .filter(b -> b.getStatus() == BookingStatus.WORKER_COMPLETED
                        || b.getStatus() == BookingStatus.COMPLETED)
                .count());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/survey/jobs")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> getMySurveyJobs(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<Booking> jobs = bookingService.findAllBySurveyor_Id(currentUser.getId());

        List<Map<String, Object>> result = jobs.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("status", b.getStatus() != null ? b.getStatus().name() : null);
            map.put("address", b.getAddress());
            map.put("appointmentDate", b.getAppointmentDate());
            map.put("description", b.getDescription());
            map.put("serviceName", b.getService() != null ? b.getService().getName() : null);
            map.put("customerName", b.getCustomer() != null ? b.getCustomer().getUsername() : null);
            map.put("technicianName", b.getTechnician() != null ? b.getTechnician().getUsername() : null);
            map.put("technicianPhone", b.getTechnician() != null ? b.getTechnician().getPhoneNumber() : null);
            map.put("totalAmount", b.getTotalAmount());
            map.put("depositAmount", b.getDepositAmount());
            map.put("remainingAmount", b.getRemainingAmount());
            map.put("paymentStatus", b.getPaymentStatus() != null ? b.getPaymentStatus().name() : null);
            map.put("preferredTechnicianName",
                    b.getPreferredTechnician() != null ? b.getPreferredTechnician().getUsername() : null);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Giám sát nhận việc khảo sát
     * Chỉ cho nhận khi status = SURVEY_ASSIGNED
     */
    @PutMapping("/survey/jobs/{id}/accept")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> acceptSurveyJob(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Bạn không có quyền nhận đơn này"));
        }

        // ★ Chỉ cho nhận khi SURVEY_ASSIGNED
        if (booking.getStatus() != BookingStatus.SURVEY_ASSIGNED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Đơn hàng không ở trạng thái có thể nhận việc (hiện tại: " + booking.getStatus() + ")"));
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        bookingService.save(booking);

        return ResponseEntity.ok(Map.of(
                "message", "Đã xác nhận nhận việc khảo sát",
                "bookingId", id));
    }

    /**
     * Gửi báo cáo khảo sát
     * Chỉ cho khi đã nhận việc (ACCEPTED)
     * Sau khi gửi report → giữ ACCEPTED (Giám sát sẽ tạo Contract →
     * WAITING_CONTRACT_APPROVAL)
     */
    @PostMapping("/survey/jobs/{id}/report")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> submitSurveyReport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Bạn không có quyền gửi báo cáo đơn này"));
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Chỉ được gửi báo cáo khi đã nhận việc khảo sát (hiện tại: " + booking.getStatus() + ")"));
        }

        // Báo cáo khảo sát từ giám sát - chuyển sang trạng thái chờ Admin báo giá
        // Không lưu totalAmount và depositAmount ở bước này nữa

        booking.setStatus(BookingStatus.WAITING_ADMIN_QUOTE);
        bookingService.save(booking);

        return ResponseEntity.ok(Map.of(
                "message", "Đã gửi báo cáo / số liệu thành công. Chờ Admin duyệt và gửi báo giá.",
                "bookingId", id));
    }

    @PostMapping("/survey/jobs/{id}/daily-report")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> submitDailyReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Bạn không có quyền gửi báo cáo đơn này"));
        }

        // Chỉ cho gửi daily report khi đơn đang thi công
        if (booking.getStatus() != BookingStatus.PROCESSING
                && booking.getStatus() != BookingStatus.CONTRACT_APPROVED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Chỉ được gửi báo cáo ngày khi đơn đang ở trạng thái thi công"));
        }

        String note = body.get("note");
        String materialShortage = body.get("materialShortage");

        return ResponseEntity.ok(Map.of(
                "message", "Đã gửi báo cáo ngày thành công",
                "bookingId", id));
    }

    @PutMapping("/survey/jobs/{id}/complete")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<?> completeSurveyJob(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Bạn không có quyền hoàn thành đơn này"));
        }

        // Không set COMPLETED ở đây — COMPLETED do khách nghiệm thu / Admin
        return ResponseEntity.badRequest().body(Map.of(
                "message",
                "Không dùng endpoint này để hoàn thành đơn. Đơn sẽ chuyển COMPLETED sau khi khách nghiệm thu."));
    }

}
