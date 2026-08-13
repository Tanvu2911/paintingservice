package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.DailyReportDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.DailyReport;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.mapper.DailyReportMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.DailyReportRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.CloudinaryService;
import com.example.paintingservice.service.DailyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DailyReportServiceImpl implements DailyReportService {

    private final DailyReportRepository dailyReportRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;


    // =========================================================
    // TẠO BÁO CÁO TIẾN ĐỘ
    // =========================================================

    @Override
    public DailyReportDto createReport(
            Long bookingId,
            DailyReportDto request,
            String username
    ) {

        // 1. Tìm Booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy booking với ID: " + bookingId
                        )
                );

        // 2. Tìm người tạo báo cáo
        User reporter = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy người dùng: " + username
                        )
                );

        // 3. Validate request
        if (request == null) {
            throw new RuntimeException(
                    "Dữ liệu báo cáo không được để trống"
            );
        }

        // 4. Validate nội dung
        if (request.getContent() == null
                || request.getContent().trim().isEmpty()) {

            throw new RuntimeException(
                    "Nội dung báo cáo không được để trống"
            );
        }

        // 5. Validate tiến độ
        if (request.getProgressPercentage() != null) {

            if (request.getProgressPercentage() < 0
                    || request.getProgressPercentage() > 100) {

                throw new RuntimeException(
                        "Tiến độ phải nằm trong khoảng 0 - 100%"
                );
            }
        }

        // 6. DTO -> Entity
        DailyReport report =
                DailyReportMapper.toEntity(request);

        // 7. Gắn Booking
        report.setBooking(booking);

        // 8. Gắn người tạo
        report.setReporter(reporter);

        // 9. Lưu
        DailyReport savedReport =
                dailyReportRepository.save(report);

        // 10. Entity -> DTO
        return DailyReportMapper.toDto(savedReport);
    }


    // =========================================================
    // LẤY DANH SÁCH BÁO CÁO THEO BOOKING
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<DailyReportDto> getReportsByBookingId(
            Long bookingId
    ) {

        // Kiểm tra Booking
        if (!bookingRepository.existsById(bookingId)) {

            throw new RuntimeException(
                    "Không tìm thấy booking với ID: " + bookingId
            );
        }

        return dailyReportRepository
                .findByBookingIdOrderByCreatedAtDesc(bookingId)
                .stream()
                .map(DailyReportMapper::toDto)
                .toList();
    }


    // =========================================================
    // UPLOAD ẢNH BÁO CÁO TIẾN ĐỘ
    // =========================================================

        @Override
        @Transactional
        public DailyReportDto uploadProgressImages(
                Long bookingId,
                List<MultipartFile> files,
                String note,
                String username
        ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User reporter = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + username));

        boolean isSurveyor = booking.getSurveyor() != null
                && booking.getSurveyor().getUsername() != null
                && booking.getSurveyor().getUsername().equals(username);

        boolean isTechnician = booking.getTechnician() != null
                && booking.getTechnician().getUsername() != null
                && booking.getTechnician().getUsername().equals(username);

        if (!isSurveyor && !isTechnician) {
                throw new RuntimeException("Bạn không có quyền upload ảnh tiến độ cho đơn này");
        }

        if (files == null || files.isEmpty()) {
                throw new RuntimeException("Vui lòng chọn ít nhất một ảnh");
        }

        // -------------------------------------------------
        // ★ Không tạo report mới nếu vừa có report text
        //   → lấy report mới nhất cùng reporter, chưa có ảnh
        // -------------------------------------------------
        DailyReport report = dailyReportRepository
                .findByBookingIdOrderByCreatedAtDesc(bookingId)
                .stream()
                .filter(r -> r.getReporter() != null
                        && r.getReporter().getUsername() != null
                        && r.getReporter().getUsername().equals(username))
                .filter(r -> r.getProgressImages() == null || r.getProgressImages().isBlank())
                .findFirst()
                .orElse(null);

        if (report == null) {
                // Không có report text nào → tạo mới (upload ảnh đơn lẻ)
                report = new DailyReport();
                report.setBooking(booking);
                report.setReporter(reporter);
                if (note != null && !note.isBlank()) {
                report.setContent(note.trim());
                } else {
                report.setContent("Báo cáo tiến độ công việc");
                }
        } else {
                // Có report text → chỉ bổ sung ảnh; cập nhật content nếu note khác
                if (note != null && !note.isBlank()
                        && (report.getContent() == null || report.getContent().isBlank())) {
                report.setContent(note.trim());
                }
        }

        // Upload Cloudinary
        List<String> imageUrls = new ArrayList<>();
        try {
                for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                String url = cloudinaryService.uploadImage(file, "progress/" + bookingId);
                if (url != null && !url.isBlank()) {
                        imageUrls.add(url);
                }
                }
        } catch (IOException e) {
                throw new RuntimeException("Upload ảnh tiến độ thất bại: " + e.getMessage(), e);
        }

        if (imageUrls.isEmpty()) {
                throw new RuntimeException("Không có ảnh nào được upload thành công");
        }

        // Gộp ảnh (nếu report đã có sẵn ảnh)
        if (report.getProgressImages() != null && !report.getProgressImages().isBlank()) {
                report.setProgressImages(
                        report.getProgressImages() + "," + String.join(",", imageUrls)
                );
        } else {
                report.setProgressImages(String.join(",", imageUrls));
        }

        DailyReport savedReport = dailyReportRepository.save(report);
        return DailyReportMapper.toDto(savedReport);
        }
}