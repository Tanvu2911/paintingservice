package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.*;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.BookingMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.repository.BookingDetailRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.BookingServiceItemRepository;
import com.example.paintingservice.repository.ServiceEntityRepository;
import com.example.paintingservice.repository.SalaryHistoryRepository;
import com.example.paintingservice.repository.DailyReportRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.BookingService;
import com.example.paintingservice.service.BookingDispatchService;
import com.example.paintingservice.service.BookingNotificationService;
import com.example.paintingservice.service.ContractGenerationService;
import com.example.paintingservice.service.CloudinaryService;
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
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceEntityRepository serviceEntityRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ContractRepository contractRepository,
            BookingDetailRepository bookingDetailRepository,
            PaymentRepository paymentRepository,
            BookingDispatchService bookingDispatchService,
            BookingNotificationService bookingNotificationService,
            ContractGenerationService contractGenerationService,
            CloudinaryService cloudinaryService,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceEntityRepository serviceEntityRepository) {
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
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.serviceEntityRepository = serviceEntityRepository;
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

        // Lưu danh sách các dịch vụ chọn trong đơn & thợ phân công tương ứng (Quan hệ N - N)
        List<BookingServiceItem> items = new ArrayList<>();
        if (dto.getBookingServices() != null && !dto.getBookingServices().isEmpty()) {
            for (com.example.paintingservice.dto.BookingServiceItemDto itemDto : dto.getBookingServices()) {
                if (itemDto.getServiceId() != null) {
                    ServiceEntity se = serviceEntityRepository.findById(itemDto.getServiceId()).orElse(null);
                    if (se != null) {
                        User tech = null;
                        if (itemDto.getTechnicianId() != null) {
                            tech = userRepository.findById(itemDto.getTechnicianId()).orElse(null);
                        }
                        BookingServiceItem item = BookingServiceItem.builder()
                                .booking(entity)
                                .service(se)
                                .technician(tech)
                                .price(se.getBasePrice() != null ? se.getBasePrice() : BigDecimal.ZERO)
                                .estimatedArea(itemDto.getEstimatedArea())
                                .note(itemDto.getNote())
                                .build();
                        items.add(item);
                    }
                }
            }
        } else {
            List<Long> sIds = dto.getServiceIds();
            if (sIds == null || sIds.isEmpty()) {
                if (dto.getServiceId() != null) {
                    sIds = List.of(dto.getServiceId());
                }
            }
            if (sIds != null && !sIds.isEmpty()) {
                List<ServiceEntity> services = serviceEntityRepository.findAllById(sIds);
                User prefTech = dto.getPreferredTechnicianId() != null
                        ? userRepository.findById(dto.getPreferredTechnicianId()).orElse(null)
                        : null;
                for (ServiceEntity se : services) {
                    BookingServiceItem item = BookingServiceItem.builder()
                            .booking(entity)
                            .service(se)
                            .technician(prefTech)
                            .price(se.getBasePrice() != null ? se.getBasePrice() : BigDecimal.ZERO)
                            .build();
                    items.add(item);
                }
            }
        }

        if (!items.isEmpty()) {
            // Gán preferredTechnician hoặc technician cho đơn nếu có thợ được chọn
            User firstTech = items.stream().map(BookingServiceItem::getTechnician).filter(Objects::nonNull).findFirst().orElse(null);
            if (firstTech != null) {
                if (entity.getTechnician() == null) {
                    entity.setTechnician(firstTech);
                }
                if (entity.getPreferredTechnician() == null) {
                    entity.setPreferredTechnician(firstTech);
                }
            }
            entity.setBookingServices(items);
        }

        // Tự động phân công Giám sát viên phù hợp nhất (Smart Auto-Dispatch)
        User autoSupervisor = bookingDispatchService.autoAssignSupervisor(entity);

        if (autoSupervisor != null) {
            entity.setSurveyor(autoSupervisor);
            entity.setStatus(BookingStatus.SURVEY_ASSIGNED);
        } else if (entity.getStatus() == null) {
            entity.setStatus(BookingStatus.PENDING);
        }

        Booking saved = bookingRepository.save(entity);
        if (!items.isEmpty()) {
            for (BookingServiceItem item : items) {
                item.setBooking(saved);
            }
            List<BookingServiceItem> savedItems = bookingServiceItemRepository.saveAll(items);
            // Cập nhật collection in-place để tránh orphanRemoval error
            saved.getBookingServices().clear();
            saved.getBookingServices().addAll(savedItems);
        }

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
                !Objects.equals(old.getDescription(), dto.getDescription());

        dto.setId(id);
        BookingMapper.updateEntity(dto, old);

        // Cập nhật phân công đội thợ cho từng gói dịch vụ nếu có truyền kèm
        if (dto.getBookingServices() != null && !dto.getBookingServices().isEmpty()) {
            for (com.example.paintingservice.dto.BookingServiceItemDto itemDto : dto.getBookingServices()) {
                if (itemDto.getId() != null) {
                    BookingServiceItem existing = bookingServiceItemRepository.findById(itemDto.getId()).orElse(null);
                    if (existing != null && existing.getBooking() != null && existing.getBooking().getId().equals(id)) {
                        if (itemDto.getTechnicianId() != null) {
                            User tech = userRepository.findById(itemDto.getTechnicianId()).orElse(null);
                            existing.setTechnician(tech);
                        }
                        if (itemDto.getEstimatedArea() != null) existing.setEstimatedArea(itemDto.getEstimatedArea());
                        if (itemDto.getPrice() != null) existing.setPrice(itemDto.getPrice());
                        if (itemDto.getNote() != null) existing.setNote(itemDto.getNote());
                        bookingServiceItemRepository.save(existing);
                    }
                } else if (itemDto.getServiceId() != null && old.getBookingServices() != null) {
                    for (BookingServiceItem existing : old.getBookingServices()) {
                        if (existing.getService() != null && existing.getService().getId().equals(itemDto.getServiceId())) {
                            if (itemDto.getTechnicianId() != null) {
                                User tech = userRepository.findById(itemDto.getTechnicianId()).orElse(null);
                                existing.setTechnician(tech);
                            }
                            bookingServiceItemRepository.save(existing);
                            break;
                        }
                    }
                }
            }
        }

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

        // Cập nhật chi tiết dự toán cho từng loại dịch vụ nếu có
        Object serviceItemsObj = payload.get("serviceItems");
        if (serviceItemsObj instanceof List<?> itemList && !itemList.isEmpty()) {
            for (Object obj : itemList) {
                if (obj instanceof Map<?, ?> itemMap) {
                    Object itemIdObj = itemMap.get("id");
                    if (itemIdObj != null) {
                        Long itemId = Long.valueOf(itemIdObj.toString());
                        BigDecimal itemPrice = null;
                        if (itemMap.get("price") != null && !itemMap.get("price").toString().isBlank()) {
                            itemPrice = new BigDecimal(itemMap.get("price").toString());
                        }

                        // Cập nhật trực tiếp trên items trong collection bookingServices của booking
                        if (booking.getBookingServices() != null) {
                            for (BookingServiceItem bi : booking.getBookingServices()) {
                                if (bi.getId() != null && bi.getId().equals(itemId)) {
                                    if (itemPrice != null) {
                                        bi.setPrice(itemPrice);
                                    }
                                }
                            }
                        }

                        // Cập nhật qua repository (bỏ qua item đã bị hủy)
                        BookingServiceItem item = bookingServiceItemRepository.findById(itemId).orElse(null);
                        if (item != null && item.getBooking().getId().equals(id)
                                && !Boolean.TRUE.equals(item.getCancelled())) {
                            if (itemPrice != null) {
                                item.setPrice(itemPrice);
                            }
                            bookingServiceItemRepository.save(item);
                        }
                    }
                }
            }
        }

        // Nếu chỉ còn 1 dịch vụ chưa hủy và chưa có giá, gán giá bằng total
        List<BookingServiceItem> activeServiceItems = booking.getBookingServices() != null
                ? booking.getBookingServices().stream()
                    .filter(i -> !Boolean.TRUE.equals(i.getCancelled()))
                    .collect(java.util.stream.Collectors.toList())
                : java.util.List.of();

        if (activeServiceItems.size() == 1) {
            BookingServiceItem onlyItem = activeServiceItems.get(0);
            if (onlyItem.getPrice() == null || onlyItem.getPrice().compareTo(BigDecimal.ZERO) == 0) {
                onlyItem.setPrice(total);
            }
        }

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
        // Khởi tạo lazy collection bookingServices trước khi save để tránh orphanRemoval error
        if (booking.getBookingServices() != null) {
            booking.getBookingServices().size(); // force init PersistentBag
        }
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

        // Đồng bộ luôn cho các hạng mục dịch vụ chưa có thợ thi công
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findAllByBookingIdWithDetails(id);
        if (serviceItems != null && !serviceItems.isEmpty()) {
            boolean hasChanged = false;
            for (BookingServiceItem item : serviceItems) {
                if (item.getTechnician() == null) {
                    item.setTechnician(technician);
                    hasChanged = true;
                }
            }
            if (hasChanged) {
                bookingServiceItemRepository.saveAll(serviceItems);
            }
        }

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);

        bookingNotificationService.notifyTeamAssigned(booking, technician, workerFee);

        return Map.of("message", "Phân công đội thợ thành công");
    }

    private boolean isAssignedTechnician(Booking booking, String username) {
        if (booking.getTechnician() != null && booking.getTechnician().getUsername() != null
                && booking.getTechnician().getUsername().equalsIgnoreCase(username)) {
            return true;
        }
        if (booking.getPreferredTechnician() != null && booking.getPreferredTechnician().getUsername() != null
                && booking.getPreferredTechnician().getUsername().equalsIgnoreCase(username)) {
            return true;
        }
        if (booking.getBookingServices() != null) {
            for (BookingServiceItem item : booking.getBookingServices()) {
                if (item.getTechnician() != null && item.getTechnician().getUsername() != null
                        && item.getTechnician().getUsername().equalsIgnoreCase(username)) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto acceptJob(Long bookingId, String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!isAssignedTechnician(booking, username)) {
            throw new RuntimeException("Bạn không có quyền nhận đơn này");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.WORKER_REJECTED
                || booking.getStatus() == BookingStatus.PAID_TO_STAFF) {
            throw new RuntimeException("Đơn không ở trạng thái có thể nhận việc (hiện tại: " + booking.getStatus() + ")");
        }

        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(bookingId);
        boolean hasSpecificMatch = false;
        if (!serviceItems.isEmpty()) {
            for (BookingServiceItem item : serviceItems) {
                if (item.getTechnician() != null && item.getTechnician().getUsername() != null
                        && item.getTechnician().getUsername().equalsIgnoreCase(username)) {
                    item.setTechnicianAccepted(true);
                    item.setTechnicianAcceptedAt(LocalDateTime.now());
                    bookingServiceItemRepository.save(item);
                    hasSpecificMatch = true;
                }
            }
            if (!hasSpecificMatch) {
                for (BookingServiceItem item : serviceItems) {
                    item.setTechnicianAccepted(true);
                    item.setTechnicianAcceptedAt(LocalDateTime.now());
                    bookingServiceItemRepository.save(item);
                }
            }
        }

        // Cập nhật booking status: nếu đơn đang ở ASSIGNED hoặc CONTRACT_APPROVED hoặc DEPOSIT_CONFIRMED
        if (booking.getStatus() == BookingStatus.CONTRACT_APPROVED
                || booking.getStatus() == BookingStatus.ASSIGNED
                || booking.getStatus() == BookingStatus.DEPOSIT_CONFIRMED) {
            booking.setStatus(BookingStatus.ACCEPTED);
        }
        // Nếu booking đã là PROCESSING (vì đội thợ khác đã bắt đầu làm trước), giữ nguyên PROCESSING

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

        boolean isAssigned = isAssignedTechnician(booking, username);

        if (!isAdmin && !isAssigned) {
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

        if (!isAssignedTechnician(booking, username)) {
            throw new RuntimeException("Bạn không được phép thao tác");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.WORKER_REJECTED
                || booking.getStatus() == BookingStatus.PAID_TO_STAFF) {
            throw new RuntimeException("Đơn không ở trạng thái có thể bắt đầu thi công (hiện tại: " + booking.getStatus() + ")");
        }

        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(id);
        boolean hasSpecificMatch = false;
        if (!serviceItems.isEmpty()) {
            for (BookingServiceItem item : serviceItems) {
                if (item.getTechnician() != null && item.getTechnician().getUsername() != null
                        && item.getTechnician().getUsername().equalsIgnoreCase(username)) {
                    item.setTechnicianAccepted(true);
                    if (item.getTechnicianAcceptedAt() == null) {
                        item.setTechnicianAcceptedAt(LocalDateTime.now());
                    }
                    item.setTechnicianStarted(true);
                    item.setTechnicianStartedAt(LocalDateTime.now());
                    bookingServiceItemRepository.save(item);
                    hasSpecificMatch = true;
                }
            }
            if (!hasSpecificMatch) {
                for (BookingServiceItem item : serviceItems) {
                    item.setTechnicianAccepted(true);
                    if (item.getTechnicianAcceptedAt() == null) {
                        item.setTechnicianAcceptedAt(LocalDateTime.now());
                    }
                    item.setTechnicianStarted(true);
                    item.setTechnicianStartedAt(LocalDateTime.now());
                    bookingServiceItemRepository.save(item);
                }
            }
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

        if (!isAssignedTechnician(booking, username)) {
            throw new RuntimeException("Bạn không được phép thao tác");
        }

        if (booking.getStatus() != BookingStatus.PROCESSING && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Đơn chưa ở trạng thái đang thi công");
        }

        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(id);
        if (!serviceItems.isEmpty()) {
            boolean hasSpecificMatch = false;
            for (BookingServiceItem item : serviceItems) {
                if (item.getTechnician() != null && item.getTechnician().getUsername() != null
                        && item.getTechnician().getUsername().equalsIgnoreCase(username)) {
                    item.setTechnicianCompleted(true);
                    item.setTechnicianCompletedAt(java.time.LocalDateTime.now());
                    bookingServiceItemRepository.save(item);
                    hasSpecificMatch = true;
                }
            }
            // Nếu không có item nào gán riêng cho thợ này (thợ chính nhận chung cả đơn)
            if (!hasSpecificMatch) {
                for (BookingServiceItem item : serviceItems) {
                    item.setTechnicianCompleted(true);
                    item.setTechnicianCompletedAt(java.time.LocalDateTime.now());
                    bookingServiceItemRepository.save(item);
                }
            }

            // Kiểm tra xem tất cả items đã hoàn thành chưa
            boolean allCompleted = serviceItems.stream().allMatch(i -> Boolean.TRUE.equals(i.getTechnicianCompleted()));
            if (allCompleted) {
                booking.setStatus(BookingStatus.WORKER_COMPLETED);
                Booking savedBooking = bookingRepository.save(booking);
                bookingNotificationService.notifyJobCompleted(savedBooking, username);
                return BookingMapper.toDto(savedBooking);
            } else {
                booking.setStatus(BookingStatus.PROCESSING);
                Booking savedBooking = bookingRepository.save(booking);
                bookingNotificationService.notifyJobCompleted(savedBooking, username);
                return BookingMapper.toDto(savedBooking);
            }
        }

        booking.setStatus(BookingStatus.WORKER_COMPLETED);
        Booking savedBooking = bookingRepository.save(booking);

        bookingNotificationService.notifyJobCompleted(savedBooking, username);

        return BookingMapper.toDto(savedBooking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto completeServiceItem(Long bookingId, Long serviceItemId, String username, String note) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        BookingServiceItem item = bookingServiceItemRepository.findById(serviceItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hạng mục dịch vụ #" + serviceItemId));

        if (!item.getBooking().getId().equals(bookingId)) {
            throw new RuntimeException("Hạng mục không thuộc đơn hàng này");
        }

        User currentUser = userRepository.findByUsername(username).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        boolean isAssignedWorker = item.getTechnician() != null && item.getTechnician().getUsername() != null
                && item.getTechnician().getUsername().equalsIgnoreCase(username);
        boolean isMainWorker = booking.getTechnician() != null && booking.getTechnician().getUsername() != null
                && booking.getTechnician().getUsername().equalsIgnoreCase(username);

        if (!isAdmin && !isAssignedWorker && !isMainWorker) {
            throw new RuntimeException("Bạn không có quyền báo hoàn thành cho hạng mục này");
        }

        if (booking.getStatus() != BookingStatus.PROCESSING && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Đơn hàng chưa ở giai đoạn thi công (hiện tại: " + booking.getStatus() + ")");
        }

        if (booking.getStatus() == BookingStatus.ACCEPTED) {
            booking.setStatus(BookingStatus.PROCESSING);
        }

        item.setTechnicianCompleted(true);
        item.setTechnicianCompletedAt(java.time.LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            item.setTechnicianNote(note.trim());
        }
        bookingServiceItemRepository.save(item);

        List<BookingServiceItem> allItems = bookingServiceItemRepository.findByBookingId(bookingId);
        boolean allCompleted = allItems.stream().allMatch(i -> Boolean.TRUE.equals(i.getTechnicianCompleted()));

        if (allCompleted) {
            booking.setStatus(BookingStatus.WORKER_COMPLETED);
            Booking saved = bookingRepository.save(booking);
            bookingNotificationService.notifyJobCompleted(saved, username);
            return BookingMapper.toDto(saved);
        } else {
            Booking saved = bookingRepository.save(booking);
            String serviceName = item.getService() != null ? item.getService().getName() : "Hạng mục";
            bookingNotificationService.notifyServiceItemCompleted(saved, username, serviceName);
            return BookingMapper.toDto(saved);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto supervisorAcceptServiceItem(Long bookingId, Long serviceItemId, String username, String note) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        BookingServiceItem item = bookingServiceItemRepository.findById(serviceItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hạng mục dịch vụ #" + serviceItemId));

        if (!item.getBooking().getId().equals(bookingId)) {
            throw new RuntimeException("Hạng mục không thuộc đơn hàng này");
        }

        User currentUser = userRepository.findByUsername(username).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        boolean isAssignedSupervisor = booking.getSurveyor() != null && booking.getSurveyor().getUsername() != null
                && booking.getSurveyor().getUsername().equalsIgnoreCase(username);

        if (!isAdmin && !isAssignedSupervisor) {
            throw new RuntimeException("Chỉ Giám sát viên phụ trách hoặc Quản trị viên mới được nghiệm thu hạng mục này");
        }

        if (!Boolean.TRUE.equals(item.getTechnicianCompleted())) {
            throw new RuntimeException("Đội thợ chưa báo hoàn thành hạng mục này, chưa thể nghiệm thu!");
        }

        item.setSupervisorAccepted(true);
        item.setSupervisorAcceptedAt(java.time.LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            item.setSupervisorNote(note.trim());
        }
        bookingServiceItemRepository.save(item);

        // Kiểm tra xem tất cả các hạng mục đã được Giám sát nghiệm thu chưa
        List<BookingServiceItem> allItems = bookingServiceItemRepository.findByBookingId(bookingId);
        boolean allAccepted = allItems.stream().allMatch(i -> Boolean.TRUE.equals(i.getSupervisorAccepted()));

        if (allAccepted) {
            List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);
            if (details.isEmpty()) {
                BookingDetail newDetail = BookingDetail.builder()
                        .booking(booking)
                        .supervisorAccepted(true)
                        .customerAccepted(false)
                        .build();
                bookingDetailRepository.save(newDetail);
            } else {
                for (BookingDetail d : details) {
                    d.setSupervisorAccepted(true);
                    bookingDetailRepository.save(d);
                }
            }
            bookingNotificationService.notifyAllServiceItemsAccepted(booking, username);
        }

        Booking saved = bookingRepository.save(booking);
        return BookingMapper.toDto(saved);
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto assignTechnicianToService(Long bookingId, Long serviceItemId, Long technicianId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Kỹ thuật viên không tồn tại #" + technicianId));

        BookingServiceItem item = bookingServiceItemRepository.findById(serviceItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hạng mục dịch vụ #" + serviceItemId));

        if (!item.getBooking().getId().equals(bookingId)) {
            throw new RuntimeException("Hạng mục dịch vụ không thuộc về đơn hàng này");
        }

        item.setTechnician(tech);
        bookingServiceItemRepository.save(item);

        // Nếu booking chưa có technician chính đại diện, đồng bộ luôn
        if (booking.getTechnician() == null) {
            booking.setTechnician(tech);
            if (booking.getStatus() == BookingStatus.CONTRACT_APPROVED
                    || booking.getStatus() == BookingStatus.DEPOSIT_CONFIRMED) {
                booking.setStatus(BookingStatus.ASSIGNED);
            }
            bookingRepository.save(booking);
        }

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);
        bookingNotificationService.notifyTeamAssigned(booking, tech, workerFee);

        return BookingMapper.toDto(bookingRepository.findById(bookingId).orElse(booking));
    }

    @Override
    @Transactional
    public BookingDto customerAcceptBooking(Long bookingId, String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User currentUser = userRepository.findByUsername(username).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));
        boolean isCustomer = booking.getCustomer() != null &&
                booking.getCustomer().getUsername() != null &&
                booking.getCustomer().getUsername().equalsIgnoreCase(username);

        if (!isAdmin && !isCustomer) {
            throw new SecurityException("Bạn không phải khách hàng của đơn hàng này!");
        }

        // Kiểm tra xem tất cả các gói dịch vụ đã hoàn thành và được giám sát nghiệm thu chưa
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(bookingId);
        if (!serviceItems.isEmpty()) {
            boolean anyWorkerNotDone = serviceItems.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getTechnicianCompleted()));
            if (anyWorkerNotDone) {
                throw new IllegalStateException("Còn gói dịch vụ chưa được đội thợ báo hoàn thành!");
            }
            boolean anySupervisorNotAccepted = serviceItems.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getSupervisorAccepted()));
            if (anySupervisorNotAccepted) {
                throw new IllegalStateException("Giám sát viên chưa nghiệm thu đạt chuẩn cho tất cả các dịch vụ!");
            }
        }

        // Cập nhật tất cả BookingDetail liên quan sang supervisorAccepted = true và customerAccepted = true
        List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);
        if (details.isEmpty()) {
            BookingDetail newDetail = BookingDetail.builder()
                    .booking(booking)
                    .supervisorAccepted(true)
                    .customerAccepted(true)
                    .build();
            bookingDetailRepository.save(newDetail);
        } else {
            for (BookingDetail d : details) {
                d.setSupervisorAccepted(true);
                d.setCustomerAccepted(true);
                bookingDetailRepository.save(d);
            }
        }

        // Cập nhật trạng thái Booking sang WAITING_FINAL_PAYMENT (hoặc COMPLETED nếu đã thanh toán đủ)
        if (booking.getPaymentStatus() == PaymentStatus.FULLY_PAID) {
            booking.setStatus(BookingStatus.COMPLETED);
            if (booking.getCompletedAt() == null) {
                booking.setCompletedAt(LocalDateTime.now());
            }
        } else {
            booking.setStatus(BookingStatus.WAITING_FINAL_PAYMENT);
        }
        Booking saved = bookingRepository.save(booking);

        // Thông báo cho Admin và Thợ
        bookingNotificationService.notifyCustomerAccepted(saved, username);

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto customerRejectServiceItem(Long bookingId, Long serviceItemId, String username) {
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
            throw new RuntimeException("Bạn không có quyền từ chối dịch vụ của đơn hàng này!");
        }

        // Cho phép từ chối/hủy gói dịch vụ ở mọi giai đoạn trước khi đặt cọc
        java.util.Set<BookingStatus> allowedStatuses = java.util.EnumSet.of(
                BookingStatus.PENDING,
                BookingStatus.SURVEY_ASSIGNED,
                BookingStatus.SURVEY_REJECTED,
                BookingStatus.ACCEPTED,
                BookingStatus.WAITING_CUSTOMER_SIGNATURE,
                BookingStatus.WAITING_ADMIN_QUOTE,
                BookingStatus.WAITING_CUSTOMER_QUOTE_APPROVAL,
                BookingStatus.CUSTOMER_ACCEPTED_QUOTE,
                BookingStatus.WAITING_DEPOSIT
        );
        if (!allowedStatuses.contains(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể hủy gói dịch vụ trước khi đặt cọc (Trạng thái hiện tại: " + booking.getStatus() + ")");
        }

        List<BookingServiceItem> serviceItems = booking.getBookingServices();
        if (serviceItems == null || serviceItems.isEmpty()) {
            serviceItems = bookingServiceItemRepository.findByBookingId(bookingId);
            // KHÔNG dùng setBookingServices(new List) vì orphanRemoval=true - thêm vào collection hiện có
            if (booking.getBookingServices() == null) {
                // Trường hợp hiếm: collection chưa được init, để Hibernate tự quản lý
                // chỉ làm việc trực tiếp trên serviceItems đã load
            } else {
                booking.getBookingServices().addAll(
                    serviceItems.stream()
                        .filter(i -> !booking.getBookingServices().contains(i))
                        .collect(java.util.stream.Collectors.toList())
                );
                serviceItems = booking.getBookingServices();
            }
        }

        if (serviceItems == null || serviceItems.isEmpty()) {
            throw new RuntimeException("Đơn hàng không có gói dịch vụ nào để hủy!");
        }

        BookingServiceItem itemToRemove = serviceItems.stream()
                .filter(i -> i.getId().equals(serviceItemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hạng mục dịch vụ #" + serviceItemId + " trong đơn hàng"));

        String removedServiceName = itemToRemove.getService() != null ? itemToRemove.getService().getName() : "Dịch vụ #" + serviceItemId;

        // Đánh dấu là đã hủy thay vì xóa khỏi DB (để khách vẫn thấy lịch sử)
        itemToRemove.setCancelled(true);
        itemToRemove.setCancelledAt(LocalDateTime.now());
        bookingServiceItemRepository.save(itemToRemove);

        // Lấy danh sách các gói chưa bị hủy để tính lại tổng tiền
        List<BookingServiceItem> activeItems = booking.getBookingServices().stream()
                .filter(i -> !Boolean.TRUE.equals(i.getCancelled()))
                .collect(java.util.stream.Collectors.toList());

        // Kiểm tra nếu không còn dịch vụ nào chưa hủy -> Đơn hàng bị hủy toàn bộ (CANCELLED)
        if (activeItems.isEmpty()) {
            booking.setTotalAmount(BigDecimal.ZERO);
            booking.setDepositAmount(BigDecimal.ZERO);
            booking.setRemainingAmount(BigDecimal.ZERO);
            booking.setStatus(BookingStatus.CANCELLED);

            String logNote = String.format("\n[Khách hàng hủy gói cuối cùng '%s' - %s]: Toàn bộ dịch vụ đã được hủy, đơn hàng chuyển sang trạng thái ĐÃ HỦY",
                    removedServiceName,
                    DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()));
            String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
            booking.setDescription(currentDesc + logNote);

            Booking savedBooking = bookingRepository.save(booking);

            // Gửi thông báo hủy đơn
            bookingNotificationService.notifyQuoteRejected(savedBooking, username, "Khách hàng đã hủy tất cả các gói dịch vụ", isAdmin);

            return BookingMapper.toDto(savedBooking);
        }

        // Nếu vẫn còn dịch vụ khác chưa hủy, tính lại tổng tiền
        BigDecimal newTotal = BigDecimal.ZERO;
        for (BookingServiceItem item : activeItems) {
            if (item.getPrice() != null && item.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                newTotal = newTotal.add(item.getPrice());
            } else if (item.getService() != null && item.getService().getBasePrice() != null) {
                newTotal = newTotal.add(item.getService().getBasePrice());
            }
        }

        BigDecimal newDeposit = newTotal.multiply(AppConstants.DEPOSIT_RATE);
        BigDecimal newRemaining = newTotal.subtract(newDeposit);

        booking.setTotalAmount(newTotal);
        booking.setDepositAmount(newDeposit);
        booking.setRemainingAmount(newRemaining);



        String logNote = String.format("\n[Khách hàng từ chối gói '%s' - %s]: Tổng tiền mới cập nhật còn %s VNĐ",
                removedServiceName,
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()),
                new java.text.DecimalFormat("#,###").format(newTotal));
        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + logNote);

        Booking savedBooking = bookingRepository.save(booking);

        // Cập nhật lại nội dung hợp đồng nếu đã có hợp đồng
        Contract contract = contractRepository.findByBookingId(bookingId).orElse(null);
        if (contract != null) {
            List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);
            int estimatedDays = savedBooking.getEstimatedDays() != null ? savedBooking.getEstimatedDays() : 3;
            int warrantyYears = savedBooking.getWarrantyYears() != null ? savedBooking.getWarrantyYears() : 2;
            String updatedContractText = contractGenerationService.generateContractContent(savedBooking, newTotal, newDeposit, estimatedDays, warrantyYears, details);
            contract.setContent(updatedContractText);
            contract.setCustomerSigned(false);
            contract.setCustomerSignedAt(null);
            contract.setCustomerSignatureImg(null);
            contractRepository.save(contract);
        }

        // Gửi thông báo
        bookingNotificationService.notifyServiceItemRejected(savedBooking, username, removedServiceName, newTotal);

        return BookingMapper.toDto(savedBooking);
    }
}
