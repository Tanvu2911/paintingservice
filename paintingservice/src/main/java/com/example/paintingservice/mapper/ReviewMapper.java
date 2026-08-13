package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.ReviewDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Review;
import com.example.paintingservice.entity.User;

public class ReviewMapper {
    public static ReviewDto toDto(Review review) {
        if (review == null) {
            return null;
        }
        return ReviewDto.builder()
                .id(review.getId())
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .customerId(review.getCustomer() != null ? review.getCustomer().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    public static Review toEntity(ReviewDto dto) {
        if (dto == null) {
            return null;
        }
        Review review = Review.builder()
                .id(dto.getId())
                .rating(dto.getRating())
                .comment(dto.getComment())
                .createdAt(dto.getCreatedAt())
                .build();
        if (dto.getBookingId() != null) {
            review.setBooking(Booking.builder().id(dto.getBookingId()).build());
        }
        if (dto.getCustomerId() != null) {
            review.setCustomer(User.builder().id(dto.getCustomerId()).build());
        }
        return review;
    }
}
