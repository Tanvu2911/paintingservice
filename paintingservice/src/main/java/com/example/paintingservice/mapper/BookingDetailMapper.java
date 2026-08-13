package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.BookingDetailDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.BookingDetail;

public final class BookingDetailMapper {
    private BookingDetailMapper() { }

    public static BookingDetailDto toDto(BookingDetail detail) {
        if (detail == null) return null;
        return BookingDetailDto.builder()
                .id(detail.getId())
                .bookingId(detail.getBooking() == null ? null : detail.getBooking().getId())
                .surveyNote(detail.getSurveyNote())
                .materialNote(detail.getMaterialNote())
                .surveyImages(detail.getSurveyImages())
                .materialShortage(detail.getMaterialShortage())
                .supervisorAccepted(detail.getSupervisorAccepted())
                .customerAccepted(detail.getCustomerAccepted())
                .createdAt(detail.getCreatedAt())
                .updatedAt(detail.getUpdatedAt())
                .build();
    }

    public static BookingDetail toEntity(BookingDetailDto dto, Booking booking) {
        if (dto == null) return null;
        BookingDetail detail = BookingDetail.builder().booking(booking).build();
        updateEntity(dto, detail);
        return detail;
    }

    public static void updateEntity(BookingDetailDto dto, BookingDetail detail) {
        detail.setSurveyNote(dto.getSurveyNote());
        detail.setMaterialNote(dto.getMaterialNote());
        detail.setSurveyImages(dto.getSurveyImages());
        detail.setMaterialShortage(dto.getMaterialShortage());
    }
}
