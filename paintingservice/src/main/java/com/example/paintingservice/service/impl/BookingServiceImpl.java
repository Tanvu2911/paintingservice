
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
                                .orElseThrow(() -> new RuntimeException(
                                                "Không tìm thấy đơn hàng #" + bookingId));

                User supervisor = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Không tìm thấy nhân viên #" + userId));

                booking.setSurveyor(supervisor);

                booking.setStatus(
                                BookingStatus.ASSIGNED);

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
                                .orElseThrow(() -> new RuntimeException(
                                                "Không tìm thấy đơn hàng"));

                if (booking.getTechnician() == null
                                || booking.getTechnician().getUsername() == null
                                || !booking.getTechnician()
                                                .getUsername()
                                                .equals(username)) {

                        throw new RuntimeException(
                                        "Bạn không có quyền nhận đơn này");
                }

                if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED
                                && booking.getStatus() != BookingStatus.ASSIGNED) {

                        throw new RuntimeException(
                                        "Đơn không ở trạng thái chờ nhận");
                }

		booking.setStatus(BookingStatus.ACCEPTED);
		Booking saved = bookingRepository.save(booking);

		// Thông báo cho Admin
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

		// Thông báo cho Khách hàng
		if (booking.getCustomer() != null) {
			notificationService.save(Notification.builder()
					.user(booking.getCustomer())
					.title("Đội thợ đã tiếp nhận công trình #" + bookingId)
					.content(String.format("Đội thợ %s đã tiếp nhận đơn hàng #%d của bạn và chuẩn bị thi công đúng kế hoạch.",
							username, bookingId))
					.createdAt(LocalDateTime.now())
					.isRead(false)
					.build());
		}

		return BookingMapper.toDto(saved);
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
				.orElseThrow(() -> new RuntimeException(
						"Không tìm thấy đơn"));

		if (booking.getTechnician() == null
				|| booking.getTechnician().getUsername() == null
				|| !booking.getTechnician()
						.getUsername()
						.equals(username)) {

			throw new RuntimeException(
					"Bạn không có quyền từ chối đơn");
		}

		if (booking.getStatus() != BookingStatus.CONTRACT_APPROVED
				&& booking.getStatus() != BookingStatus.ASSIGNED) {

			throw new RuntimeException(
					"Chỉ được từ chối khi đơn đang chờ nhận");
		}

		// -----------------------------------------
		// Lưu lý do từ chối
		// -----------------------------------------

		if (reason != null
				&& !reason.isBlank()) {

			String description = booking.getDescription() == null
					? ""
					: booking.getDescription();

			booking.setDescription(
					description
							+ "\n[Thợ từ chối] "
							+ reason);
		}

		// -----------------------------------------
		// Bỏ kỹ thuật viên
		// -----------------------------------------

		booking.setTechnician(null);

		booking.setStatus(
				BookingStatus.WORKER_REJECTED);

		Booking saved = bookingRepository.save(booking);

		// Thông báo cho Admin để phân công lại
		userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
			notificationService.save(Notification.builder()
					.user(admin)
					.title("Thợ từ chối nhận việc #" + bookingId)
					.content(String.format("Đội thợ %s đã từ chối nhận thi công đơn #%d. Lý do: %s. Vui lòng phân công đội thợ khác.",
							username, bookingId, (reason != null && !reason.isBlank()) ? reason.trim() : "Không ghi rõ lý do"))
					.createdAt(LocalDateTime.now())
					.isRead(false)
					.build());
		});

		return BookingMapper.toDto(saved);
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
				.orElseThrow(() -> new RuntimeException(
						"Không tìm thấy đơn"));

		if (booking.getTechnician() == null
				|| booking.getTechnician().getUsername() == null
				|| !booking.getTechnician()
						.getUsername()
						.equals(username)) {

			throw new RuntimeException(
					"Bạn không được phép thao tác");
		}

		if (booking.getStatus() != BookingStatus.ACCEPTED) {

			throw new RuntimeException(
					"Đơn chưa ở trạng thái đã nhận việc");
		}

		booking.setStatus(
				BookingStatus.PROCESSING);

		Booking savedBooking = bookingRepository.save(booking);

		// Thông báo cho Admin
		userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
			notificationService.save(Notification.builder()
					.user(admin)
					.title("Bắt đầu thi công đơn #" + id)
					.content(String.format("Đội thợ %s đã bắt đầu triển khai thi công đơn hàng #%d.",
							username, id))
					.createdAt(LocalDateTime.now())
					.isRead(false)
					.build());
		});

		// Thông báo cho Khách hàng
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

	// =========================================================
	// THỢ HOÀN THÀNH
	// =========================================================

	@Override
	@Transactional
	public BookingDto completeJob(
			Long id,
			String username) {

		Booking booking = bookingRepository.findById(id)
				.orElseThrow(() -> new RuntimeException(
						"Không tìm thấy đơn"));

		if (booking.getTechnician() == null
				|| booking.getTechnician().getUsername() == null
				|| !booking.getTechnician()
						.getUsername()
						.equals(username)) {

			throw new RuntimeException(
					"Bạn không được phép thao tác");
		}

		if (booking.getStatus() != BookingStatus.PROCESSING) {

			throw new RuntimeException(
					"Đơn chưa ở trạng thái đang thi công");
		}

		booking.setStatus(
				BookingStatus.WORKER_COMPLETED);

		Booking savedBooking = bookingRepository.save(booking);

		// Thông báo cho Admin
		userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
			notificationService.save(Notification.builder()
					.user(admin)
					.title("Thợ báo hoàn thành thi công #" + id)
					.content(String.format("Đội thợ %s đã báo hoàn thành thi công công trình #%d. Đang chờ Giám sát và Khách hàng nghiệm thu.",
							username, id))
					.createdAt(LocalDateTime.now())
					.isRead(false)
					.build());
		});

		// Thông báo cho Giám sát viên (nếu có)
		if (savedBooking.getSurveyor() != null) {
			notificationService.save(Notification.builder()
					.user(savedBooking.getSurveyor())
					.title("Thợ báo hoàn thành #" + id)
					.content(String.format("Đội thợ %s đã hoàn thành thi công đơn #%d. Vui lòng kiểm tra hiện trường và nghiệm thu công trình.",
							username, id))
					.createdAt(LocalDateTime.now())
					.isRead(false)
					.build());
		}

		// Thông báo cho Khách hàng
		if (savedBooking.getCustomer() != null) {
			notificationService.save(Notification.builder()
					.user(savedBooking.getCustomer())
					.title("Công trình hoàn thành thi công #" + id)
					.content(String.format("Đội thợ %s đã hoàn tất thi công công trình #%d. Kính mời quý khách kiểm tra và xác nhận nghiệm thu.",
							username, id))
					.createdAt(LocalDateTime.now())
					.isRead(false)
					.build());
		}

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
                                        "Đơn không ở trạng thái có thể từ chối nhận khảo sát (hiện tại: "
                                                        + booking.getStatus() + ")");
                }

                // Ghi lý do
                String rejectNote = String.format(
                                "\n[Từ chối nhận khảo sát - %s bởi %s]: %s",
                                LocalDateTime.now().toLocalDate(),
                                currentUser.getUsername(),
                                reason.trim());
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

        @Override
        @Transactional
        public BookingDto rejectQuote(Long bookingId, String username, String reason) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

                User currentUser = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

                boolean isAdmin = currentUser.getRole() != null
                                && ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole().getName())
                                                || "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));
                boolean isCustomer = booking.getCustomer() != null
                                && booking.getCustomer().getId().equals(currentUser.getId());

                if (!isAdmin && !isCustomer) {
                        throw new RuntimeException("Bạn không có quyền từ chối báo giá cho đơn hàng này");
                }

                // Cho phép từ chối khi đơn đang ở các trạng thái báo giá / chờ ký hợp đồng / chờ cọc
                if (booking.getStatus() != BookingStatus.WAITING_CUSTOMER_SIGNATURE
                                && booking.getStatus() != BookingStatus.WAITING_ADMIN_QUOTE
                                && booking.getStatus() != BookingStatus.WAITING_CUSTOMER_QUOTE_APPROVAL
                                && booking.getStatus() != BookingStatus.CUSTOMER_ACCEPTED_QUOTE
                                && booking.getStatus() != BookingStatus.WAITING_DEPOSIT) {
                        throw new RuntimeException("Đơn không ở trạng thái có thể từ chối báo giá (Trạng thái hiện tại: "
                                        + booking.getStatus() + ")");
                }

                String customerName = booking.getCustomer() != null ? booking.getCustomer().getUsername() : "Khách hàng";
                String finalReason = (reason != null && !reason.isBlank()) ? reason.trim()
                                : "Khách hàng không đồng ý với phương án/báo giá";

                String rejectNote = String.format(
                                "\n[Khách hàng từ chối báo giá - %s bởi %s]: %s",
                                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()),
                                currentUser.getUsername(),
                                finalReason);

                String currentDesc = booking.getDescription() != null ? booking.getDescription() : "";
                booking.setDescription(currentDesc + rejectNote);
                booking.setStatus(BookingStatus.CANCELLED);

                Booking saved = bookingRepository.save(booking);

                // Thông báo cho Admin
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

                // Thông báo cho Giám sát viên (nếu có)
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

                // Thông báo cho Khách hàng nếu là khách thực hiện
                if (saved.getCustomer() != null && !isAdmin) {
                        notificationService.save(Notification.builder()
                                        .user(saved.getCustomer())
                                        .title("Đã từ chối báo giá #" + bookingId)
                                        .content(String.format("Bạn đã từ chối báo giá cho đơn hàng #%d thành công. Đơn hàng đã được chuyển sang trạng thái Đã hủy.", bookingId))
                                        .createdAt(LocalDateTime.now())
                                        .isRead(false)
                                        .build());
                }

                return BookingMapper.toDto(saved);
        }

}
