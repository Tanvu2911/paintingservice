package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.PaymentDto;
import com.example.paintingservice.mapper.PaymentMapper;
import com.example.paintingservice.service.PaymentService;
import com.example.paintingservice.service.VNPayService;
import com.example.paintingservice.service.WarrantyClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;
    private final WarrantyClaimService warrantyClaimService;

    // ===== VNPAY SANDBOX =====

    @PostMapping("/vnpay/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createVNPayOrder(
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "DEPOSIT") String paymentType,
            @RequestParam(required = false) Long claimId,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            return ResponseEntity.ok(vnPayService.createVNPayPaymentUrl(bookingId, paymentType, claimId, request));
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

    @PostMapping("/warranty-staff-payout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payWarrantyStaffPayout(
            @RequestParam Long claimId,
            @RequestParam(required = false) Long staffId,
            @RequestParam(required = false, defaultValue = "TECHNICIAN") String role,
            @RequestParam(required = false) BigDecimal amount,
            Principal principal) {
        try {
            return ResponseEntity.ok(warrantyClaimService.payStaff(claimId, staffId, role, amount, principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== PAYMENTS LIST & DETAIL =====

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getPaymentsByBooking(@PathVariable Long bookingId) {
        List<PaymentDto> dtos = paymentService.getPaymentsByBooking(bookingId).stream()
                .map(PaymentMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping
    public List<PaymentDto> getAll() {
        return paymentService.findAll().stream()
                .map(PaymentMapper::toDto)
                .collect(Collectors.toList());
    }
}