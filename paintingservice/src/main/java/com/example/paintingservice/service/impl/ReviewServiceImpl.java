package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.ReviewDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Review;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.ReviewMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.ReviewRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.ReviewService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewServiceImpl extends BaseServiceImpl<Review, Long> implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final NotificationService notificationService;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            StaffProfileRepository staffProfileRepository,
            NotificationService notificationService) {
        super(reviewRepository);
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.notificationService = notificationService;
    }

    @Override
    public ReviewDto createCustomerReview(ReviewDto dto, String username) {
        if (dto.getBookingId() == null) {
            throw new IllegalArgumentException("Mã đơn hàng (bookingId) không được để trống");
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + dto.getBookingId()));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + username));

        // 1. Kiểm tra quyền sở hữu đơn hàng (Khách hàng tạo đơn hoặc Admin)
        if (!isAdmin(currentUser) && (booking.getCustomer() == null || !booking.getCustomer().getId().equals(currentUser.getId()))) {
            throw new SecurityException("Bạn không có quyền đánh giá đơn hàng này");
        }

        // 2. Kiểm tra trạng thái hoàn thành của đơn hàng
        boolean isCompleted = booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.PAID_TO_STAFF
                || booking.getPaymentStatus() == PaymentStatus.FULLY_PAID;

        if (!isCompleted) {
            throw new IllegalStateException("Đơn hàng chưa hoàn thành. Quý khách chỉ có thể gửi đánh giá & góp ý sau khi đơn hàng đã hoàn tất.");
        }

        // 3. Kiểm tra đơn hàng đã được đánh giá chưa
        if (reviewRepository.existsByBooking_Id(booking.getId())) {
            throw new IllegalStateException("Đơn hàng #" + booking.getId() + " đã được gửi đánh giá trước đó.");
        }

        // 4. Kiểm tra số sao hợp lệ (1 - 5)
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("Số sao đánh giá phải từ 1 đến 5 sao.");
        }

        // 5. Lưu đánh giá
        Review review = Review.builder()
                .booking(booking)
                .customer(booking.getCustomer())
                .rating(dto.getRating())
                .comment(dto.getComment() != null ? dto.getComment().trim() : "")
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);

        // 6. Cập nhật điểm đánh giá trung bình cho thợ trong StaffProfile
        User technician = (booking.getTechnician() != null) ? booking.getTechnician() : booking.getPreferredTechnician();
        if (technician != null) {
            updateStaffAverageRating(technician);
        }

        // 7. Gửi thông báo cho thợ thi công
        String customerName = (booking.getCustomer() != null && booking.getCustomer().getUsername() != null)
                ? booking.getCustomer().getUsername()
                : "Khách hàng";
        String commentSnippet = (dto.getComment() != null && !dto.getComment().isBlank())
                ? String.format("\nGóp ý: \"%s\"", dto.getComment().trim())
                : "";

        if (technician != null) {
            notificationService.save(Notification.builder()
                    .user(technician)
                    .title("Đánh giá mới từ khách hàng #" + booking.getId())
                    .content(String.format("Khách hàng %s đã đánh giá %d sao cho bạn ở đơn hàng #%d.%s",
                            customerName, dto.getRating(), booking.getId(), commentSnippet))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        // 8. Gửi thông báo cho Admin
        final String techName = (technician != null) ? technician.getUsername() : "Chưa chỉ định";
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Đánh giá đơn hàng #" + booking.getId())
                    .content(String.format("Khách hàng %s vừa gửi đánh giá %d sao cho đơn #%d (Thợ: %s).%s",
                            customerName, dto.getRating(), booking.getId(), techName, commentSnippet))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        return ReviewMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewDto getReviewByBookingId(Long bookingId) {
        return reviewRepository.findByBooking_Id(bookingId)
                .map(ReviewMapper::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByTechnicianId(Long technicianId) {
        return reviewRepository.findAllByTechnicianId(technicianId)
                .stream()
                .map(ReviewMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getMyReviews(String username) {
        return reviewRepository.findAllByCustomer_UsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(ReviewMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getStaffReviews(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Nhân viên không tồn tại: " + username));

        List<Review> reviews = reviewRepository.findAllByStaffUsername(username);

        // Nâng cấp: Nếu nhân viên chưa được gán trực tiếp đánh giá nào, trả về danh sách đánh giá của hệ thống để nhân viên tham khảo
        if (reviews == null || reviews.isEmpty()) {
            reviews = reviewRepository.findAll();
        }

        return reviews.stream().map(ReviewMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemReviewStats() {
        Double avg = reviewRepository.findOverallAverageRating();
        long total = reviewRepository.count();
        double avgVal = avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0;

        long star5 = reviewRepository.countByRating(5);
        long star4 = reviewRepository.countByRating(4);
        long star3 = reviewRepository.countByRating(3);
        long star2 = reviewRepository.countByRating(2);
        long star1 = reviewRepository.countByRating(1);

        Map<String, Object> distribution = new HashMap<>();
        distribution.put("5", star5);
        distribution.put("4", star4);
        distribution.put("3", star3);
        distribution.put("2", star2);
        distribution.put("1", star1);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalReviews", total);
        stats.put("averageRating", avgVal);
        stats.put("distribution", distribution);
        stats.put("fiveStarPercentage", total > 0 ? Math.round(((double) star5 / total) * 100.0) : 0);

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTechnicianRatingStats(Long technicianId) {
        Double avg = reviewRepository.findAverageRatingByTechnicianId(technicianId);
        Long count = reviewRepository.countByTechnicianId(technicianId);
        double avgVal = avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("technicianId", technicianId);
        stats.put("averageRating", avgVal);
        stats.put("totalReviews", count != null ? count : 0L);
        return stats;
    }

    @Override
    public ReviewDto updateCustomerReview(Long id, ReviewDto dto, String username) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá #" + id));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + username));

        if (!isAdmin(currentUser) && (review.getCustomer() == null || !review.getCustomer().getId().equals(currentUser.getId()))) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa đánh giá này");
        }

        if (dto.getRating() != null) {
            if (dto.getRating() < 1 || dto.getRating() > 5) {
                throw new IllegalArgumentException("Số sao đánh giá phải từ 1 đến 5 sao.");
            }
            review.setRating(dto.getRating());
        }

        if (dto.getComment() != null) {
            review.setComment(dto.getComment().trim());
        }

        Review updated = reviewRepository.save(review);

        if (review.getBooking() != null) {
            User tech = review.getBooking().getTechnician() != null
                    ? review.getBooking().getTechnician()
                    : review.getBooking().getPreferredTechnician();
            if (tech != null) {
                updateStaffAverageRating(tech);
            }
        }

        return ReviewMapper.toDto(updated);
    }

    @Override
    public void deleteCustomerReview(Long id, String username) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá #" + id));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + username));

        if (!isAdmin(currentUser) && (review.getCustomer() == null || !review.getCustomer().getId().equals(currentUser.getId()))) {
            throw new SecurityException("Bạn không có quyền xóa đánh giá này");
        }

        Booking booking = review.getBooking();
        User tech = (booking != null) ? (booking.getTechnician() != null ? booking.getTechnician() : booking.getPreferredTechnician()) : null;

        reviewRepository.delete(review);

        if (tech != null) {
            updateStaffAverageRating(tech);
        }
    }

    private void updateStaffAverageRating(User technician) {
        if (technician == null) return;
        Double avgRating = reviewRepository.findAverageRatingByTechnicianId(technician.getId());
        double roundedRating = (avgRating != null) ? (Math.round(avgRating * 10.0) / 10.0) : 5.0;

        staffProfileRepository.findByUser_Id(technician.getId()).ifPresent(profile -> {
            profile.setRating(roundedRating);
            staffProfileRepository.save(profile);
        });
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRole() != null
                && user.getRole().getName() != null
                && user.getRole().getName().toUpperCase().contains("ADMIN");
    }
}

