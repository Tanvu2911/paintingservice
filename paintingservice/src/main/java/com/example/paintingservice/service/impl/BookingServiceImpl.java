
package com.example.paintingservice.service.impl;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.mapper.BookingMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.BookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingServiceImpl
        extends BaseServiceImpl<Booking, Long>
        implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationServiceImpl notificationService;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            NotificationServiceImpl notificationService) {

        super(bookingRepository);

        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // =========================================================
    // PHÂN CÔNG GIÁM SÁT
    // =========================================================

    @Override
    @Transactional
    public Booking assignSupervisor(
            Long bookingId,
            Long userId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy đơn hàng #" + bookingId
                        )
                );

        User supervisor = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy nhân viên #" + userId
                        )
                );

        booking.setSurveyor(supervisor);

        booking.setStatus(
                BookingStatus.ASSIGNED
        );

        return bookingRepository.save(booking);
    }

    // =========================================================
    // LẤY BOOKING THEO GIÁM SÁT
    // =========================================================

    @Override
    public List<Booking> findAllBySurveyor_Id(
            Long surveyorId) {

        return bookingRepository
                .findAllBySurveyor_Id(surveyorId);
    }

    // =========================================================
    // KỸ THUẬT VIÊN NHẬN ĐƠN
    // =========================================================

    @Override
    @Transactional
    public BookingDto acceptJob(
            Long bookingId,
            String username) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy đơn hàng"
                        )
                );

        if (booking.getTechnician() == null
                || booking.getTechnician().getUsername() == null
                || !booking.getTechnician()
                           .getUsername()
                           .equals(username)) {

            throw new RuntimeException(
                    "Bạn không có quyền nhận đơn này"
            );
        }

        if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED
                && booking.getStatus() != BookingStatus.ASSIGNED) {

            throw new RuntimeException(
                    "Đơn không ở trạng thái chờ nhận"
            );
        }

        booking.setStatus(
                BookingStatus.ACCEPTED
        );

        return BookingMapper.toDto(
                bookingRepository.save(booking)
        );
    }

    // =========================================================
    // KỸ THUẬT VIÊN TỪ CHỐI ĐƠN
    // =========================================================

    @Override
    @Transactional
    public BookingDto rejectJob(
            Long bookingId,
            String username,
            String reason) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy đơn"
                        )
                );

        if (booking.getTechnician() == null
                || booking.getTechnician().getUsername() == null
                || !booking.getTechnician()
                           .getUsername()
                           .equals(username)) {

            throw new RuntimeException(
                    "Bạn không có quyền từ chối đơn"
            );
        }

        if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED
                && booking.getStatus() != BookingStatus.ASSIGNED) {

            throw new RuntimeException(
                    "Chỉ được từ chối khi đơn đang chờ nhận"
            );
        }

        // -----------------------------------------
        // Lưu lý do từ chối
        // -----------------------------------------

        if (reason != null
                && !reason.isBlank()) {

            String description =
                    booking.getDescription() == null
                            ? ""
                            : booking.getDescription();

            booking.setDescription(
                    description
                            + "\n[Thợ từ chối] "
                            + reason
            );
        }

        // -----------------------------------------
        // Bỏ kỹ thuật viên
        // -----------------------------------------

        booking.setTechnician(null);

        booking.setStatus(
                BookingStatus.WORKER_REJECTED
        );

        return BookingMapper.toDto(
                bookingRepository.save(booking)
        );
    }

    // =========================================================
    // BẮT ĐẦU THI CÔNG
    // =========================================================

    @Override
    @Transactional
    public BookingDto startJob(
            Long id,
            String username) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy đơn"
                        )
                );

        if (booking.getTechnician() == null
                || booking.getTechnician().getUsername() == null
                || !booking.getTechnician()
                           .getUsername()
                           .equals(username)) {

            throw new RuntimeException(
                    "Bạn không được phép thao tác"
            );
        }

        if (booking.getStatus()
                != BookingStatus.ACCEPTED) {

            throw new RuntimeException(
                    "Đơn chưa ở trạng thái đã nhận việc"
            );
        }

        booking.setStatus(
                BookingStatus.PROCESSING
        );

        Booking savedBooking =
                bookingRepository.save(booking);

        return BookingMapper.toDto(savedBooking);
    }

    // =========================================================
    // THỢ HOÀN THÀNH
    // =========================================================

    @Override
    @Transactional
    public BookingDto completeJob(
            Long id,
            String username) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy đơn"
                        )
                );

        if (booking.getTechnician() == null
                || booking.getTechnician().getUsername() == null
                || !booking.getTechnician()
                           .getUsername()
                           .equals(username)) {

            throw new RuntimeException(
                    "Bạn không được phép thao tác"
            );
        }

        if (booking.getStatus()
                != BookingStatus.PROCESSING) {

            throw new RuntimeException(
                    "Đơn chưa ở trạng thái đang thi công"
            );
        }

        booking.setStatus(
                BookingStatus.WORKER_COMPLETED
        );

        Booking savedBooking =
                bookingRepository.save(booking);

        return BookingMapper.toDto(savedBooking);
    }

        @Override
        @Transactional
        public BookingDto rejectSurveyJob(Long bookingId, String username, String reason) {
        if (reason == null || reason.isBlank()) {
                throw new RuntimeException("Vui lòng nhập lý do từ chối");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Chỉ surveyor của đơn mới được từ chối
        if (booking.getSurveyor() == null || !booking.getSurveyor().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Bạn không có quyền từ chối đơn này");
        }

        // Chỉ cho từ chối khi SURVEY_ASSIGNED
        if (booking.getStatus() != BookingStatus.SURVEY_ASSIGNED) {
                throw new RuntimeException(
                        "Đơn không ở trạng thái có thể từ chối nhận khảo sát (hiện tại: " + booking.getStatus() + ")"
                );
        }

        // Ghi lý do
        String rejectNote = String.format(
                "\n[Từ chối nhận khảo sát - %s bởi %s]: %s",
                LocalDateTime.now().toLocalDate(),
                currentUser.getUsername(),
                reason.trim()
        );
        String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
        booking.setDescription(currentDesc + rejectNote);

        // Gỡ surveyor + trả về PENDING
        booking.setSurveyor(null);
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);

        // Thông báo Admin (tuỳ chọn)
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



}

