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

        Booking booking = review.getBooking();
        User customer = review.getCustomer();
        User technician = (booking != null) ? (booking.getTechnician() != null ? booking.getTechnician() : booking.getPreferredTechnician()) : null;
        User surveyor = (booking != null) ? booking.getSurveyor() : null;
        String serviceName = null;
        if (booking != null && booking.getBookingServices() != null && !booking.getBookingServices().isEmpty()) {
            serviceName = booking.getBookingServices().stream()
                    .map(bs -> (bs != null && bs.getService() != null) ? bs.getService().getName() : "")
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        String address = (booking != null) ? booking.getAddress() : null;
        Double totalAmount = (booking != null && booking.getTotalAmount() != null) ? booking.getTotalAmount().doubleValue() : null;
        String customerPhone = (customer != null) ? customer.getPhoneNumber() : null;

        return ReviewDto.builder()
                .id(review.getId())
                .bookingId(booking != null ? booking.getId() : null)
                .customerId(customer != null ? customer.getId() : null)
                .customerUsername(customer != null ? customer.getUsername() : null)
                .customerPhone(customerPhone)
                .technicianId(technician != null ? technician.getId() : null)
                .technicianUsername(technician != null ? technician.getUsername() : null)
                .surveyorId(surveyor != null ? surveyor.getId() : null)
                .surveyorUsername(surveyor != null ? surveyor.getUsername() : null)
                .serviceName(serviceName)
                .bookingAddress(address)
                .bookingTotalAmount(totalAmount)
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

