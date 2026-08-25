package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.*;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.BookingMapper;
import com.example.paintingservice.repository.*;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.BookingService;
import com.example.paintingservice.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class BookingServiceImpl extends BaseServiceImpl<Booking, Long> implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ServiceEntityRepository serviceEntityRepository;
    private final ContractRepository contractRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final PaymentRepository paymentRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            ServiceEntityRepository serviceEntityRepository,
            ContractRepository contractRepository,
            BookingDetailRepository bookingDetailRepository,
            PaymentRepository paymentRepository) {
        super(bookingRepository);
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.serviceEntityRepository = serviceEntityRepository;
        this.contractRepository = contractRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto createBooking(BookingDto dto, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        if (!isAdmin && currentUser != null && !currentUser.getId().equals(dto.getCustomerId())) {
            throw new RuntimeException("Bạn không có quyền tạo đơn hàng cho tài khoản khác");
        }

        Booking entity = BookingMapper.toEntity(dto);
        if (entity.getStatus() == null) {
            entity.setStatus(BookingStatus.PENDING);
        }
        Booking saved = bookingRepository.save(entity);

        String serviceName = serviceEntityRepository.findById(dto.getServiceId())
                .map(ServiceEntity::getName).orElse("Dịch vụ");
        User customer = userRepository.findById(dto.getCustomerId()).orElse(null);
        String customerName = customer != null ? customer.getUsername() : "Khách hàng";

        if (customer != null) {
            notificationService.save(Notification.builder()
                    .user(customer)
                    .title("Gửi yêu cầu thành công")
                    .content(String.format("Yêu cầu #%d (%s) đã được gửi thành công và đang chờ xử lý.", saved.getId(),
                            serviceName))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Yêu cầu khảo sát mới")
                    .content(String.format("Khách hàng %s vừa gửi yêu cầu #%d cho dịch vụ '%s'.", customerName,
                            saved.getId(), serviceName))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto updateBooking(Long id, BookingDto dto, String currentUsername) {
        Booking old = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        boolean statusChanged = old.getStatus() != dto.getStatus();
        boolean technicianChanged = (old.getTechnician() == null && dto.getTechnicianId() != null) ||
                (old.getTechnician() != null && dto.getTechnicianId() == null) ||
                (old.getTechnician() != null && dto.getTechnicianId() != null
                        && !old.getTechnician().getId().equals(dto.getTechnicianId()));

        boolean detailsChanged = !Objects.equals(old.getAppointmentDate(), dto.getAppointmentDate()) ||
                !Objects.equals(old.getAppointmentTime(), dto.getAppointmentTime()) ||
                !Objects.equals(old.getAddress(), dto.getAddress()) ||
                !Objects.equals(old.getDescription(), dto.getDescription()) ||
                !Objects.equals(old.getService() != null ? old.getService().getId() : null, dto.getServiceId());

        dto.setId(id);
        BookingMapper.updateEntity(dto, old);
        Booking updated = bookingRepository.save(old);

        String serviceName = (old.getService() != null) ? old.getService().getName()
                : serviceEntityRepository.findById(dto.getServiceId())
                        .map(ServiceEntity::getName).orElse("Dịch vụ");

        User actor = userRepository.findByUsername(currentUsername).orElse(null);
        String actorDisplayName = (actor != null && actor.getUsername() != null) ? actor.getUsername()
                : currentUsername;

        User customerEntity = old.getCustomer();
        User techEntity = (dto.getTechnicianId() != null) ? userRepository.findById(dto.getTechnicianId()).orElse(null)
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
            List<User> admins = userRepository.findAllByRole_Name("ROLE_ADMIN");

            // Check if this is a negotiation request from customer
            boolean isNegotiation = dto.getDescription() != null &&
                    dto.getDescription().startsWith("[Đề xuất thương lượng giá");

            final String finalStatusVN = statusVN;
            admins.forEach(admin -> {
                if (!admin.getUsername().equals(currentUsername)) {
                    if (isNegotiation) {
                        // Extract negotiation content after the prefix tag
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
                                .content(String.format("Tài khoản %s đã cập nhật trạng thái đơn '%s' thành: %s",
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

        return BookingMapper.toDto(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBooking(Long id, String currentUsername) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        String serviceName = (booking.getService() != null && booking.getService().getId() != null)
                ? serviceEntityRepository.findById(booking.getService().getId()).map(ServiceEntity::getName)
                        .orElse("Dịch vụ")
                : "Dịch vụ";

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hủy yêu cầu")
                    .content(String.format("Yêu cầu #%d (%s) đã bị xóa khỏi hệ thống bởi %s.", id, serviceName,
                            currentUsername))
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

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            if (!admin.getUsername().equals(currentUsername)) {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Đã xóa đơn #" + id)
                        .content(String.format("Người dùng %s đã xóa đơn '%s' khỏi hệ thống.", currentUsername,
                                serviceName))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }
        });

        bookingRepository.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto assignSupervisor(Long bookingId, Long supervisorUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        boolean canChangeSupervisor = booking.getStatus() == BookingStatus.PENDING
                || booking.getStatus() == BookingStatus.SURVEY_ASSIGNED
                || booking.getStatus() == BookingStatus.ACCEPTED;

        if (!canChangeSupervisor) {
            throw new RuntimeException(
                    "Giám sát đã hoàn thành khảo sát và gửi báo cáo cho Admin. Không thể thay đổi giám sát viên nữa.");
        }

        User supervisor = userRepository.findById(supervisorUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giám sát viên #" + supervisorUserId));

        booking.setSurveyor(supervisor);
        booking.setStatus(BookingStatus.SURVEY_ASSIGNED);
        Booking saved = bookingRepository.save(booking);

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

        return BookingMapper.toDto(saved);
    }

    @Override
    public List<Booking> findAllBySurveyor_Id(Long surveyorId) {
        return bookingRepository.findAllBySurveyor_Id(surveyorId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> sendQuote(Long id, Map<String, Object> payload) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        boolean isFirstQuote = booking.getStatus() == BookingStatus.WAITING_ADMIN_QUOTE;
        boolean isReQuote = booking.getStatus() == BookingStatus.WAITING_CUSTOMER_SIGNATURE;

        if (!isFirstQuote && !isReQuote) {
            throw new RuntimeException("Đơn hàng không ở trạng thái có thể gửi/cập nhật báo giá");
        }

        if (payload.get("totalAmount") == null || payload.get("totalAmount").toString().isBlank()) {
            throw new RuntimeException("Thiếu thông tin tổng báo giá");
        }

        BigDecimal total = new BigDecimal(payload.get("totalAmount").toString());
        BigDecimal deposit;
        if (payload.get("depositAmount") != null && !payload.get("depositAmount").toString().isBlank()) {
            deposit = new BigDecimal(payload.get("depositAmount").toString());
        } else {
            deposit = total.multiply(new BigDecimal("0.3")).setScale(0, RoundingMode.HALF_UP);
        }

        if (total.compareTo(BigDecimal.ZERO) <= 0 || deposit.compareTo(BigDecimal.ZERO) < 0
                || deposit.compareTo(total) > 0) {
            throw new RuntimeException("Số tiền báo giá không hợp lệ");
        }

        Integer estimatedDays = 3;
        if (payload.get("estimatedDays") != null && !payload.get("estimatedDays").toString().isBlank()) {
            try {
                estimatedDays = Integer.parseInt(payload.get("estimatedDays").toString());
            } catch (Exception ignored) {
            }
        }
        Integer warrantyYears = 2;
        if (payload.get("warrantyYears") != null && !payload.get("warrantyYears").toString().isBlank()) {
            try {
                warrantyYears = Integer.parseInt(payload.get("warrantyYears").toString());
            } catch (Exception ignored) {
            }
        }

        booking.setTotalAmount(total);
        booking.setDepositAmount(deposit);
        booking.setRemainingAmount(total.subtract(deposit));
        booking.setEstimatedDays(estimatedDays);
        booking.setWarrantyYears(warrantyYears);
        booking.setPaymentStatus(PaymentStatus.UNPAID);
        booking.setStatus(BookingStatus.WAITING_CUSTOMER_SIGNATURE);

        // Archive active negotiation proposal to history when sending quote
        if (booking.getDescription() != null &&
                (booking.getDescription().contains("[Đề xuất thương lượng") ||
                 booking.getDescription().contains("[Thương lượng giá") ||
                 booking.getDescription().contains("Giá đề xuất:"))) {
            String rawDesc = booking.getDescription();
            NumberFormat nfTemp = NumberFormat.getInstance(new Locale("vi", "VN"));
            String timeStr = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(java.time.LocalDateTime.now());

            // 1. Extract negotiation proposal details
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                    "(?s)\\[(?:Đề xuất thương lượng[^\\]]*|Thương lượng giá[^\\]]*)\\]\\s*(.*?)(?=(\\[Lịch sử|\\[Mô tả|$))"
            );
            java.util.regex.Matcher m = pattern.matcher(rawDesc);
            String historyEntry = "";
            if (m.find()) {
                String fullMatch = m.group(0);
                String meta = fullMatch.contains("(") && fullMatch.contains(")")
                        ? fullMatch.substring(fullMatch.indexOf("(") + 1, fullMatch.lastIndexOf(")")).replace("(", "").replace(")", "").trim()
                        : "Đã gửi đề xuất";
                String msg = m.group(1).trim();
                historyEntry = String.format("• Lần thương lượng (%s): %s. Ghi chú: \"%s\" → Admin đã cập nhật lại báo giá: %sđ",
                        timeStr, meta.isEmpty() ? "Đã gửi đề xuất" : meta, msg.isEmpty() ? "Không có ghi chú" : msg, nfTemp.format(total));
            } else {
                historyEntry = String.format("• Lần thương lượng (%s) → Admin đã cập nhật lại báo giá: %sđ", timeStr, nfTemp.format(total));
            }

            // 2. Remove active negotiation block completely
            String withoutActive = pattern.matcher(rawDesc).replaceAll("").trim();
            withoutActive = withoutActive.replaceAll("(?s)\\[(?:Đề xuất thương lượng|Thương lượng giá)[^\\]]*\\]\\s*", "").trim();

            // 3. Append to negotiation history block
            if (!historyEntry.isEmpty()) {
                if (withoutActive.contains("[Lịch sử thương lượng:")) {
                    withoutActive = withoutActive.replace("[Lịch sử thương lượng:", "[Lịch sử thương lượng:\n" + historyEntry);
                } else {
                    withoutActive = "[Lịch sử thương lượng:\n" + historyEntry + "\n]\n\n" + withoutActive;
                }
            }
            booking.setDescription(withoutActive.trim().isBlank() ? null : withoutActive.trim());
        }

        bookingRepository.save(booking);

        List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(id);
        String customerName = booking.getCustomer() != null ? booking.getCustomer().getUsername() : "Khách hàng";
        String customerPhone = booking.getCustomer() != null ? booking.getCustomer().getPhoneNumber() : "Chưa cung cấp";

        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));

        StringBuilder sb = new StringBuilder();
        sb.append("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n");
        sb.append("Độc lập - Tự do - Hạnh phúc\n\n");
        sb.append("HỢP ĐỒNG THI CÔNG SƠN SỬA & DỊCH VỤ DÂN DỤNG\n");
        sb.append("Mã đơn hàng: #").append(id).append("\n");
        sb.append("Thời gian lập: ").append(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()))
                .append("\n\n");
        sb.append("THÔNG TIN CÁC BÊN:\n");
        sb.append("Bên A (Khách hàng): ").append(customerName).append("\n");
        sb.append("Số điện thoại: ").append(customerPhone).append("\n");
        sb.append("Địa điểm thi công: ")
                .append(booking.getAddress() != null ? booking.getAddress() : "Theo thông tin đăng ký").append("\n\n");
        sb.append("Bên B (Đơn vị thi công): CÔNG TY DỊCH VỤ SƠN SỬA 24/7\n");
        sb.append("Hotline hỗ trợ: 1900 1234 - 0355.880.362\n\n");
        sb.append("I. HIỆN TRẠNG KHẢO SÁT & TIẾN ĐỘ THI CÔNG:\n");
        sb.append("- Mô tả ban đầu: ")
                .append(booking.getDescription() != null ? booking.getDescription() : "Khách hàng không ghi chú")
                .append("\n");
        sb.append("- Thời gian thi công dự kiến: ").append(estimatedDays).append(" ngày làm việc.\n");
        if (booking.getExpectedStartDate() != null) {
            sb.append("- Ngày bắt đầu thi công cam kết: ").append(booking.getExpectedStartDate()).append("\n");
        }
        if (!details.isEmpty()) {
            BookingDetail bd = details.get(0);
            if (bd.getSurveyNote() != null && !bd.getSurveyNote().isBlank()) {
                sb.append("- Ghi chú hiện trạng khảo sát: ").append(bd.getSurveyNote()).append("\n");
            }
            if (bd.getMaterialNote() != null && !bd.getMaterialNote().isBlank()) {
                sb.append("- Chủng loại vật tư đề xuất: ").append(bd.getMaterialNote()).append("\n");
            }
        }
        sb.append("\nII. GIÁ TRỊ HỢP ĐỒNG & PHƯƠNG THỨC THANH TOÁN:\n");
        sb.append("- Tổng chi phí thi công: ").append(nf.format(total)).append(" VNĐ\n");
        sb.append("- Số tiền đặt cọc (xác nhận đơn): ").append(nf.format(deposit)).append(" VNĐ\n");
        sb.append("- Số tiền còn lại (thanh toán sau nghiệm thu): ").append(nf.format(booking.getRemainingAmount()))
                .append(" VNĐ\n");
        sb.append("- Phương thức thanh toán: Chuyển khoản VNPay / VietQR.\n\n");
        sb.append("III. QUY TRÌNH THI CÔNG & TIÊU CHUẨN KỸ THUẬT:\n");
        sb.append("1. Che chắn cẩn thận sàn nhà, nội thất và tài sản xung quanh khu vực thi công.\n");
        sb.append("2. Xử lý bề mặt: Sủi dơ, dặm vá bột trét tại các vị trí nứt vỡ, xả nhám phẳng mịn bề mặt.\n");
        sb.append("3. Thi công lớp sơn lót kháng kiềm / chống thấm chuyên dụng (01 lớp chuẩn).\n");
        sb.append("4. Thi công lớp sơn phủ hoàn thiện màu sắc theo đúng yêu cầu (02 lớp chuẩn kỹ thuật).\n");
        sb.append("5. Vệ sinh công nghiệp khu vực thi công và bàn giao mặt bằng sạch đẹp.\n\n");
        sb.append("IV. CHẾ ĐỘ BẢO HÀNH & CAM KẾT CHẤT LƯỢNG:\n");
        sb.append("- Cam kết 100% sử dụng vật tư sơn chính hãng, đúng chủng loại thỏa thuận.\n");
        sb.append("- Thời hạn bảo hành công trình: ").append(warrantyYears)
                .append(" năm kể từ ngày ký biên bản nghiệm thu.\n");
        sb.append("- Điều kiện bảo hành: Khắc phục miễn phí các lỗi bong tróc, bay màu do kỹ thuật thi công.\n\n");
        sb.append("V. ĐIỀU KHOẢN KÝ KẾT:\n");
        sb.append("- Hợp đồng có hiệu lực kể từ khi Bên A thực hiện ký điện tử và đặt cọc thành công.\n");
        sb.append(
                "- Bên B cam kết triển khai đúng tiến độ và phân công nhân sự chuyên nghiệp sau khi xác nhận tiền cọc.");

        Contract contract = contractRepository.findByBookingId(id).orElseGet(() -> Contract.builder()
                .booking(booking)
                .contractCode("HD-" + id + "-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .customerSigned(false)
                .surveySigned(false)
                .adminSigned(false)
                .build());

        // Reset customer signature if re-quoting after negotiation
        if (isReQuote) {
            contract.setCustomerSigned(false);
            contract.setCustomerSignedAt(null);
            contract.setCustomerSignatureImg(null);
        }

        contract.setContent(sb.toString());
        contractRepository.save(contract);

        if (booking.getCustomer() != null) {
            String notifTitle = isReQuote
                    ? "Báo giá đã được cập nhật - Đơn #" + id
                    : "Hợp đồng & Báo giá sẵn sàng ký #" + id;
            String notifContent = isReQuote
                    ? "Admin đã cập nhật lại báo giá cho đơn #" + id + " sau thương lượng. Tổng mới: "
                            + nf.format(total) + " VNĐ. Vui lòng vào ứng dụng xem và phản hồi."
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

        String msg = isReQuote ? "Đã cập nhật báo giá mới và thông báo cho khách hàng"
                : "Đã gửi báo giá và tạo hợp đồng cho khách ký";
        return Map.of("message", msg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> confirmDeposit(Long id, Map<String, String> payload) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        Contract contract = contractRepository.findByBookingId(id).orElseGet(() -> Contract.builder()
                .booking(booking)
                .contractCode("HD-" + id + "-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .customerSigned(true)
                .build());

        String signature = payload.get("adminSignatureImg") != null ? payload.get("adminSignatureImg")
                : payload.get("adminSignature");
        contract.setAdminSigned(true);
        contract.setAdminSignedAt(LocalDateTime.now());
        if (signature != null && !signature.isBlank()) {
            contract.setAdminSignatureImg(signature);
        }
        contractRepository.save(contract);

        booking.setStatus(BookingStatus.DEPOSIT_CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        bookingRepository.save(booking);

        List<Payment> payments = paymentRepository.findAllByBooking_IdOrderByIdDesc(booking.getId());
        boolean hasDepositPayment = false;
        for (Payment p : payments) {
            if ("DEPOSIT".equalsIgnoreCase(p.getPaymentType())) {
                p.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                p.setPaidAt(LocalDateTime.now());
                paymentRepository.save(p);
                hasDepositPayment = true;
            }
        }

        if (!hasDepositPayment) {
            BigDecimal depositAmount = booking.getDepositAmount() != null
                    && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                            ? booking.getDepositAmount()
                            : (booking.getTotalAmount() != null
                                    ? booking.getTotalAmount().multiply(new BigDecimal("0.3"))
                                    : BigDecimal.ZERO);
            Payment newPayment = Payment.builder()
                    .booking(booking)
                    .amount(depositAmount)
                    .paymentMethod("VNPAY_SANDBOX")
                    .paymentType("DEPOSIT")
                    .paymentStatus(PaymentStatus.DEPOSIT_PAID)
                    .transactionCode("VNPAY-CONFIRMED-" + booking.getId() + "-" + System.currentTimeMillis())
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(newPayment);
        }

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Hợp đồng đã ký duyệt & Xác nhận cọc #" + booking.getId())
                    .content(
                            "Admin đã ký duyệt hợp đồng và xác nhận tiền cọc thành công. Hệ thống tiến hành bàn giao đội thợ thi công.")
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return Map.of(
                "message", "Đã xác nhận tiền cọc và Admin đã ký duyệt hợp đồng thành công!",
                "bookingStatus", booking.getStatus(),
                "adminSigned", true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> assignTeam(Long id, Long technicianId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        if (booking.getStatus() == BookingStatus.PROCESSING ||
                booking.getStatus() == BookingStatus.WORKER_COMPLETED ||
                booking.getStatus() == BookingStatus.WAITING_FINAL_PAYMENT ||
                booking.getStatus() == BookingStatus.COMPLETED ||
                booking.getStatus() == BookingStatus.PAID_TO_STAFF) {
            throw new RuntimeException(
                    "Công trình đã bắt đầu thi công hoặc đã hoàn thành, không thể thay đổi đội thợ!");
        }

        Contract contract = contractRepository.findByBookingId(id).orElse(null);
        if (contract == null || !Boolean.TRUE.equals(contract.getAdminSigned())) {
            throw new RuntimeException(
                    "Admin chưa ký hợp đồng! Vui lòng ký duyệt hợp đồng và xác nhận cọc trước khi phân công đội thợ thi công.");
        }

        if (!Boolean.TRUE.equals(contract.getCustomerSigned())) {
            throw new RuntimeException("Khách hàng chưa ký hợp đồng! Chưa thể phân công thợ thi công.");
        }

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Kỹ thuật viên không tồn tại #" + technicianId));

        booking.setTechnician(technician);
        booking.setStatus(BookingStatus.ASSIGNED);
        bookingRepository.save(booking);

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal workerFee = total.multiply(new BigDecimal("0.60"));

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

        return Map.of("message", "Phân công đội thợ thành công");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> payStaff(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + id));

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        if (booking.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getTechnician())
                    .title("Xác nhận thanh toán #" + id)
                    .content(String.format("Chi phí thù lao cho đơn hàng #%d đã được quyết toán.", id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return Map.of("message", "Đã thanh toán thù lao cho nhân viên");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto acceptJob(Long bookingId, String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền nhận đơn này");
        }

        if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED && booking.getStatus() != BookingStatus.ASSIGNED) {
            throw new RuntimeException("Đơn không ở trạng thái chờ nhận");
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        Booking saved = bookingRepository.save(booking);

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Thợ đã nhận việc #" + bookingId)
                    .content(String.format("Đội thợ %s đã xác nhận nhận thi công đơn hàng #%d (Địa chỉ: %s).",
                            username, bookingId, booking.getAddress() != null ? booking.getAddress() : "Theo đơn"))
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

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto rejectJob(Long bookingId, String username, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền từ chối đơn");
        }

        if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED && booking.getStatus() != BookingStatus.ASSIGNED) {
            throw new RuntimeException("Chỉ được từ chối khi đơn đang chờ nhận");
        }

        if (reason != null && !reason.isBlank()) {
            String description = booking.getDescription() == null ? "" : booking.getDescription();
            booking.setDescription(description + "\n[Thợ từ chối] " + reason);
        }

        booking.setTechnician(null);
        booking.setStatus(BookingStatus.WORKER_REJECTED);
        Booking saved = bookingRepository.save(booking);

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Thợ từ chối nhận việc #" + bookingId)
                    .content(String.format(
                            "Đội thợ %s đã từ chối nhận thi công đơn #%d. Lý do: %s. Vui lòng phân công đội thợ khác.",
                            username, bookingId,
                            (reason != null && !reason.isBlank()) ? reason.trim() : "Không ghi rõ lý do"))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto startJob(Long id, String username) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phép thao tác");
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Đơn chưa ở trạng thái đã nhận việc");
        }

        booking.setStatus(BookingStatus.PROCESSING);
        Booking savedBooking = bookingRepository.save(booking);

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Bắt đầu thi công đơn #" + id)
                    .content(String.format("Đội thợ %s đã bắt đầu triển khai thi công đơn hàng #%d.", username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (savedBooking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(savedBooking.getCustomer())
                    .title("Công trình đang thi công #" + id)
                    .content(String.format("Đội thợ %s đã chính thức bắt đầu thi công công trình #%d của bạn.",
                            username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return BookingMapper.toDto(savedBooking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto completeJob(Long id, String username) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));

        if (booking.getTechnician() == null || booking.getTechnician().getUsername() == null
                || !booking.getTechnician().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phép thao tác");
        }

        if (booking.getStatus() != BookingStatus.PROCESSING) {
            throw new RuntimeException("Đơn chưa ở trạng thái đang thi công");
        }

        booking.setStatus(BookingStatus.WORKER_COMPLETED);
        Booking savedBooking = bookingRepository.save(booking);

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
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

        if (savedBooking.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(savedBooking.getSurveyor())
                    .title("Thợ báo hoàn thành #" + id)
                    .content(String.format(
                            "Đội thợ %s đã hoàn thành thi công đơn #%d. Vui lòng kiểm tra hiện trường và nghiệm thu công trình.",
                            username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        if (savedBooking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(savedBooking.getCustomer())
                    .title("Công trình hoàn thành thi công #" + id)
                    .content(String.format(
                            "Đội thợ %s đã hoàn tất thi công công trình #%d. Kính mời quý khách kiểm tra và xác nhận nghiệm thu.",
                            username, id))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return BookingMapper.toDto(savedBooking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto rejectSurveyJob(Long bookingId, String username, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Vui lòng nhập lý do từ chối");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền từ chối đơn này");
        }

        if (booking.getStatus() != BookingStatus.SURVEY_ASSIGNED) {
            throw new RuntimeException(
                    "Đơn không ở trạng thái có thể từ chối nhận khảo sát (hiện tại: " + booking.getStatus() + ")");
        }

        String rejectNote = String.format(
                "\n[Từ chối nhận khảo sát - %s bởi %s]: %s",
                LocalDateTime.now().toLocalDate(),
                currentUser.getUsername(),
                reason.trim());
        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + rejectNote);
        booking.setSurveyor(null);
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Giám sát từ chối khảo sát #" + bookingId)
                    .content(String.format("%s đã từ chối nhận khảo sát đơn #%d. Lý do: %s",
                            currentUser.getUsername(), bookingId, reason.trim()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        return BookingMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingDto rejectQuote(Long bookingId, String username, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        boolean isAdmin = currentUser.getRole() != null &&
                ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));
        boolean isCustomer = booking.getCustomer() != null && booking.getCustomer().getId().equals(currentUser.getId());

        if (!isAdmin && !isCustomer) {
            throw new RuntimeException("Bạn không có quyền từ chối báo giá cho đơn hàng này");
        }

        if (booking.getStatus() != BookingStatus.WAITING_CUSTOMER_SIGNATURE
                && booking.getStatus() != BookingStatus.WAITING_ADMIN_QUOTE
                && booking.getStatus() != BookingStatus.WAITING_CUSTOMER_QUOTE_APPROVAL
                && booking.getStatus() != BookingStatus.CUSTOMER_ACCEPTED_QUOTE
                && booking.getStatus() != BookingStatus.WAITING_DEPOSIT) {
            throw new RuntimeException(
                    "Đơn không ở trạng thái có thể từ chối báo giá (Trạng thái hiện tại: " + booking.getStatus() + ")");
        }

        String customerName = booking.getCustomer() != null ? booking.getCustomer().getUsername() : "Khách hàng";
        String finalReason = (reason != null && !reason.isBlank()) ? reason.trim()
                : "Khách hàng không đồng ý với phương án/báo giá";

        String rejectNote = String.format(
                "\n[Khách hàng từ chối báo giá - %s bởi %s]: %s",
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()),
                currentUser.getUsername(),
                finalReason);

        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + rejectNote);
        booking.setStatus(BookingStatus.CANCELLED);

        Booking saved = bookingRepository.save(booking);

        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Khách hàng từ chối báo giá #" + bookingId)
                    .content(String.format("Khách hàng %s đã từ chối báo giá cho đơn hàng #%d. Lý do: %s",
                            customerName, bookingId, finalReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        if (saved.getSurveyor() != null) {
            notificationService.save(Notification.builder()
                    .user(saved.getSurveyor())
                    .title("Khách hàng từ chối báo giá #" + bookingId)
                    .content(String.format("Khách hàng %s đã từ chối báo giá cho đơn hàng khảo sát #%d. Lý do: %s",
                            customerName, bookingId, finalReason))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        if (saved.getCustomer() != null && !isAdmin) {
            notificationService.save(Notification.builder()
                    .user(saved.getCustomer())
                    .title("Đã từ chối báo giá #" + bookingId)
                    .content(String.format(
                            "Bạn đã từ chối báo giá cho đơn hàng #%d thành công. Đơn hàng đã được chuyển sang trạng thái Đã hủy.",
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return BookingMapper.toDto(saved);
    }

    private String mapBookingStatusToVietnamese(BookingStatus status) {
        if (status == null)
            return "";
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
}
