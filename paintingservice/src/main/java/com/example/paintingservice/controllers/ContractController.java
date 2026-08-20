package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.ContractDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Contract;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.ContractMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.ContractService;
import com.example.paintingservice.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @GetMapping
    public List<ContractDto> getAll() {
        return contractService.findAll().stream()
                .map(ContractMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDto> getById(@PathVariable Long id) {
        return contractService.findById(id)
                .map(ContractMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/stats/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> getMonthlyStats() {
        List<Contract> contracts = contractService.findAll();

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

    // =========================================================================
    // 1. TẠO HỢP ĐỒNG (Admin lập hợp đồng sau khi khách hàng đồng ý báo giá)
    // → Chuyển status đơn sang WAITING_CUSTOMER_SIGNATURE
    // =========================================================================
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody ContractDto dto, HttpServletRequest request) {

        // Validate booking
        if (dto.getBookingId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu bookingId"));
        }

        var bookingOpt = bookingRepository.findById(dto.getBookingId());
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Không tìm thấy đơn hàng #" + dto.getBookingId()));
        }

        // ★ Tự generate contractCode nếu client không gửi (hoặc gửi rỗng)
        if (dto.getContractCode() == null || dto.getContractCode().isBlank()) {
            dto.setContractCode("HD-" + dto.getBookingId() + "-" + System.currentTimeMillis());
        }

        Contract entity = ContractMapper.toEntity(dto);
        entity.setBooking(bookingOpt.get()); // dùng entity thật từ DB

        if (dto.getSurveySignatureImg() != null && !dto.getSurveySignatureImg().isBlank()) {
            entity.setSurveySigned(true);
            entity.setSurveySignedAt(LocalDateTime.now());
            entity.setSurveyIp(request.getRemoteAddr());
        }

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        Contract savedEntity = contractService.save(entity);
        ContractDto result = ContractMapper.toDto(savedEntity);

        // Cập nhật status Booking → WAITING_CUSTOMER_SIGNATURE + notify Customer
        bookingRepository.findById(savedEntity.getBooking().getId()).ifPresent(booking -> {
            booking.setStatus(BookingStatus.WAITING_CUSTOMER_SIGNATURE);
            bookingRepository.save(booking);

            if (booking.getCustomer() != null) {
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Hợp đồng sẵn sàng ký #" + booking.getId())
                        .content(
                                "Admin đã lập hợp đồng cho đơn hàng của bạn. Vui lòng vào app xem nội dung và ký điện tử.")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // =========================================================================
    // 3. CẬP NHẬT & KÝ HỢP ĐỒNG (Khách ký → PROCESSING)
    // =========================================================================
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @Valid @RequestBody ContractDto dto,
            Authentication auth,
            HttpServletRequest request) {

        return contractService.findById(id).map(existing -> {
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            boolean isCustomer = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
            BookingStatus bookingStatus = existing.getBooking().getStatus();

            // Khách chỉ được ký khi Admin đã duyệt hợp đồng
            if (!isAdmin && bookingStatus != BookingStatus.WAITING_CUSTOMER_SIGNATURE) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if (!isAdmin && !isCustomer && Boolean.TRUE.equals(existing.getCustomerSigned())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).<ContractDto>build();
            }

            boolean wasSigned = Boolean.TRUE.equals(existing.getCustomerSigned());
            boolean isSigningNow = Boolean.TRUE.equals(dto.getCustomerSigned());

            // Nội dung hợp đồng
            if (dto.getContent() != null) {
                existing.setContent(dto.getContent());
            }

            // ========== CHỮ KÝ KHÁCH ==========
            if (dto.getCustomerSigned() != null) {
                existing.setCustomerSigned(dto.getCustomerSigned());
            }
            if (dto.getCustomerSignatureImg() != null && !dto.getCustomerSignatureImg().isBlank()) {
                existing.setCustomerSignatureImg(dto.getCustomerSignatureImg());
            }

            // ========== CHỮ KÝ GIÁM SÁT (chỉ cập nhật khi client gửi, KHÔNG ghi đè null)
            // ==========
            if (dto.getSurveySigned() != null) {
                existing.setSurveySigned(dto.getSurveySigned());
            }
            if (dto.getSurveySignatureImg() != null && !dto.getSurveySignatureImg().isBlank()) {
                existing.setSurveySignatureImg(dto.getSurveySignatureImg());
            }
            // ================================================================================

            if (!wasSigned && isSigningNow) {
                existing.setCustomerSignedAt(LocalDateTime.now());
                existing.setCustomerIp(request.getRemoteAddr());
            }

            Contract savedEntity = contractService.save(existing);
            ContractDto result = ContractMapper.toDto(savedEntity);

            // Khách vừa ký hợp đồng → chuyển status
            if (!wasSigned && isSigningNow) {
                bookingRepository.findById(savedEntity.getBooking().getId()).ifPresent(booking -> {

                    booking.setStatus(BookingStatus.WAITING_DEPOSIT);

                    userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
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

                    bookingRepository.save(booking);
                });
            }

            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 3.1 KÝ HỢP ĐỒNG (Dùng cho cả Khách hàng và Admin)
    // =========================================================================
    @PostMapping("/{id}/sign")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sign(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication auth,
            HttpServletRequest request) {

        return contractService.findById(id).map(existing -> {
            String role = payload.getOrDefault("role", "CUSTOMER");
            String signatureImg = payload.get("signatureImage");
            if (signatureImg == null || signatureImg.isBlank()) {
                signatureImg = payload.get("signatureImg");
            }
            if (signatureImg == null || signatureImg.isBlank()) {
                signatureImg = payload.get("customerSignatureImg");
            }

            if ("CUSTOMER".equalsIgnoreCase(role)) {
                existing.setCustomerSigned(true);
                existing.setCustomerSignedAt(LocalDateTime.now());
                if (signatureImg != null && !signatureImg.isBlank()) {
                    existing.setCustomerSignatureImg(signatureImg);
                }
                existing.setCustomerIp(request.getRemoteAddr());

                Booking booking = existing.getBooking();
                if (booking != null) {
                    booking.setStatus(BookingStatus.WAITING_DEPOSIT);
                    bookingRepository.save(booking);

                    userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
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
                    existing.setAdminSignatureImg(signatureImg);
                }
            }

            Contract saved = contractService.save(existing);
            return ResponseEntity.ok(ContractMapper.toDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 4. XÁC NHẬN CỌC & ADMIN KÝ HỢP ĐỒNG
    // =========================================================================
    @PostMapping("/{id}/confirm-deposit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirmDeposit(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return contractService.findById(id).map(existing -> {
            Booking booking = existing.getBooking();

            if (booking.getStatus() != BookingStatus.WAITING_DEPOSIT) {
                return ResponseEntity.badRequest().body(Map.of("message", "Đơn hàng chưa ở trạng thái chờ cọc"));
            }

            // Admin ký
            existing.setAdminSigned(true);
            existing.setAdminSignedAt(LocalDateTime.now());
            if (payload.get("adminSignatureImg") != null && !payload.get("adminSignatureImg").isBlank()) {
                existing.setAdminSignatureImg(payload.get("adminSignatureImg"));
            }

            Contract savedEntity = contractService.save(existing);
            ContractDto result = ContractMapper.toDto(savedEntity);

            // Cập nhật booking status & payment status
            booking.setStatus(BookingStatus.DEPOSIT_CONFIRMED);
            booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
            bookingRepository.save(booking);

            // Đồng bộ bản ghi thanh toán (Payment) của đơn hàng này
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

            // Nếu chưa có record Payment cọc thì tạo 1 record đã thanh toán
            if (!hasDepositPayment) {
                BigDecimal depositAmount = booking.getDepositAmount() != null
                        && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                                ? booking.getDepositAmount()
                                : (booking.getTotalAmount() != null
                                        ? booking.getTotalAmount().multiply(new BigDecimal("0.3"))
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
                        .content(
                                "Admin đã xác nhận nhận tiền cọc và ký hợp đồng. Đơn hàng sẽ được phân công cho đội thợ trong thời gian tới.")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!contractService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        contractService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}