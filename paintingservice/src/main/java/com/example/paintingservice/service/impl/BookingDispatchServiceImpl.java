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

import com.example.paintingservice.entity.BookingServiceItem;
import com.example.paintingservice.entity.ServiceEntity;
import com.example.paintingservice.repository.BookingServiceItemRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingDispatchServiceImpl implements BookingDispatchService {

    private final StaffProfileRepository staffProfileRepository;
    private final BookingRepository bookingRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
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
    @lombok.Getter
    @lombok.AllArgsConstructor
    private static class StaffCandidate {
        private final User user;
        private final StaffProfile profile;
    }

    private List<StaffCandidate> getSupervisorCandidates(List<Long> excludedUserIds) {
        Map<Long, StaffCandidate> map = new LinkedHashMap<>();

        // 1. Lấy từ staffProfileRepository với staffType = SUPERVISOR
        List<StaffProfile> profiles = staffProfileRepository.findAll();
        for (StaffProfile sp : profiles) {
            if (sp.getUser() == null) continue;
            User u = sp.getUser();
            if (excludedUserIds != null && excludedUserIds.contains(u.getId())) continue;
            if (u.getStatus() != null && u.getStatus() != UserStatus.ACTIVE) continue;
            if (sp.getStaffType() != StaffType.SUPERVISOR) continue;
            if (Boolean.FALSE.equals(sp.getAvailable())) continue;
            map.put(u.getId(), new StaffCandidate(u, sp));
        }

        // 2. Tìm thêm user có role ROLE_SUPERVISOR
        List<User> supUsers = userRepository.findAllByRole_Name("ROLE_SUPERVISOR");
        for (User u : supUsers) {
            if (excludedUserIds != null && excludedUserIds.contains(u.getId())) continue;
            if (u.getStatus() != null && u.getStatus() != UserStatus.ACTIVE) continue;
            if (!map.containsKey(u.getId())) {
                StaffProfile sp = staffProfileRepository.findByUserId(u.getId()).orElse(null);
                if (sp != null && Boolean.FALSE.equals(sp.getAvailable())) continue;
                map.put(u.getId(), new StaffCandidate(u, sp));
            }
        }

        return new ArrayList<>(map.values());
    }

    private List<StaffCandidate> getWorkerCandidates(List<Long> excludedUserIds) {
        Map<Long, StaffCandidate> map = new LinkedHashMap<>();

        // 1. Lấy từ staffProfileRepository
        List<StaffProfile> profiles = staffProfileRepository.findAll();
        for (StaffProfile sp : profiles) {
            if (sp.getUser() == null) continue;
            User u = sp.getUser();
            if (excludedUserIds != null && excludedUserIds.contains(u.getId())) continue;
            if (u.getStatus() != null && u.getStatus() != UserStatus.ACTIVE) continue;
            if (sp.getStaffType() == StaffType.SUPERVISOR) continue; // Bỏ qua giám sát
            if (Boolean.FALSE.equals(sp.getAvailable())) continue; // Thợ chủ động tắt trạng thái sẵn sàng
            map.put(u.getId(), new StaffCandidate(u, sp));
        }

        // 2. Lấy thêm từ User có ROLE_TECHNICIAN
        List<User> techUsers = userRepository.findAllByRole_Name(AppConstants.ROLE_TECHNICIAN);
        for (User u : techUsers) {
            if (excludedUserIds != null && excludedUserIds.contains(u.getId())) continue;
            if (u.getStatus() != null && u.getStatus() != UserStatus.ACTIVE) continue;
            if (!map.containsKey(u.getId())) {
                StaffProfile sp = staffProfileRepository.findByUserId(u.getId()).orElse(null);
                if (sp != null) {
                    if (sp.getStaffType() == StaffType.SUPERVISOR) continue;
                    if (Boolean.FALSE.equals(sp.getAvailable())) continue;
                    map.put(u.getId(), new StaffCandidate(u, sp));
                } else {
                    map.put(u.getId(), new StaffCandidate(u, null));
                }
            }
        }

        // 3. Lấy thêm từ User có ROLE_STAFF (nếu profile không phải SUPERVISOR)
        List<User> staffUsers = userRepository.findAllByRole_Name(AppConstants.ROLE_STAFF);
        for (User u : staffUsers) {
            if (excludedUserIds != null && excludedUserIds.contains(u.getId())) continue;
            if (u.getStatus() != null && u.getStatus() != UserStatus.ACTIVE) continue;
            if (!map.containsKey(u.getId())) {
                StaffProfile sp = staffProfileRepository.findByUserId(u.getId()).orElse(null);
                if (sp != null) {
                    if (sp.getStaffType() != StaffType.SUPERVISOR && !Boolean.FALSE.equals(sp.getAvailable())) {
                        map.put(u.getId(), new StaffCandidate(u, sp));
                    }
                }
            }
        }

        return new ArrayList<>(map.values());
    }

    /**
     * Tự động tìm kiếm và phân công Giám sát viên (SUPERVISOR) phù hợp nhất
     * dựa trên thuật toán Smart Scoring:
     * 1. Lọc: candidate supervisor, available != false, user active.
     * 2. Ưu tiên Giám sát cũ do khách chọn: +200 điểm
     * 3. Điểm khu vực (Service Area Match): +100 điểm nếu quận/huyện trong địa chỉ khách khớp với serviceArea của giám sát.
     * 4. Điểm cân bằng tải (Workload Balancing): + tối đa 50 điểm cho người đang có ít đơn khảo sát nhất.
     * 5. Điểm đánh giá (Rating): + rating * 2.0 (tối đa 10 điểm).
     * 6. Điểm kinh nghiệm: + exp * 0.5 (tối đa 5 điểm).
     */
    @Override
    public User autoAssignSupervisor(Booking booking) {
        return autoAssignSupervisor(booking, null);
    }

    @Override
    public User autoAssignSupervisor(Booking booking, List<Long> excludedUserIds) {
        try {
            List<StaffCandidate> candidates = getSupervisorCandidates(excludedUserIds);
            if (candidates.isEmpty()) {
                log.warn("[Auto-Assign-Supervisor] Không có giám sát viên nào khả dụng trong hệ thống");
                return null;
            }

            String rawAddress = (booking.getAddress() != null) ? booking.getAddress().toLowerCase() : "";
            Long preferredSupervisorId = (booking.getPreferredSupervisor() != null)
                    ? booking.getPreferredSupervisor().getId()
                    : null;

            User bestUser = null;
            double bestScore = -1.0;

            for (StaffCandidate sc : candidates) {
                User u = sc.getUser();
                StaffProfile sp = sc.getProfile();

                double score = 0.0;

                // 1. Ưu tiên Giám sát viên cũ do khách hàng chọn (+200 điểm nếu khả dụng và không bị loại trừ)
                if (preferredSupervisorId != null && preferredSupervisorId.equals(u.getId())
                        && (excludedUserIds == null || !excludedUserIds.contains(preferredSupervisorId))) {
                    score += 200.0;
                    log.info("[Auto-Assign-Supervisor] Giám sát viên cũ được chọn @{} (#{}) khớp đơn hàng, cộng 200 điểm ưu tiên",
                            u.getUsername(), u.getId());
                }

                // 2. Khớp khu vực (Location Match)
                String serviceArea = (sp != null && sp.getServiceArea() != null) ? sp.getServiceArea().toLowerCase() : "";
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
                } else if (serviceArea.contains("toàn hà nội") || serviceArea.contains("hà nội") || serviceArea.isBlank()) {
                    score += 50.0;
                }

                // 3. Cân bằng tải công việc (Workload Balancing)
                long activeSurveyCount = bookingRepository.countBySurveyor_IdAndStatusIn(
                        u.getId(),
                        List.of(BookingStatus.SURVEY_ASSIGNED, BookingStatus.ACCEPTED));
                double workloadScore = Math.max(0.0, 50.0 - (activeSurveyCount * 10.0));
                score += workloadScore;

                // 4. Điểm đánh giá (Rating)
                double rating = (sp != null && sp.getRating() != null) ? sp.getRating() : 5.0;
                score += (rating * 2.0);

                // 5. Kinh nghiệm (Experience)
                int exp = (sp != null && sp.getExperienceYears() != null) ? sp.getExperienceYears() : 3;
                score += Math.min(exp, 10) * 0.5;

                log.info("[Auto-Assign-Supervisor] Candidate @{} (id={}) | Area Match: {} | Active Tasks: {} | Total Score: {}",
                        u.getUsername(), u.getId(), matchedArea, activeSurveyCount, score);

                if (score > bestScore) {
                    bestScore = score;
                    bestUser = u;
                }
            }

            if (bestUser != null) {
                log.info("[Auto-Assign-Supervisor] Đã chọn Giám sát viên tối ưu: @{} (Score: {}) cho đơn hàng tại '{}'",
                        bestUser.getUsername(), bestScore, booking.getAddress());
                return bestUser;
            }
        } catch (Exception e) {
            log.error("[Auto-Assign-Supervisor] Lỗi trong quá trình tự động phân công giám sát viên: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Thuật toán phân công Đội thợ thi công thông minh (Smart Auto-Dispatch for Workers):
     * 1. Lọc: candidate worker, available != false, user active.
     * 2. Ưu tiên Đội thợ do khách chọn khi tạo đơn (preferredTechnician): +200 điểm nếu khả dụng.
     * 3. Điểm khu vực (Service Area Match): +100 điểm nếu quận/huyện trong địa chỉ khách khớp với serviceArea của thợ.
     * 4. Điểm chuyên môn dịch vụ (Specialty Match): +40 điểm nếu chuyên môn của thợ khớp với loại dịch vụ sơn.
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
        ServiceEntity primaryService = (booking.getBookingServices() != null && !booking.getBookingServices().isEmpty())
                ? booking.getBookingServices().get(0).getService()
                : null;
        return autoAssignTechnicianForService(booking, primaryService, excludedUserIds);
    }

    @Override
    public User autoAssignTechnicianForService(Booking booking, ServiceEntity service, List<Long> excludedUserIds) {
        try {
            List<StaffCandidate> candidates = getWorkerCandidates(excludedUserIds);
            if (candidates.isEmpty()) {
                log.warn("[Auto-Assign-Worker] Không tìm thấy thợ thi công nào khả dụng trong hệ thống");
                return null;
            }

            String rawAddress = (booking.getAddress() != null) ? booking.getAddress().toLowerCase() : "";
            String serviceName = "";
            if (service != null && service.getName() != null) {
                serviceName = service.getName().toLowerCase();
            } else if (booking.getBookingServices() != null && !booking.getBookingServices().isEmpty()
                    && booking.getBookingServices().get(0).getService() != null
                    && booking.getBookingServices().get(0).getService().getName() != null) {
                serviceName = booking.getBookingServices().get(0).getService().getName().toLowerCase();
            }

            Long preferredTechId = (booking.getPreferredTechnician() != null)
                    ? booking.getPreferredTechnician().getId()
                    : null;

            User bestUser = null;
            double bestScore = -1.0;

            for (StaffCandidate sc : candidates) {
                User u = sc.getUser();
                StaffProfile sp = sc.getProfile();

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
                String serviceArea = (sp != null && sp.getServiceArea() != null) ? sp.getServiceArea().toLowerCase() : "";
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
                } else if (serviceArea.contains("toàn hà nội") || serviceArea.contains("hà nội") || serviceArea.isBlank()) {
                    score += 50.0;
                }

                // 3. Khớp chuyên môn dịch vụ (Specialty Match: +40 điểm)
                String specialty = (sp != null && sp.getSpecialty() != null) ? sp.getSpecialty().toLowerCase() : "";
                if (!serviceName.isBlank()) {
                    if (specialty.contains(serviceName) || serviceName.contains(specialty)
                            || specialty.contains("tất cả")
                            || specialty.contains("sơn nhà")
                            || specialty.contains("sơn")) {
                        score += 40.0;
                    }
                } else {
                    score += 20.0;
                }

                // 4. Cân bằng tải công việc (Workload Balancing: tối đa 50 điểm)
                long activeTaskCount = bookingRepository.countByTechnician_IdAndStatusIn(
                        u.getId(),
                        List.of(BookingStatus.ASSIGNED, BookingStatus.ACCEPTED, BookingStatus.PROCESSING));
                double workloadScore = Math.max(0.0, 50.0 - (activeTaskCount * 10.0));
                score += workloadScore;

                // 5. Điểm đánh giá (Rating: tối đa 10 điểm)
                double rating = (sp != null && sp.getRating() != null) ? sp.getRating() : 5.0;
                score += (rating * 2.0);

                // 6. Kinh nghiệm (Experience: tối đa 5 điểm)
                int exp = (sp != null && sp.getExperienceYears() != null) ? sp.getExperienceYears() : 3;
                score += Math.min(exp, 10) * 0.5;

                log.info("[Auto-Assign-Worker] Candidate @{} (id={}) | Service: '{}' | Area Match: {} | Active Tasks: {} | Total Score: {}",
                        u.getUsername(), u.getId(), serviceName, matchedArea, activeTaskCount, score);

                if (score > bestScore) {
                    bestScore = score;
                    bestUser = u;
                }
            }

            if (bestUser != null) {
                log.info("[Auto-Assign-Worker] Đã chọn Đội thợ tối ưu: @{} (Score: {}) cho đơn hàng #{} [Dịch vụ: {}] tại '{}'",
                        bestUser.getUsername(), bestScore, booking.getId(), serviceName, booking.getAddress());
                return bestUser;
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

        log.info("[Auto-Assign-Worker] Bắt đầu tự động phân công đội thợ sau khi cọc cho đơn hàng #{}", booking.getId());

        // Đảm bảo lấy đầy đủ các service items
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findAllByBookingIdWithDetails(booking.getId());
        if (serviceItems.isEmpty() && booking.getBookingServices() != null && !booking.getBookingServices().isEmpty()) {
            serviceItems = booking.getBookingServices();
        }

        // Ưu tiên thợ yêu thích nếu có và còn active
        User preferredTech = booking.getPreferredTechnician();
        if (preferredTech != null && preferredTech.getStatus() != null && preferredTech.getStatus() != UserStatus.ACTIVE) {
            preferredTech = null; // Thợ yêu thích không còn active
        }

        User primaryWorker = booking.getTechnician();
        if (primaryWorker == null && preferredTech != null) {
            primaryWorker = preferredTech;
        }

        Set<User> assignedWorkers = new LinkedHashSet<>();

        // 1. Phân công cho từng hạng mục dịch vụ (Multi-service dispatch)
        if (!serviceItems.isEmpty()) {
            for (BookingServiceItem item : serviceItems) {
                if (item.getTechnician() == null) {
                    User itemWorker = null;
                    if (preferredTech != null) {
                        itemWorker = preferredTech;
                    } else {
                        itemWorker = autoAssignTechnicianForService(booking, item.getService(), null);
                    }

                    if (itemWorker == null && primaryWorker != null) {
                        itemWorker = primaryWorker;
                    }

                    if (itemWorker != null) {
                        item.setTechnician(itemWorker);
                        assignedWorkers.add(itemWorker);
                        log.info("[Auto-Assign-Worker] Đã gán đội thợ @{} cho hạng mục dịch vụ '{}' (#{}) của đơn #{}",
                                itemWorker.getUsername(),
                                item.getService() != null ? item.getService().getName() : "N/A",
                                item.getId(),
                                booking.getId());
                    }
                } else {
                    assignedWorkers.add(item.getTechnician());
                }
            }
            bookingServiceItemRepository.saveAll(serviceItems);
            // KHÔNG gán lại collection - orphanRemoval=true sẽ gây lỗi nếu thay thế reference
        }

        // 2. Xác định thợ chính đại diện cho đơn hàng nếu chưa có
        if (primaryWorker == null) {
            if (!assignedWorkers.isEmpty()) {
                primaryWorker = assignedWorkers.iterator().next();
            } else {
                primaryWorker = autoAssignTechnician(booking);
                if (primaryWorker != null) {
                    assignedWorkers.add(primaryWorker);
                }
            }
        }

        // 3. Nếu vẫn còn service items chưa có thợ mà đã có primaryWorker thì gán nốt primaryWorker
        if (primaryWorker != null && !serviceItems.isEmpty()) {
            boolean hasUpdatedItem = false;
            for (BookingServiceItem item : serviceItems) {
                if (item.getTechnician() == null) {
                    item.setTechnician(primaryWorker);
                    assignedWorkers.add(primaryWorker);
                    hasUpdatedItem = true;
                }
            }
            if (hasUpdatedItem) {
                bookingServiceItemRepository.saveAll(serviceItems);
            }
        }

        // 4. Cập nhật booking status và lưu
        if (primaryWorker != null) {
            booking.setTechnician(primaryWorker);
            booking.setStatus(BookingStatus.ASSIGNED);
            bookingRepository.save(booking);

            BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal workerFee = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);

            // Gửi thông báo cho TẤT CẢ các thợ được phân công
            for (User worker : assignedWorkers) {
                notificationService.save(Notification.builder()
                        .user(worker)
                        .title("Phân công thi công tự động #" + booking.getId())
                        .content(String.format(
                                "Bạn đã được hệ thống tự động phân công thi công đơn hàng #%d (Địa chỉ: %s). Thù lao dự kiến: %s đ. Vui lòng vào hệ thống để tiếp nhận công việc.",
                                booking.getId(),
                                booking.getAddress() != null ? booking.getAddress() : "Theo đơn",
                                String.format("%,d", workerFee.longValue())))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            // Gửi thông báo cho khách hàng
            if (booking.getCustomer() != null) {
                String workerNames = assignedWorkers.stream()
                        .map(w -> "@" + w.getUsername() + (w.getPhoneNumber() != null ? " (" + w.getPhoneNumber() + ")" : ""))
                        .reduce((a, b) -> a + ", " + b)
                        .orElse("@" + primaryWorker.getUsername());

                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Đã phân công Đội thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã hoàn tất đặt cọc thành công và được hệ thống phân công cho Đội thợ: %s. Đội thợ sẽ sớm liên hệ và tiếp nhận thi công theo lịch hẹn.",
                                booking.getId(),
                                workerNames))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            // Gửi thông báo cho Admin
            final User finalPrimaryWorker = primaryWorker;
            userRepository.findAllByRole_Name(AppConstants.ROLE_ADMIN).forEach(admin -> {
                notificationService.save(Notification.builder()
                        .user(admin)
                        .title("Tự động phân công thợ thi công #" + booking.getId())
                        .content(String.format(
                                "Đơn hàng #%d đã nhận cọc và hệ thống đã tự động phân công cho thợ thi công: @%s (Tổng %d đội thợ).",
                                booking.getId(),
                                finalPrimaryWorker.getUsername(),
                                assignedWorkers.size()))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            });

            log.info("[Auto-Assign-Worker] Đơn hàng #{} đã tự động phân công thợ thi công @{} thành công (Tổng {} thợ)",
                    booking.getId(), primaryWorker.getUsername(), assignedWorkers.size());
            return primaryWorker;
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

            // Cập nhật các service items của thợ từ chối sang thợ mới
            List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findAllByBookingIdWithDetails(booking.getId());
            if (serviceItems != null && !serviceItems.isEmpty()) {
                boolean hasUpdated = false;
                for (BookingServiceItem item : serviceItems) {
                    if (item.getTechnician() == null ||
                            (rejectedTechnician != null && item.getTechnician() != null && item.getTechnician().getId().equals(rejectedTechnician.getId()))) {
                        item.setTechnician(newWorker);
                        hasUpdated = true;
                    }
                }
                if (hasUpdated) {
                    bookingServiceItemRepository.saveAll(serviceItems);
                }
            }

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
