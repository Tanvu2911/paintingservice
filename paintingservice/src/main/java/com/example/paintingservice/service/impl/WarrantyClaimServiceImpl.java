package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.WarrantyClaimDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.WarrantyClaim;
import com.example.paintingservice.entity.WarrantyReport;
import com.example.paintingservice.enums.SalaryStatus;
import com.example.paintingservice.enums.WarrantyStatus;
import com.example.paintingservice.mapper.WarrantyClaimMapper;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.SalaryHistoryRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.repository.WarrantyClaimRepository;
import com.example.paintingservice.service.CloudinaryService;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.WarrantyClaimService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class WarrantyClaimServiceImpl implements WarrantyClaimService {

    private final WarrantyClaimRepository warrantyClaimRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SalaryHistoryRepository salaryHistoryRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

    private WarrantyReport getOrCreateReport(WarrantyClaim claim) {
        WarrantyReport report = claim.getReport();
        if (report == null) {
            report = WarrantyReport.builder()
                    .claim(claim)
                    .supervisorAccepted(false)
                    .customerAccepted(false)
                    .build();
            claim.setReport(report);
        }
        return report;
    }

    private WarrantyClaimDto mapToDtoWithSalaries(WarrantyClaim claim) {
        if (claim == null) return null;
        List<SalaryHistory> salaries = salaryHistoryRepository.findByWarrantyClaimId(claim.getId());
        return WarrantyClaimMapper.toDto(claim, salaries);
    }

    private List<WarrantyClaimDto> mapToDtoListWithSalaries(List<WarrantyClaim> claims) {
        if (claims == null || claims.isEmpty()) return List.of();
        return claims.stream().map(this::mapToDtoWithSalaries).toList();
    }

    private User resolveCustomer(Booking booking, WarrantyClaimDto request, String username) {
        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) return user;
            try {
                user = userRepository.findById(Long.parseLong(username)).orElse(null);
                if (user != null) return user;
            } catch (NumberFormatException ignored) {
            }
        }
        if (booking.getCustomer() != null) {
            return booking.getCustomer();
        }
        if (request != null && request.getCustomerId() != null) {
            return userRepository.findById(request.getCustomerId()).orElse(null);
        }
        return null;
    }

    @Override
    public WarrantyClaimDto createClaim(
            Long bookingId,
            WarrantyClaimDto request,
            List<MultipartFile> images,
            String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        final User resolvedCustomer = resolveCustomer(booking, request, username);
        if (resolvedCustomer == null) {
            throw new RuntimeException("Không tìm thấy tài khoản khách hàng để tạo yêu cầu bảo hành");
        }

        // 1. Kiểm tra thời hạn bảo hành từ ngày nghiệm thu/hoàn thành đơn
        int warrantyYears = (booking.getWarrantyYears() != null && booking.getWarrantyYears() > 0)
                ? booking.getWarrantyYears()
                : 2;

        LocalDate baseDate = null;
        if (booking.getCompletedAt() != null) {
            baseDate = booking.getCompletedAt().toLocalDate();
        } else if (booking.getCreatedAt() != null) {
            baseDate = booking.getCreatedAt().toLocalDate();
        } else {
            baseDate = LocalDate.now();
        }

        LocalDate expirationDate = baseDate.plusYears(warrantyYears);
        if (LocalDate.now().isAfter(expirationDate)) {
            throw new RuntimeException(String.format(
                    "Đơn hàng #%d đã hết hạn bảo hành vào ngày %s (thời hạn %d năm)",
                    bookingId, expirationDate, warrantyYears));
        }

        // Kiểm tra xem có yêu cầu bảo hành nào đang được xử lý dở dang không
        List<WarrantyClaim> existingClaims = warrantyClaimRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        boolean hasActiveClaim = existingClaims.stream()
                .anyMatch(c -> c.getStatus() != WarrantyStatus.COMPLETED
                        && c.getStatus() != WarrantyStatus.REJECTED
                        && c.getStatus() != WarrantyStatus.CANCELLED);
        if (hasActiveClaim) {
            throw new RuntimeException("Đơn hàng này đang có một yêu cầu bảo hành đang được xử lý. Vui lòng chờ hoàn tất.");
        }

        // 2. Upload danh sách ảnh sự cố khách gửi lên Cloudinary
        List<String> uploadedUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = cloudinaryService.uploadImage(file, "warranty/claim-booking-" + bookingId);
                        uploadedUrls.add(url);
                    } catch (IOException e) {
                        log.error("Lỗi khi tải ảnh yêu cầu bảo hành: {}", e.getMessage());
                    }
                }
            }
        }

        String finalImageUrls = String.join(",", uploadedUrls);
        if (request.getImageUrls() != null && !request.getImageUrls().isBlank()) {
            if (!finalImageUrls.isBlank()) {
                finalImageUrls = request.getImageUrls() + "," + finalImageUrls;
            } else {
                finalImageUrls = request.getImageUrls();
            }
        }

        String issueTitle = (request.getIssueTitle() != null && !request.getIssueTitle().isBlank())
                ? request.getIssueTitle().trim()
                : ("Yêu cầu bảo hành: " + (request.getIssueType() != null ? request.getIssueType() : "Sự cố sơn"));

        // 3. Tạo Entity WarrantyClaim ở trạng thái PENDING
        WarrantyClaim claim = WarrantyClaim.builder()
                .booking(booking)
                .customer(resolvedCustomer)
                .issueType(request.getIssueType() != null ? request.getIssueType() : "KHAC")
                .issueTitle(issueTitle)
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .imageUrls(finalImageUrls)
                .preferredDate(request.getPreferredDate())
                .preferredTime(request.getPreferredTime())
                .status(WarrantyStatus.PENDING)
                .build();

        WarrantyClaim savedClaim = warrantyClaimRepository.save(claim);

        // 4. Bắn thông báo chuông cho toàn bộ Ban Quản Trị (ADMIN)
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Yêu cầu bảo hành mới #%d", bookingId))
                    .content(String.format(
                            "Khách hàng @%s vừa gửi yêu cầu bảo hành cho công trình #%d: \"%s\". Vui lòng phân công Giám sát khảo sát.",
                            finalCustomerUsername(resolvedCustomer),
                            bookingId,
                            issueTitle))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Bắn thông báo xác nhận cho Khách hàng
        notificationService.save(Notification.builder()
                .user(resolvedCustomer)
                .title(String.format("Đã tiếp nhận yêu cầu bảo hành #%d", bookingId))
                .content(String.format(
                        "Yêu cầu bảo hành công trình #%d đã được tiếp nhận. Đội ngũ kỹ thuật/giám sát sẽ liên hệ khảo sát trong 24-48h.",
                        bookingId))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        return mapToDtoWithSalaries(savedClaim);
    }

    private String finalCustomerUsername(User customer) {
        return customer != null ? customer.getUsername() : "khách hàng";
    }

    @Override
    @Transactional(readOnly = true)
    public WarrantyClaimDto getClaimById(Long id) {
        WarrantyClaim claim = warrantyClaimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + id));
        return mapToDtoWithSalaries(claim);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarrantyClaimDto> getClaimsByBooking(Long bookingId) {
        return mapToDtoListWithSalaries(warrantyClaimRepository.findByBookingIdOrderByCreatedAtDesc(bookingId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarrantyClaimDto> getMyClaims(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        return mapToDtoListWithSalaries(warrantyClaimRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarrantyClaimDto> getAllClaims() {
        return mapToDtoListWithSalaries(warrantyClaimRepository.findAllByOrderByCreatedAtDesc());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarrantyClaimDto> getClaimsBySurveyor(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        return mapToDtoListWithSalaries(warrantyClaimRepository.findBySurveyorIdOrderByCreatedAtDesc(user.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarrantyClaimDto> getClaimsByTechnician(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        return mapToDtoListWithSalaries(warrantyClaimRepository.findByTechnicianIdOrderByCreatedAtDesc(user.getId()));
    }

    // ==========================================
    // 1. ADMIN GÁN GIÁM SÁT KHẢO SÁT
    // ==========================================
    @Override
    public WarrantyClaimDto assignSurveyor(Long claimId, Long surveyorId, String adminNote) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        User surveyor = userRepository.findById(surveyorId)
                .orElseGet(() -> staffProfileRepository.findById(surveyorId)
                        .map(StaffProfile::getUser)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giám sát #" + surveyorId)));

        claim.setSurveyor(surveyor);
        claim.setStatus(WarrantyStatus.SURVEY_ASSIGNED);
        if (adminNote != null && !adminNote.isBlank()) {
            WarrantyReport report = getOrCreateReport(claim);
            report.setAdminNote(adminNote.trim());
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Bắn thông báo cho Giám sát
        notificationService.save(Notification.builder()
                .user(surveyor)
                .title(String.format("Phân công khảo sát bảo hành #%d", claim.getBooking().getId()))
                .content(String.format(
                        "Bạn được phân công đến khảo sát hiện trường bảo hành cho công trình #%d (%s) tại %s.",
                        claim.getBooking().getId(),
                        claim.getIssueTitle(),
                        claim.getBooking().getAddress()))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        // Bắn thông báo cho Khách hàng
        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Đã phân công Giám sát khảo sát bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Chuyên viên giám sát @%s (SĐT: %s) đã được phân công đến kiểm tra hiện trường công trình của bạn.",
                            surveyor.getUsername(),
                            surveyor.getPhoneNumber() != null ? surveyor.getPhoneNumber() : "Đang cập nhật"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 2. GIÁM SÁT GỬI BÁO CÁO KHẢO SÁT VỀ ADMIN
    // ==========================================
    @Override
    public WarrantyClaimDto submitSurveyReport(
            Long claimId,
            String faultType,
            String surveyNote,
            String materialNote,
            BigDecimal suggestedPrice,
            List<MultipartFile> surveyImages,
            String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        WarrantyReport report = getOrCreateReport(claim);

        // Upload ảnh khảo sát hiện trường lên Cloudinary
        List<String> uploadedUrls = new ArrayList<>();
        if (surveyImages != null && !surveyImages.isEmpty()) {
            for (MultipartFile file : surveyImages) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = cloudinaryService.uploadImage(file, "warranty/survey-claim-" + claimId);
                        uploadedUrls.add(url);
                    } catch (IOException e) {
                        log.error("Lỗi khi tải ảnh khảo sát bảo hành: {}", e.getMessage());
                    }
                }
            }
        }

        String surveyImagesStr = String.join(",", uploadedUrls);
        if (report.getSurveyImages() != null && !report.getSurveyImages().isBlank()) {
            if (!surveyImagesStr.isBlank()) {
                surveyImagesStr = report.getSurveyImages() + "," + surveyImagesStr;
            } else {
                surveyImagesStr = report.getSurveyImages();
            }
        }

        report.setFaultType(faultType != null && !faultType.isBlank() ? faultType : "COMPANY_FAULT");
        report.setSurveyNote(surveyNote != null ? surveyNote.trim() : "");
        report.setMaterialNote(materialNote != null ? materialNote.trim() : "");
        report.setSurveyImages(surveyImagesStr);

        if ("COMPANY_FAULT".equalsIgnoreCase(report.getFaultType())) {
            report.setSuggestedPrice(BigDecimal.ZERO);
        } else {
            report.setSuggestedPrice(suggestedPrice != null ? suggestedPrice : BigDecimal.ZERO);
        }

        claim.setStatus(WarrantyStatus.SURVEYED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        String faultTypeLabel = "COMPANY_FAULT".equalsIgnoreCase(report.getFaultType())
                ? "Lỗi kỹ thuật thi công bên mình (Bảo hành 0đ)"
                : "Lỗi khách quan ngoại lực (Đề xuất hỗ trợ)";

        // Báo Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Báo cáo khảo sát bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Giám sát đã nộp báo cáo khảo sát bảo hành cho đơn #%d. Kết luận: %s. Giá đề xuất: %s.",
                            claim.getBooking().getId(),
                            faultTypeLabel,
                            report.getSuggestedPrice() != null ? report.getSuggestedPrice() : "0đ"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Thông báo khách hàng
        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Đã có kết quả khảo sát bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Chuyên viên đã hoàn tất khảo sát hiện trường đơn #%d. Ban quản trị đang xử lý phương án khắc phục.",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 3. ADMIN DUYỆT & GÁN ĐỘI THỢ KHẮC PHỤC (ƯU TIÊN THỢ CŨ)
    // ==========================================
    @Override
    public WarrantyClaimDto assignTechnician(Long claimId, Long technicianId, String adminNote) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        User technician = userRepository.findById(technicianId)
                .orElseGet(() -> staffProfileRepository.findById(technicianId)
                        .map(StaffProfile::getUser)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy thợ #" + technicianId)));

        claim.setTechnician(technician);
        claim.setStatus(WarrantyStatus.ACCEPTED); // hoặc IN_PROGRESS khi thợ nhận việc
        if (adminNote != null && !adminNote.isBlank()) {
            WarrantyReport report = getOrCreateReport(claim);
            report.setAdminNote(adminNote.trim());
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Bắn thông báo cho Thợ
        String noteContent = (saved.getReport() != null && saved.getReport().getAdminNote() != null && !saved.getReport().getAdminNote().isBlank())
                ? saved.getReport().getAdminNote()
                : "Vật tư do Giám sát trực tiếp chuẩn bị, bạn đến kiểm tra và tiến hành thi công dặm vá.";

        notificationService.save(Notification.builder()
                .user(technician)
                .title(String.format("Giao việc xử lý bảo hành #%d", claim.getBooking().getId()))
                .content(String.format("Bạn được phân công khắc phục bảo hành cho công trình #%d tại %s. Dặn dò: %s",
                        claim.getBooking().getId(),
                        claim.getBooking().getAddress(),
                        noteContent))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        // Bắn thông báo cho Khách
        if (claim.getCustomer() != null) {
            String scheduleInfo = claim.getPreferredDate() != null
                    ? String.format(" theo lịch hẹn của bạn (%s %s)", claim.getPreferredDate(),
                            claim.getPreferredTime() != null ? claim.getPreferredTime() : "")
                    : "";

            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Đã phân công Đội thợ xử lý bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Đội thợ thi công @%s (SĐT: %s) đã được phân công khắc phục bảo hành công trình của bạn%s.",
                            technician.getUsername(),
                            technician.getPhoneNumber() != null ? technician.getPhoneNumber() : "Đang cập nhật",
                            scheduleInfo))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        // CẬP NHẬT THÔNG TIN CHO GIÁM SÁT
        if (claim.getSurveyor() != null) {
            String scheduleInfo = claim.getPreferredDate() != null
                    ? String.format(" (Lịch khách hẹn: %s %s)", claim.getPreferredDate(),
                            claim.getPreferredTime() != null ? claim.getPreferredTime() : "")
                    : "";

            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Cập nhật thợ thi công bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Admin đã phân công Đội thợ @%s (SĐT: %s) xử lý bảo hành đơn #%d tại %s%s. Vui lòng theo dõi và nghiệm thu hiện trường sau khi thợ hoàn thành.",
                            technician.getUsername(),
                            technician.getPhoneNumber() != null ? technician.getPhoneNumber() : "Đang cập nhật",
                            claim.getBooking().getId(),
                            claim.getBooking().getAddress(),
                            scheduleInfo))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 4. ADMIN TỪ CHỐI BẢO HÀNH & GỬI BÁO GIÁ GỢI Ý HỖ TRỢ
    // ==========================================
    @Override
    public WarrantyClaimDto rejectWithSupportPrice(Long claimId, String adminNote, BigDecimal supportPrice) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        WarrantyReport report = getOrCreateReport(claim);
        claim.setStatus(WarrantyStatus.REJECTED);
        report.setAdminNote(adminNote != null ? adminNote.trim()
                : "Từ chối bảo hành do nguyên nhân khách quan ngoài phạm vi cam kết.");
        report.setFinalSupportPrice(supportPrice != null ? supportPrice : BigDecimal.ZERO);

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Gửi thông báo đến khách hàng
        if (claim.getCustomer() != null) {
            String priceStr = report.getFinalSupportPrice() != null
                    && report.getFinalSupportPrice().compareTo(BigDecimal.ZERO) > 0
                            ? String.format(
                                    " Công ty gửi báo giá gợi ý hỗ trợ sửa chữa ưu đãi: %,.0f VNĐ. Vui lòng phản hồi Đồng ý hoặc Từ chối trên hệ thống.",
                                    report.getFinalSupportPrice())
                            : "";

            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Thông báo kết quả bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Yêu cầu bảo hành đơn #%d không thuộc phạm vi bảo hành miễn phí. Lý do: %s.%s",
                            claim.getBooking().getId(),
                            report.getAdminNote(),
                            priceStr))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 4b. KHÁCH HÀNG PHẢN HỒI ĐỒNG Ý HOẶC TỪ CHỐI BÁO GIÁ HỖ TRỢ
    // ==========================================
    @Override
    public WarrantyClaimDto respondToSupportOffer(Long claimId, Boolean accepted, LocalDate preferredDate,
            String preferredTime, String customerNote, String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        if (claim.getCustomer() != null && !claim.getCustomer().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền thao tác trên phiếu bảo hành này");
        }

        WarrantyReport report = claim.getReport();
        BigDecimal finalPrice = report != null && report.getFinalSupportPrice() != null ? report.getFinalSupportPrice() : BigDecimal.ZERO;

        if (Boolean.TRUE.equals(accepted)) {
            claim.setStatus(WarrantyStatus.CUSTOMER_ACCEPTED_SUPPORT);
            if (preferredDate != null) {
                claim.setPreferredDate(preferredDate);
            }
            if (preferredTime != null && !preferredTime.isBlank()) {
                claim.setPreferredTime(preferredTime);
            }
            if (customerNote != null && !customerNote.isBlank()) {
                claim.setDescription(claim.getDescription() + "\n[Khách đồng ý sửa chữa hỗ trợ]: " + customerNote);
            }

            WarrantyClaim saved = warrantyClaimRepository.save(claim);

            String scheduleStr = claim.getPreferredDate() != null
                    ? String.format(" (Lịch khách chọn: %s %s)", claim.getPreferredDate(),
                            claim.getPreferredTime() != null ? claim.getPreferredTime() : "")
                    : "";

            // Bắn thông báo cho Admin
            userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title(String.format("Khách hàng đã đồng ý giá hỗ trợ bảo hành #%d",
                                claim.getBooking().getId()))
                        .content(String.format(
                                "Khách hàng @%s đã đồng ý mức giá hỗ trợ %,.0f VNĐ cho đơn bảo hành #%d%s. Vui lòng phân công Đội thợ thi công.",
                                username,
                                finalPrice,
                                claim.getBooking().getId(),
                                scheduleStr))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            // Cập nhật thông tin cho Giám sát
            if (claim.getSurveyor() != null) {
                notificationService.save(Notification.builder()
                        .user(claim.getSurveyor())
                        .title(String.format("Khách hàng đồng ý sửa chữa hỗ trợ #%d", claim.getBooking().getId()))
                        .content(String.format(
                                "Khách hàng đơn #%d đã đồng ý phương án sửa chữa có hỗ trợ (%,.0f VNĐ)%s. Admin sẽ phân công Đội thợ và bạn sẽ nghiệm thu sau khi hoàn thiện.",
                                claim.getBooking().getId(),
                                finalPrice,
                                scheduleStr))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            return mapToDtoWithSalaries(saved);
        } else {
            claim.setStatus(WarrantyStatus.CANCELLED);
            WarrantyClaim saved = warrantyClaimRepository.save(claim);

            // Bắn thông báo cho Admin
            userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title(String.format("Khách hàng đã từ chối giá hỗ trợ #%d", claim.getBooking().getId()))
                        .content(String.format(
                                "Khách hàng @%s đã từ chối phương án sửa chữa có hỗ trợ cho đơn bảo hành #%d. Phiếu bảo hành đã được đóng.",
                                username,
                                claim.getBooking().getId()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            // Cập nhật thông tin cho Giám sát
            if (claim.getSurveyor() != null) {
                notificationService.save(Notification.builder()
                        .user(claim.getSurveyor())
                        .title(String.format("Khách từ chối sửa chữa hỗ trợ #%d", claim.getBooking().getId()))
                        .content(String.format(
                                "Khách hàng đơn #%d đã từ chối báo giá sửa chữa hỗ trợ. Phiếu bảo hành đã đóng.",
                                claim.getBooking().getId()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            return mapToDtoWithSalaries(saved);
        }
    }

    // ==========================================
    // 5. THỢ BẮT ĐẦU THI CÔNG
    // ==========================================
    @Override
    public WarrantyClaimDto workerStart(Long claimId, String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        claim.setStatus(WarrantyStatus.IN_PROGRESS);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Bắn thông báo cho Giám sát
        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Thợ đã bắt đầu thi công bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Đội thợ đã có mặt tại hiện trường công trình #%d và bắt đầu triển khai thi công khắc phục.",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 5b. THỢ TỪ CHỐI NHẬN VIỆC BẢO HÀNH (CHỜ ADMIN PHÂN THỢ KHÁC)
    // ==========================================
    @Override
    public WarrantyClaimDto technicianReject(Long claimId, String reason, String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        if (claim.getTechnician() != null && !claim.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phân công cho phiếu bảo hành này");
        }

        String technicianName = claim.getTechnician() != null ? claim.getTechnician().getUsername() : username;
        String rejectReason = (reason != null && !reason.isBlank()) ? reason.trim()
                : "Lý do cá nhân / Trùng lịch thi công";

        WarrantyReport report = getOrCreateReport(claim);
        claim.setStatus(WarrantyStatus.TECHNICIAN_REJECTED);
        report.setAdminNote(String.format("Thợ @%s đã từ chối nhận việc (Lý do: %s). Vui lòng phân công thợ khác.",
                technicianName, rejectReason));
        claim.setTechnician(null);

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Bắn thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Thợ từ chối nhận việc bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Thợ @%s đã từ chối nhận khắc phục bảo hành cho đơn #%d tại %s. Lý do: %s. Vui lòng phân công Đội thợ khác.",
                            technicianName,
                            claim.getBooking().getId(),
                            claim.getBooking().getAddress(),
                            rejectReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Bắn thông báo cập nhật cho Giám Sát
        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Thợ từ chối bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Thợ @%s đã từ chối nhận xử lý bảo hành đơn #%d (Lý do: %s). Admin đang phân công Thợ khác.",
                            technicianName,
                            claim.getBooking().getId(),
                            rejectReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 6. THỢ BÁO LÀM XONG (CHỜ GIÁM SÁT NGHIỆM THU)
    // ==========================================
    @Override
    public WarrantyClaimDto workerComplete(Long claimId, String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        claim.setStatus(WarrantyStatus.WORKER_COMPLETED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Bắn thông báo cho Giám sát đến hiện trường nghiệm thu
        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Cần nghiệm thu công trình bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Đội thợ đã hoàn thành khắc phục bảo hành cho đơn #%d. Bạn hãy đến hiện trường kiểm tra, chụp ảnh báo cáo nghiệm thu cùng khách hàng.",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        // Bắn thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Đội thợ đã báo làm xong bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Đội thợ đã hoàn thành khắc phục đơn #%d. Giám sát đang tiến hành nghiệm thu thực tế cùng khách hàng.",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 7. GIÁM SÁT NGHIỆM THU CÙNG KHÁCH HÀNG & GỬI ẢNH HOÀN TẤT
    // ==========================================
    @Override
    public WarrantyClaimDto supervisorAccept(Long claimId, String note, List<MultipartFile> resolvedImages,
            String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        WarrantyReport report = getOrCreateReport(claim);

        List<String> uploadedUrls = new ArrayList<>();
        if (resolvedImages != null && !resolvedImages.isEmpty()) {
            for (MultipartFile file : resolvedImages) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = cloudinaryService.uploadImage(file, "warranty/resolved-claim-" + claimId);
                        uploadedUrls.add(url);
                    } catch (IOException e) {
                        log.error("Lỗi khi tải ảnh hoàn tất bảo hành: {}", e.getMessage());
                    }
                }
            }
        }

        String resolvedImagesStr = String.join(",", uploadedUrls);
        if (report.getResolvedImageUrls() != null && !report.getResolvedImageUrls().isBlank()) {
            if (!resolvedImagesStr.isBlank()) {
                resolvedImagesStr = report.getResolvedImageUrls() + "," + resolvedImagesStr;
            } else {
                resolvedImagesStr = report.getResolvedImageUrls();
            }
        }

        report.setResolvedImageUrls(resolvedImagesStr);
        report.setSupervisorAccepted(true);
        report.setCustomerAccepted(true);
        report.setResolvedAt(LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            report.setAdminNote(note);
        }

        claim.setStatus(WarrantyStatus.COMPLETED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Bắn thông báo cho Admin biết để vào xem báo cáo và thanh toán công cho thợ
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Giám sát đã nghiệm thu hoàn tất bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Giám sát đã nghiệm thu chất lượng công trình bảo hành đơn #%d cùng khách hàng kèm ảnh hoàn thiện. Bạn có thể vào xem báo cáo và quyết toán tiền công cho thợ.",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Bắn thông báo hoàn tất cho khách
        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Nghiệm thu hoàn tất bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Công trình #%d đã được Giám sát nghiệm thu hoàn tất bảo hành cùng bạn. Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Sơn Sửa 247!",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    // ==========================================
    // 8. ADMIN QUYẾT TOÁN THANH TOÁN THÙ LAO CHO GIÁM SÁT HOẶC THỢ
    // ==========================================
    @Override
    public WarrantyClaimDto payStaff(Long claimId, Long staffId, String role, BigDecimal amount, String adminUsername) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        boolean isSurveyor = "SURVEYOR".equalsIgnoreCase(role);
        User staff;

        if (isSurveyor) {
            staff = claim.getSurveyor();
            if (staff == null) {
                throw new RuntimeException("Phiếu bảo hành chưa được gán Giám Sát!");
            }
            BigDecimal payAmount = (amount != null && amount.compareTo(BigDecimal.ZERO) > 0)
                    ? amount
                    : new BigDecimal("100000"); // Mặc định 100.000 VNĐ cho Giám sát

            SalaryHistory sh = salaryHistoryRepository
                    .findByWarrantyClaimIdAndRoleInBooking(claim.getId(), "SURVEYOR")
                    .orElse(null);

            if (sh == null) {
                sh = SalaryHistory.builder()
                        .booking(claim.getBooking())
                        .warrantyClaim(claim)
                        .worker(staff)
                        .roleInBooking("SURVEYOR")
                        .amountEarned(payAmount)
                        .paymentStatus(SalaryStatus.PAID)
                        .calculatedAt(LocalDateTime.now())
                        .paidAt(LocalDateTime.now())
                        .build();
            } else {
                sh.setWorker(staff);
                sh.setAmountEarned(payAmount);
                sh.setPaymentStatus(SalaryStatus.PAID);
                sh.setPaidAt(LocalDateTime.now());
            }
            salaryHistoryRepository.save(sh);

            notificationService.save(Notification.builder()
                    .user(staff)
                    .title(String.format("Đã nhận thù lao bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Admin đã thanh toán thù lao khảo sát & nghiệm thu bảo hành %,.0f VNĐ cho đơn #%d vào ví thu nhập của bạn.",
                            payAmount, claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        } else {
            staff = claim.getTechnician();
            if (staff == null) {
                throw new RuntimeException("Phiếu bảo hành chưa được gán Đội Thợ!");
            }
            BigDecimal payAmount = (amount != null && amount.compareTo(BigDecimal.ZERO) > 0)
                    ? amount
                    : new BigDecimal("200000"); // Mặc định 200.000 VNĐ cho Thợ thi công

            SalaryHistory sh = salaryHistoryRepository
                    .findByWarrantyClaimIdAndRoleInBooking(claim.getId(), "TECHNICIAN")
                    .orElse(null);

            if (sh == null) {
                sh = SalaryHistory.builder()
                        .booking(claim.getBooking())
                        .warrantyClaim(claim)
                        .worker(staff)
                        .roleInBooking("TECHNICIAN")
                        .amountEarned(payAmount)
                        .paymentStatus(SalaryStatus.PAID)
                        .calculatedAt(LocalDateTime.now())
                        .paidAt(LocalDateTime.now())
                        .build();
            } else {
                sh.setWorker(staff);
                sh.setAmountEarned(payAmount);
                sh.setPaymentStatus(SalaryStatus.PAID);
                sh.setPaidAt(LocalDateTime.now());
            }
            salaryHistoryRepository.save(sh);

            notificationService.save(Notification.builder()
                    .user(staff)
                    .title(String.format("Đã nhận thù lao thi công bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format(
                            "Admin đã quyết toán tiền công khắc phục bảo hành %,.0f VNĐ cho đơn #%d vào ví thu nhập của bạn.",
                            payAmount, claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        return mapToDtoWithSalaries(saved);
    }

    @Override
    public WarrantyClaimDto payWorker(Long claimId, BigDecimal amount, String adminUsername) {
        return payStaff(claimId, null, "TECHNICIAN", amount, adminUsername);
    }

    // ==========================================
    // 9. NGHIỆM THU HOÀN TẤT (BACKWARD COMPATIBLE)
    // ==========================================
    @Override
    public WarrantyClaimDto completeClaim(Long claimId, String adminNote, List<MultipartFile> resolvedImages,
            String username) {
        return supervisorAccept(claimId, adminNote, resolvedImages, username);
    }

    @Override
    public WarrantyClaimDto updateStatus(
            Long claimId,
            String statusStr,
            String adminNote,
            Long technicianId,
            String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        if (statusStr != null && !statusStr.isBlank()) {
            WarrantyStatus status = WarrantyStatus.valueOf(statusStr.toUpperCase());
            claim.setStatus(status);
            if (status == WarrantyStatus.COMPLETED) {
                WarrantyReport report = getOrCreateReport(claim);
                report.setResolvedAt(LocalDateTime.now());
            }
        }

        if (adminNote != null) {
            WarrantyReport report = getOrCreateReport(claim);
            report.setAdminNote(adminNote);
        }

        if (technicianId != null) {
            User tech = userRepository.findById(technicianId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thợ #" + technicianId));
            claim.setTechnician(tech);
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        if (claim.getCustomer() != null) {
            String statusVN = switch (saved.getStatus()) {
                case SURVEY_ASSIGNED -> "Đã phân công Giám sát khảo sát hiện trường";
                case SURVEYED -> "Giám sát đã nộp báo cáo khảo sát hiện trường";
                case ACCEPTED -> "Đã tiếp nhận & phân công thợ khắc phục";
                case IN_PROGRESS -> "Đang trong quá trình xử lý khắc phục";
                case COMPLETED -> "Đã hoàn tất khắc phục bảo hành";
                case REJECTED -> "Đã từ chối bảo hành";
                default -> "Đang xử lý";
            };

            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Cập nhật phiếu bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format("Phiếu yêu cầu bảo hành của bạn hiện ở trạng thái: %s.%s",
                            statusVN,
                            adminNote != null && !adminNote.isBlank() ? " Ghi chú: " + adminNote : ""))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }

    @Override
    public WarrantyClaimDto customerPay(Long claimId, String username) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));

        WarrantyReport report = getOrCreateReport(claim);
        report.setCustomerAccepted(true);
        if (claim.getStatus() == WarrantyStatus.WORKER_COMPLETED || Boolean.TRUE.equals(report.getSupervisorAccepted())) {
            claim.setStatus(WarrantyStatus.COMPLETED);
            if (report.getResolvedAt() == null) {
                report.setResolvedAt(LocalDateTime.now());
            }
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        BigDecimal price = report.getFinalSupportPrice() != null ? report.getFinalSupportPrice() : BigDecimal.ZERO;

        // Lưu bản ghi Payment ở trạng thái FULLY_PAID
        if (price.compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = Payment.builder()
                    .booking(claim.getBooking())
                    .amount(price)
                    .paymentMethod("VNPAY_SANDBOX")
                    .paymentType("WARRANTY_SUPPORT")
                    .paymentStatus(PaymentStatus.FULLY_PAID)
                    .transactionCode("VNP_BH_" + claim.getId() + "_" + claim.getBooking().getId())
                    .paidAt(LocalDateTime.now())
                    .note(String.format("Khách hàng thanh toán phí hỗ trợ sửa chữa bảo hành #%d", claim.getId()))
                    .build();
            paymentRepository.save(payment);
        }

        // Bắn thông báo cho Admin & Thợ
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Khách hàng đã thanh toán phí bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format("Khách hàng đã thanh toán số tiền %,.0f VNĐ cho phiếu bảo hành đơn #%d.",
                            price,
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (claim.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getTechnician())
                    .title(String.format("Khách đã thanh toán phí bảo hành #%d", claim.getBooking().getId()))
                    .content(String.format("Khách hàng đã thanh toán phí bảo hành cho đơn #%d. Admin sẽ tiến hành quyết toán thù lao cho bạn.",
                            claim.getBooking().getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return mapToDtoWithSalaries(saved);
    }
}
