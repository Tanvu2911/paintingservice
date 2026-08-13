package com.example.paintingservice.service;

import com.example.paintingservice.dto.DailyReportDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DailyReportService {

    DailyReportDto createReport(
            Long bookingId,
            DailyReportDto request,
            String username
    );

    List<DailyReportDto> getReportsByBookingId(Long bookingId);

    DailyReportDto uploadProgressImages(
            Long bookingId,
            List<MultipartFile> files,
            String note,
            String username
    );
}