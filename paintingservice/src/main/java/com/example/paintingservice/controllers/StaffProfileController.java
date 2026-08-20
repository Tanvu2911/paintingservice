package com.example.paintingservice.controllers;

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
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.BookingDetailRepository;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BookingService;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.StaffProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private final NotificationService notificationService;

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

        StaffProfileDto dto = StaffProfileMapper.toDto(profile);
        return ResponseEntity.ok(dto);
    }

    // 2.1 READ: Lấy thông tin StaffProfile của chính mình
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> getMyStaffProfile(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Optional<StaffProfile> profileOpt = staffProfileRepository.findByUser_Id(currentUser.getId());
        if (profileOpt.isEmpty()) {
            return ResponseEntity.ok(StaffProfileDto.builder()
                    .userId(currentUser.getId())
                    .username(currentUser.getUsername())
                    .email(currentUser.getEmail())
                    .phoneNumber(currentUser.getPhoneNumber())
                    .address(currentUser.getAddress())
                    .build());
        }
        return ResponseEntity.ok(StaffProfileMapper.toDto(profileOpt.get()));
    }

    // 2.2 UPDATE: Nhân viên tự cập nhật khu vực hoạt động & thông tin ngân hàng của mình
    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> updateMyStaffProfile(@RequestBody StaffProfileDto dto, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        
        if (dto.getEmail() != null) currentUser.setEmail(dto.getEmail());
        if (dto.getPhoneNumber() != null) currentUser.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAddress() != null) currentUser.setAddress(dto.getAddress());
        userRepository.save(currentUser);

        StaffProfile profile = staffProfileRepository.findByUser_Id(currentUser.getId())
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

        StaffProfile saved = staffProfileRepository.save(profile);
        return ResponseEntity.ok(StaffProfileMapper.toDto(saved));
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
        profile.setServiceArea(dto.getServiceArea());
        profile.setBankName(dto.getBankName());
        profile.setBankAccountNumber(dto.getBankAccountNumber());
        profile.setBankAccountName(dto.getBankAccountName());
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
        if (dto.getServiceArea() != null)
            profile.setServiceArea(dto.getServiceArea());
        if (dto.getBankName() != null)
            profile.setBankName(dto.getBankName());
        if (dto.getBankAccountNumber() != null)
            profile.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getBankAccountName() != null)
            profile.setBankAccountName(dto.getBankAccountName());

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

        // Thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Giám sát đã nhận đơn #" + id)
                    .content(String.format("Giám sát viên %s đã nhận việc khảo sát đơn hàng #%d (Địa chỉ: %s).",
                            currentUser.getUsername(), id, booking.getAddress() != null ? booking.getAddress() : "Theo đơn"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Thông báo cho Khách hàng
        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Giám sát viên đã tiếp nhận lịch khảo sát #" + id)
                    .content(String.format("Giám sát viên %s đã tiếp nhận đơn #%d và chuẩn bị đến khảo sát công trình của bạn theo lịch hẹn.",
                            currentUser.getUsername(), id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Đã xác nhận nhận việc khảo sát",
                "bookingId", id));
    }

    /**
     * Gửi báo cáo khảo sát
     * Chỉ cho khi đã nhận việc (ACCEPTED)
     * Sau khi gửi report → chuyển sang WAITING_ADMIN_QUOTE để Admin lập báo giá & hợp đồng
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

        booking.setStatus(BookingStatus.WAITING_ADMIN_QUOTE);
        bookingService.save(booking);

        // Thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Báo cáo khảo sát đơn #" + id)
                    .content(String.format("Giám sát viên %s đã nộp báo cáo khảo sát hiện trường đơn hàng #%d. Vui lòng kiểm tra số liệu và gửi báo giá cho khách.",
                            currentUser.getUsername(), id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

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

        // Thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Báo cáo tiến độ thi công #" + id)
                    .content(String.format("Giám sát viên %s vừa gửi báo cáo tiến độ thi công cho đơn hàng #%d.",
                            currentUser.getUsername(), id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

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
