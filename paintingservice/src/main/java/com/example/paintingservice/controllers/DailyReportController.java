package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.DailyReportDto;
import com.example.paintingservice.service.DailyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/daily-reports")
@RequiredArgsConstructor
public class DailyReportController {

    private final DailyReportService dailyReportService;


    // =========================================================
    // TẠO BÁO CÁO
    // =========================================================

    @PostMapping("/{bookingId}")
    @PreAuthorize("hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('TECHNICIAN')")
    public ResponseEntity<DailyReportDto> createReport(
            @PathVariable Long bookingId,
            @RequestBody DailyReportDto request,
            Principal principal
    ) {

        DailyReportDto result =
                dailyReportService.createReport(
                        bookingId,
                        request,
                        principal.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(result);
    }


    // =========================================================
    // LẤY BÁO CÁO THEO BOOKING
    // =========================================================

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<DailyReportDto>> getReports(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                dailyReportService.getReportsByBookingId(
                        bookingId
                )
        );
    }


    // =========================================================
    // UPLOAD ẢNH TIẾN ĐỘ
    // =========================================================

    @PostMapping(
            value = "/{bookingId}/progress-images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize(
            "hasRole('STAFF') or " +
            "hasRole('SUPERVISOR') or " +
            "hasRole('TECHNICIAN') or " +
            "hasRole('ADMIN')"
    )
    public ResponseEntity<?> uploadProgressImages(

            @PathVariable Long bookingId,

            @RequestParam("files")
            List<MultipartFile> files,

            @RequestParam(
                    value = "note",
                    required = false
            )
            String note,

            Principal principal
    ) {

        try {

            DailyReportDto dto =
                    dailyReportService.uploadProgressImages(
                            bookingId,
                            files,
                            note,
                            principal.getName()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Upload ảnh tiến độ thành công",

                            "report",
                            dto
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Upload ảnh thất bại",

                                    "errorType",
                                    e.getClass().getSimpleName()
                            )
                    );
        }
    }
}