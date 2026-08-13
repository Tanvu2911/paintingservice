package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.ContractDto;
import com.example.paintingservice.entity.Contract;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.mapper.ContractMapper;
import com.example.paintingservice.repository.BookingRepository;
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
                        Collectors.counting()
                ));
    }

    // =========================================================================
    // 1. TẠO HỢP ĐỒNG (NV Giám sát lập hợp đồng sau khi khảo sát xong)
    //    → Chuyển status đơn sang WAITING_CONTRACT_APPROVAL
    // =========================================================================
   @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('TECHNICIAN')")
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

        // Cập nhật status Booking → WAITING_CONTRACT_APPROVAL + notify Admin
        bookingRepository.findById(savedEntity.getBooking().getId()).ifPresent(booking -> {
            booking.setStatus(BookingStatus.WAITING_CONTRACT_APPROVAL);
            bookingRepository.save(booking);

            userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Hợp đồng mới chờ duyệt #" + booking.getId())
                        .content(String.format(
                                "NV Giám sát đã lập hợp đồng %s cho đơn hàng #%d. Vui lòng kiểm tra và duyệt!",
                                savedEntity.getContractCode(), booking.getId()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // =========================================================================
    // 2. ADMIN DUYỆT HỢP ĐỒNG
    //    → Chuyển sang CONTRACT_APPROVED + bàn giao đội thợ khách chọn
    // =========================================================================
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveContract(@PathVariable Long id) {
        return contractService.findById(id).map(contract -> {
            var booking = contract.getBooking();
            if (booking == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Hợp đồng không gắn với đơn hàng"));
            }

            if (booking.getStatus() != BookingStatus.WAITING_CONTRACT_APPROVAL) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Đơn không ở trạng thái chờ duyệt hợp đồng"));
            }

            // 1. Duyệt HĐ
            booking.setStatus(BookingStatus.WAITING_CUSTOMER_SIGNATURE);

            // 2. Gán sẵn đội thợ khách chọn (nếu có) — chưa cho phép thi công
            if (booking.getPreferredTechnician() != null && booking.getTechnician() == null) {
                booking.setTechnician(booking.getPreferredTechnician());
            }

            bookingRepository.save(booking);

            // 3. Thông báo Đội thợ (chờ khách ký, chưa làm)
            // if (booking.getTechnician() != null) {
            //     notificationService.save(Notification.builder()
            //             .user(booking.getTechnician())
            //             .title("Đơn hàng đã duyệt HĐ #" + booking.getId())
            //             .content("Hợp đồng đã được Admin duyệt. Vui lòng chờ khách hàng ký điện tử, sau đó bấm 'Nhận việc'.")
            //             .createdAt(LocalDateTime.now())
            //             .isRead(false)
            //             .build());
            // }

            // 4. Thông báo Khách vào ký
            if (booking.getCustomer() != null) {
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Hợp đồng sẵn sàng ký #" + booking.getId())
                        .content("Admin đã duyệt hợp đồng. Vui lòng vào app đọc nội dung và ký điện tử.")
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Đã duyệt hợp đồng. Đang chờ khách hàng ký điện tử.",
                    "bookingStatus", booking.getStatus().name()
            ));
        }).orElse(ResponseEntity.notFound().build());
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

            // ========== CHỮ KÝ GIÁM SÁT (chỉ cập nhật khi client gửi, KHÔNG ghi đè null) ==========
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

                    if (booking.getTechnician() != null) {
                        booking.setStatus(BookingStatus.ASSIGNED);

                        notificationService.save(Notification.builder()
                                .user(booking.getTechnician())
                                .title("Khách hàng đã ký hợp đồng #" + booking.getId())
                                .content("Khách hàng đã ký hợp đồng. Vui lòng vào hệ thống và bấm 'Nhận việc'.")
                                .createdAt(LocalDateTime.now())
                                .isRead(false)
                                .build());

                    } else {
                        booking.setStatus(BookingStatus.CONTRACT_APPROVED);

                        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
                            notificationService.save(Notification.builder()
                                    .user(admin)
                                    .title("Cần phân công đội thợ #" + booking.getId())
                                    .content("Khách hàng đã ký hợp đồng nhưng chưa có đội thợ.")
                                    .createdAt(LocalDateTime.now())
                                    .isRead(false)
                                    .build());
                        });
                    }

                    bookingRepository.save(booking);
                });
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