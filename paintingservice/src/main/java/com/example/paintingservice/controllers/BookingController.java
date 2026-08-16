package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.dto.RejectJobDto;
import com.example.paintingservice.mapper.BookingMapper;
import com.example.paintingservice.service.BookingService;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.ServiceEntity;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.BookingDetail;
import com.example.paintingservice.entity.Contract;
import com.example.paintingservice.repository.ServiceEntityRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.repository.BookingDetailRepository;
import jakarta.validation.Valid;
import com.example.paintingservice.enums.BookingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.example.paintingservice.repository.BookingRepository;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ServiceEntityRepository serviceEntityRepository;
    private final ContractRepository contractRepository;
    private final BookingDetailRepository bookingDetailRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookingDto> getAll() {
        return bookingService.findAll().stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/me")
    public List<BookingDto> getMyBookings(Authentication authentication) {
        String username = authentication.getName();
        return bookingRepository.findAllByCustomer_Username(username).stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/technician")
    @PreAuthorize("hasRole('STAFF') or hasRole('TECHNICIAN')")
    public List<BookingDto> getTechnicianTasks(Authentication authentication) {
        String username = authentication.getName();
        return bookingRepository.findAllByTechnician_Username(username).stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDto> getById(@PathVariable Long id) {
        return bookingService.findById(id)
                .map(BookingMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDto> create(@Valid @RequestBody BookingDto dto, Authentication authentication) {
        if (!isAdmin(authentication) && !authentication.getName().equals(
                userRepository.findById(dto.getCustomerId()).map(User::getUsername).orElse(null))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Booking entity = BookingMapper.toEntity(dto);
        // Mặc định status khi khách tạo = PENDING
        if (entity.getStatus() == null) {
            entity.setStatus(BookingStatus.PENDING);
        }
        Booking saved = bookingService.save(entity);

        String serviceName = serviceEntityRepository.findById(dto.getServiceId())
                .map(s -> s.getName()).orElse("Dịch vụ");

        User customer = userRepository.findById(dto.getCustomerId()).orElse(null);
        String customerName = customer != null ? customer.getUsername() : "Khách hàng";

        if (customer != null) {
            notificationService.save(Notification.builder()
                    .user(customer)
                    .title("Gửi yêu cầu thành công")
                    .content(String.format("Yêu cầu #%d (%s) đã được gửi thành công và đang chờ xử lý.", saved.getId(),
                            serviceName))
                    .createdAt(LocalDateTime.now()).isRead(false).build());
        }

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Yêu cầu khảo sát mới")
                    .content(String.format("Khách hàng %s vừa gửi yêu cầu #%d cho dịch vụ '%s'.", customerName,
                            saved.getId(), serviceName))
                    .createdAt(LocalDateTime.now()).isRead(false).build());
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(BookingMapper.toDto(saved));
    }

    // ==================== UPDATE (giữ nguyên logic thông báo) ====================
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
    public ResponseEntity<BookingDto> update(@PathVariable Long id,
            @Valid @RequestBody BookingDto dto,
            Authentication authentication) {
        if (!bookingService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        Booking old = bookingRepository.findById(id).orElse(null);
        if (old == null)
            return ResponseEntity.notFound().build();

        boolean statusChanged = old.getStatus() != dto.getStatus();
        boolean technicianChanged = (old.getTechnician() == null && dto.getTechnicianId() != null) ||
                (old.getTechnician() != null && dto.getTechnicianId() == null) ||
                (old.getTechnician() != null && dto.getTechnicianId() != null
                        && !old.getTechnician().getId().equals(dto.getTechnicianId()));

        boolean detailsChanged = !Objects.equals(old.getAppointmentDate(), dto.getAppointmentDate()) ||
                !Objects.equals(old.getAppointmentTime(), dto.getAppointmentTime()) ||
                !Objects.equals(old.getAddress(), dto.getAddress()) ||
                !Objects.equals(old.getDescription(), dto.getDescription()) ||
                !Objects.equals(old.getService() != null ? old.getService().getId() : null, dto.getServiceId());

        dto.setId(id);
        BookingMapper.updateEntity(dto, old);
        Booking updated = bookingService.save(old);

        String serviceName = (old.getService() != null) ? old.getService().getName()
                : serviceEntityRepository.findById(dto.getServiceId())
                        .map(ServiceEntity::getName).orElse("Dịch vụ");

        String actorName = authentication.getName();
        User actor = userRepository.findByUsername(actorName).orElse(null);
        String actorDisplayName = (actor != null && actor.getUsername() != null) ? actor.getUsername() : actorName;

        User customerEntity = old.getCustomer();

        User techEntity = null;
        if (dto.getTechnicianId() != null) {
            techEntity = userRepository.findById(dto.getTechnicianId()).orElse(null);
        } else if (old.getTechnician() != null) {
            techEntity = old.getTechnician();
        }

        // --- 1. GỬI THÔNG BÁO CHO KHÁCH HÀNG ---
        if (statusChanged && customerEntity != null) {
            String statusVN = mapBookingStatusToVietnamese(dto.getStatus());
            String friendlyMsg = switch (dto.getStatus()) {
                case ACCEPTED -> "Yêu cầu của bạn đã được kỹ thuật viên tiếp nhận và sẽ sớm đến xử lý.";
                case PROCESSING -> "Kỹ thuật viên đang thi công công trình của bạn.";
                case COMPLETED -> "Kỹ thuật viên đã hoàn thành công việc.";
                default -> String.format("Yêu cầu của bạn hiện đang ở trạng thái: %s", statusVN);
            };

            String content = String.format("Dịch vụ %s: %s", serviceName, friendlyMsg);
            if (techEntity != null) {
                content += " - Kỹ thuật viên: " + (techEntity.getUsername() != null ? techEntity.getUsername() : "");
            }

            notificationService.save(Notification.builder()
                    .user(customerEntity)
                    .title("Cập nhật tiến độ #" + id)
                    .content(content)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        // --- 2. GỬI THÔNG BÁO CHO ADMIN ---
        if (statusChanged || detailsChanged || technicianChanged) {
            String statusVN = mapBookingStatusToVietnamese(dto.getStatus());
            List<User> admins = userRepository.findAllByRole_Name("ROLE_ADMIN");

            admins.forEach(admin -> {
                if (!admin.getUsername().equals(actorName)) {
                    notificationService.save(Notification.builder()
                            .user(admin)
                            .title("Cập nhật đơn hàng #" + id)
                            .content(String.format("Tài khoản %s đã cập nhật trạng thái đơn '%s' thành: %s",
                                    actorDisplayName, serviceName, statusVN))
                            .createdAt(LocalDateTime.now())
                            .isRead(false)
                            .build());
                }
            });
        }

        // --- 3. GỬI THÔNG BÁO CHO KỸ THUẬT VIÊN ---
        if (techEntity != null && (statusChanged || detailsChanged || technicianChanged)) {
            String techTitle = (technicianChanged && dto.getTechnicianId() == null)
                    ? "Hủy phân công nhiệm vụ #" + id
                    : (technicianChanged ? "Nhiệm vụ mới được phân công" : "Cập nhật nhiệm vụ #" + id);
            String statusVN = mapBookingStatusToVietnamese(dto.getStatus());
            String customerName = (customerEntity != null) ? customerEntity.getUsername() : "Khách hàng";

            String techContent = technicianChanged
                    ? (dto.getTechnicianId() == null
                            ? String.format("Bạn không còn đảm nhận yêu cầu #%d (%s) nữa.", id, serviceName)
                            : String.format("Bạn được phân công yêu cầu #%d (%s) cho khách hàng %s tại %s.",
                                    id, serviceName, customerName, dto.getAddress()))
                    : String.format("Hệ thống đã cập nhật yêu cầu #%d (%s). Trạng thái hiện tại: %s",
                            id, serviceName, statusVN);

            notificationService.save(Notification.builder()
                    .user(techEntity)
                    .title(techTitle)
                    .content(techContent)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ResponseEntity.ok(BookingMapper.toDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }

        String serviceName = serviceEntityRepository.findById(booking.getService().getId())
                .map(s -> s.getName()).orElse("Dịch vụ");
        String actorName = authentication.getName();

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hủy yêu cầu")
                    .content(String.format("Yêu cầu #%d (%s) đã bị xóa khỏi hệ thống bởi %s.", id, serviceName,
                            actorName))
                    .createdAt(LocalDateTime.now()).isRead(false).build());
        }

        if (booking.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getTechnician())
                    .title("Hủy nhiệm vụ")
                    .content(String.format("Nhiệm vụ #%d (%s) đã được gỡ bỏ khỏi danh sách của bạn.", id, serviceName))
                    .createdAt(LocalDateTime.now()).isRead(false).build());
        }

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            if (!admin.getUsername().equals(actorName)) {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Đã xóa đơn #" + id)
                        .content(String.format("Người dùng %s đã xóa đơn '%s' khỏi hệ thống.", actorName, serviceName))
                        .createdAt(LocalDateTime.now()).isRead(false).build());
            }
        });

        bookingService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== PHÂN CÔNG GIÁM SÁT → SURVEY_ASSIGNED
    // ====================
    @PostMapping("/{id}/assign-supervisor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignSupervisor(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        if (payload.get("supervisorId") == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Thiếu supervisorId"));
        }

        Long supervisorId = Long.valueOf(payload.get("supervisorId").toString());

        Booking booking = bookingService.assignSupervisor(id, supervisorId);

        // ★ Chuyển status → SURVEY_ASSIGNED
        booking.setStatus(BookingStatus.SURVEY_ASSIGNED);
        bookingRepository.save(booking);

        if (booking.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getSurveyor())
                    .title("Phân công khảo sát #" + id)
                    .content("Bạn được phân công khảo sát đơn hàng #" + id)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Phân công giám sát thành công",
                "booking", BookingMapper.toDto(booking)));
    }

    //
    // ==================== ADMIN GỬI BÁO GIÁ & LẬP HỢP ĐỒNG CHI TIẾT
    // ====================
    @PostMapping("/{id}/send-quote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendQuote(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null)
            return ResponseEntity.notFound().build();

        if (booking.getStatus() != BookingStatus.WAITING_ADMIN_QUOTE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Đơn hàng không ở trạng thái chờ báo giá"));
        }

        if (payload.get("totalAmount") == null || payload.get("totalAmount").toString().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin tổng báo giá"));
        }

        java.math.BigDecimal total = new java.math.BigDecimal(payload.get("totalAmount").toString());
        java.math.BigDecimal deposit;
        if (payload.get("depositAmount") != null && !payload.get("depositAmount").toString().isBlank()) {
            deposit = new java.math.BigDecimal(payload.get("depositAmount").toString());
        } else {
            deposit = total.multiply(new java.math.BigDecimal("0.3")).setScale(0, java.math.RoundingMode.HALF_UP);
        }

        if (total.compareTo(java.math.BigDecimal.ZERO) <= 0 || deposit.compareTo(java.math.BigDecimal.ZERO) < 0
                || deposit.compareTo(total) > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền báo giá không hợp lệ"));
        }

        booking.setTotalAmount(total);
        booking.setDepositAmount(deposit);
        booking.setRemainingAmount(total.subtract(deposit));
        booking.setPaymentStatus(com.example.paintingservice.enums.PaymentStatus.UNPAID);

        // ★ Tự động chuyển thẳng sang WAITING_CUSTOMER_SIGNATURE để Khách xem hợp đồng
        // chi tiết & ký luôn
        booking.setStatus(BookingStatus.WAITING_CUSTOMER_SIGNATURE);
        bookingRepository.save(booking);

        // ★ TẠO HỢP ĐỒNG CHI TIẾT
        List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(id);
        String customerName = booking.getCustomer() != null ? booking.getCustomer().getUsername() : "Khách hàng";
        String customerPhone = booking.getCustomer() != null ? booking.getCustomer().getPhoneNumber() : "Chưa cung cấp";

        java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));

        StringBuilder sb = new StringBuilder();
        sb.append("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n");
        sb.append("Độc lập - Tự do - Hạnh phúc\n\n");
        sb.append("HỢP ĐỒNG THI CÔNG SƠN SỬA & DỊCH VỤ DÂN DỤNG\n");
        sb.append("Mã đơn hàng: #").append(id).append("\n");
        sb.append("Thời gian lập: ")
                .append(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()))
                .append("\n\n");

        sb.append("THÔNG TIN CÁC BÊN:\n");
        sb.append("Bên A (Khách hàng): ").append(customerName).append("\n");
        sb.append("Số điện thoại: ").append(customerPhone).append("\n");
        sb.append("Địa điểm thi công: ")
                .append(booking.getAddress() != null ? booking.getAddress() : "Theo thông tin đăng ký").append("\n\n");

        sb.append("Bên B (Đơn vị thi công): CÔNG TY DỊCH VỤ SƠN SỬA 24/7\n");
        sb.append("Hotline hỗ trợ: 1900 1234 - 0355.880.362\n\n");

        sb.append("I. HIỆN TRẠNG KHẢO SÁT & YÊU CẦU CÔNG TRÌNH:\n");
        sb.append("- Mô tả ban đầu: ")
                .append(booking.getDescription() != null ? booking.getDescription() : "Khách hàng không ghi chú")
                .append("\n");
        if (!details.isEmpty()) {
            BookingDetail bd = details.get(0);
            if (bd.getSurveyNote() != null && !bd.getSurveyNote().isBlank()) {
                sb.append("- Ghi chú hiện trạng khảo sát: ").append(bd.getSurveyNote()).append("\n");
            }
            if (bd.getMaterialNote() != null && !bd.getMaterialNote().isBlank()) {
                sb.append("- Chủng loại vật tư đề xuất: ").append(bd.getMaterialNote()).append("\n");
            }
        }
        sb.append("\nII. GIÁ TRỊ HỢP ĐỒNG & PHƯƠNG THỨC THANH TOÁN:\n");
        sb.append("- Tổng chi phí thi công: ").append(nf.format(total)).append(" VNĐ\n");
        sb.append("- Số tiền đặt cọc (xác nhận đơn): ").append(nf.format(deposit)).append(" VNĐ\n");
        sb.append("- Số tiền còn lại (thanh toán sau nghiệm thu): ").append(nf.format(booking.getRemainingAmount()))
                .append(" VNĐ\n");
        sb.append("- Phương thức thanh toán: Chuyển khoản VietQR / Tiền mặt.\n\n");

        sb.append("III. QUY TRÌNH THI CÔNG & TIÊU CHUẨN KỸ THUẬT:\n");
        sb.append("1. Che chắn cẩn thận sàn nhà, nội thất và tài sản xung quanh khu vực thi công.\n");
        sb.append("2. Xử lý bề mặt: Sủi dơ, dặm vá bột trét tại các vị trí nứt vỡ, xả nhám phẳng mịn bề mặt.\n");
        sb.append("3. Thi công lớp sơn lót kháng kiềm / chống thấm chuyên dụng (01 lớp chuẩn).\n");
        sb.append("4. Thi công lớp sơn phủ hoàn thiện màu sắc theo đúng yêu cầu (02 lớp chuẩn kỹ thuật).\n");
        sb.append("5. Vệ sinh công nghiệp khu vực thi công và bàn giao mặt bằng sạch đẹp.\n\n");

        sb.append("IV. CHẾ ĐỘ BẢO HÀNH & CAM KẾT CHẤT LƯỢNG:\n");
        sb.append("- Cam kết 100% sử dụng vật tư sơn chính hãng, đúng chủng loại thỏa thuận.\n");
        sb.append("- Thời hạn bảo hành công trình: 12 tháng kể từ ngày ký biên bản nghiệm thu.\n");
        sb.append("- Điều kiện bảo hành: Khắc phục miễn phí các lỗi bong tróc, bay màu do kỹ thuật thi công.\n\n");

        sb.append("V. ĐIỀU KHOẢN KÝ KẾT:\n");
        sb.append("- Hợp đồng có hiệu lực kể từ khi Bên A thực hiện ký điện tử và đặt cọc thành công.\n");
        sb.append("- Bên B cam kết triển khai đúng tiến độ và nhân sự chuyên nghiệp sau khi xác nhận tiền cọc.");

        Contract contract = contractRepository.findByBookingId(id).orElseGet(() -> Contract.builder()
                .booking(booking)
                .contractCode("HD-" + id + "-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .customerSigned(false)
                .surveySigned(false)
                .adminSigned(false)
                .build());

        contract.setContent(sb.toString());
        contractRepository.save(contract);

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hợp đồng & Báo giá sẵn sàng ký #" + id)
                    .content("Admin đã lập hợp đồng chi tiết và báo giá cho đơn hàng #" + id
                            + ". Vui lòng vào ứng dụng xem nội dung và ký điện tử.")
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ResponseEntity.ok(Map.of("message", "Đã gửi báo giá và tạo hợp đồng cho khách ký"));
    }

    // ==================== PHÂN CÔNG ĐỘI THỢ (dùng khi cần gán lại)
    // ====================
    @PostMapping("/{id}/assign-team")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTeam(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Object teamIdObj = payload.get("teamId") != null ? payload.get("teamId") : payload.get("technicianId");
        if (teamIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu teamId hoặc technicianId"));
        }

        Long technicianId = Long.valueOf(teamIdObj.toString());
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null)
            return ResponseEntity.notFound().build();

        boolean canAssign = booking.getStatus() == BookingStatus.DEPOSIT_CONFIRMED
                || booking.getStatus() == BookingStatus.WORKER_REJECTED
                || booking.getStatus() == BookingStatus.ASSIGNED
                || booking.getStatus() == BookingStatus.CONTRACT_APPROVED
                || booking.getStatus() == BookingStatus.WAITING_CUSTOMER_SIGNATURE;

        if (!canAssign) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ được phân công thợ khi đơn hàng đã xác nhận cọc hoặc thợ từ chối cần gán lại."));
        }

        User technician = userRepository.findById(technicianId).orElse(null);
        if (technician == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Kỹ thuật viên không tồn tại"));
        }

        booking.setTechnician(technician);
        booking.setStatus(BookingStatus.ASSIGNED); // Đổi thành ASSIGNED thay vì CONTRACT_APPROVED

        bookingRepository.save(booking);

        notificationService.save(Notification.builder()
                .user(technician)
                .title("Phân công thi công #" + id)
                .content(String.format("Bạn đã được phân công thi công đơn hàng #%d.", id))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        return ResponseEntity.ok(Map.of("message", "Phân công đội thợ thành công"));
    }

    // ==================== THANH TOÁN NHÂN VIÊN ====================
    @PostMapping("/{id}/pay-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payStaff(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null)
            return ResponseEntity.notFound().build();

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        if (booking.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getTechnician())
                    .title("Xác nhận thanh toán #" + id)
                    .content(String.format("Chi phí thù lao cho đơn hàng #%d đã được quyết toán.", id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ResponseEntity.ok(Map.of("message", "Đã thanh toán thù lao cho nhân viên"));
    }

    // ==================== CÁC API CỦA ĐỘI THỢ ====================
    @PostMapping("/{id}/accept-job")
    public ResponseEntity<BookingDto> acceptJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(bookingService.acceptJob(id, principal.getName()));
    }

    @PostMapping("/{id}/reject-job")
    public ResponseEntity<BookingDto> rejectJob(
            @PathVariable Long id,
            @RequestBody(required = false) RejectJobDto dto,
            Principal principal) {
        String reason = dto != null ? dto.getReason() : null;
        return ResponseEntity.ok(bookingService.rejectJob(id, principal.getName(), reason));
    }

    @PostMapping("/{id}/reject-survey")
    @PreAuthorize("hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('ADMIN') or hasRole('TECHNICIAN')")
    public ResponseEntity<BookingDto> rejectSurveyJob(
            @PathVariable Long id,
            @RequestBody(required = false) RejectJobDto dto,
            Principal principal) {
        String reason = dto != null ? dto.getReason() : null;
        return ResponseEntity.ok(bookingService.rejectSurveyJob(id, principal.getName(), reason));
    }

    @PostMapping("/{id}/start-job")
    @PreAuthorize("hasRole('STAFF') or hasRole('TECHNICIAN')")
    public ResponseEntity<BookingDto> startJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(bookingService.startJob(id, principal.getName()));
    }

    @PostMapping("/{id}/complete-job")
    @PreAuthorize("hasRole('STAFF') or hasRole('TECHNICIAN')")
    public ResponseEntity<BookingDto> completeJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(bookingService.completeJob(id, principal.getName()));
    }

    private String mapBookingStatusToVietnamese(BookingStatus status) {
        return switch (status) {
            case PENDING -> "Đang chờ xử lý";
            case SURVEY_ASSIGNED -> "Đã phân công khảo sát";
            case SURVEY_REJECTED -> "Từ chối khảo sát";
            case WAITING_ADMIN_QUOTE -> "Chờ Admin gửi báo giá";
            case WAITING_CONTRACT_APPROVAL -> "Chờ duyệt hợp đồng (Cũ)";
            case WAITING_CUSTOMER_QUOTE_APPROVAL -> "Chờ khách hàng duyệt báo giá";
            case CUSTOMER_ACCEPTED_QUOTE -> "Khách hàng đã đồng ý báo giá";
            case WAITING_CUSTOMER_SIGNATURE -> "Chờ khách hàng ký hợp đồng";
            case WAITING_DEPOSIT -> "Chờ thanh toán cọc";
            case DEPOSIT_CONFIRMED -> "Đã thanh toán cọc";
            case CONTRACT_APPROVED -> "Đã duyệt hợp đồng";
            case ASSIGNED -> "Đã phân công kỹ thuật viên";
            case ACCEPTED -> "Kỹ thuật viên đã nhận việc";
            case PROCESSING -> "Đang thi công";
            case WORKER_COMPLETED -> "Thợ đã hoàn thành, chờ nghiệm thu";
            case COMPLETED -> "Đã hoàn thành";
            case CANCELLED -> "Đã hủy";
            default -> status.toString();
        };
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ADMIN"));
    }

}
