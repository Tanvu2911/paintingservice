package com.example.paintingservice.service;

import com.example.paintingservice.dto.ReviewDto;
import com.example.paintingservice.entity.Review;

import java.util.List;
import java.util.Map;

public interface ReviewService extends BaseService<Review, Long> {

    ReviewDto createCustomerReview(ReviewDto dto, String username);

    ReviewDto getReviewByBookingId(Long bookingId);

    List<ReviewDto> getReviewsByTechnicianId(Long technicianId);

    List<ReviewDto> getMyReviews(String username);

    List<ReviewDto> getStaffReviews(String username);

    Map<String, Object> getSystemReviewStats();

    Map<String, Object> getTechnicianRatingStats(Long technicianId);

    ReviewDto updateCustomerReview(Long id, ReviewDto dto, String username);

    void deleteCustomerReview(Long id, String username);
}

