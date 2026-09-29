package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.StaffType;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BookingDispatchService;
import com.example.paintingservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingDispatchServiceImpl implements BookingDispatchService {

    private final StaffProfileRepository staffProfileRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Tự động tìm kiếm và phân công Giám sát viên (SUPERVISOR) phù hợp nhất
     * dựa trên thuật toán Smart Scoring:
     * 1. Lọc: role = ROLE_SUPERVISOR / staffType = SUPERVISOR, available = true, user active.
     * 2. Điểm khu vực (Service Area Match): +100 điểm nếu quận/huyện trong địa chỉ khách khớp với serviceArea của giám sát.
     * 3. Điểm cân bằng tải (Workload Balancing): + tối đa 50 điểm cho người đang có ít đơn khảo sát nhất.
     * 4. Điểm đánh giá (Rating): + rating * 2.0 (tối đa 10 điểm).
     * 5. Điểm kinh nghiệm: + exp * 0.5 (tối đa 5 điểm).
     */
    @Override
    public User autoAssignSupervisor(Booking booking) {
        return autoAssignSupervisor(booking, null);
    }

    @Override
    public User autoAssignSupervisor(Booking booking, List<Long> excludedUserIds) {
        try {
            List<StaffProfile> profiles = staffProfileRepository
                    .findByStaffTypeAndAvailableTrue(StaffType.SUPERVISOR);
            if (profiles == null || profiles.isEmpty()) {
                log.warn("[Auto-Assign] Không có giám sát viên nào đang bật trạng thái available = true");
                return null;
            }

            // Lọc các giám sát viên có user ACTIVE
            List<StaffProfile> activeProfiles = profiles.stream()
                    .filter(p -> p.getUser() != null
                            && (p.getUser().getStatus() == null || p.getUser().getStatus() == UserStatus.ACTIVE))
                    .toList();

            if (activeProfiles.isEmpty()) {
                log.warn("[Auto-Assign] Không tìm thấy giám sát viên có tài khoản ACTIVE");
                return null;
            }

            String rawAddress = (booking.getAddress() != null) ? booking.getAddress().toLowerCase() : "";
            Long preferredSupervisorId = (booking.getPreferredSupervisor() != null)
                    ? booking.getPreferredSupervisor().getId()
                    : null;

            StaffProfile bestProfile = null;
            double bestScore = -1.0;

            for (StaffProfile sp : activeProfiles) {
                User u = sp.getUser();
                if (excludedUserIds != null && excludedUserIds.contains(u.getId())) {
                    log.info("[Auto-Assign] Bỏ qua giám sát viên @{} (id={}) do nằm trong danh sách loại trừ",
                            u.getUsername(), u.getId());
                    continue;
                }

                double score = 0.0;

                // 1. Ưu tiên Giám sát viên cũ do khách hàng chọn (+200 điểm nếu khả dụng và không bị loại trừ)
                if (preferredSupervisorId != null && preferredSupervisorId.equals(u.getId())
                        && (excludedUserIds == null || !excludedUserIds.contains(preferredSupervisorId))) {
                    score += 200.0;
                    log.info("[Auto-Assign] Giám sát viên cũ được chọn @{} (#{}) khớp đơn hàng, cộng 200 điểm ưu tiên",
                            u.getUsername(), u.getId());
                }

                // 1. Khớp khu vực (Location Match)
                String serviceArea = (sp.getServiceArea() != null) ? sp.getServiceArea().toLowerCase() : "";
                boolean matchedArea = false;
                if (!serviceArea.isBlank() && !rawAddress.isBlank()) {
                    String[] areas = serviceArea.split("[,;]");
                    for (String area : areas) {
                        String cleanArea = area.trim()
                                .replace("quận", "")
                                .replace("huyện", "")
                                .replace("thị xã", "")
                                .trim();
                        if (cleanArea.length() >= 3 && rawAddress.contains(cleanArea)) {
                            matchedArea = true;
                            break;
                        }
                    }
                }

                if (matchedArea) {
                    score += 100.0;
                } else if (serviceArea.contains("toàn hà nội") || serviceArea.contains("hà nội")) {
                    score += 50.0;
                }

                // 2. Cân bằng tải công việc (Workload Balancing)
                long activeSurveyCount = bookingRepository.countBySurveyor_IdAndStatusIn(
                        u.getId(),
                        List.of(BookingStatus.SURVEY_ASSIGNED, BookingStatus.ACCEPTED));
                double workloadScore = Math.max(0.0, 50.0 - (activeSurveyCount * 10.0));
                score += workloadScore;

                // 3. Điểm đánh giá (Rating)
                double rating = (sp.getRating() != null) ? sp.getRating() : 5.0;
                score += (rating * 2.0);

                // 4. Kinh nghiệm (Experience)
                int exp = (sp.getExperienceYears() != null) ? sp.getExperienceYears() : 0;
                score += Math.min(exp, 10) * 0.5;

                log.info("[Auto-Assign] Candidate @{} (id={}) | Area Match: {} | Active Tasks: {} | Total Score: {}",
                        u.getUsername(), u.getId(), matchedArea, activeSurveyCount, score);

                if (score > bestScore) {
                    bestScore = score;
                    bestProfile = sp;
                }
            }

            if (bestProfile != null && bestProfile.getUser() != null) {
                log.info("[Auto-Assign] Đã chọn Giám sát viên tối ưu: @{} (Score: {}) cho đơn hàng tại '{}'",
                        bestProfile.getUser().getUsername(), bestScore, booking.getAddress());
                return bestProfile.getUser();
            }
        } catch (Exception e) {
            log.error("[Auto-Assign] Lỗi trong quá trình tự động phân công giám sát viên: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Thuật toán phân công Đội thợ thi công thông minh (Smart Auto-Dispatch for Workers):
     * 1. Lọc: staffType = WORKER, available = true, user active.
     * 2. Ưu tiên Đội thợ do khách chọn khi tạo đơn (preferredTechnician): +200 điểm nếu khả dụng.
     * 3. Điểm khu vực (Service Area Match): +100 điểm nếu quận/huyện trong địa chỉ khách khớp với serviceArea của thợ.
     * 4. Điểm chuyên môn dịch vụ (Specialty Match): +30 điểm nếu chuyên môn của thợ khớp với loại dịch vụ sơn.
     * 5. Điểm cân bằng tải (Workload Balancing): + tối đa 50 điểm cho thợ đang có ít đơn nhận/thi công nhất.
     * 6. Điểm đánh giá (Rating): + rating * 2.0 (tối đa 10 điểm).
     * 7. Điểm kinh nghiệm: + exp * 0.5 (tối đa 5 điểm).
     */
    @Override
    public User autoAssignTechnician(Booking booking) {
        return autoAssignTechnician(booking, null);
    }

    @Override
    public User autoAssignTechnician(Booking booking, List<Long> excludedUserIds) {
        try {
            List<StaffProfile> profiles = staffProfileRepository
                    .findByStaffTypeAndAvailableTrue(StaffType.WORKER);
            if (profiles == null || profiles.isEmpty()) {
                log.warn("[Auto-Assign-Worker] Không có thợ thi công nào đang bật trạng thái available = true");
                return null;
            }

            // Lọc các thợ thi công có user ACTIVE
            List<StaffProfile> activeProfiles = profiles.stream()
                    .filter(p -> p.getUser() != null
                            && (p.getUser().getStatus() == null || p.getUser().getStatus() == UserStatus.ACTIVE))
                    .toList();

            if (activeProfiles.isEmpty()) {
                log.warn("[Auto-Assign-Worker] Không tìm thấy thợ thi công có tài khoản ACTIVE");
                return null;
            }

            String rawAddress = (booking.getAddress() != null) ? booking.getAddress().toLowerCase() : "";
            String serviceName = (booking.getService() != null && booking.getService().getName() != null)
                    ? booking.getService().getName().toLowerCase()
                    : "";
            Long preferredTechId = (booking.getPreferredTechnician() != null)
                    ? booking.getPreferredTechnician().getId()
                    : null;

            StaffProfile bestProfile = null;
            double bestScore = -1.0;

            for (StaffProfile sp : activeProfiles) {
                User u = sp.getUser();
                if (excludedUserIds != null && excludedUserIds.contains(u.getId())) {
                    log.info("[Auto-Assign-Worker] Bỏ qua thợ thi công @{} (id={}) do nằm trong danh sách loại trừ",
                            u.getUsername(), u.getId());
                    continue;
                }

                double score = 0.0;

                // 1. Ưu tiên thợ yêu thích mà khách đã chọn khi tạo đơn (+200 điểm nếu chưa bị loại trừ)
                if (preferredTechId != null && preferredTechId.equals(u.getId())
                        && (excludedUserIds == null || !excludedUserIds.contains(preferredTechId))) {
                    score += 200.0;
                }

                // 2. Khớp khu vực (Location Match: +100 điểm)
                String serviceArea = (sp.getServiceArea() != null) ? sp.getServiceArea().toLowerCase() : "";
                boolean matchedArea = false;
                if (!serviceArea.isBlank() && !rawAddress.isBlank()) {
                    String[] areas = serviceArea.split("[,;]");
                    for (String area : areas) {
                        String cleanArea = area.trim()
                                .replace("quận", "")
                                .replace("huyện", "")
                                .replace("thị xã", "")
                                .trim();
                        if (cleanArea.length() >= 3 && rawAddress.contains(cleanArea)) {
                            matchedArea = true;
                            break;
                        }
                    }
                }

                if (matchedArea) {
                    score += 100.0;
                } else if (serviceArea.contains("toàn hà nội") || serviceArea.contains("hà nội")) {
                    score += 50.0;
                }

                // 3. Khớp chuyên môn dịch vụ (Specialty Match: +30 điểm)
                String specialty = (sp.getSpecialty() != null) ? sp.getSpecialty().toLowerCase() : "";
                if (!specialty.isBlank() && !serviceName.isBlank()) {
                    if (specialty.contains(serviceName) || serviceName.contains(specialty)
                            || specialty.contains("tất cả")
                            || specialty.contains("sơn nhà")) {
                        score += 30.0;
                    }
                }

                // 4. Cân bằng tải công việc (Workload Balancing: tối đa 50 điểm)
                long activeTaskCount = bookingRepository.countByTechnician_IdAndStatusIn(
                        u.getId(),
                        List.of(BookingStatus.ASSIGNED, BookingStatus.ACCEPTED, BookingStatus.PROCESSING));
                double workloadScore = Math.max(0.0, 50.0 - (activeTaskCount * 10.0));
                score += workloadScore;

                // 5. Điểm đánh giá (Rating: tối đa 10 điểm)
                double rating = (sp.getRating() != null) ? sp.getRating() : 5.0;
                score += (rating * 2.0);

                // 6. Kinh nghiệm (Experience: tối đa 5 điểm)
                int exp = (sp.getExperienceYears() != null) ? sp.getExperienceYears() : 0;
                score += Math.min(exp, 10) * 0.5;

                log.info("[Auto-Assign-Worker] Candidate @{} (id={}) | Area Match: {} | Active Tasks: {} | Total Score: {}",
                        u.getUsername(), u.getId(), matchedArea, activeTaskCount, score);

                if (score > bestScore) {
                    bestScore = score;
                    bestProfile = sp;
                }
            }

            if (bestProfile != null && bestProfile.getUser() != null) {
                log.info("[Auto-Assign-Worker] Đã chọn Đội thợ tối ưu: @{} (Score: {}) cho đơn hàng #{} tại '{}'",
                        bestProfile.getUser().getUsername(), bestScore, booking.getId(), booking.getAddress());
                return bestProfile.getUser();
            }
        } catch (Exception e) {
            log.error("[Auto-Assign-Worker] Lỗi trong quá trình tự động phân công thợ thi công: {}", e.getMessage(), e);
        }
        return null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User handleWorkerAutoAssignmentAfterDeposit(Booking booking) {
        if (booking == null) return null;

        // Nếu đơn đã có thợ phụ trách thì không gán lại
        if (booking.getTechnician() != null) {
            log.info("[Auto-Assign-Worker] Đơn hàng #{} đã có thợ thi công @{}, bỏ qua auto-dispatch",
                    booking.getId(), booking.getTechnician().getUsername());
            if (booking.getStatus() != BookingStatus.ASSIGNED) {
                booking.setStatus(BookingStatus.ASSIGNED);
                bookingRepository.save(booking);

                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
                BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);

                notificationService.save(Notification.builder()
                        .user(booking.getTechnician())
                        .title("Đơn hàng sẵn sàng thi công #" + booking.getId())
                        .content(String.format(
                                "Khách hàng đã thanh toán cọc đơn hàng #%d (Địa chỉ: %s). Thù lao thi công của bạn: %s đ (60%% giá trị công trình). Vui lòng vào hệ thống để tiếp nhận công việc.",
                                booking.getId(),
                                booking.getAddress() != null ? booking.getAddress() : "Theo đơn",
                                String.format("%,d", workerFee.longValue())))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }
            return booking.getTechnician();
        }

        User autoWorker = autoAssignTechnician(booking);
        if (autoWorker != null) {
            booking.setTechnician(autoWorker);
            booking.setStatus(BookingStatus.ASSIGNED);
            bookingRepository.save(booking);

            BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);

            // 1. Thông báo cho Đội thợ
            notificationService.save(Notification.builder()
                    .user(autoWorker)
                    .title("Phân công thi công tự động #" + booking.getId())
                    .content(String.format(
                            "Bạn đã được hệ thống tự động phân công thi công đơn hàng #%d (Địa chỉ: %s). Thù lao thi công của bạn: %s đ (60%% giá trị công trình). Vui lòng vào hệ thống để tiếp nhận công việc.",
                            booking.getId(),
                            booking.getAddress() != null ? booking.getAddress() : "Theo đơn",
                            String.format("%,d", workerFee.longValue())))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());

            // 2. Thông báo cho Khách hàng
            if (booking.getCustomer() != null) {
                String workerContact = (autoWorker.getPhoneNumber() != null && !autoWorker.getPhoneNumber().isBlank())
                        ? " (SĐT: " + autoWorker.getPhoneNumber() + ")"
                        : "";
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Đã phân công Đội thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã hoàn tất đặt cọc thành công và được hệ thống phân công cho Đội thợ: @%s%s. Đội thợ sẽ sớm liên hệ và tiếp nhận thi công theo lịch hẹn.",
                                booking.getId(),
                                autoWorker.getUsername(),
                                workerContact))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            // 3. Thông báo cho Admin
            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Tự động phân công thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã nhận cọc và hệ thống đã tự động phân công cho thợ thi công: @%s.",
                                booking.getId(),
                                autoWorker.getUsername()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            log.info("[Auto-Assign-Worker] Đơn hàng #{} đã tự động phân công thợ thi công @{} thành công",
                    booking.getId(), autoWorker.getUsername());
            return autoWorker;
        } else {
            // Không tìm thấy thợ khả dụng: giữ đơn ở trạng thái DEPOSIT_CONFIRMED để Admin phân công thủ công
            booking.setStatus(BookingStatus.DEPOSIT_CONFIRMED);
            bookingRepository.save(booking);

            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Cần phân công thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã nhận cọc thành công nhưng hiện tại không có thợ thi công nào khả dụng. Vui lòng phân công thủ công.",
                                booking.getId()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            log.warn("[Auto-Assign-Worker] Đơn hàng #{} không tìm thấy thợ thi công khả dụng, giữ DEPOSIT_CONFIRMED để gán thủ công",
                    booking.getId());
            return null;
        }
    }

    private List<Long> extractExcludedSupervisorIds(Booking booking, Long currentRejectUserId) {
        Set<Long> ids = new HashSet<>();
        if (currentRejectUserId != null) {
            ids.add(currentRejectUserId);
        }
        if (booking.getSurveyor() != null && booking.getSurveyor().getId() != null) {
            ids.add(booking.getSurveyor().getId());
        }
        String desc = booking.getDescription();
        if (desc != null && !desc.isBlank()) {
            Pattern pattern = Pattern.compile("\\[(?:Từ chối nhận khảo sát|Giám sát từ chối)[^\\]]*bởi\\s+([^\\]\\s:]+)\\]", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(desc);
            while (matcher.find()) {
                String uname = matcher.group(1).trim();
                userRepository.findByUsername(uname).ifPresent(u -> ids.add(u.getId()));
            }
        }
        return new ArrayList<>(ids);
    }

    private List<Long> extractExcludedWorkerIds(Booking booking, Long currentRejectUserId) {
        Set<Long> ids = new HashSet<>();
        if (currentRejectUserId != null) {
            ids.add(currentRejectUserId);
        }
        if (booking.getTechnician() != null && booking.getTechnician().getId() != null) {
            ids.add(booking.getTechnician().getId());
        }
        String desc = booking.getDescription();
        if (desc != null && !desc.isBlank()) {
            Pattern pattern = Pattern.compile("\\[(?:Thợ từ chối|Từ chối thi công)[^\\]]*?(?:bởi\\s+|-)\\s*([^\\]\\s:]+)\\]", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(desc);
            while (matcher.find()) {
                String uname = matcher.group(1).trim();
                userRepository.findByUsername(uname).ifPresent(u -> ids.add(u.getId()));
            }
        }
        return new ArrayList<>(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User reassignSupervisorAfterRejection(Booking booking, User rejectedSupervisor, String reason) {
        if (booking == null) return null;

        List<Long> excludedIds = extractExcludedSupervisorIds(booking, rejectedSupervisor != null ? rejectedSupervisor.getId() : null);
        log.info("[Reassign-Supervisor] Đơn hàng #{}, danh sách giám sát bị loại trừ: {}", booking.getId(), excludedIds);

        User newSupervisor = autoAssignSupervisor(booking, excludedIds);
        if (newSupervisor != null) {
            booking.setSurveyor(newSupervisor);
            booking.setStatus(BookingStatus.SURVEY_ASSIGNED);
            bookingRepository.save(booking);

            // 1. Thông báo cho Giám sát viên mới
            String appointmentInfo = String.format("%s %s",
                    booking.getAppointmentTime() != null ? booking.getAppointmentTime() : "08:00",
                    booking.getAppointmentDate() != null ? booking.getAppointmentDate() : "trong ngày");
            notificationService.save(Notification.builder()
                    .user(newSupervisor)
                    .title("Phân công khảo sát tự động #" + booking.getId())
                    .content(String.format(
                            "Bạn đã được hệ thống tự động phân công khảo sát đơn hàng #%d (Địa chỉ: %s). Lịch hẹn: %s. Vui lòng vào hệ thống để tiếp nhận công việc.",
                            booking.getId(),
                            booking.getAddress() != null ? booking.getAddress() : "Theo đơn",
                            appointmentInfo))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());

            // 2. Thông báo cho Khách hàng
            if (booking.getCustomer() != null) {
                String supervisorContact = (newSupervisor.getPhoneNumber() != null && !newSupervisor.getPhoneNumber().isBlank())
                        ? " (SĐT: " + newSupervisor.getPhoneNumber() + ")"
                        : "";
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Cập nhật Chuyên viên khảo sát #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã được hệ thống điều phối lại cho Chuyên viên khảo sát: @%s%s. Chuyên viên sẽ liên hệ và đến khảo sát theo đúng lịch hẹn.",
                                booking.getId(),
                                newSupervisor.getUsername(),
                                supervisorContact))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            // 3. Thông báo cho Admin
            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Tự động điều phối lại khảo sát #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d: Giám sát viên @%s đã từ chối khảo sát (Lý do: %s). Hệ thống đã tự động chuyển giao đơn cho Giám sát viên @%s.",
                                booking.getId(),
                                rejectedSupervisor != null ? rejectedSupervisor.getUsername() : "N/A",
                                reason != null ? reason : "Không có lý do",
                                newSupervisor.getUsername()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            log.info("[Reassign-Supervisor] Đơn hàng #{} đã tự động chuyển sang Giám sát viên @{}",
                    booking.getId(), newSupervisor.getUsername());
            return newSupervisor;
        } else {
            // Không tìm thấy giám sát viên khả dụng khác
            booking.setSurveyor(null);
            booking.setStatus(BookingStatus.SURVEY_REJECTED);
            bookingRepository.save(booking);

            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Cần phân công giám sát viên #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d: Giám sát viên @%s đã từ chối khảo sát (Lý do: %s). Hiện tại không còn giám sát viên nào khác khả dụng. Vui lòng phân công thủ công.",
                                booking.getId(),
                                rejectedSupervisor != null ? rejectedSupervisor.getUsername() : "N/A",
                                reason != null ? reason : "Không có lý do"))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            if (booking.getCustomer() != null) {
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Đang điều phối lại khảo sát #" + booking.getId())
                        .content(String.format(
                                "Chuyên viên khảo sát trước đó bận lịch đột xuất. Đội ngũ quản trị đang sắp xếp chuyên viên khác phù hợp nhất cho đơn hàng #%d của bạn.",
                                booking.getId()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            log.warn("[Reassign-Supervisor] Đơn hàng #{} không còn giám sát viên khả dụng, chuyển sang SURVEY_REJECTED để phân công thủ công",
                    booking.getId());
            return null;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User reassignTechnicianAfterRejection(Booking booking, User rejectedTechnician, String reason) {
        if (booking == null) return null;

        List<Long> excludedIds = extractExcludedWorkerIds(booking, rejectedTechnician != null ? rejectedTechnician.getId() : null);
        log.info("[Reassign-Worker] Đơn hàng #{}, danh sách thợ bị loại trừ: {}", booking.getId(), excludedIds);

        User newWorker = autoAssignTechnician(booking, excludedIds);
        if (newWorker != null) {
            booking.setTechnician(newWorker);
            booking.setStatus(BookingStatus.ASSIGNED);
            bookingRepository.save(booking);

            BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);

            // 1. Thông báo cho Đội thợ mới
            notificationService.save(Notification.builder()
                    .user(newWorker)
                    .title("Phân công thi công tự động #" + booking.getId())
                    .content(String.format(
                            "Bạn đã được hệ thống tự động phân công thi công đơn hàng #%d (Địa chỉ: %s). Thù lao thi công của bạn: %s đ (60%% giá trị công trình). Vui lòng vào hệ thống để tiếp nhận công việc.",
                            booking.getId(),
                            booking.getAddress() != null ? booking.getAddress() : "Theo đơn",
                            String.format("%,d", workerFee.longValue())))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());

            // 2. Thông báo cho Khách hàng
            if (booking.getCustomer() != null) {
                String workerContact = (newWorker.getPhoneNumber() != null && !newWorker.getPhoneNumber().isBlank())
                        ? " (SĐT: " + newWorker.getPhoneNumber() + ")"
                        : "";
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Cập nhật Đội thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã được hệ thống điều phối lại cho Đội thợ: @%s%s. Đội thợ sẽ sớm liên hệ và tiếp nhận thi công theo lịch hẹn.",
                                booking.getId(),
                                newWorker.getUsername(),
                                workerContact))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            // 3. Thông báo cho Admin
            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Tự động điều phối lại thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d: Thợ thi công @%s đã từ chối đơn (Lý do: %s). Hệ thống đã tự động điều phối lại cho thợ thi công @%s.",
                                booking.getId(),
                                rejectedTechnician != null ? rejectedTechnician.getUsername() : "N/A",
                                reason != null ? reason : "Không có lý do",
                                newWorker.getUsername()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            log.info("[Reassign-Worker] Đơn hàng #{} đã tự động chuyển giao cho thợ thi công @{}",
                    booking.getId(), newWorker.getUsername());
            return newWorker;
        } else {
            // Không tìm thấy thợ thi công khả dụng khác
            booking.setTechnician(null);
            booking.setStatus(BookingStatus.WORKER_REJECTED);
            bookingRepository.save(booking);

            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Cần phân công thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d: Thợ thi công @%s đã từ chối đơn (Lý do: %s). Hiện tại không còn thợ nào khác khả dụng để tự động phân công. Vui lòng phân công thủ công.",
                                booking.getId(),
                                rejectedTechnician != null ? rejectedTechnician.getUsername() : "N/A",
                                reason != null ? reason : "Không có lý do"))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            if (booking.getCustomer() != null) {
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Đang điều phối lại đội thợ #" + booking.getId())
                        .content(String.format(
                                "Đơn vị thi công đang phân bổ đội thợ tay nghề cao khác để đảm bảo tiến độ cho đơn hàng #%d của bạn.",
                                booking.getId()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            log.warn("[Reassign-Worker] Đơn hàng #{} không còn thợ khả dụng, chuyển sang WORKER_REJECTED để phân công thủ công",
                    booking.getId());
            return null;
        }
    }
}
