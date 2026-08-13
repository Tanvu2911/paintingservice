package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.PaymentDto;
import com.example.paintingservice.mapper.PaymentMapper;
import com.example.paintingservice.service.PaymentService;
import com.example.paintingservice.service.MoMoService;
import tools.jackson.databind.ObjectMapper;
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
    private final MoMoService moMoService;
    private final ObjectMapper objectMapper;

    // =========================================================================
    // === TÍCH HỢP THANH TOÁN MOMO ===
    // =========================================================================

    /**
     * Khách hàng bấm lấy URL thanh toán MoMo để chuyển hướng (Redirect)
     * @param bookingId ID đơn hàng
     * @param paymentType "DEPOSIT" (Cọc) hoặc "FINAL" (Thanh toán nốt)
     */
    @PostMapping("/momo/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createMoMoOrder(
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "DEPOSIT") String paymentType) {

        try {
            return ResponseEntity.ok(
                    paymentService.createMoMoPayment(bookingId, paymentType)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * IPN Webhook nhận kết quả thanh toán tự động từ MoMo Server gửi về
     * (Lưu ý: Cần cấu hình permitAll() cho endpoint này trong SecurityConfig)
     */
    @PostMapping("/momo/ipn")
    public ResponseEntity<?> momoIPN(@RequestBody Map<String, String> ipnParams) {
        try {
            // 1. Kiểm tra chữ ký bảo mật signature từ MoMo
            boolean isValid = moMoService.verifyIPN(ipnParams);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid signature"));
            }

            // 2. Lấy kết quả giao dịch
            String orderId = ipnParams.get("orderId");
            String resultCode = ipnParams.get("resultCode");

            // 3. Nếu thanh toán thành công (resultCode == "0") -> Cập nhật Database
            if ("0".equals(resultCode)) {
                paymentService.processMoMoSuccessCallback(orderId);
            }

            // MoMo yêu cầu trả về HTTP 204 hoặc JSON xác nhận đã nhận tin
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    // =========================================================================
    // === CÁC API CRUD QUẢN LÝ THANH TOÁN CŨ ===
    // =========================================================================

    @GetMapping
    public List<PaymentDto> getAll() {
        return paymentService.findAll().stream().map(PaymentMapper::toDto).collect(Collectors.toList());
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
    public ResponseEntity<PaymentDto> update(@PathVariable Long id, @Valid @RequestBody PaymentDto dto) {
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