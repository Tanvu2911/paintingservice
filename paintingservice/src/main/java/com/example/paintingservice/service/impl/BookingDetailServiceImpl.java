package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.BookingDetailDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.BookingDetail;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.mapper.BookingDetailMapper;
import com.example.paintingservice.repository.BookingDetailRepository;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BookingDetailService;
import com.example.paintingservice.service.CloudinaryService;
import com.example.paintingservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingDetailServiceImpl implements BookingDetailService {
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;
    private final com.example.paintingservice.repository.BookingServiceItemRepository bookingServiceItemRepository;

    @Override
    public BookingDetailDto create(BookingDetailDto request, String username) {
        Booking booking = getBooking(requiredBookingId(request));
        ensureSurveyorOrAdmin(booking, username);
        return BookingDetailMapper.toDto(bookingDetailRepository.save(BookingDetailMapper.toEntity(request, booking)));
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDetailDto getById(Long id, String username) {
        BookingDetail detail = getDetail(id);
        ensureCanView(detail.getBooking(), username);
        return BookingDetailMapper.toDto(detail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDetailDto> getByBookingId(Long bookingId, String username) {
        Booking booking = getBooking(bookingId);
        ensureCanView(booking, username);
        return bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
                .map(BookingDetailMapper::toDto)
                .toList();
    }

    @Override
    public BookingDetailDto update(Long id, BookingDetailDto request, String username) {
        BookingDetail detail = getDetail(id);
        ensureSurveyorOrAdmin(detail.getBooking(), username);
        BookingDetailMapper.updateEntity(request, detail);
        return BookingDetailMapper.toDto(bookingDetailRepository.save(detail));
    }

    @Override
    public void delete(Long id) {
        bookingDetailRepository.delete(getDetail(id));
    }

    @Override
    public BookingDetailDto updateSurvey(Long id, BookingDetailDto request, List<MultipartFile> files, String username) {
        BookingDetail detail = getDetail(id);
        ensureSurveyorOrAdmin(detail.getBooking(), username);
        if (request.getSurveyNote() != null) detail.setSurveyNote(request.getSurveyNote());
        if (request.getMaterialNote() != null) detail.setMaterialNote(request.getMaterialNote());
        detail.setSurveyImages(appendSurveyImages(detail, files));
        return BookingDetailMapper.toDto(bookingDetailRepository.save(detail));
    }

    @Override
    public BookingDetailDto reportMaterialShortage(Long id, String materialShortage, String username) {
        if (materialShortage == null || materialShortage.isBlank()) throw new IllegalArgumentException("materialShortage must not be blank");
        BookingDetail detail = getDetail(id);
        Booking booking = detail.getBooking();
        if (!isAdmin(username) && !isSurveyor(booking, username) && !isTechnician(booking, username)) {
            throw new SecurityException("You are not assigned to this booking");
        }
        detail.setMaterialShortage(materialShortage.trim());
        return BookingDetailMapper.toDto(bookingDetailRepository.save(detail));
    }

    @Override
    public BookingDetailDto supervisorAccept(Long id, String username) {
        BookingDetail detail = getDetail(id);
        Booking booking = detail.getBooking();
        ensureSurveyorOrAdmin(booking, username);
        ensureReadyForAcceptance(booking);

        List<com.example.paintingservice.entity.BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(booking.getId());
        if (!serviceItems.isEmpty()) {
            boolean anyNotCompleted = serviceItems.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getTechnicianCompleted()));
            if (anyNotCompleted) {
                throw new IllegalStateException("Vẫn còn gói dịch vụ chưa được đội thợ thi công hoàn thành!");
            }
            // Đồng bộ supervisorAccepted cho tất cả các gói dịch vụ
            for (com.example.paintingservice.entity.BookingServiceItem item : serviceItems) {
                if (!Boolean.TRUE.equals(item.getSupervisorAccepted())) {
                    item.setSupervisorAccepted(true);
                    item.setSupervisorAcceptedAt(LocalDateTime.now());
                    if (item.getSupervisorNote() == null || item.getSupervisorNote().isBlank()) {
                        item.setSupervisorNote("Nghiệm thu đạt chuẩn kỹ thuật");
                    }
                    bookingServiceItemRepository.save(item);
                }
            }
        }

        detail.setSupervisorAccepted(true);
        BookingDetail saved = bookingDetailRepository.save(detail);
        completeBookingWhenAllDetailsAccepted(booking);

        // Thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Giám sát đã nghiệm thu đơn #" + booking.getId())
                    .content(String.format("Giám sát viên %s đã xác nhận nghiệm thu đạt chuẩn cho đơn hàng #%d.",
                            username, booking.getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Thông báo cho Khách hàng
        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Giám sát đã nghiệm thu công trình #" + booking.getId())
                    .content(String.format("Giám sát viên %s đã hoàn tất nghiệm thu kỹ thuật cho toàn bộ công trình #%d. Kính mời quý khách kiểm tra thực tế và xác nhận nghiệm thu bàn giao.",
                            username, booking.getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return BookingDetailMapper.toDto(saved);
    }

    @Override
    public BookingDetailDto customerAccept(Long id, String username) {
        BookingDetail detail = getDetail(id);
        Booking booking = detail.getBooking();
        if (!isAdmin(username) && !isCustomer(booking, username)) throw new SecurityException("You are not the customer of this booking");
        ensureReadyForAcceptance(booking);

        // BẮT BUỘC: Giám sát viên phải nghiệm thu đạt chuẩn xong thì khách hàng mới được nghiệm thu!
        if (!Boolean.TRUE.equals(detail.getSupervisorAccepted())) {
            throw new IllegalStateException("Giám sát viên chưa hoàn tất nghiệm thu kỹ thuật, khách hàng chưa thể nghiệm thu!");
        }

        List<com.example.paintingservice.entity.BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(booking.getId());
        if (!serviceItems.isEmpty()) {
            boolean anyWorkerNotDone = serviceItems.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getTechnicianCompleted()));
            if (anyWorkerNotDone) {
                throw new IllegalStateException("Còn gói dịch vụ chưa được đội thợ báo hoàn thành!");
            }
            boolean anySupervisorNotAccepted = serviceItems.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getSupervisorAccepted()));
            if (anySupervisorNotAccepted) {
                throw new IllegalStateException("Giám sát viên chưa nghiệm thu đạt chuẩn cho tất cả các dịch vụ!");
            }
        }

        detail.setCustomerAccepted(true);
        BookingDetail saved = bookingDetailRepository.save(detail);
        completeBookingWhenAllDetailsAccepted(booking);

        // Thông báo cho Admin
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Khách hàng đã nghiệm thu đơn #" + booking.getId())
                    .content(String.format("Khách hàng %s đã xác nhận nghiệm thu hài lòng công trình #%d. Đơn chờ thanh toán tất toán 70%% còn lại.",
                            username, booking.getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        // Thông báo cho Thợ thi công
        if (booking.getTechnician() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getTechnician())
                    .title("Khách hàng đã nghiệm thu công trình #" + booking.getId())
                    .content(String.format("Khách hàng %s đã nghiệm thu hoàn tất công trình #%d của bạn. Chờ tất toán để nhận thù lao thi công.",
                            username, booking.getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        return BookingDetailMapper.toDto(saved);
    }

    private String appendSurveyImages(BookingDetail detail, List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();
        if (detail.getSurveyImages() != null && !detail.getSurveyImages().isBlank()) urls.addAll(Arrays.asList(detail.getSurveyImages().split(",")));
        if (files == null || files.isEmpty()) return String.join(",", urls);
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    urls.add(cloudinaryService.uploadImage(file, "survey/booking-" + detail.getBooking().getId()));
                }
            }
            return String.join(",", urls);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not upload survey images", exception);
        }
    }

    private void completeBookingWhenAllDetailsAccepted(Booking booking) {
        List<BookingDetail> details = bookingDetailRepository.findByBookingIdOrderByCreatedAtAsc(booking.getId());
        boolean anyAccepted = details.stream().anyMatch(detail -> Boolean.TRUE.equals(detail.getSupervisorAccepted()) && Boolean.TRUE.equals(detail.getCustomerAccepted()));
        if (anyAccepted || details.isEmpty()) {
            if (booking.getPaymentStatus() == PaymentStatus.FULLY_PAID) {
                booking.setStatus(BookingStatus.COMPLETED);
                if (booking.getCompletedAt() == null) {
                    booking.setCompletedAt(LocalDateTime.now());
                }
            } else {
                booking.setStatus(BookingStatus.WAITING_FINAL_PAYMENT);
            }
            bookingRepository.save(booking);
        }
    }

    private void ensureReadyForAcceptance(Booking booking) {
        if (booking.getStatus() == BookingStatus.WORKER_COMPLETED || booking.getStatus() == BookingStatus.PROCESSING) {
            List<com.example.paintingservice.entity.BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingId(booking.getId());
            if (!serviceItems.isEmpty()) {
                boolean anyNotDone = serviceItems.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getTechnicianCompleted()));
                if (anyNotDone) {
                    throw new IllegalStateException("Vẫn còn gói dịch vụ chưa được đội thợ báo hoàn thành!");
                }
                return;
            }
            if (booking.getStatus() == BookingStatus.WORKER_COMPLETED) {
                return;
            }
        }
        throw new IllegalStateException("Đơn hàng chưa hoàn thành thi công, chưa thể nghiệm thu!");
    }

    private void ensureCanView(Booking booking, String username) {
        if (!isAdmin(username) && !isCustomer(booking, username) && !isSurveyor(booking, username) && !isTechnician(booking, username)) {
            throw new SecurityException("You do not have access to this booking detail");
        }
    }

    private void ensureSurveyorOrAdmin(Booking booking, String username) {
        if (!isAdmin(username) && !isSurveyor(booking, username)) throw new SecurityException("You are not the surveyor assigned to this booking");
    }

    private boolean isAdmin(String username) {
        return userRepository.findByUsername(username)
                .map(User::getRole)
                .map(role -> role.getName() != null && role.getName().toUpperCase().contains("ADMIN"))
                .orElse(false);
    }

    private boolean isCustomer(Booking booking, String username) { return booking.getCustomer() != null && username.equals(booking.getCustomer().getUsername()); }
    private boolean isSurveyor(Booking booking, String username) { return booking.getSurveyor() != null && username.equals(booking.getSurveyor().getUsername()); }
    private boolean isTechnician(Booking booking, String username) { return booking.getTechnician() != null && username.equals(booking.getTechnician().getUsername()); }
    private BookingDetail getDetail(Long id) { return bookingDetailRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking detail not found: " + id)); }
    private Booking getBooking(Long id) { return bookingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking not found: " + id)); }
    private Long requiredBookingId(BookingDetailDto request) { if (request == null || request.getBookingId() == null) throw new IllegalArgumentException("bookingId is required"); return request.getBookingId(); }
}
