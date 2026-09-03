package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.dto.ContractDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Contract;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.ContractMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.CloudinaryService;
import com.example.paintingservice.service.ContractService;
import com.example.paintingservice.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ContractServiceImpl extends BaseServiceImpl<Contract, Long> implements ContractService {

    private final ContractRepository contractRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;

    public ContractServiceImpl(
            ContractRepository repository,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            CloudinaryService cloudinaryService) {
        super(repository);
        this.contractRepository = repository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public Map<String, Long> getMonthlyStats() {
        List<Contract> contracts = contractRepository.findAll();

        return contracts.stream()
                .filter(c -> Boolean.TRUE.equals(c.getCustomerSigned()))
                .collect(Collectors.groupingBy(
                        c -> {
                            LocalDateTime date = c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now();
                            return String.format("%02d-%d", date.getMonthValue(), date.getYear());
                        },
                        TreeMap::new,
                        Collectors.counting()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ContractDto createContract(ContractDto dto, HttpServletRequest request) {
        if (dto.getBookingId() == null) {
            throw new IllegalArgumentException("Thiếu bookingId");
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + dto.getBookingId()));

        // Tự sinh contractCode nếu chưa có
        if (dto.getContractCode() == null || dto.getContractCode().isBlank()) {
            dto.setContractCode("HD-" + dto.getBookingId() + "-" + System.currentTimeMillis());
        }

        Contract entity = ContractMapper.toEntity(dto);
        entity.setBooking(booking);

        // Upload chữ ký Admin lên Cloudinary nếu có
        if (dto.getAdminSignatureImg() != null && !dto.getAdminSignatureImg().isBlank()) {
            String signatureUrl = cloudinaryService.uploadBase64(
                    dto.getAdminSignatureImg(),
                    AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + booking.getId()
            );
            entity.setAdminSignatureImg(signatureUrl);
            entity.setAdminSigned(true);
            entity.setAdminSignedAt(LocalDateTime.now());
            entity.setAdminIp(request != null ? request.getRemoteAddr() : null);
        }

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        Contract savedEntity = contractRepository.save(entity);

        // Cập nhật status Booking → WAITING_CUSTOMER_SIGNATURE & thông báo cho khách hàng
        booking.setStatus(BookingStatus.WAITING_CUSTOMER_SIGNATURE);
        bookingRepository.save(booking);

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hợp đồng sẵn sàng ký #" + booking.getId())
                    .content("Admin đã lập hợp đồng cho đơn hàng của bạn. Vui lòng vào ứng dụng xem nội dung và ký điện tử.")
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ContractMapper.toDto(savedEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ContractDto updateContract(Long id, ContractDto dto, Authentication auth, HttpServletRequest request) {
        Contract existing = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng #" + id));

        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(AppConstants.ROLE_ADMIN));
        boolean isCustomer = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(AppConstants.ROLE_CUSTOMER));

        Booking booking = existing.getBooking();
        BookingStatus bookingStatus = booking != null ? booking.getStatus() : null;

        // Khách chỉ được ký khi đơn ở trạng thái WAITING_CUSTOMER_SIGNATURE
        if (!isAdmin && bookingStatus != BookingStatus.WAITING_CUSTOMER_SIGNATURE) {
            throw new IllegalStateException("Đơn hàng chưa ở trạng thái sẵn sàng để ký");
        }

        if (!isAdmin && !isCustomer && Boolean.TRUE.equals(existing.getCustomerSigned())) {
            throw new SecurityException("Bạn không có quyền cập nhật hợp đồng này");
        }

        boolean wasSigned = Boolean.TRUE.equals(existing.getCustomerSigned());
        boolean isSigningNow = Boolean.TRUE.equals(dto.getCustomerSigned());

        if (dto.getContent() != null) {
            existing.setContent(dto.getContent());
        }

        // Chữ ký khách hàng
        if (dto.getCustomerSigned() != null) {
            existing.setCustomerSigned(dto.getCustomerSigned());
        }
        if (dto.getCustomerSignatureImg() != null && !dto.getCustomerSignatureImg().isBlank()) {
            String uploaded = cloudinaryService.uploadBase64(
                    dto.getCustomerSignatureImg(),
                    AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + (booking != null ? booking.getId() : id)
            );
            existing.setCustomerSignatureImg(uploaded);
        }

        // Chữ ký Admin
        if (dto.getAdminSigned() != null) {
            existing.setAdminSigned(dto.getAdminSigned());
        }
        if (dto.getAdminSignatureImg() != null && !dto.getAdminSignatureImg().isBlank()) {
            String uploaded = cloudinaryService.uploadBase64(
                    dto.getAdminSignatureImg(),
                    AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + (booking != null ? booking.getId() : id)
            );
            existing.setAdminSignatureImg(uploaded);
            existing.setAdminSigned(true);
            existing.setAdminSignedAt(LocalDateTime.now());
            existing.setAdminIp(request != null ? request.getRemoteAddr() : null);
        }

        if (!wasSigned && isSigningNow) {
            existing.setCustomerSignedAt(LocalDateTime.now());
            existing.setCustomerIp(request != null ? request.getRemoteAddr() : null);
        }

        Contract savedEntity = contractRepository.save(existing);

        if (!wasSigned && isSigningNow && booking != null) {
            booking.setStatus(BookingStatus.WAITING_DEPOSIT);
            bookingRepository.save(booking);

            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Khách hàng đã ký hợp đồng #" + booking.getId())
                        .content("Khách hàng đã ký hợp đồng. Đang chờ khách hàng thanh toán cọc.")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            if (booking.getCustomer() != null) {
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Ký hợp đồng thành công #" + booking.getId())
                        .content("Vui lòng thanh toán cọc để hệ thống phân công đội thợ thi công.")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }
        }

        return ContractMapper.toDto(savedEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ContractDto signContract(Long id, Map<String, String> payload, Authentication auth, HttpServletRequest request) {
        Contract existing = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng #" + id));

        String role = payload.getOrDefault("role", "CUSTOMER");
        String signatureImg = payload.get("signatureImage");
        if (signatureImg == null || signatureImg.isBlank()) {
            signatureImg = payload.get("signatureImg");
        }
        if (signatureImg == null || signatureImg.isBlank()) {
            signatureImg = payload.get("customerSignatureImg");
        }

        Booking booking = existing.getBooking();
        String folder = AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + (booking != null ? booking.getId() : id);

        if ("CUSTOMER".equalsIgnoreCase(role)) {
            existing.setCustomerSigned(true);
            existing.setCustomerSignedAt(LocalDateTime.now());
            if (signatureImg != null && !signatureImg.isBlank()) {
                String uploaded = cloudinaryService.uploadBase64(signatureImg, folder);
                existing.setCustomerSignatureImg(uploaded);
            }
            existing.setCustomerIp(request != null ? request.getRemoteAddr() : null);

            if (booking != null) {
                booking.setStatus(BookingStatus.WAITING_DEPOSIT);
                bookingRepository.save(booking);

                userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                    notificationService.save(Notification.builder()
                            .user(admin)
                            .title("Khách hàng đã ký hợp đồng #" + booking.getId())
                            .content("Khách hàng đã ký hợp đồng. Đang chờ khách hàng thanh toán cọc.")
                            .createdAt(LocalDateTime.now())
                            .isRead(false)
                            .build());
                });
            }
        } else if ("ADMIN".equalsIgnoreCase(role)) {
            existing.setAdminSigned(true);
            existing.setAdminSignedAt(LocalDateTime.now());
            if (signatureImg != null && !signatureImg.isBlank()) {
                String uploaded = cloudinaryService.uploadBase64(signatureImg, folder);
                existing.setAdminSignatureImg(uploaded);
            }
            existing.setAdminIp(request != null ? request.getRemoteAddr() : null);
        }

        Contract saved = contractRepository.save(existing);
        return ContractMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ContractDto confirmDeposit(Long id, Map<String, String> payload) {
        Contract existing = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng #" + id));

        Booking booking = existing.getBooking();
        if (booking == null) {
            throw new IllegalArgumentException("Hợp đồng không gắn liền với đơn hàng nào");
        }

        if (booking.getStatus() != BookingStatus.WAITING_DEPOSIT) {
            throw new IllegalStateException("Đơn hàng chưa ở trạng thái chờ cọc");
        }

        // Admin ký duyệt
        existing.setAdminSigned(true);
        existing.setAdminSignedAt(LocalDateTime.now());
        String adminSignatureImg = payload != null ? payload.get("adminSignatureImg") : null;
        if (adminSignatureImg != null && !adminSignatureImg.isBlank()) {
            String uploaded = cloudinaryService.uploadBase64(
                    adminSignatureImg,
                    AppConstants.FOLDER_CONTRACT_SIGNATURES + "/" + booking.getId()
            );
            existing.setAdminSignatureImg(uploaded);
        }

        Contract savedEntity = contractRepository.save(existing);

        // Cập nhật booking status & payment status
        booking.setStatus(BookingStatus.DEPOSIT_CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        booking.setDepositPaidAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // Đồng bộ bản ghi Payment
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

        // Nếu chưa có record Payment cọc thì tạo mới
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
                    .paymentMethod("MANUAL_ADMIN")
                    .paymentType("DEPOSIT")
                    .paymentStatus(PaymentStatus.DEPOSIT_PAID)
                    .transactionCode("COC-ADMIN-" + booking.getId() + "-" + System.currentTimeMillis())
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(newPayment);
        }

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Đã nhận tiền cọc #" + booking.getId())
                    .content("Admin đã xác nhận nhận tiền cọc và ký hợp đồng. Đơn hàng sẽ được phân công cho đội thợ trong thời gian tới.")
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return ContractMapper.toDto(savedEntity);
    }
}
