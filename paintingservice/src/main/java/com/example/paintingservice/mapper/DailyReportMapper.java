package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.DailyReportDto;
import com.example.paintingservice.entity.DailyReport;
import com.example.paintingservice.entity.User;

public class DailyReportMapper {

    private DailyReportMapper() {
        // Utility class
    }

    /**
     * Entity -> DTO
     */
    public static DailyReportDto toDto(DailyReport report) {

        if (report == null) {
            return null;
        }

        Long bookingId = null;
        Long reporterId = null;
        String reporterName = null;

        // Booking
        if (report.getBooking() != null) {
            bookingId = report.getBooking().getId();
        }

        // Reporter
        if (report.getReporter() != null) {
            User reporter = report.getReporter();

            reporterId = reporter.getId();

            // Ưu tiên fullName nếu User có field này
            if (reporter.getUsername() != null
                    && !reporter.getUsername().isBlank()) {

                reporterName = reporter.getUsername();

            } else {

                reporterName = reporter.getUsername();
            }
        }

        return DailyReportDto.builder()
                .id(report.getId())
                .bookingId(bookingId)
                .reporterId(reporterId)
                .reporterName(reporterName)
                .content(report.getContent())
                .progressPercentage(report.getProgressPercentage())
                .progressImages(report.getProgressImages())
                .materialShortage(report.getMaterialShortage())
                .createdAt(report.getCreatedAt())
                .build();
    }

    /**
     * DTO -> Entity
     *
     * Không map booking và reporter ở đây.
     * Hai object này được Service lấy từ database.
     */
    public static DailyReport toEntity(DailyReportDto dto) {

        if (dto == null) {
            return null;
        }

        return DailyReport.builder()
                .content(dto.getContent())
                .progressPercentage(dto.getProgressPercentage())
                .progressImages(dto.getProgressImages())
                .materialShortage(dto.getMaterialShortage())
                .build();
    }
}