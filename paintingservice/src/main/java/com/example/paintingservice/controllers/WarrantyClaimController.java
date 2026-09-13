package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.WarrantyClaimDto;
import com.example.paintingservice.service.WarrantyClaimService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warranty-claims")
@RequiredArgsConstructor
@Slf4j
public class WarrantyClaimController {

    private final WarrantyClaimService warrantyClaimService;

    /**
     * Khách hàng gửi yêu cầu bảo hành (kèm ảnh hiện trường)
     */
    @PostMapping(value = "/{bookingId}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_OCTET_STREAM_VALUE, "*/*" })
    public ResponseEntity<?> submitClaim(
            @PathVariable Long bookingId,
            @RequestParam(value = "issueType", required = false) String issueType,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "preferredDate", required = false) String preferredDateStr,
            @RequestParam(value = "preferredTime", required = false) String preferredTime,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Principal principal) {
        try {
            LocalDate parsedDate = null;
            if (preferredDateStr != null && !preferredDateStr.isBlank()) {
                try {
                    parsedDate = LocalDate.parse(preferredDateStr);
                } catch (Exception ignored) {
                }
            }

            WarrantyClaimDto req = WarrantyClaimDto.builder()
                    .issueType(issueType != null && !issueType.isBlank() ? issueType : "BONG_TROC")
                    .description(description != null && !description.isBlank() ? description : "Yêu cầu bảo hành")
                    .preferredDate(parsedDate)
                    .preferredTime(preferredTime)
                    .build();

            WarrantyClaimDto created = warrantyClaimService.createClaim(
                    bookingId,
                    req,
                    files,
                    principal.getName());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Gửi yêu cầu bảo hành thành công!",
                    "claim", created));
        } catch (Exception e) {
            log.error("Lỗi khi gửi yêu cầu bảo hành đơn #{}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Không thể gửi yêu cầu bảo hành",
                    "error", e.getClass().getSimpleName()));
        }
    }

    /**
     * Lấy danh sách phiếu bảo hành theo đơn hàng (Booking)
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<WarrantyClaimDto>> getClaimsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(warrantyClaimService.getClaimsByBooking(bookingId));
    }

    /**
     * Khách hàng xem tất cả phiếu bảo hành của mình
     */
    @GetMapping("/my-claims")
    public ResponseEntity<List<WarrantyClaimDto>> getMyClaims(Principal principal) {
        return ResponseEntity.ok(warrantyClaimService.getMyClaims(principal.getName()));
    }

    /**
     * Giám sát xem danh sách phiếu bảo hành được phân công
     */
    @GetMapping("/surveyor/my-claims")
    public ResponseEntity<List<WarrantyClaimDto>> getSurveyorClaims(Principal principal) {
        return ResponseEntity.ok(warrantyClaimService.getClaimsBySurveyor(principal.getName()));
    }

    /**
     * Thợ xem danh sách phiếu bảo hành được giao xử lý
     */
    @GetMapping("/technician/my-claims")
    public ResponseEntity<List<WarrantyClaimDto>> getTechnicianClaims(Principal principal) {
        return ResponseEntity.ok(warrantyClaimService.getClaimsByTechnician(principal.getName()));
    }

    /**
     * Admin xem danh sách tất cả phiếu bảo hành
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WarrantyClaimDto>> getAllClaims() {
        return ResponseEntity.ok(warrantyClaimService.getAllClaims());
    }

    /**
     * Xem chi tiết 1 phiếu bảo hành theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getClaimById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(warrantyClaimService.getClaimById(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Không tìm thấy phiếu bảo hành"));
        }
    }

    /**
     * 1. Admin phân công Giám sát đi khảo sát hiện trường
     */
    @PutMapping("/{id}/assign-surveyor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignSurveyor(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Long surveyorId = Long.parseLong(body.get("surveyorId").toString());
            String adminNote = (String) body.get("adminNote");

            WarrantyClaimDto updated = warrantyClaimService.assignSurveyor(id, surveyorId, adminNote);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã phân công Giám sát khảo sát hiện trường thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Phân công Giám sát thất bại"));
        }
    }

    /**
     * 2. Giám sát nộp Báo cáo khảo sát về Admin
     */
    @PostMapping(value = "/{id}/survey-report", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_OCTET_STREAM_VALUE, "*/*" })
    public ResponseEntity<?> submitSurveyReport(
            @PathVariable Long id,
            @RequestParam(value = "faultType", required = false) String faultType,
            @RequestParam(value = "surveyNote", required = false) String surveyNote,
            @RequestParam(value = "materialNote", required = false) String materialNote,
            @RequestParam(value = "suggestedPrice", required = false) BigDecimal suggestedPrice,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Principal principal) {
        try {
            WarrantyClaimDto updated = warrantyClaimService.submitSurveyReport(
                    id,
                    faultType,
                    surveyNote,
                    materialNote,
                    suggestedPrice,
                    files,
                    principal.getName());

            return ResponseEntity.ok(Map.of(
                    "message", "Đã gửi Báo cáo khảo sát thẩm định thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Gửi báo cáo thất bại"));
        }
    }

    /**
     * 3. Admin duyệt Lỗi bên mình & phân Đội thợ khắc phục (ưu tiên thợ cũ)
     */
    @PutMapping("/{id}/assign-technician")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTechnician(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Long technicianId = Long.parseLong(body.get("technicianId").toString());
            String adminNote = (String) body.get("adminNote");
            BigDecimal workerSalary = body.get("workerSalary") != null && !body.get("workerSalary").toString().isBlank()
                    ? new BigDecimal(body.get("workerSalary").toString())
                    : null;

            WarrantyClaimDto updated = warrantyClaimService.assignTechnician(id, technicianId, adminNote, workerSalary);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã phân công Đội thợ khắc phục bảo hành thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Phân công thợ thất bại"));
        }
    }

    /**
     * 3b. Admin chủ động cập nhật tiền công thợ / giám sát cho phiếu bảo hành
     */
    @PutMapping("/{id}/update-salaries")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateSalaries(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal workerSalary = body.get("workerSalary") != null && !body.get("workerSalary").toString().isBlank()
                    ? new BigDecimal(body.get("workerSalary").toString())
                    : null;
            BigDecimal surveyorSalary = body.get("surveyorSalary") != null && !body.get("surveyorSalary").toString().isBlank()
                    ? new BigDecimal(body.get("surveyorSalary").toString())
                    : null;

            WarrantyClaimDto updated = warrantyClaimService.updateSalaries(id, workerSalary, surveyorSalary);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã cập nhật tiền công nhân sự thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Cập nhật tiền công thất bại"));
        }
    }

    /**
     * 4. Admin Từ chối bảo hành (lỗi khách quan) & Gửi Báo giá gợi ý hỗ trợ
     */
    @PutMapping(value = { "/{id}/reject-with-support", "/{id}/reject" })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectWithSupportPrice(

            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            String adminNote = (String) body.get("adminNote");
            BigDecimal supportPrice = body.get("supportPrice") != null
                    ? new BigDecimal(body.get("supportPrice").toString())
                    : BigDecimal.ZERO;

            WarrantyClaimDto updated = warrantyClaimService.rejectWithSupportPrice(id, adminNote, supportPrice);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã gửi thông báo từ chối bảo hành và báo giá hỗ trợ đến khách hàng!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thao tác thất bại"));
        }
    }

    /**
     * 4b. Khách hàng phản hồi Đồng ý hoặc Từ chối báo giá sửa chữa hỗ trợ
     */
    @PostMapping("/{id}/customer-response")
    public ResponseEntity<?> respondToSupportOffer(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Principal principal) {
        try {
            Boolean accepted = Boolean
                    .parseBoolean(body.get("accepted") != null ? body.get("accepted").toString() : "false");
            String dateStr = (String) body.get("preferredDate");
            String timeStr = (String) body.get("preferredTime");
            String note = (String) body.get("customerNote");

            LocalDate parsedDate = null;
            if (dateStr != null && !dateStr.isBlank()) {
                try {
                    parsedDate = LocalDate.parse(dateStr);
                } catch (Exception ignored) {
                }
            }

            WarrantyClaimDto updated = warrantyClaimService.respondToSupportOffer(
                    id, accepted, parsedDate, timeStr, note, principal.getName());

            return ResponseEntity.ok(Map.of(
                    "message",
                    accepted ? "Bạn đã đồng ý báo giá hỗ trợ & chọn lịch thi công thành công!"
                            : "Bạn đã từ chối phương án sửa chữa có hỗ trợ.",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thao tác thất bại"));
        }
    }

    /**
     * 4c. Khách hàng thanh toán phí sửa chữa có hỗ trợ khi hoàn thành
     */
    @PostMapping("/{id}/customer-pay")
    public ResponseEntity<?> customerPay(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            Principal principal) {
        try {
            WarrantyClaimDto updated = warrantyClaimService.customerPay(id, principal.getName());
            return ResponseEntity.ok(Map.of(
                    "message", "Thanh toán phí hỗ trợ sửa chữa bảo hành thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thanh toán thất bại"));
        }
    }

    /**
     * 5. Thợ bấm Bắt đầu thi công bảo hành
     */
    @PostMapping("/{id}/worker-start")
    public ResponseEntity<?> workerStart(@PathVariable Long id, Principal principal) {
        try {
            WarrantyClaimDto updated = warrantyClaimService.workerStart(id, principal.getName());
            return ResponseEntity.ok(Map.of(
                    "message", "Đã xác nhận bắt đầu thi công khắc phục!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thao tác thất bại"));
        }
    }

    /**
     * 5b. Thợ từ chối nhận việc bảo hành (chờ Admin phân thợ khác)
     */
    @PostMapping("/{id}/technician-reject")
    public ResponseEntity<?> technicianReject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            Principal principal) {
        try {
            String reason = body != null && body.containsKey("reason") ? (String) body.get("reason")
                    : "Bận lịch / Lý do cá nhân";
            WarrantyClaimDto updated = warrantyClaimService.technicianReject(id, reason, principal.getName());
            return ResponseEntity.ok(Map.of(
                    "message",
                    "Đã từ chối nhận việc thành công! Hệ thống đã thông báo đến Ban Quản Trị để phân công thợ khác.",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thao tác thất bại"));
        }
    }

    /**
     * 6. Thợ bấm Báo hoàn thành thi công (1-click, chờ Giám sát nghiệm thu)
     */
    @PostMapping("/{id}/worker-complete")

    public ResponseEntity<?> workerComplete(@PathVariable Long id, Principal principal) {
        try {
            WarrantyClaimDto updated = warrantyClaimService.workerComplete(id, principal.getName());
            return ResponseEntity.ok(Map.of(
                    "message",
                    "Đã báo hoàn thành thi công! Hệ thống đã gửi thông báo đến Giám sát để nghiệm thu thực tế.",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thao tác thất bại"));
        }
    }

    /**
     * 7. Giám sát nghiệm thu hiện trường cùng khách hàng & gửi ảnh hoàn tất
     */
    @PostMapping(value = "/{id}/supervisor-accept", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_OCTET_STREAM_VALUE, "*/*" })
    public ResponseEntity<?> supervisorAccept(
            @PathVariable Long id,
            @RequestParam(value = "note", required = false) String note,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Principal principal) {
        try {
            WarrantyClaimDto updated = warrantyClaimService.supervisorAccept(id, note, files, principal.getName());
            return ResponseEntity.ok(Map.of(
                    "message", "Đã nghiệm thu hiện trường cùng khách hàng & gửi ảnh báo cáo thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Nghiệm thu thất bại"));
        }
    }

    /**
     * 8. Admin thanh toán thù lao bảo hành cho Nhân sự (Giám sát / Thợ thi công)
     */
    @PostMapping("/{id}/pay-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payStaff(
            @PathVariable Long id,
            @RequestParam(value = "role", defaultValue = "TECHNICIAN") String role,
            @RequestParam(value = "staffId", required = false) Long staffId,
            @RequestBody(required = false) Map<String, Object> body,
            Principal principal) {
        try {
            BigDecimal amount = null;
            if (body != null && body.get("amount") != null) {
                amount = new BigDecimal(body.get("amount").toString());
            }

            WarrantyClaimDto updated = warrantyClaimService.payStaff(id, staffId, role, amount, principal.getName());
            String roleName = "SURVEYOR".equalsIgnoreCase(role) ? "Giám Sát" : "Đội Thợ";
            return ResponseEntity.ok(Map.of(
                    "message", String.format("Đã quyết toán thù lao bảo hành cho %s thành công!", roleName),
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Thanh toán thất bại"));
        }
    }

    /**
     * 8b. Admin thanh toán tiền công bảo hành cho Thợ (backward-compatible)
     */
    @PostMapping("/{id}/pay-worker")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payWorker(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            Principal principal) {
        return payStaff(id, "TECHNICIAN", null, body, principal);
    }

    /**
     * Nghiệm thu hoàn tất bảo hành (kèm ảnh kết quả nếu có)
     */
    @PostMapping(value = "/{id}/complete", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_OCTET_STREAM_VALUE, "*/*" })
    public ResponseEntity<?> completeClaim(
            @PathVariable Long id,
            @RequestParam(value = "adminNote", required = false) String adminNote,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Principal principal) {
        try {
            WarrantyClaimDto updated = warrantyClaimService.completeClaim(id, adminNote, files, principal.getName());
            return ResponseEntity.ok(Map.of(
                    "message", "Đã nghiệm thu hoàn tất phiếu bảo hành!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Nghiệm thu thất bại"));
        }
    }

    /**
     * Cập nhật trạng thái tổng quát
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateClaimStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Principal principal) {
        try {
            String status = (String) body.get("status");
            String adminNote = (String) body.get("adminNote");
            Long technicianId = body.get("technicianId") != null
                    ? Long.parseLong(body.get("technicianId").toString())
                    : null;

            WarrantyClaimDto updated = warrantyClaimService.updateStatus(
                    id,
                    status,
                    adminNote,
                    technicianId,
                    principal.getName());

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật phiếu bảo hành thành công!",
                    "claim", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Cập nhật thất bại"));
        }
    }
}
