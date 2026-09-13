package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.WarrantyClaim;
import com.example.paintingservice.enums.WarrantyStatus;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.WarrantyNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyNotificationServiceImpl implements WarrantyNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private String finalCustomerUsername(User customer) {
        return customer != null ? customer.getUsername() : "khách hàng";
    }

    private String mapWarrantyStatusToVietnamese(WarrantyStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING -> "Chờ tiếp nhận khảo sát";
            case SURVEY_ASSIGNED -> "Đã phân công giám sát khảo sát";
            case SURVEYED -> "Đã khảo sát hiện trường";
            case CUSTOMER_ACCEPTED_SUPPORT -> "Khách hàng đồng ý chi phí hỗ trợ";
            case ACCEPTED -> "Đã gán đội thợ thi công";
            case TECHNICIAN_REJECTED -> "Thợ từ chối nhận việc";
            case IN_PROGRESS -> "Đang triển khai thi công bảo hành";
            case WORKER_COMPLETED -> "Thợ đã hoàn thành, chờ nghiệm thu";
            case COMPLETED -> "Đã hoàn tất bảo hành";
            case REJECTED -> "Đã từ chối";
            case CANCELLED -> "Đã hủy";
        };
    }

    @Override
    public void notifyClaimCreated(WarrantyClaim claim) {
        Long bookingId = claim.getBooking().getId();
        String issueTitle = claim.getIssueTitle();
        User customer = claim.getCustomer();

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Yêu cầu bảo hành mới #%d", bookingId))
                    .content(String.format(
                            "Khách hàng @%s vừa gửi yêu cầu bảo hành cho công trình #%d: \"%s\". Vui lòng phân công Giám sát khảo sát.",
                            finalCustomerUsername(customer),
                            bookingId,
                            issueTitle))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (customer != null) {
            notificationService.save(Notification.builder()
                    .user(customer)
                    .title(String.format("Đã tiếp nhận yêu cầu bảo hành #%d", bookingId))
                    .content(String.format(
                            "Yêu cầu bảo hành công trình #%d đã được tiếp nhận. Đội ngũ kỹ thuật/giám sát sẽ liên hệ khảo sát trong 24-48h.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifySurveyorAssigned(WarrantyClaim claim, User surveyor, String adminNote) {
        Long bookingId = claim.getBooking().getId();
        notificationService.save(Notification.builder()
                .user(surveyor)
                .title(String.format("Nhiệm vụ khảo sát bảo hành #%d", bookingId))
                .content(String.format(
                        "Bạn được phân công khảo sát sự cố bảo hành cho đơn #%d tại %s. Ghi chú của Admin: %s. Thù lao khảo sát & nghiệm thu: 150.000đ.",
                        bookingId,
                        claim.getBooking().getAddress(),
                        adminNote != null && !adminNote.isBlank() ? adminNote : "Khảo sát và ghi nhận hiện trạng tường."))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Đã phân công Giám sát khảo sát bảo hành #%d", bookingId))
                    .content(String.format(
                            "Chuyên viên giám sát @%s (SĐT: %s) đã được phân công đến kiểm tra hiện trường công trình của bạn.",
                            surveyor.getUsername(),
                            surveyor.getPhoneNumber() != null ? surveyor.getPhoneNumber() : "Đang cập nhật"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifySurveyReportSubmitted(WarrantyClaim claim) {
        Long bookingId = claim.getBooking().getId();
        String faultType = (claim.getReport() != null && claim.getReport().getFaultType() != null)
                ? claim.getReport().getFaultType() : "COMPANY_FAULT";
        String faultLabel = "COMPANY_FAULT".equalsIgnoreCase(faultType)
                ? "Lỗi kỹ thuật thi công bên mình (Bảo hành 0đ)"
                : "Lỗi khách quan ngoại lực (Đề xuất hỗ trợ)";

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin ->
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Báo cáo khảo sát bảo hành #%d", bookingId))
                    .content(String.format(
                            "Giám sát đã nộp báo cáo khảo sát bảo hành cho đơn #%d. Kết luận: %s.",
                            bookingId, faultLabel))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build())
        );

        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Đã có kết quả khảo sát bảo hành #%d", bookingId))
                    .content(String.format(
                            "Chuyên viên đã hoàn tất khảo sát hiện trường đơn #%d. Ban quản trị đang xử lý phương án khắc phục.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyTechnicianAssigned(WarrantyClaim claim, User technician, String adminNote) {
        Long bookingId = claim.getBooking().getId();
        String noteContent = (adminNote != null && !adminNote.isBlank()) ? adminNote
                : "Vật tư do Giám sát trực tiếp chuẩn bị, bạn đến kiểm tra và tiến hành thi công dặm vá.";

        notificationService.save(Notification.builder()
                .user(technician)
                .title(String.format("Giao việc xử lý bảo hành #%d", bookingId))
                .content(String.format("Bạn được phân công khắc phục bảo hành cho công trình #%d tại %s. Dặn dò: %s",
                        bookingId,
                        claim.getBooking().getAddress(),
                        noteContent))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        if (claim.getCustomer() != null) {
            String scheduleInfo = claim.getPreferredDate() != null
                    ? String.format(" theo lịch hẹn của bạn (%s %s)", claim.getPreferredDate(),
                    claim.getPreferredTime() != null ? claim.getPreferredTime() : "")
                    : "";

            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Đã phân công Đội thợ xử lý bảo hành #%d", bookingId))
                    .content(String.format(
                            "Đội thợ @%s (SĐT: %s) đã tiếp nhận xử lý sự cố bảo hành cho công trình #%d%s. Thợ sẽ liên hệ trước khi đến.",
                            technician.getUsername(),
                            technician.getPhoneNumber() != null ? technician.getPhoneNumber() : "Đang cập nhật",
                            bookingId,
                            scheduleInfo))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifySupportPriceRejected(WarrantyClaim claim, String username) {
        Long bookingId = claim.getBooking().getId();
        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Khách hàng đã từ chối giá hỗ trợ #%d", bookingId))
                    .content(String.format(
                            "Khách hàng @%s đã từ chối phương án sửa chữa có hỗ trợ cho đơn bảo hành #%d. Phiếu bảo hành đã được đóng.",
                            username, bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Khách từ chối sửa chữa hỗ trợ #%d", bookingId))
                    .content(String.format(
                            "Khách hàng đơn #%d đã từ chối báo giá sửa chữa hỗ trợ. Phiếu bảo hành đã đóng.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyCustomerAgreedSupport(WarrantyClaim claim, BigDecimal supportPrice, String note) {
        Long bookingId = claim.getBooking().getId();
        String noteSuffix = (note != null && !note.isBlank()) ? String.format(". Lời nhắn của khách: \"%s\"", note.trim()) : "";

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Khách hàng đã đồng ý giá hỗ trợ #%d", bookingId))
                    .content(String.format(
                            "Khách hàng đã đồng ý phương án hỗ trợ (%,.0f VNĐ) cho đơn bảo hành #%d%s. Vui lòng phân công Đội thợ thi công.",
                            supportPrice != null ? supportPrice.doubleValue() : 0.0,
                            bookingId,
                            noteSuffix))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Khách hàng đồng ý sửa chữa hỗ trợ #%d", bookingId))
                    .content(String.format(
                            "Khách hàng đơn #%d đã đồng ý phương án sửa chữa có hỗ trợ (%,.0f VNĐ)%s. Admin sẽ phân công Đội thợ và bạn sẽ nghiệm thu sau khi hoàn thiện.",
                            bookingId,
                            supportPrice != null ? supportPrice.doubleValue() : 0.0,
                            noteSuffix))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyWorkerStarted(WarrantyClaim claim) {
        Long bookingId = claim.getBooking().getId();
        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Thợ đã bắt đầu thi công bảo hành #%d", bookingId))
                    .content(String.format(
                            "Đội thợ đã có mặt tại hiện trường công trình #%d và bắt đầu triển khai thi công khắc phục.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyTechnicianRejected(WarrantyClaim claim, String technicianName, String reason) {
        Long bookingId = claim.getBooking().getId();
        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Thợ từ chối nhận việc bảo hành #%d", bookingId))
                    .content(String.format(
                            "Thợ @%s đã từ chối nhận khắc phục bảo hành cho đơn #%d tại %s. Lý do: %s. Vui lòng phân công Đội thợ khác.",
                            technicianName,
                            bookingId,
                            claim.getBooking().getAddress(),
                            reason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Thợ từ chối bảo hành #%d", bookingId))
                    .content(String.format(
                            "Thợ @%s đã từ chối nhận xử lý bảo hành đơn #%d (Lý do: %s). Admin đang phân công Thợ khác.",
                            technicianName,
                            bookingId,
                            reason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyWorkerCompleted(WarrantyClaim claim) {
        Long bookingId = claim.getBooking().getId();
        if (claim.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getSurveyor())
                    .title(String.format("Cần nghiệm thu công trình bảo hành #%d", bookingId))
                    .content(String.format(
                            "Đội thợ đã hoàn thành khắc phục bảo hành cho đơn #%d. Bạn hãy đến hiện trường kiểm tra, chụp ảnh báo cáo nghiệm thu cùng khách hàng.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Đội thợ đã báo làm xong bảo hành #%d", bookingId))
                    .content(String.format(
                            "Đội thợ đã hoàn thành khắc phục đơn #%d. Giám sát đang tiến hành nghiệm thu thực tế cùng khách hàng.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });
    }

    @Override
    public void notifySupervisorAccepted(WarrantyClaim claim) {
        Long bookingId = claim.getBooking().getId();
        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Giám sát đã nghiệm thu hoàn tất bảo hành #%d", bookingId))
                    .content(String.format(
                            "Giám sát đã nghiệm thu chất lượng công trình bảo hành đơn #%d cùng khách hàng kèm ảnh hoàn thiện. Bạn có thể vào xem báo cáo và quyết toán tiền công cho thợ.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Nghiệm thu hoàn tất bảo hành #%d", bookingId))
                    .content(String.format(
                            "Công trình #%d đã được Giám sát nghiệm thu hoàn tất bảo hành cùng bạn. Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Sơn Sửa 247!",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyStaffPaid(WarrantyClaim claim, User staff, String role, BigDecimal payAmount) {
        Long bookingId = claim.getBooking().getId();
        String title = "SUPERVISOR".equalsIgnoreCase(role)
                ? String.format("Đã nhận thù lao bảo hành #%d", bookingId)
                : String.format("Đã nhận thù lao thi công bảo hành #%d", bookingId);

        String content = "SUPERVISOR".equalsIgnoreCase(role)
                ? String.format("Admin đã thanh toán thù lao khảo sát & nghiệm thu bảo hành %,.0f VNĐ cho đơn #%d vào ví thu nhập của bạn.",
                payAmount != null ? payAmount.doubleValue() : 0.0, bookingId)
                : String.format("Admin đã quyết toán tiền công khắc phục bảo hành %,.0f VNĐ cho đơn #%d vào ví thu nhập của bạn.",
                payAmount != null ? payAmount.doubleValue() : 0.0, bookingId);

        notificationService.save(Notification.builder()
                .user(staff)
                .title(title)
                .content(content)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());
    }

    @Override
    public void notifyStatusUpdated(WarrantyClaim claim, String adminNote) {
        Long bookingId = claim.getBooking().getId();
        String statusVN = mapWarrantyStatusToVietnamese(claim.getStatus());

        if (claim.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getCustomer())
                    .title(String.format("Cập nhật phiếu bảo hành #%d", bookingId))
                    .content(String.format("Phiếu yêu cầu bảo hành của bạn hiện ở trạng thái: %s.%s",
                            statusVN,
                            adminNote != null && !adminNote.isBlank() ? " Ghi chú: " + adminNote : ""))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyCustomerPaid(WarrantyClaim claim, BigDecimal price) {
        Long bookingId = claim.getBooking().getId();
        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title(String.format("Khách hàng đã thanh toán phí bảo hành #%d", bookingId))
                    .content(String.format("Khách hàng đã thanh toán số tiền %,.0f VNĐ cho phiếu bảo hành đơn #%d.",
                            price != null ? price.doubleValue() : 0.0,
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (claim.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(claim.getTechnician())
                    .title(String.format("Khách đã thanh toán phí bảo hành #%d", bookingId))
                    .content(String.format("Khách hàng đã thanh toán phí bảo hành cho đơn #%d. Admin sẽ tiến hành quyết toán thù lao cho bạn.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }
}
