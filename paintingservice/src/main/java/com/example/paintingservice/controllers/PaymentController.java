package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.PaymentDto;
import com.example.paintingservice.mapper.PaymentMapper;
import com.example.paintingservice.service.MoMoService;
import com.example.paintingservice.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final MoMoService moMoService;

    // ===== MOMO =====

    @PostMapping("/momo/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createMoMoOrder(
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "DEPOSIT") String paymentType) {
        try {
            return ResponseEntity.ok(paymentService.createMoMoPayment(bookingId, paymentType));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<?> momoIPN(@RequestBody Map<String, String> ipnParams) {
        try {
            boolean isValid = moMoService.verifyIPN(ipnParams);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid signature"));
            }
            String orderId = ipnParams.get("orderId");
            String resultCode = ipnParams.get("resultCode");
            if ("0".equals(resultCode)) {
                paymentService.processMoMoSuccessCallback(orderId);
            }
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ===== QR + ADMIN =====

    @PostMapping(value = "/qr-submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> submitQrPayment(
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "DEPOSIT") String paymentType,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) MultipartFile proofImage,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "customer";
            return ResponseEntity.ok(
                    paymentService.submitQrPayment(bookingId, paymentType, note, proofImage, username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingPayments() {
        List<PaymentDto> dtos = paymentService.getPendingPayments().stream()
                .map(PaymentMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getPaymentsByBooking(@PathVariable Long bookingId) {
        List<PaymentDto> dtos = paymentService.getPaymentsByBooking(bookingId).stream()
                .map(PaymentMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirmPayment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(paymentService.confirmPayment(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectPayment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.get("reason") : null;
            return ResponseEntity.ok(paymentService.rejectPayment(id, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/staff-payout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payStaffPayout(
            @RequestParam Long bookingId,
            @RequestParam Long staffId,
            @RequestParam(required = false, defaultValue = "STAFF") String role) {
        try {
            return ResponseEntity.ok(paymentService.payStaffPayout(bookingId, staffId, role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Admin gia hạn thêm 24h (hoặc số giờ tùy chọn)
     * Frontend gọi: POST /api/payments/extend-deposit-deadline/{bookingId}
     * body: { "hours": 24, "reason": "..." }
     */
    @PostMapping("/extend-deposit-deadline/{bookingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> extendDepositDeadline(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Integer hours = body != null && body.get("hours") != null
                    ? Integer.valueOf(body.get("hours").toString())
                    : 24;
            String reason = body != null ? (String) body.get("reason") : null;
            return ResponseEntity.ok(paymentService.extendDepositDeadline(bookingId, hours, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== CRUD =====

    @GetMapping
    public List<PaymentDto> getAll() {
        return paymentService.findAll().stream()
                .map(PaymentMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto> getById(@PathVariable Long id) {
        return paymentService.findById(id)
                .map(PaymentMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentDto> create(@Valid @RequestBody PaymentDto dto) {
        PaymentDto result = PaymentMapper.toDto(paymentService.save(PaymentMapper.toEntity(dto)));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentDto> update(
            @PathVariable Long id,
            @Valid @RequestBody PaymentDto dto) {
        if (!paymentService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dto.setId(id);
        PaymentDto result = PaymentMapper.toDto(paymentService.save(PaymentMapper.toEntity(dto)));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!paymentService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        paymentService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}