package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.ReviewDto;
import com.example.paintingservice.mapper.ReviewMapper;
import com.example.paintingservice.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 1. Khách hàng gửi đánh giá & góp ý sau khi hoàn thành đơn
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDto> createReview(
            @Valid @RequestBody ReviewDto dto,
            Authentication authentication) {
        ReviewDto result = reviewService.createCustomerReview(dto, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // 2. Lấy đánh giá của một đơn hàng cụ thể
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ReviewDto> getReviewByBookingId(@PathVariable Long bookingId) {
        ReviewDto review = reviewService.getReviewByBookingId(bookingId);
        if (review == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(review);
    }

    // 3. Lấy danh sách đánh giá của một thợ thi công
    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByTechnician(@PathVariable Long technicianId) {
        return ResponseEntity.ok(reviewService.getReviewsByTechnicianId(technicianId));
    }

    // 4. Lấy thống kê số sao & số lượng đánh giá của thợ
    @GetMapping("/technician/{technicianId}/stats")
    public ResponseEntity<Map<String, Object>> getTechnicianStats(@PathVariable Long technicianId) {
        return ResponseEntity.ok(reviewService.getTechnicianRatingStats(technicianId));
    }

    // 5. Khách hàng xem danh sách các đánh giá của chính mình
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReviewDto>> getMyReviews(Authentication authentication) {
        return ResponseEntity.ok(reviewService.getMyReviews(authentication.getName()));
    }

    // 5b. Nhân viên (Thợ thi công / Khảo sát) xem đánh giá công trình của mình
    @GetMapping("/staff/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReviewDto>> getMyStaffReviews(Authentication authentication) {
        return ResponseEntity.ok(reviewService.getStaffReviews(authentication.getName()));
    }

    // 5c. Thống kê đánh giá tổng thể hệ thống (Dashboard / Admin)
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(reviewService.getSystemReviewStats());
    }

    // 6. Lấy tất cả đánh giá
    @GetMapping
    public List<ReviewDto> getAll() {
        return reviewService.findAll().stream().map(ReviewMapper::toDto).collect(Collectors.toList());
    }

    // 7. Lấy chi tiết đánh giá theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ReviewDto> getById(@PathVariable Long id) {
        return reviewService.findById(id)
                .map(ReviewMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 8. Chỉnh sửa đánh giá (Khách hàng tạo đơn hoặc Admin)
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDto> update(
            @PathVariable Long id,
            @RequestBody ReviewDto dto,
            Authentication authentication) {
        ReviewDto result = reviewService.updateCustomerReview(id, dto, authentication.getName());
        return ResponseEntity.ok(result);
    }

    // 9. Xóa đánh giá (Khách hàng tạo đơn hoặc Admin)
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        reviewService.deleteCustomerReview(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}

