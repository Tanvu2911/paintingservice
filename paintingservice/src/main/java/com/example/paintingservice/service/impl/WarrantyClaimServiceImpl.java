package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.WarrantyClaimDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.WarrantyClaim;
import com.example.paintingservice.entity.WarrantyReport;
import com.example.paintingservice.enums.SalaryStatus;
import com.example.paintingservice.enums.WarrantyStatus;
import com.example.paintingservice.mapper.WarrantyClaimMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.SalaryHistoryRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.repository.WarrantyClaimRepository;
import com.example.paintingservice.service.WarrantyClaimService;
import com.example.paintingservice.service.WarrantyImageService;
import com.example.paintingservice.service.WarrantyNotificationService;
import com.example.paintingservice.service.WarrantyPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Điều phối viên chính cho vòng đời Phiếu Bảo Hành (Warranty Orchestration Facade).
 * Tuân thủ Single Responsibility Principle — chỉ điều phối trạng thái và ủy thác:
 * - {@link WarrantyNotificationService} — gửi toàn bộ thông báo đa kênh.
 * - {@link WarrantyImageService}        — upload ảnh lên Cloudinary.
 * - {@link WarrantyPaymentService}      — ghi nhận thanh toán thù lao & Payment.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class WarrantyClaimServiceImpl implements WarrantyClaimService {

    private final WarrantyClaimRepository warrantyClaimRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final SalaryHistoryRepository salaryHistoryRepository;
    private final StaffProfileRepository staffProfileRepository;

    // Delegated services (SRP)
    private final WarrantyNotificationService warrantyNotificationService;
    private final WarrantyImageService warrantyImageService;
    private final WarrantyPaymentService warrantyPaymentService;

    // ─── Private helpers ───────────────────────────────────────────────────────

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
        if (booking.getCustomer() != null) return booking.getCustomer();
        if (request != null && request.getCustomerId() != null) {
            return userRepository.findById(request.getCustomerId()).orElse(null);
        }
        return null;
    }

    private User resolveStaffUser(Long id) {
        return userRepository.findById(id)
                .orElseGet(() -> staffProfileRepository.findById(id)
                        .map(StaffProfile::getUser)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân sự #" + id)));
    }

    // ─── Queries (read-only) ──────────────────────────────────────────────────

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

    // ─── Commands ─────────────────────────────────────────────────────────────

    // 0. KHÁCH TẠO PHIẾU BẢO HÀNH
    @Override
    public WarrantyClaimDto createClaim(Long bookingId, WarrantyClaimDto request,
            List<MultipartFile> images, String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User resolvedCustomer = resolveCustomer(booking, request, username);
        if (resolvedCustomer == null) {
            throw new RuntimeException("Không tìm thấy tài khoản khách hàng để tạo yêu cầu bảo hành");
        }

        validateWarrantyPeriod(booking, bookingId);
        validateNoActiveClaim(bookingId);

        // Upload ảnh sự cố — ủy thác WarrantyImageService
        String uploadedUrls = warrantyImageService.uploadClaimImages(images, bookingId);
        String finalImageUrls = warrantyImageService.mergeImageUrls(request.getImageUrls(), uploadedUrls);

        String issueTitle = (request.getIssueTitle() != null && !request.getIssueTitle().isBlank())
                ? request.getIssueTitle().trim()
                : ("Yêu cầu bảo hành: " + (request.getIssueType() != null ? request.getIssueType() : "Sự cố sơn"));

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

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Gửi thông báo — ủy thác WarrantyNotificationService
        warrantyNotificationService.notifyClaimCreated(saved);
        log.info("Tạo phiếu bảo hành mới claimId={} bookingId={}", saved.getId(), bookingId);

        return mapToDtoWithSalaries(saved);
    }

    // 1. ADMIN GÁN GIÁM SÁT KHẢO SÁT
    @Override
    public WarrantyClaimDto assignSurveyor(Long claimId, Long surveyorId, String adminNote) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        User surveyor = resolveStaffUser(surveyorId);

        claim.setSurveyor(surveyor);
        claim.setStatus(WarrantyStatus.SURVEY_ASSIGNED);
        if (adminNote != null && !adminNote.isBlank()) {
            getOrCreateReport(claim).setAdminNote(adminNote.trim());
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifySurveyorAssigned(saved, surveyor, adminNote);
        return mapToDtoWithSalaries(saved);
    }

    // 1b. GIÁM SÁT TIẾP NHẬN VIỆC KHẢO SÁT
    @Override
    public WarrantyClaimDto surveyorAcceptJob(Long claimId, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (claim.getSurveyor() != null && !claim.getSurveyor().getUsername().equals(username)) {
            User currentUser = userRepository.findByUsername(username).orElse(null);
            boolean isAdmin = currentUser != null && currentUser.getRole() != null
                    && "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
            if (!isAdmin) {
                throw new RuntimeException("Bạn không được phân công làm Giám sát cho phiếu bảo hành này");
            }
        }

        claim.setStatus(WarrantyStatus.SURVEYOR_ACCEPTED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifySurveyorAcceptedJob(saved, claim.getSurveyor());
        log.info("Giám sát @{} đã tiếp nhận việc cho phiếu bảo hành #{}", username, claimId);
        return mapToDtoWithSalaries(saved);
    }

    // 1c. GIÁM SÁT TỪ CHỐI NHẬN VIỆC KHẢO SÁT
    @Override
    public WarrantyClaimDto surveyorReject(Long claimId, String reason, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (claim.getSurveyor() != null && !claim.getSurveyor().getUsername().equals(username)) {
            User currentUser = userRepository.findByUsername(username).orElse(null);
            boolean isAdmin = currentUser != null && currentUser.getRole() != null
                    && "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
            if (!isAdmin) {
                throw new RuntimeException("Bạn không được phân công cho phiếu bảo hành này");
            }
        }

        String surveyorName = claim.getSurveyor() != null ? claim.getSurveyor().getUsername() : username;
        String rejectReason = (reason != null && !reason.isBlank()) ? reason.trim() : "Lý do cá nhân / Bận lịch";

        WarrantyReport report = getOrCreateReport(claim);
        claim.setStatus(WarrantyStatus.SURVEYOR_REJECTED);
        report.setAdminNote(String.format("Giám sát @%s đã từ chối nhận việc (Lý do: %s). Vui lòng phân công Giám sát khác.",
                surveyorName, rejectReason));
        claim.setSurveyor(null);

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifySurveyorRejected(saved, surveyorName, rejectReason);
        log.info("Giám sát @{} đã từ chối nhận việc phiếu bảo hành #{}", surveyorName, claimId);
        return mapToDtoWithSalaries(saved);
    }


    // 1e. KHÁCH HÀNG CHỈNH SỬA YÊU CẦU BẢO HÀNH (trước khi Giám sát nhận việc)
    @Override
    public WarrantyClaimDto updateClaim(Long claimId, WarrantyClaimDto request,
            List<MultipartFile> newImages, String existingImageUrls, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (claim.getCustomer() != null && !claim.getCustomer().getUsername().equals(username)) {
            User currentUser = userRepository.findByUsername(username).orElse(null);
            boolean isAdmin = currentUser != null && currentUser.getRole() != null
                    && "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
            if (!isAdmin) {
                throw new RuntimeException("Bạn không có quyền chỉnh sửa phiếu bảo hành này");
            }
        }

        if (claim.getStatus() != WarrantyStatus.PENDING
                && claim.getStatus() != WarrantyStatus.SURVEY_ASSIGNED
                && claim.getStatus() != WarrantyStatus.SURVEYOR_REJECTED) {
            throw new RuntimeException("Không thể chỉnh sửa yêu cầu bảo hành sau khi Giám sát đã tiếp nhận việc hoặc đang xử lý.");
        }

        if (request.getIssueType() != null && !request.getIssueType().isBlank()) {
            claim.setIssueType(request.getIssueType().trim());
        }
        if (request.getIssueTitle() != null && !request.getIssueTitle().isBlank()) {
            claim.setIssueTitle(request.getIssueTitle().trim());
        } else if (request.getIssueType() != null) {
            claim.setIssueTitle("Yêu cầu bảo hành: " + request.getIssueType());
        }
        if (request.getDescription() != null) {
            claim.setDescription(request.getDescription().trim());
        }
        if (request.getPreferredDate() != null) {
            claim.setPreferredDate(request.getPreferredDate());
        }
        if (request.getPreferredTime() != null) {
            claim.setPreferredTime(request.getPreferredTime().trim());
        }

        String uploadedUrls = warrantyImageService.uploadClaimImages(newImages, claim.getBooking().getId());
        String finalImages = warrantyImageService.mergeImageUrls(existingImageUrls, uploadedUrls);
        if (finalImages != null) {
            claim.setImageUrls(finalImages);
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifyClaimUpdated(saved);
        log.info("Khách hàng @{} đã cập nhật phiếu bảo hành #{}", username, claimId);
        return mapToDtoWithSalaries(saved);
    }

    // 1f. KHÁCH HÀNG XÓA YÊU CẦU BẢO HÀNH (trước khi Giám sát nhận việc)
    @Override
    public void deleteClaim(Long claimId, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (claim.getCustomer() != null && !claim.getCustomer().getUsername().equals(username)) {
            User currentUser = userRepository.findByUsername(username).orElse(null);
            boolean isAdmin = currentUser != null && currentUser.getRole() != null
                    && "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
            if (!isAdmin) {
                throw new RuntimeException("Bạn không có quyền xóa phiếu bảo hành này");
            }
        }

        if (claim.getStatus() != WarrantyStatus.PENDING
                && claim.getStatus() != WarrantyStatus.SURVEY_ASSIGNED
                && claim.getStatus() != WarrantyStatus.SURVEYOR_REJECTED) {
            throw new RuntimeException("Không thể xóa yêu cầu bảo hành sau khi Giám sát đã tiếp nhận việc hoặc đang xử lý.");
        }

        List<SalaryHistory> salaries = salaryHistoryRepository.findByWarrantyClaimId(claimId);
        if (salaries != null && !salaries.isEmpty()) {
            salaryHistoryRepository.deleteAll(salaries);
        }

        warrantyNotificationService.notifyClaimDeleted(claim);
        warrantyClaimRepository.delete(claim);
        log.info("Khách hàng @{} đã xóa phiếu bảo hành #{}", username, claimId);
    }

    // 2. GIÁM SÁT GỬI BÁO CÁO KHẢO SÁT
    @Override
    public WarrantyClaimDto submitSurveyReport(Long claimId, String faultType, String surveyNote,
            String materialNote, BigDecimal suggestedPrice,
            List<MultipartFile> surveyImages, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        WarrantyReport report = getOrCreateReport(claim);

        // Upload ảnh khảo sát — ủy thác WarrantyImageService
        String uploadedUrls = warrantyImageService.uploadSurveyImages(surveyImages, claimId);
        report.setSurveyImages(warrantyImageService.mergeImageUrls(report.getSurveyImages(), uploadedUrls));

        report.setFaultType(faultType != null && !faultType.isBlank() ? faultType : "COMPANY_FAULT");
        report.setSurveyNote(surveyNote != null ? surveyNote.trim() : "");
        report.setMaterialNote(materialNote != null ? materialNote.trim() : "");
        report.setSuggestedPrice("COMPANY_FAULT".equalsIgnoreCase(report.getFaultType())
                ? BigDecimal.ZERO
                : (suggestedPrice != null ? suggestedPrice : BigDecimal.ZERO));

        claim.setStatus(WarrantyStatus.SURVEYED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifySurveyReportSubmitted(saved);
        return mapToDtoWithSalaries(saved);
    }

    // 3. ADMIN DUYỆT & GÁN ĐỘI THỢ KHẮC PHỤC
    @Override
    @Transactional
    public WarrantyClaimDto assignTechnician(Long claimId, Long technicianId, String adminNote, BigDecimal workerSalary) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        User technician = resolveStaffUser(technicianId);

        claim.setTechnician(technician);
        claim.setStatus(WarrantyStatus.ACCEPTED);
        if (adminNote != null && !adminNote.isBlank()) {
            getOrCreateReport(claim).setAdminNote(adminNote.trim());
        }

        if (workerSalary != null && workerSalary.compareTo(BigDecimal.ZERO) >= 0) {
            SalaryHistory sh = salaryHistoryRepository
                    .findByWarrantyClaimIdAndRoleInBooking(claim.getId(), "TECHNICIAN")
                    .orElse(null);
            if (sh == null) {
                sh = SalaryHistory.builder()
                        .booking(claim.getBooking())
                        .warrantyClaim(claim)
                        .worker(technician)
                        .roleInBooking("TECHNICIAN")
                        .amountEarned(workerSalary)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build();
            } else {
                sh.setWorker(technician);
                sh.setAmountEarned(workerSalary);
            }
            salaryHistoryRepository.save(sh);
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifyTechnicianAssigned(saved, technician, adminNote);
        return mapToDtoWithSalaries(saved);
    }

    @Override
    public WarrantyClaimDto assignTechnician(Long claimId, Long technicianId, String adminNote) {
        return assignTechnician(claimId, technicianId, adminNote, null);
    }

    @Override
    @Transactional
    public WarrantyClaimDto updateSalaries(Long claimId, BigDecimal workerSalary, BigDecimal surveyorSalary) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (workerSalary != null && workerSalary.compareTo(BigDecimal.ZERO) >= 0 && claim.getTechnician() != null) {
            SalaryHistory techSh = salaryHistoryRepository
                    .findByWarrantyClaimIdAndRoleInBooking(claim.getId(), "TECHNICIAN")
                    .orElse(null);
            if (techSh == null) {
                techSh = SalaryHistory.builder()
                        .booking(claim.getBooking())
                        .warrantyClaim(claim)
                        .worker(claim.getTechnician())
                        .roleInBooking("TECHNICIAN")
                        .amountEarned(workerSalary)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build();
            } else {
                techSh.setAmountEarned(workerSalary);
                techSh.setWorker(claim.getTechnician());
            }
            salaryHistoryRepository.save(techSh);
        }

        if (surveyorSalary != null && surveyorSalary.compareTo(BigDecimal.ZERO) >= 0 && claim.getSurveyor() != null) {
            SalaryHistory supSh = salaryHistoryRepository
                    .findByWarrantyClaimIdAndRoleInBooking(claim.getId(), "SURVEYOR")
                    .orElse(null);
            if (supSh == null) {
                supSh = SalaryHistory.builder()
                        .booking(claim.getBooking())
                        .warrantyClaim(claim)
                        .worker(claim.getSurveyor())
                        .roleInBooking("SURVEYOR")
                        .amountEarned(surveyorSalary)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build();
            } else {
                supSh.setAmountEarned(surveyorSalary);
                supSh.setWorker(claim.getSurveyor());
            }
            salaryHistoryRepository.save(supSh);
        }

        return mapToDtoWithSalaries(claim);
    }

    // 4. ADMIN TỪ CHỐI BẢO HÀNH & GỬI BÁO GIÁ HỖ TRỢ
    @Override
    public WarrantyClaimDto rejectWithSupportPrice(Long claimId, String adminNote, BigDecimal supportPrice) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        WarrantyReport report = getOrCreateReport(claim);

        claim.setStatus(WarrantyStatus.REJECTED);
        report.setAdminNote(adminNote != null ? adminNote.trim()
                : "Từ chối bảo hành do nguyên nhân khách quan ngoài phạm vi cam kết.");
        report.setFinalSupportPrice(supportPrice != null ? supportPrice : BigDecimal.ZERO);

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifySupportPriceRejected(saved, null);
        return mapToDtoWithSalaries(saved);
    }

    // 4b. KHÁCH HÀNG PHẢN HỒI BÁO GIÁ HỖ TRỢ
    @Override
    public WarrantyClaimDto respondToSupportOffer(Long claimId, Boolean accepted, LocalDate preferredDate,
            String preferredTime, String customerNote, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (claim.getCustomer() != null && !claim.getCustomer().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền thao tác trên phiếu bảo hành này");
        }

        BigDecimal finalPrice = (claim.getReport() != null && claim.getReport().getFinalSupportPrice() != null)
                ? claim.getReport().getFinalSupportPrice()
                : BigDecimal.ZERO;

        if (Boolean.TRUE.equals(accepted)) {
            claim.setStatus(WarrantyStatus.CUSTOMER_ACCEPTED_SUPPORT);
            if (preferredDate != null) claim.setPreferredDate(preferredDate);
            if (preferredTime != null && !preferredTime.isBlank()) claim.setPreferredTime(preferredTime);
            if (customerNote != null && !customerNote.isBlank()) {
                claim.setDescription(claim.getDescription() + "\n[Khách đồng ý sửa chữa hỗ trợ]: " + customerNote);
            }
            WarrantyClaim saved = warrantyClaimRepository.save(claim);
            warrantyNotificationService.notifyCustomerAgreedSupport(saved, finalPrice, customerNote);
            return mapToDtoWithSalaries(saved);
        } else {
            claim.setStatus(WarrantyStatus.CANCELLED);
            WarrantyClaim saved = warrantyClaimRepository.save(claim);
            warrantyNotificationService.notifySupportPriceRejected(saved, username);
            return mapToDtoWithSalaries(saved);
        }
    }

    // 5. THỢ BẮT ĐẦU THI CÔNG
    @Override
    public WarrantyClaimDto workerStart(Long claimId, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        claim.setStatus(WarrantyStatus.IN_PROGRESS);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifyWorkerStarted(saved);
        return mapToDtoWithSalaries(saved);
    }

    // 5b. THỢ TỪ CHỐI NHẬN VIỆC BẢO HÀNH
    @Override
    public WarrantyClaimDto technicianReject(Long claimId, String reason, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (claim.getTechnician() != null && !claim.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phân công cho phiếu bảo hành này");
        }

        String technicianName = claim.getTechnician() != null ? claim.getTechnician().getUsername() : username;
        String rejectReason   = (reason != null && !reason.isBlank()) ? reason.trim() : "Lý do cá nhân / Trùng lịch thi công";

        WarrantyReport report = getOrCreateReport(claim);
        claim.setStatus(WarrantyStatus.TECHNICIAN_REJECTED);
        report.setAdminNote(String.format("Thợ @%s đã từ chối nhận việc (Lý do: %s). Vui lòng phân công thợ khác.",
                technicianName, rejectReason));
        claim.setTechnician(null);

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifyTechnicianRejected(saved, technicianName, rejectReason);
        return mapToDtoWithSalaries(saved);
    }

    // 6. THỢ BÁO LÀM XONG
    @Override
    public WarrantyClaimDto workerComplete(Long claimId, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        claim.setStatus(WarrantyStatus.WORKER_COMPLETED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifyWorkerCompleted(saved);
        return mapToDtoWithSalaries(saved);
    }

    // 7. GIÁM SÁT NGHIỆM THU CÙNG KHÁCH HÀNG & GỬI ẢNH HOÀN TẤT
    @Override
    public WarrantyClaimDto supervisorAccept(Long claimId, String note,
            List<MultipartFile> resolvedImages, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        WarrantyReport report = getOrCreateReport(claim);

        // Upload ảnh hoàn tất — ủy thác WarrantyImageService
        String uploadedUrls = warrantyImageService.uploadResolvedImages(resolvedImages, claimId);
        report.setResolvedImageUrls(warrantyImageService.mergeImageUrls(report.getResolvedImageUrls(), uploadedUrls));

        report.setSupervisorAccepted(true);
        report.setCustomerAccepted(true);
        report.setResolvedAt(LocalDateTime.now());
        if (note != null && !note.isBlank()) report.setAdminNote(note);

        claim.setStatus(WarrantyStatus.COMPLETED);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifySupervisorAccepted(saved);
        return mapToDtoWithSalaries(saved);
    }

    // 8. ADMIN THANH TOÁN THÙ LAO
    @Override
    public WarrantyClaimDto payStaff(Long claimId, Long staffId, String role,
            BigDecimal amount, String adminUsername) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        // Ủy thác toàn bộ logic thanh toán & salary sang WarrantyPaymentService
        warrantyPaymentService.payStaff(claim, staffId, role, amount, adminUsername);
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        return mapToDtoWithSalaries(saved);
    }

    @Override
    public WarrantyClaimDto payWorker(Long claimId, BigDecimal amount, String adminUsername) {
        return payStaff(claimId, null, "TECHNICIAN", amount, adminUsername);
    }

    // 9. NGHIỆM THU HOÀN TẤT (backward compatible)
    @Override
    public WarrantyClaimDto completeClaim(Long claimId, String adminNote,
            List<MultipartFile> resolvedImages, String username) {
        return supervisorAccept(claimId, adminNote, resolvedImages, username);
    }

    // 9b. KHÁCH HÀNG THANH TOÁN PHÍ HỖ TRỢ
    @Override
    public WarrantyClaimDto customerPay(Long claimId, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);
        WarrantyReport report = getOrCreateReport(claim);

        report.setCustomerAccepted(true);
        if (claim.getStatus() == WarrantyStatus.WORKER_COMPLETED
                || Boolean.TRUE.equals(report.getSupervisorAccepted())) {
            claim.setStatus(WarrantyStatus.COMPLETED);
            if (report.getResolvedAt() == null) report.setResolvedAt(LocalDateTime.now());
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);

        // Ghi nhận Payment — ủy thác WarrantyPaymentService
        BigDecimal price = warrantyPaymentService.recordCustomerPayment(saved);
        warrantyNotificationService.notifyCustomerPaid(saved, price);

        return mapToDtoWithSalaries(saved);
    }

    // 10. CẬP NHẬT TRẠNG THÁI TỔNG QUÁT
    @Override
    public WarrantyClaimDto updateStatus(Long claimId, String statusStr, String adminNote,
            Long technicianId, String username) {
        WarrantyClaim claim = getClaimOrThrow(claimId);

        if (statusStr != null && !statusStr.isBlank()) {
            WarrantyStatus status = WarrantyStatus.valueOf(statusStr.toUpperCase());
            claim.setStatus(status);
            if (status == WarrantyStatus.COMPLETED) {
                getOrCreateReport(claim).setResolvedAt(LocalDateTime.now());
            }
        }
        if (adminNote != null) {
            getOrCreateReport(claim).setAdminNote(adminNote);
        }
        if (technicianId != null) {
            User tech = userRepository.findById(technicianId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thợ #" + technicianId));
            claim.setTechnician(tech);
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        warrantyNotificationService.notifyStatusUpdated(saved, adminNote);
        return mapToDtoWithSalaries(saved);
    }

    // ─── Private guard helpers ─────────────────────────────────────────────────

    private WarrantyClaim getClaimOrThrow(Long claimId) {
        return warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo hành #" + claimId));
    }

    private void validateWarrantyPeriod(Booking booking, Long bookingId) {
        int warrantyYears = (booking.getWarrantyYears() != null && booking.getWarrantyYears() > 0)
                ? booking.getWarrantyYears() : 2;

        LocalDate baseDate = booking.getCompletedAt() != null
                ? booking.getCompletedAt().toLocalDate()
                : (booking.getCreatedAt() != null ? booking.getCreatedAt().toLocalDate() : LocalDate.now());

        LocalDate expirationDate = baseDate.plusYears(warrantyYears);
        if (LocalDate.now().isAfter(expirationDate)) {
            throw new RuntimeException(String.format(
                    "Đơn hàng #%d đã hết hạn bảo hành vào ngày %s (thời hạn %d năm)",
                    bookingId, expirationDate, warrantyYears));
        }
    }

    private void validateNoActiveClaim(Long bookingId) {
        List<WarrantyClaim> existingClaims = warrantyClaimRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        boolean hasActive = existingClaims.stream()
                .anyMatch(c -> c.getStatus() != WarrantyStatus.COMPLETED
                        && c.getStatus() != WarrantyStatus.REJECTED
                        && c.getStatus() != WarrantyStatus.CANCELLED);
        if (hasActive) {
            throw new RuntimeException("Đơn hàng này đang có một yêu cầu bảo hành đang được xử lý. Vui lòng chờ hoàn tất.");
        }
    }
}
