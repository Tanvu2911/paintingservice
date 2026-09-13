package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.ServiceEntity;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.repository.ServiceEntityRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BookingNotificationService;
import com.example.paintingservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationServiceImpl implements BookingNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ServiceEntityRepository serviceEntityRepository;

    private String getServiceName(Booking booking) {
        if (booking.getService() != null && booking.getService().getName() != null) {
            return booking.getService().getName();
        }
        if (booking.getService() != null && booking.getService().getId() != null) {
            return serviceEntityRepository.findById(booking.getService().getId())
                    .map(ServiceEntity::getName).orElse("Dịch vụ");
        }
        return "Dịch vụ";
    }

    private String mapBookingStatusToVietnamese(BookingStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING -> "Đang chờ xử lý";
            case SURVEY_ASSIGNED -> "Đã phân công khảo sát";
            case SURVEY_REJECTED -> "Từ chối khảo sát";
            case WAITING_ADMIN_QUOTE -> "Chờ Admin gửi báo giá";
            case WAITING_CONTRACT_APPROVAL -> "Chờ duyệt hợp đồng (Cũ)";
            case WAITING_CUSTOMER_QUOTE_APPROVAL -> "Chờ khách hàng duyệt báo giá";
            case CUSTOMER_ACCEPTED_QUOTE -> "Khách hàng đã đồng ý báo giá";
            case WAITING_CUSTOMER_SIGNATURE -> "Chờ khách hàng ký hợp đồng";
            case WAITING_DEPOSIT -> "Chờ thanh toán cọc";
            case DEPOSIT_CONFIRMED -> "Đã thanh toán cọc";
            case CONTRACT_APPROVED -> "Đã duyệt hợp đồng";
            case ASSIGNED -> "Đã phân công kỹ thuật viên";
            case ACCEPTED -> "Kỹ thuật viên đã nhận việc";
            case PROCESSING -> "Đang thi công";
            case WORKER_COMPLETED -> "Thợ đã hoàn thành, chờ nghiệm thu";
            case COMPLETED -> "Đã hoàn thành";
            case CANCELLED -> "Đã hủy";
            default -> status.toString();
        };
    }

    @Override
    public void notifyBookingCreated(Booking saved, User autoSupervisor) {
        String serviceName = getServiceName(saved);
        User customer = saved.getCustomer();
        String customerName = customer != null ? customer.getUsername() : "Khách hàng";

        if (autoSupervisor != null) {
            // 1. Thông báo cho Khách hàng: Có giám sát được phân công
            if (customer != null) {
                String supervisorContact = (autoSupervisor.getPhoneNumber() != null
                        && !autoSupervisor.getPhoneNumber().isBlank())
                        ? " (SĐT: " + autoSupervisor.getPhoneNumber() + ")"
                        : "";
                notificationService.save(Notification.builder()
                        .user(customer)
                        .title("Đã phân công giám sát viên #" + saved.getId())
                        .content(String.format(
                                "Yêu cầu #%d (%s) đã được tiếp nhận và tự động phân công cho Giám sát viên @%s%s. Giám sát viên sẽ liên hệ với bạn trước giờ hẹn.",
                                saved.getId(), serviceName, autoSupervisor.getUsername(), supervisorContact))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            // 2. Thông báo cho Giám sát viên: Nhận nhiệm vụ khảo sát
            notificationService.save(Notification.builder()
                    .user(autoSupervisor)
                    .title("Nhiệm vụ khảo sát mới #" + saved.getId())
                    .content(String.format(
                            "Hệ thống đã tự động phân công bạn khảo sát đơn hàng #%d (Dịch vụ: %s, Địa chỉ: %s). Vui lòng kiểm tra lịch hẹn.",
                            saved.getId(), serviceName,
                            saved.getAddress() != null ? saved.getAddress() : "Theo đơn"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());

            // 3. Thông báo cho Admin: Đơn đã được tự động gán
            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Đơn khảo sát mới đã tự động phân công #" + saved.getId())
                        .content(String.format(
                                "Đơn hàng #%d (%s) của khách %s đã được tự động phân công cho giám sát @%s. Admin có thể kiểm tra và thay đổi nếu cần.",
                                saved.getId(), serviceName, customerName, autoSupervisor.getUsername()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });
        } else {
            // Fallback: Không có giám sát viên khả dụng -> Báo Admin phân công thủ công
            if (customer != null) {
                notificationService.save(Notification.builder()
                        .user(customer)
                        .title("Gửi yêu cầu thành công")
                        .content(String.format("Yêu cầu #%d (%s) đã được gửi thành công và đang chờ xử lý.",
                                saved.getId(), serviceName))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Yêu cầu khảo sát mới (Cần phân công thủ công)")
                        .content(String.format(
                                "Khách hàng %s vừa gửi yêu cầu #%d cho dịch vụ '%s'. Hiện chưa có giám sát viên khả dụng, vui lòng phân công thủ công!",
                                customerName, saved.getId(), serviceName))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });
        }
    }

    @Override
    public void notifyBookingUpdated(Booking old, BookingDto dto, String currentUsername,
                                    boolean statusChanged, boolean detailsChanged, boolean technicianChanged) {
        Long id = old.getId();
        String serviceName = getServiceName(old);

        User actor = userRepository.findByUsername(currentUsername).orElse(null);
        String actorDisplayName = (actor != null && actor.getUsername() != null) ? actor.getUsername() : currentUsername;

        User customerEntity = old.getCustomer();
        User techEntity = (dto.getTechnicianId() != null)
                ? userRepository.findById(dto.getTechnicianId()).orElse(null)
                : old.getTechnician();

        // 1. Thông báo cho khách hàng
        if (statusChanged && customerEntity != null) {
            String statusVN = mapBookingStatusToVietnamese(dto.getStatus());
            String friendlyMsg = switch (dto.getStatus()) {
                case ACCEPTED -> "Yêu cầu của bạn đã được kỹ thuật viên tiếp nhận và sẽ sớm đến xử lý.";
                case PROCESSING -> "Kỹ thuật viên đang thi công công trình của bạn.";
                case COMPLETED -> "Kỹ thuật viên đã hoàn thành công việc.";
                default -> String.format("Yêu cầu của bạn hiện đang ở trạng thái: %s", statusVN);
            };

            String content = String.format("Dịch vụ %s: %s", serviceName, friendlyMsg);
            if (techEntity != null) {
                content += " - Kỹ thuật viên: " + (techEntity.getUsername() != null ? techEntity.getUsername() : "");
            }

            notificationService.save(Notification.builder()
                    .user(customerEntity)
                    .title("Cập nhật tiến độ #" + id)
                    .content(content)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        // 2. Thông báo cho Admin
        if (statusChanged || detailsChanged || technicianChanged) {
            String statusVN = mapBookingStatusToVietnamese(dto.getStatus());
            List<User> admins = userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN);

            boolean isNegotiation = dto.getDescription() != null &&
                    dto.getDescription().startsWith("[Đề xuất thương lượng giá");

            final String finalStatusVN = statusVN;
            admins.forEach(admin -> {
                if (!admin.getUsername().equals(currentUsername)) {
                    if (isNegotiation) {
                        String negContent = dto.getDescription()
                                .replaceAll("^\\[Đề xuất thương lượng giá[^\\]]*\\]\\s*", "");
                        notificationService.save(Notification.builder()
                                .user(admin)
                                .title("🔔 Khách hàng yêu cầu thương lượng giá đơn #" + id)
                                .content(String.format(
                                        "Khách hàng %s chưa đồng ý báo giá dịch vụ '%s' và muốn thương lượng lại. Nội dung: \"%s\". Vui lòng liên hệ để thỏa thuận và cập nhật báo giá.",
                                        actorDisplayName, serviceName, negContent))
                                .createdAt(LocalDateTime.now())
                                .isRead(false)
                                .build());
                    } else {
                        notificationService.save(Notification.builder()
                                .user(admin)
                                .title("Cập nhật đơn hàng #" + id)
                                .content(String.format(
                                        "Tài khoản %s đã cập nhật trạng thái đơn '%s' thành: %s",
                                        actorDisplayName, serviceName, finalStatusVN))
                                .createdAt(LocalDateTime.now())
                                .isRead(false)
                                .build());
                    }
                }
            });
        }

        // 3. Thông báo cho Kỹ thuật viên
        if (techEntity != null && (statusChanged || detailsChanged || technicianChanged)) {
            String techTitle = (technicianChanged && dto.getTechnicianId() == null)
                    ? "Hủy phân công nhiệm vụ #" + id
                    : (technicianChanged ? "Nhiệm vụ mới được phân công" : "Cập nhật nhiệm vụ #" + id);
            String statusVN = mapBookingStatusToVietnamese(dto.getStatus());
            String customerName = (customerEntity != null) ? customerEntity.getUsername() : "Khách hàng";

            String techContent = technicianChanged
                    ? (dto.getTechnicianId() == null
                    ? String.format("Bạn không còn đảm nhận yêu cầu #%d (%s) nữa.", id, serviceName)
                    : String.format("Bạn được phân công yêu cầu #%d (%s) cho khách hàng %s tại %s.",
                    id, serviceName, customerName, dto.getAddress()))
                    : String.format("Hệ thống đã cập nhật yêu cầu #%d (%s). Trạng thái hiện tại: %s",
                    id, serviceName, statusVN);

            notificationService.save(Notification.builder()
                    .user(techEntity)
                    .title(techTitle)
                    .content(techContent)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyBookingDeleted(Booking booking, String currentUsername) {
        Long id = booking.getId();
        String serviceName = getServiceName(booking);

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hủy yêu cầu")
                    .content(String.format("Yêu cầu #%d (%s) đã bị xóa khỏi hệ thống bởi %s.", id, serviceName, currentUsername))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        if (booking.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getTechnician())
                    .title("Hủy nhiệm vụ")
                    .content(String.format("Nhiệm vụ #%d (%s) đã được gỡ bỏ khỏi danh sách của bạn.", id, serviceName))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            if (!admin.getUsername().equals(currentUsername)) {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Đã xóa đơn #" + id)
                        .content(String.format("Người dùng %s đã xóa đơn '%s' khỏi hệ thống.", currentUsername, serviceName))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }
        });
    }

    @Override
    public void notifySupervisorAssigned(Booking booking, User supervisor, User previousSupervisor) {
        Long bookingId = booking.getId();

        notificationService.save(Notification.builder()
                .user(supervisor)
                .title("Phân công khảo sát #" + bookingId)
                .content(String.format(
                        "Bạn được phân công khảo sát đơn hàng #%d (Địa chỉ: %s). Thù lao giám sát: 10%% giá trị hợp đồng + hoàn tiền vật tư bổ sung khi hoàn tất.",
                        bookingId,
                        booking.getAddress() != null ? booking.getAddress() : "Theo đơn"))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        // Nếu Admin đổi người khác -> gửi thông báo hủy nhiệm vụ cho giám sát cũ
        if (previousSupervisor != null && !previousSupervisor.getId().equals(supervisor.getId())) {
            notificationService.save(Notification.builder()
                    .user(previousSupervisor)
                    .title("Điều phối lại đơn khảo sát #" + bookingId)
                    .content(String.format(
                            "Đơn hàng #%d đã được Admin điều phối lại cho nhân sự khác. Bạn không cần thực hiện khảo sát đơn này nữa.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyQuoteSent(Booking booking, BigDecimal total, boolean isReQuote) {
        Long id = booking.getId();
        NumberFormat nf = NumberFormat.getInstance(Locale.of("vi", "VN"));

        if (booking.getCustomer() != null) {
            String notifTitle = isReQuote
                    ? "Báo giá đã được cập nhật - Đơn #" + id
                    : "Hợp đồng & Báo giá sẵn sàng ký #" + id;
            String notifContent = isReQuote
                    ? "Admin đã cập nhật lại báo giá cho đơn #" + id
                    + " sau thương lượng. Tổng mới: "
                    + nf.format(total)
                    + " VNĐ. Vui lòng vào ứng dụng xem và phản hồi."
                    : "Admin đã lập hợp đồng chi tiết và báo giá cho đơn hàng #" + id
                    + ". Vui lòng vào ứng dụng xem nội dung và ký điện tử.";
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title(notifTitle)
                    .content(notifContent)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyDepositConfirmed(Booking booking, User autoWorker) {
        if (autoWorker == null && booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hợp đồng đã ký duyệt & Xác nhận cọc #" + booking.getId())
                    .content("Admin đã ký duyệt hợp đồng và xác nhận tiền cọc thành công. Hệ thống đang tìm kiếm và bàn giao đội thợ thi công phù hợp nhất.")
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyTeamAssigned(Booking booking, User technician, BigDecimal workerFee) {
        Long id = booking.getId();
        notificationService.save(Notification.builder()
                .user(technician)
                .title("Phân công thi công #" + id)
                .content(String.format(
                        "Bạn đã được phân công thi công đơn hàng #%d (Địa chỉ: %s). Thù lao thi công của bạn: %s đ (60%% giá trị công trình). Quyết toán sau khi hoàn tất.",
                        id,
                        booking.getAddress() != null ? booking.getAddress() : "Theo đơn",
                        String.format("%,d", workerFee.longValue())))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());
    }

    @Override
    public void notifyStaffPaid(Booking booking) {
        Long id = booking.getId();
        if (booking.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getTechnician())
                    .title("Xác nhận thanh toán #" + id)
                    .content(String.format("Chi phí thù lao cho đơn hàng #%d đã được quyết toán.", id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyJobAccepted(Booking booking, String username) {
        Long bookingId = booking.getId();

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Thợ đã nhận việc #" + bookingId)
                    .content(String.format(
                            "Đội thợ %s đã xác nhận nhận thi công đơn hàng #%d (Địa chỉ: %s).",
                            username, bookingId,
                            booking.getAddress() != null ? booking.getAddress() : "Theo đơn"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Đội thợ đã tiếp nhận công trình #" + bookingId)
                    .content(String.format(
                            "Đội thợ %s đã tiếp nhận đơn hàng #%d của bạn và chuẩn bị thi công đúng kế hoạch.",
                            username, bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyJobRejected(Booking booking, String username, String reason) {
        Long bookingId = booking.getId();
        String rejectReason = (reason != null && !reason.isBlank()) ? reason.trim() : "Không ghi rõ lý do";

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Thợ từ chối nhận việc #" + bookingId)
                    .content(String.format(
                            "Đội thợ %s đã từ chối nhận thi công đơn #%d. Lý do: %s. Vui lòng phân công đội thợ khác.",
                            username, bookingId, rejectReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Điều phối lại đội thợ #" + bookingId)
                    .content(String.format(
                            "Đơn hàng #%d đang được hệ thống điều phối lại đội thợ thi công phù hợp nhất cho công trình của bạn.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyJobStarted(Booking booking, String username) {
        Long id = booking.getId();

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Bắt đầu thi công đơn #" + id)
                    .content(String.format("Đội thợ %s đã bắt đầu triển khai thi công đơn hàng #%d.", username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Công trình đang thi công #" + id)
                    .content(String.format("Đội thợ %s đã chính thức bắt đầu thi công công trình #%d của bạn.", username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifyJobCompleted(Booking booking, String username) {
        Long id = booking.getId();

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Thợ báo hoàn thành thi công #" + id)
                    .content(String.format(
                            "Đội thợ %s đã báo hoàn thành thi công công trình #%d. Đang chờ Giám sát và Khách hàng nghiệm thu.",
                            username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (booking.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getSurveyor())
                    .title("Thợ báo hoàn thành #" + id)
                    .content(String.format(
                            "Đội thợ %s đã hoàn thành thi công đơn #%d. Vui lòng kiểm tra hiện trường và nghiệm thu công trình.",
                            username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Công trình hoàn thành thi công #" + id)
                    .content(String.format(
                            "Đội thợ %s đã hoàn tất thi công công trình #%d. Kính mời quý khách kiểm tra và xác nhận nghiệm thu.",
                            username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }

    @Override
    public void notifySurveyJobRejected(Booking booking, String username, String reason) {
        Long bookingId = booking.getId();
        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Giám sát từ chối khảo sát #" + bookingId)
                    .content(String.format("%s đã từ chối nhận khảo sát đơn #%d. Lý do: %s",
                            username, bookingId, reason.trim()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });
    }

    @Override
    public void notifyQuoteRejected(Booking booking, String username, String reason, boolean isAdmin) {
        Long bookingId = booking.getId();
        String customerName = booking.getCustomer() != null ? booking.getCustomer().getUsername() : "Khách hàng";
        String finalReason = (reason != null && !reason.isBlank()) ? reason.trim()
                : "Khách hàng không đồng ý với phương án/báo giá";

        userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Khách hàng từ chối báo giá #" + bookingId)
                    .content(String.format(
                            "Khách hàng %s đã từ chối báo giá cho đơn hàng #%d. Lý do: %s",
                            customerName, bookingId, finalReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (booking.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getSurveyor())
                    .title("Khách hàng từ chối báo giá #" + bookingId)
                    .content(String.format(
                            "Khách hàng %s đã từ chối báo giá cho đơn hàng khảo sát #%d. Lý do: %s",
                            customerName, bookingId, finalReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        if (booking.getCustomer() != null && !isAdmin) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Đã từ chối báo giá #" + bookingId)
                    .content(String.format(
                            "Bạn đã từ chối báo giá cho đơn hàng #%d thành công. Đơn hàng đã được chuyển sang trạng thái Đã hủy.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }
    }
}
