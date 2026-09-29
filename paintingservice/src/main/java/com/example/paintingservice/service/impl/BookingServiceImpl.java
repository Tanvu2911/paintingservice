package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.*;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.BookingMapper;
import com.example.paintingservice.repository.*;
import com.example.paintingservice.service.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Điều phối viên chính cho thực thể Đơn hàng (Booking Orchestration Facade).
 * Tuân thủ Single Responsibility Principle:
 * - Điều phối vòng đời Đơn hàng & Quản lý giao dịch (@Transactional).
 * - Ủy thác thuật toán phân công nhân sự sang {@link BookingDispatchService}.
 * - Ủy thác thông báo đa kênh sang {@link BookingNotificationService}.
 * - Ủy thác sinh văn bản hợp đồng sang {@link ContractGenerationService}.
 */
@Service
@Slf4j
public class BookingServiceImpl extends BaseServiceImpl<Booking, Long> implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final PaymentRepository paymentRepository;
    private final BookingDispatchService bookingDispatchService;
    private final BookingNotificationService bookingNotificationService;
    private final ContractGenerationService contractGenerationService;
    private final CloudinaryService cloudinaryService;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ContractRepository contractRepository,
            BookingDetailRepository bookingDetailRepository,
            PaymentRepository paymentRepository,
            BookingDispatchService bookingDispatchService,
            BookingNotificationService bookingNotificationService,
            ContractGenerationService contractGenerationService,
            CloudinaryService cloudinaryService) {
        super(bookingRepository);
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.contractRepository = contractRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.paymentRepository = paymentRepository;
        this.bookingDispatchService = bookingDispatchService;
        this.bookingNotificationService = bookingNotificationService;
        this.contractGenerationService = contractGenerationService;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto createBooking(BookingDto dto, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        if (!isAdmin && currentUser != null && !currentUser.getId().equals(dto.getCustomerId())) {
            throw new RuntimeException("Bạn không có quyền tạo đơn hàng cho tài khoản khác");
        }

        Booking entity = BookingMapper.toEntity(dto);

        // Tự động phân công Giám sát viên phù hợp nhất (Smart Auto-Dispatch)
        User autoSupervisor = bookingDispatchService.autoAssignSupervisor(entity);

        if (autoSupervisor != null) {
            entity.setSurveyor(autoSupervisor);
            entity.setStatus(BookingStatus.SURVEY_ASSIGNED);
        } else if (entity.getStatus() == null) {
            entity.setStatus(BookingStatus.PENDING);
        }

        Booking saved = bookingRepository.save(entity);

        // Gửi thông báo sự kiện tạo đơn
        bookingNotificationService.notifyBookingCreated(saved, autoSupervisor);

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto updateBooking(Long id, BookingDto dto, String currentUsername) {
        Booking old = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        User currentUser = userRepository.findByUsername(currentUsername)
                .or(() -> userRepository.findByEmailIgnoreCase(currentUsername))
                .orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        boolean isCustomer = currentUser != null && old.getCustomer() != null && (
                old.getCustomer().getId().equals(currentUser.getId())
                || (old.getCustomer().getUsername() != null && old.getCustomer().getUsername().equalsIgnoreCase(currentUser.getUsername()))
                || (old.getCustomer().getEmail() != null && old.getCustomer().getEmail().equalsIgnoreCase(currentUser.getEmail()))
        );

        boolean isSurveyor = currentUser != null && old.getSurveyor() != null && (
                old.getSurveyor().getId().equals(currentUser.getId())
                || (old.getSurveyor().getUsername() != null && old.getSurveyor().getUsername().equalsIgnoreCase(currentUser.getUsername()))
                || (old.getSurveyor().getEmail() != null && old.getSurveyor().getEmail().equalsIgnoreCase(currentUser.getEmail()))
        );

        if (!isAdmin) {
            if (!isCustomer && !isSurveyor) {
                throw new SecurityException("Bạn không có quyền cập nhật đơn hàng này");
            }

            // Bảo vệ các trường tài chính: phi-Admin không được sửa
            dto.setTotalAmount(old.getTotalAmount());
            dto.setDepositAmount(old.getDepositAmount());
            dto.setRemainingAmount(old.getRemainingAmount());
            dto.setSurveyFee(old.getSurveyFee());
            dto.setPaymentStatus(old.getPaymentStatus());

            // Bảo vệ thông tin phân công nhân sự
            dto.setCustomerId(old.getCustomer() != null ? old.getCustomer().getId() : null);
            dto.setSurveyorId(old.getSurveyor() != null ? old.getSurveyor().getId() : null);
            dto.setSupervisorId(old.getSurveyor() != null ? old.getSurveyor().getId() : null);
            dto.setTechnicianId(old.getTechnician() != null ? old.getTechnician().getId() : null);
            dto.setPreferredSupervisorId(
                    old.getPreferredSupervisor() != null ? old.getPreferredSupervisor().getId() : null);

            // Cho phép khách hàng chọn Đội thợ ưu tiên khi duyệt báo giá (khi thợ chưa được
            // gán chính thức)
            if (isCustomer && old.getTechnician() == null) {
                // Giữ nguyên dto.getPreferredTechnicianId() do khách chọn
            } else {
                dto.setPreferredTechnicianId(
                        old.getPreferredTechnician() != null ? old.getPreferredTechnician().getId() : null);
            }

            // Kiểm soát chuyển trạng thái: chỉ cho phép hủy đơn hợp lệ
            if (dto.getStatus() != null && dto.getStatus() != old.getStatus()) {
                if (dto.getStatus() == BookingStatus.CANCELLED) {
                    boolean customerCanCancel = isCustomer && (old.getStatus() == BookingStatus.PENDING
                            || old.getStatus() == BookingStatus.SURVEY_ASSIGNED
                            || old.getStatus() == BookingStatus.SURVEY_REJECTED
                            || old.getStatus() == BookingStatus.ACCEPTED);
                    boolean surveyorCanCancel = isSurveyor && old.getStatus() == BookingStatus.SURVEY_ASSIGNED;
                    if (!customerCanCancel && !surveyorCanCancel) {
                        throw new RuntimeException(
                                "Không thể hủy đơn hàng ở trạng thái hiện tại (" + old.getStatus() + ")");
                    }
                } else {
                    dto.setStatus(old.getStatus());
                }
            } else {
                dto.setStatus(old.getStatus());
            }
        }

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
        Booking updated = bookingRepository.save(old);

        // Gửi thông báo cập nhật đơn hàng
        bookingNotificationService.notifyBookingUpdated(old, dto, currentUsername, statusChanged, detailsChanged,
                technicianChanged);

        return BookingMapper.toDto(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBooking(Long id, String currentUsername) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        if (!isAdmin) {
            throw new SecurityException("Chỉ Quản trị viên (Admin) mới có quyền xóa đơn hàng");
        }

        bookingNotificationService.notifyBookingDeleted(booking, currentUsername);

        bookingRepository.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto assignSupervisor(Long bookingId, Long supervisorUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        boolean canChangeSupervisor = booking.getStatus() == BookingStatus.PENDING
                || booking.getStatus() == BookingStatus.SURVEY_ASSIGNED
                || booking.getStatus() == BookingStatus.ACCEPTED;

        if (!canChangeSupervisor) {
            throw new RuntimeException(
                    "Giám sát đã hoàn thành khảo sát và gửi báo cáo cho Admin. Không thể thay đổi giám sát viên nữa.");
        }

        User supervisor = userRepository.findById(supervisorUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giám sát viên #" + supervisorUserId));

        User previousSupervisor = booking.getSurveyor();

        booking.setSurveyor(supervisor);
        booking.setStatus(BookingStatus.SURVEY_ASSIGNED);
        Booking saved = bookingRepository.save(booking);

        bookingNotificationService.notifySupervisorAssigned(booking, supervisor, previousSupervisor);

        return BookingMapper.toDto(saved);
    }

    @Override
    public List<Booking> findAllBySurveyor_Id(Long surveyorId) {
        return bookingRepository.findAllBySurveyor_Id(surveyorId);
    }

    @Override
    public List<Booking> findSurveyJobsForStaff(Long staffId) {
        return bookingRepository.findSurveyJobsForStaff(staffId);
    }

    @Override
    public List<Booking> findAllOrderByIdDesc() {
        return bookingRepository.findAllOrderByIdDesc();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> sendQuote(Long id, Map<String, Object> payload) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        boolean isFirstQuote = booking.getStatus() == BookingStatus.WAITING_ADMIN_QUOTE;
        boolean isReQuote = booking.getStatus() == BookingStatus.WAITING_CUSTOMER_SIGNATURE;

        if (!isFirstQuote && !isReQuote) {
            throw new RuntimeException("Đơn hàng không ở trạng thái có thể gửi/cập nhật báo giá");
        }

        if (payload.get("totalAmount") == null || payload.get("totalAmount").toString().isBlank()) {
            throw new RuntimeException("Thiếu thông tin tổng báo giá");
        }

        BigDecimal total = new BigDecimal(payload.get("totalAmount").toString());
        BigDecimal deposit;
        if (payload.get("depositAmount") != null && !payload.get("depositAmount").toString().isBlank()) {
            deposit = new BigDecimal(payload.get("depositAmount").toString());
        } else {
            deposit = total.multiply(AppConstants.DEPOSIT_RATE).setScale(0, RoundingMode.HALF_UP);
        }

        if (total.compareTo(BigDecimal.ZERO) <= 0 || deposit.compareTo(BigDecimal.ZERO) < 0
                || deposit.compareTo(total) > 0) {
            throw new RuntimeException("Số tiền báo giá không hợp lệ");
        }

        Integer estimatedDays = 3;
        if (payload.get("estimatedDays") != null && !payload.get("estimatedDays").toString().isBlank()) {
            try {
                estimatedDays = Integer.parseInt(payload.get("estimatedDays").toString());
            } catch (Exception ignored) {
            }
        }
        Integer warrantyYears = 2;
        if (payload.get("warrantyYears") != null && !payload.get("warrantyYears").toString().isBlank()) {
            try {
                warrantyYears = Integer.parseInt(payload.get("warrantyYears").toString());
            } catch (Exception ignored) {
            }
        }

        booking.setTotalAmount(total);
        booking.setDepositAmount(deposit);
        booking.setRemainingAmount(total.subtract(deposit));
        booking.setEstimatedDays(estimatedDays);
        booking.setWarrantyYears(warrantyYears);
        booking.setPaymentStatus(PaymentStatus.UNPAID);
        booking.setStatus(BookingStatus.WAITING_CUSTOMER_SIGNATURE);

        // Lưu vết lịch sử thương lượng qua ContractGenerationService
        String updatedDescription = contractGenerationService.archiveNegotiationToDescription(booking.getDescription(),
                total);
        booking.setDescription(updatedDescription);

        bookingRepository.save(booking);

        List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(id);

        // Tạo văn bản hợp đồng thông qua ContractGenerationService
        String contractText = contractGenerationService.generateContractContent(booking, total, deposit, estimatedDays,
                warrantyYears, details);

        Contract contract = contractRepository.findByBookingId(id).orElseGet(() -> Contract.builder()
                .booking(booking)
                .contractCode("HD-" + id + "-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .customerSigned(false)
                .adminSigned(false)
                .build());

        // Reset customer signature if re-quoting after negotiation
        if (isReQuote) {
            contract.setCustomerSigned(false);
            contract.setCustomerSignedAt(null);
            contract.setCustomerSignatureImg(null);
        }

        // Hướng 3: Admin ký duyệt hợp đồng trước khi gửi báo giá cho khách (Pre-signed
        // contract)
        String adminSignature = payload.get("adminSignatureImg") != null
                ? payload.get("adminSignatureImg").toString()
                : (payload.get("adminSignature") != null ? payload.get("adminSignature").toString() : null);

        if (adminSignature != null && !adminSignature.isBlank()) {
            String uploadedUrl;
            if (adminSignature.startsWith("http://") || adminSignature.startsWith("https://")) {
                uploadedUrl = adminSignature;
            } else {
                String folder = AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + booking.getId();
                uploadedUrl = cloudinaryService.uploadBase64(adminSignature, folder);
            }
            contract.setAdminSignatureImg(uploadedUrl);
            contract.setAdminSigned(true);
            contract.setAdminSignedAt(LocalDateTime.now());
        } else if (contract.getAdminSignatureImg() != null && !contract.getAdminSignatureImg().isBlank()) {
            contract.setAdminSigned(true);
            if (contract.getAdminSignedAt() == null) {
                contract.setAdminSignedAt(LocalDateTime.now());
            }
        }

        contract.setContent(contractText);
        contractRepository.save(contract);

        bookingNotificationService.notifyQuoteSent(booking, total, isReQuote);

        String msg = isReQuote ? "Đã cập nhật báo giá mới và thông báo cho khách hàng"
                : "Đã gửi báo giá và tạo hợp đồng cho khách ký";
        return Map.of("message", msg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> confirmDeposit(Long id, Map<String, String> payload) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        Contract contract = contractRepository.findByBookingId(id).orElseGet(() -> Contract.builder()
                .booking(booking)
                .contractCode("HD-" + id + "-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .customerSigned(true)
                .build());

        String signature = payload != null
                ? (payload.get("adminSignatureImg") != null ? payload.get("adminSignatureImg")
                        : payload.get("adminSignature"))
                : null;
        contract.setAdminSigned(true);
        if (contract.getAdminSignedAt() == null) {
            contract.setAdminSignedAt(LocalDateTime.now());
        }
        if (signature != null && !signature.isBlank()) {
            String signatureUrl;
            if (signature.startsWith("http://") || signature.startsWith("https://")) {
                signatureUrl = signature;
            } else {
                signatureUrl = cloudinaryService.uploadBase64(
                        signature,
                        AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + booking.getId());
            }
            contract.setAdminSignatureImg(signatureUrl);
        }
        contractRepository.save(contract);

        booking.setStatus(BookingStatus.DEPOSIT_CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        bookingRepository.save(booking);

        List<Payment> payments = paymentRepository.findAllByBooking_IdOrderByIdDesc(booking.getId());
        boolean hasDepositPayment = false;
        for (Payment p : payments) {
            if ("DEPOSIT".equalsIgnoreCase(p.getPaymentType())) {
                p.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                p.setPaidAt(LocalDateTime.now());
                paymentRepository.save(p);
                hasDepositPayment = true;
            }
        }

        if (!hasDepositPayment) {
            BigDecimal depositAmount = booking.getDepositAmount() != null
                    && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                            ? booking.getDepositAmount()
                            : (booking.getTotalAmount() != null
                                    ? booking.getTotalAmount().multiply(AppConstants.DEPOSIT_RATE)
                                    : BigDecimal.ZERO);
            Payment newPayment = Payment.builder()
                    .booking(booking)
                    .amount(depositAmount)
                    .paymentMethod("VNPAY_SANDBOX")
                    .paymentType("DEPOSIT")
                    .paymentStatus(PaymentStatus.DEPOSIT_PAID)
                    .transactionCode("VNPAY-CONFIRMED-" + booking.getId() + "-" + System.currentTimeMillis())
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(newPayment);
        }

        // Tự động phân công thợ thi công thông minh qua BookingDispatchService
        User autoWorker = bookingDispatchService.handleWorkerAutoAssignmentAfterDeposit(booking);

        bookingNotificationService.notifyDepositConfirmed(booking, autoWorker);

        String successMessage = autoWorker != null
                ? String.format("Đã xác nhận tiền cọc, Admin ký hợp đồng & tự động phân công đội thợ @%s thành công!",
                        autoWorker.getUsername())
                : "Đã xác nhận tiền cọc và Admin đã ký duyệt hợp đồng thành công!";

        return Map.of(
                "message", successMessage,
                "bookingStatus", booking.getStatus(),
                "adminSigned", true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> assignTeam(Long id, Long technicianId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        if (booking.getStatus() == BookingStatus.PROCESSING ||
                booking.getStatus() == BookingStatus.WORKER_COMPLETED ||
                booking.getStatus() == BookingStatus.WAITING_FINAL_PAYMENT ||
                booking.getStatus() == BookingStatus.COMPLETED ||
                booking.getStatus() == BookingStatus.PAID_TO_STAFF) {
            throw new RuntimeException(
                    "Công trình đã bắt đầu thi công hoặc đã hoàn thành, không thể thay đổi đội thợ!");
        }

        Contract contract = contractRepository.findByBookingId(id).orElse(null);
        if (contract == null || !Boolean.TRUE.equals(contract.getAdminSigned())) {
            throw new RuntimeException(
                    "Admin chưa ký hợp đồng! Vui lòng ký duyệt hợp đồng và xác nhận cọc trước khi phân công đội thợ thi công.");
        }

        if (!Boolean.TRUE.equals(contract.getCustomerSigned())) {
            throw new RuntimeException("Khách hàng chưa ký hợp đồng! Chưa thể phân công thợ thi công.");
        }

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Kỹ thuật viên không tồn tại #" + technicianId));

        booking.setTechnician(technician);
        booking.setStatus(BookingStatus.ASSIGNED);
        bookingRepository.save(booking);

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);

        bookingNotificationService.notifyTeamAssigned(booking, technician, workerFee);

        return Map.of("message", "Phân công đội thợ thành công");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto acceptJob(Long bookingId, String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equalsIgnoreCase(username)) {
            throw new RuntimeException("Bạn không có quyền nhận đơn này");
        }

        if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED
                && booking.getStatus() != BookingStatus.ASSIGNED
                && booking.getStatus() != BookingStatus.DEPOSIT_CONFIRMED) {
            throw new RuntimeException("Đơn không ở trạng thái chờ nhận (hiện tại: " + booking.getStatus() + ")");
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        Booking saved = bookingRepository.save(booking);

        bookingNotificationService.notifyJobAccepted(booking, username);

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto rejectJob(Long bookingId, String username, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));

        User currentUser = userRepository.findByUsername(username).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        boolean isAssignedTechnician = booking.getTechnician() != null && booking.getTechnician().getUsername() != null
                && booking.getTechnician().getUsername().equalsIgnoreCase(username);

        if (!isAdmin && !isAssignedTechnician) {
            throw new RuntimeException("Bạn không có quyền từ chối đơn này");
        }

        if (booking.getStatus() == BookingStatus.PROCESSING
                || booking.getStatus() == BookingStatus.WORKER_COMPLETED
                || booking.getStatus() == BookingStatus.WAITING_FINAL_PAYMENT
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.PAID_TO_STAFF
                || booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.WORKER_REJECTED) {
            throw new RuntimeException(
                    "Chỉ được từ chối khi đơn chưa bắt đầu thi công (hiện tại: " + booking.getStatus() + ")");
        }

        String rejectReason = (reason != null && !reason.isBlank()) ? reason.trim() : "Không ghi rõ lý do";
        String description = booking.getDescription() == null ? "" : booking.getDescription();
        booking.setDescription(description + "\n[Thợ từ chối - "
                + (currentUser != null ? currentUser.getUsername() : username) + "]: " + rejectReason);

        User rejectingWorker = booking.getTechnician() != null ? booking.getTechnician() : currentUser;

        // Tự động phân công lại cho Đội thợ khác (Smart Auto-Redispatch)
        bookingDispatchService.reassignTechnicianAfterRejection(booking, rejectingWorker, rejectReason);

        Booking saved = bookingRepository.findById(bookingId).orElse(booking);
        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto startJob(Long id, String username) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phép thao tác");
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Đơn chưa ở trạng thái đã nhận việc");
        }

        booking.setStatus(BookingStatus.PROCESSING);
        Booking savedBooking = bookingRepository.save(booking);

        bookingNotificationService.notifyJobStarted(booking, username);

        return BookingMapper.toDto(savedBooking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto completeJob(Long id, String username) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phép thao tác");
        }

        if (booking.getStatus() != BookingStatus.PROCESSING) {
            throw new RuntimeException("Đơn chưa ở trạng thái đang thi công");
        }

        booking.setStatus(BookingStatus.WORKER_COMPLETED);
        Booking savedBooking = bookingRepository.save(booking);

        bookingNotificationService.notifyJobCompleted(savedBooking, username);

        return BookingMapper.toDto(savedBooking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto rejectSurveyJob(Long bookingId, String username, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Vui lòng nhập lý do từ chối");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền từ chối đơn này");
        }

        if (booking.getStatus() != BookingStatus.SURVEY_ASSIGNED) {
            throw new RuntimeException(
                    "Đơn không ở trạng thái có thể từ chối nhận khảo sát (hiện tại: " + booking.getStatus() + ")");
        }

        String rejectNote = String.format(
                "\n[Từ chối nhận khảo sát - %s bởi %s]: %s",
                LocalDateTime.now().toLocalDate(),
                currentUser.getUsername(),
                reason.trim());
        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + rejectNote);

        // Tự động phân công lại cho Giám sát viên khác (Smart Auto-Redispatch)
        bookingDispatchService.reassignSupervisorAfterRejection(booking, currentUser, reason.trim());

        Booking saved = bookingRepository.findById(bookingId).orElse(booking);
        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto rejectQuote(Long bookingId, String username, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        boolean isAdmin = currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));
        boolean isCustomer = booking.getCustomer() != null
                && booking.getCustomer().getId().equals(currentUser.getId());

        if (!isAdmin && !isCustomer) {
            throw new RuntimeException("Bạn không có quyền từ chối báo giá cho đơn hàng này");
        }

        if (booking.getStatus() != BookingStatus.WAITING_CUSTOMER_SIGNATURE
                && booking.getStatus() != BookingStatus.WAITING_ADMIN_QUOTE
                && booking.getStatus() != BookingStatus.WAITING_CUSTOMER_QUOTE_APPROVAL
                && booking.getStatus() != BookingStatus.CUSTOMER_ACCEPTED_QUOTE
                && booking.getStatus() != BookingStatus.WAITING_DEPOSIT) {
            throw new RuntimeException(
                    "Đơn không ở trạng thái có thể từ chối báo giá (Trạng thái hiện tại: " + booking.getStatus() + ")");
        }

        String finalReason = (reason != null && !reason.isBlank()) ? reason.trim()
                : "Khách hàng không đồng ý với phương án/báo giá";

        String rejectNote = String.format(
                "\n[Khách hàng từ chối báo giá - %s bởi %s]: %s",
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()),
                currentUser.getUsername(),
                finalReason);

        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + rejectNote);
        booking.setStatus(BookingStatus.CANCELLED);

        Booking saved = bookingRepository.save(booking);

        bookingNotificationService.notifyQuoteRejected(saved, username, reason, isAdmin);

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto cancelSurvey(Long bookingId, String username, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User currentUser = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmailIgnoreCase(username))
                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + username));

        boolean isAdmin = currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        boolean isCustomer = booking.getCustomer() != null && (
                booking.getCustomer().getId().equals(currentUser.getId())
                || (booking.getCustomer().getUsername() != null && booking.getCustomer().getUsername().equalsIgnoreCase(currentUser.getUsername()))
                || (booking.getCustomer().getEmail() != null && booking.getCustomer().getEmail().equalsIgnoreCase(currentUser.getEmail()))
        );

        if (!isAdmin && !isCustomer) {
            throw new RuntimeException("Bạn không có quyền hủy yêu cầu khảo sát cho đơn hàng này");
        }

        // Chỉ cho phép hủy khi chuyên viên khảo sát chưa nộp báo cáo
        // Các trạng thái trước khi nộp báo cáo: PENDING, SURVEY_ASSIGNED, SURVEY_REJECTED, ACCEPTED
        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.SURVEY_ASSIGNED
                && booking.getStatus() != BookingStatus.SURVEY_REJECTED
                && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Không thể hủy yêu cầu do chuyên viên khảo sát đã hoàn tất nộp báo cáo hiện trường. Bạn có thể kiểm tra dự toán và từ chối báo giá sau khi nhận được thông báo.");
        }

        String finalReason = (reason != null && !reason.isBlank()) ? reason.trim()
                : "Khách hàng không còn nhu cầu khảo sát";

        String cancelNote = String.format(
                "\n[Khách hàng hủy khảo sát - %s bởi %s]: %s",
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()),
                currentUser.getUsername(),
                finalReason);

        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + cancelNote);
        booking.setStatus(BookingStatus.CANCELLED);

        Booking saved = bookingRepository.save(booking);

        bookingNotificationService.notifySurveyCancelled(saved, username, finalReason);

        return BookingMapper.toDto(saved);
    }

    @Override
    public User autoAssignTechnician(Booking booking) {
        return bookingDispatchService.autoAssignTechnician(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User handleWorkerAutoAssignmentAfterDeposit(Booking booking) {
        return bookingDispatchService.handleWorkerAutoAssignmentAfterDeposit(booking);
    }
}
