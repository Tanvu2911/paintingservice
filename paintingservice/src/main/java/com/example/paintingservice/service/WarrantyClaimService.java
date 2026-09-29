package com.example.paintingservice.service;

import com.example.paintingservice.dto.WarrantyClaimDto;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface WarrantyClaimService {
    WarrantyClaimDto createClaim(Long bookingId, WarrantyClaimDto request, List<MultipartFile> images, String username);

    WarrantyClaimDto getClaimById(Long id);

    List<WarrantyClaimDto> getClaimsByBooking(Long bookingId);

    List<WarrantyClaimDto> getMyClaims(String username);

    List<WarrantyClaimDto> getAllClaims();

    List<WarrantyClaimDto> getClaimsBySurveyor(String username);

    List<WarrantyClaimDto> getClaimsByTechnician(String username);

    // 1. Admin gán Giám sát đi khảo sát
    WarrantyClaimDto assignSurveyor(Long claimId, Long surveyorId, String adminNote);

    // 1b. Giám sát bấm Tiếp nhận khảo sát (nhận việc)
    WarrantyClaimDto surveyorAcceptJob(Long claimId, String username);

    // 1c. Giám sát từ chối nhận việc khảo sát (chờ Admin phân người khác)
    WarrantyClaimDto surveyorReject(Long claimId, String reason, String username);


    // 1e. Khách hàng chỉnh sửa yêu cầu bảo hành (trước khi Giám sát nhận việc)
    WarrantyClaimDto updateClaim(Long claimId, WarrantyClaimDto request, List<MultipartFile> newImages,
            String existingImageUrls, String username);

    // 1f. Khách hàng xóa yêu cầu bảo hành (trước khi Giám sát nhận việc)
    void deleteClaim(Long claimId, String username);

    // 2. Giám sát nộp Báo cáo khảo sát
    WarrantyClaimDto submitSurveyReport(Long claimId, String faultType, String surveyNote, String materialNote,
            BigDecimal suggestedPrice, List<MultipartFile> surveyImages, String username);

    // 3. Admin duyệt Lỗi bên mình & phân Đội thợ khắc phục (ưu tiên thợ cũ)
    WarrantyClaimDto assignTechnician(Long claimId, Long technicianId, String adminNote);

    WarrantyClaimDto assignTechnician(Long claimId, Long technicianId, String adminNote, BigDecimal workerSalary);

    WarrantyClaimDto updateSalaries(Long claimId, BigDecimal workerSalary, BigDecimal surveyorSalary);

    // 4. Admin Từ chối bảo hành (lỗi khách quan) & gửi báo giá hỗ trợ
    WarrantyClaimDto rejectWithSupportPrice(Long claimId, String adminNote, BigDecimal supportPrice);

    // 4b. Khách hàng phản hồi Đồng ý hoặc Từ chối báo giá sửa chữa hỗ trợ
    WarrantyClaimDto respondToSupportOffer(Long claimId, Boolean accepted, LocalDate preferredDate,
            String preferredTime, String customerNote, String username);

    // 5. Thợ bắt đầu thi công
    WarrantyClaimDto workerStart(Long claimId, String username);

    // 5b. Thợ từ chối nhận việc bảo hành (chờ Admin phân thợ khác)
    WarrantyClaimDto technicianReject(Long claimId, String reason, String username);

    // 6. Thợ báo làm xong (chuyển sang chờ Giám sát nghiệm thu)
    WarrantyClaimDto workerComplete(Long claimId, String username);

    // 7. Giám sát nghiệm thu hiện trường cùng khách hàng & gửi ảnh hoàn thành
    WarrantyClaimDto supervisorAccept(Long claimId, String note, List<MultipartFile> resolvedImages, String username);

    // 8. Admin thanh toán tiền công bảo hành cho Thợ
    WarrantyClaimDto payWorker(Long claimId, BigDecimal amount, String adminUsername);

    // 8b. Admin thanh toán thù lao bảo hành cho Nhân sự (Giám sát / Thợ thi công)
    WarrantyClaimDto payStaff(Long claimId, Long staffId, String role, BigDecimal amount, String adminUsername);

    // 9. Nghiệm thu hoàn tất bảo hành (backward compatible)
    WarrantyClaimDto completeClaim(Long claimId, String adminNote, List<MultipartFile> resolvedImages, String username);

    // 9b. Khách hàng thanh toán phí hỗ trợ sửa chữa
    WarrantyClaimDto customerPay(Long claimId, String username);

    // 10. Cập nhật trạng thái tổng quát
    WarrantyClaimDto updateStatus(Long claimId, String status, String adminNote, Long technicianId, String username);
}
