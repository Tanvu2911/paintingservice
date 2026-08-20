package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.PaymentDto;
import com.example.paintingservice.mapper.PaymentMapper;
import com.example.paintingservice.service.PaymentService;
import com.example.paintingservice.service.VNPayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;

    // ===== VNPAY SANDBOX =====

    @PostMapping("/vnpay/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createVNPayOrder(
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "DEPOSIT") String paymentType,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            return ResponseEntity.ok(vnPayService.createVNPayPaymentUrl(bookingId, paymentType, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<?> vnPayReturn(@RequestParam Map<String, String> allParams) {
        try {
            Map<String, Object> result = vnPayService.processVNPayCallback(allParams);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage(), "success", false));
        }
    }

    // ===== STAFF PAYOUT =====

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

    // ===== PAYMENTS LIST & DETAIL =====

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