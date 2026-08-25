package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.StaffProfileDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.mapper.StaffProfileMapper;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffProfileController {

    private final StaffProfileService staffProfileService;
    private final BookingService bookingService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // 1. READ: Lấy danh sách tất cả Staff (Công khai / Khách hàng xem)
    @GetMapping
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
    public ResponseEntity<StaffProfileDto> getStaffById(@PathVariable Long id) {
        return staffProfileService.findById(id)
                .map(StaffProfileMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 2.0 READ: Lấy thông tin Staff theo User ID
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<StaffProfileDto> getStaffByUserId(@PathVariable Long userId) {
        return staffProfileService.findByUserId(userId)
                .map(StaffProfileMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 2.1 READ: Lấy thông tin StaffProfile của chính mình
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<StaffProfileDto> getMyStaffProfile(Authentication authentication) {
        return ResponseEntity.ok(staffProfileService.getMyProfile(authentication.getName()));
    }

    // 2.2 UPDATE: Nhân viên tự cập nhật thông tin cá nhân
    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<StaffProfileDto> updateMyStaffProfile(@RequestBody StaffProfileDto dto, Authentication authentication) {
        return ResponseEntity.ok(staffProfileService.updateMyProfile(authentication.getName(), dto));
    }

    // 2.3 UPLOAD AVATAR: Nhân viên tự tải avatar lên
    @PostMapping("/me/avatar")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> uploadMyAvatar(@RequestParam("file") org.springframework.web.multipart.MultipartFile file, Authentication authentication) {
        String avatarUrl = staffProfileService.uploadMyAvatar(authentication.getName(), file);
        return ResponseEntity.ok(Map.of("avatar", avatarUrl, "message", "Tải ảnh đại diện thành công"));
    }

    // 3. CREATE: Tạo mới Staff
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffProfileDto> createStaff(@Valid @RequestBody StaffProfileDto dto) {
        StaffProfileDto created = staffProfileService.createStaff(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 4. UPDATE: Cập nhật thông tin Staff và User liên quan
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffProfileDto> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffProfileDto dto) {
        return ResponseEntity.ok(staffProfileService.updateStaff(id, dto));
    }

    // 4.1 UPLOAD AVATAR: Admin tải avatar cho Staff
    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadStaffAvatar(@PathVariable Long id, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String avatarUrl = staffProfileService.uploadAvatar(id, file);
        return ResponseEntity.ok(Map.of("avatar", avatarUrl, "message", "Tải ảnh đại diện cho nhân viên thành công"));
    }

    // 5. DELETE: Xóa Staff
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffProfileService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== SURVEY APIs ====================

    @GetMapping("/survey/dashboard-stats")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> getSurveyDashboardStats(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<Booking> myJobs = bookingService.findAllBySurveyor_Id(currentUser.getId());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalJobs", myJobs.size());
        stats.put("pendingJobs", myJobs.stream()
                .filter(b -> b.getStatus() == BookingStatus.SURVEY_ASSIGNED)
                .count());
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

    @PutMapping("/survey/jobs/{id}/accept")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> acceptSurveyJob(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền nhận đơn này"));
        }

        if (booking.getStatus() != BookingStatus.SURVEY_ASSIGNED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Đơn hàng không ở trạng thái có thể nhận việc (hiện tại: " + booking.getStatus() + ")"));
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        bookingService.save(booking);

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

        return ResponseEntity.ok(Map.of("message", "Đã xác nhận nhận việc khảo sát", "bookingId", id));
    }

    @PostMapping("/survey/jobs/{id}/report")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> submitSurveyReport(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền gửi báo cáo đơn này"));
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Chỉ được gửi báo cáo khi đã nhận việc khảo sát (hiện tại: " + booking.getStatus() + ")"));
        }

        booking.setStatus(BookingStatus.WAITING_ADMIN_QUOTE);
        bookingService.save(booking);

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

        return ResponseEntity.ok(Map.of("message", "Đã gửi báo cáo / số liệu thành công. Chờ Admin duyệt và gửi báo giá.", "bookingId", id));
    }

    @PostMapping("/survey/jobs/{id}/daily-report")
    @PreAuthorize("hasAnyRole('STAFF', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<?> submitDailyReport(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền gửi báo cáo đơn này"));
        }

        if (booking.getStatus() != BookingStatus.PROCESSING && booking.getStatus() != BookingStatus.CONTRACT_APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ được gửi báo cáo ngày khi đơn đang ở trạng thái thi công"));
        }

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

        return ResponseEntity.ok(Map.of("message", "Đã gửi báo cáo ngày thành công", "bookingId", id));
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + authentication.getName()));
    }
}
