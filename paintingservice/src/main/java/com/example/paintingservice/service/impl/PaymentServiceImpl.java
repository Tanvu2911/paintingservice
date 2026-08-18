// package com.example.paintingservice.service.impl;

// import com.example.paintingservice.entity.Booking;
// import com.example.paintingservice.entity.Notification;
// import com.example.paintingservice.entity.Payment;
// import com.example.paintingservice.entity.SalaryHistory;
// import com.example.paintingservice.entity.User;
// import com.example.paintingservice.enums.BookingStatus;
// import com.example.paintingservice.enums.PaymentStatus;
// import com.example.paintingservice.enums.SalaryStatus;
// import com.example.paintingservice.repository.BookingRepository;
// import com.example.paintingservice.repository.PaymentRepository;
// import com.example.paintingservice.repository.SalaryHistoryRepository;
// import com.example.paintingservice.repository.UserRepository;
// import com.example.paintingservice.service.BaseServiceImpl;
// import com.example.paintingservice.service.MoMoService;
// import com.example.paintingservice.service.NotificationService;
// import com.example.paintingservice.service.PaymentService;
// import jakarta.transaction.Transactional;
// import org.springframework.stereotype.Service;

// import java.math.BigDecimal;
// import java.time.LocalDateTime;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.Optional;

// @Service
// public class PaymentServiceImpl extends BaseServiceImpl<Payment, Long> implements PaymentService {

//     private final BookingRepository bookingRepository;
//     private final PaymentRepository paymentRepository;
//     private final SalaryHistoryRepository salaryHistoryRepository;
//     private final UserRepository userRepository;
//     private final NotificationService notificationService;
//     private final MoMoService moMoService;

//     public PaymentServiceImpl(
//             PaymentRepository paymentRepository,
//             BookingRepository bookingRepository,
//             SalaryHistoryRepository salaryHistoryRepository,
//             UserRepository userRepository,
//             NotificationService notificationService,
//             MoMoService moMoService) {
//         super(paymentRepository);
//         this.paymentRepository = paymentRepository;
//         this.bookingRepository = bookingRepository;
//         this.salaryHistoryRepository = salaryHistoryRepository;
//         this.userRepository = userRepository;
//         this.notificationService = notificationService;
//         this.moMoService = moMoService;
//     }

//     @Override
//     @Transactional
//     public Map<String, Object> createMoMoPayment(Long bookingId, String paymentType) throws Exception {
//         Booking booking = bookingRepository.findById(bookingId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

//         String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
//         if (!type.equals("DEPOSIT") && !type.equals("FINAL")) {
//             throw new RuntimeException("paymentType phải là DEPOSIT hoặc FINAL");
//         }

//         PaymentStatus current = booking.getPaymentStatus();
//         if (type.equals("DEPOSIT") && (current == PaymentStatus.DEPOSIT_PAID || current == PaymentStatus.FULLY_PAID)) {
//             throw new RuntimeException("Đơn hàng đã thanh toán cọc hoặc thanh toán đủ rồi");
//         }
//         if (type.equals("FINAL") && current != PaymentStatus.DEPOSIT_PAID) {
//             throw new RuntimeException("Cần thanh toán cọc trước khi thanh toán phần còn lại");
//         }

//         BigDecimal amount = type.equals("DEPOSIT")
//                 ? booking.getDepositAmount()
//                 : booking.getRemainingAmount();

//         if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
//             throw new RuntimeException("Số tiền thanh toán không hợp lệ. Kiểm tra lại báo giá của đơn hàng.");
//         }

//         Map<String, Object> moMoRes = moMoService.createOrder(bookingId, amount.longValue(), type);
//         Object errorCodeObj = moMoRes != null ? moMoRes.get("errorCode") : null;
//         int errorCode = errorCodeObj != null ? Integer.parseInt(errorCodeObj.toString()) : -1;

//         if (errorCode == 0) {
//             String orderId = (String) moMoRes.get("orderId");

//             Payment payment = Payment.builder()
//                     .booking(booking)
//                     .amount(amount)
//                     .paymentMethod("MOMO")
//                     .paymentType(type)
//                     .paymentStatus(PaymentStatus.UNPAID)
//                     .transactionCode(orderId)
//                     .build();

//             paymentRepository.save(payment);
//         }

//         return moMoRes;
//     }

//     @Override
//     @Transactional
//     public void processMoMoSuccessCallback(String orderId) {
//         Payment payment = paymentRepository.findByTransactionCode(orderId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch: " + orderId));

//         if (payment.getPaidAt() != null) {
//             return;
//         }

//         String type = payment.getPaymentType() != null
//                 ? payment.getPaymentType().toUpperCase()
//                 : "DEPOSIT";

//         if ("DEPOSIT".equals(type)) {
//             payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
//         } else {
//             payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
//         }
//         payment.setPaidAt(LocalDateTime.now());
//         paymentRepository.save(payment);

//         Booking booking = payment.getBooking();
//         if (booking == null) {
//             return;
//         }

//         if ("DEPOSIT".equals(type)) {
//             booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
//         } else if ("FINAL".equals(type)) {
//             booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
//             booking.setRemainingAmount(BigDecimal.ZERO);
//             if (booking.getStatus() == BookingStatus.WORKER_COMPLETED || booking.getStatus() == BookingStatus.PROCESSING) {
//                 booking.setStatus(BookingStatus.COMPLETED);
//             }
//             createSalaryHistoriesForBooking(booking);
//         }

//         bookingRepository.save(booking);
//     }

//     // =========================================================================
//     // === QR CODE PAYMENT & MANUAL ADMIN CONFIRMATION ===
//     // =========================================================================

//     @Override
//     @Transactional
//     public Map<String, Object> submitQrPayment(Long bookingId, String paymentType, String note, String username) {
//         Booking booking = bookingRepository.findById(bookingId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

//         String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
//         if (!type.equals("DEPOSIT") && !type.equals("FINAL")) {
//             throw new RuntimeException("paymentType phải là DEPOSIT hoặc FINAL");
//         }

//         PaymentStatus current = booking.getPaymentStatus();
//         if (type.equals("DEPOSIT") && (current == PaymentStatus.DEPOSIT_PAID || current == PaymentStatus.FULLY_PAID)) {
//             throw new RuntimeException("Đơn hàng đã được xác nhận thanh toán cọc hoặc hoàn tất");
//         }
//         if (type.equals("FINAL") && current != PaymentStatus.DEPOSIT_PAID && current != PaymentStatus.PENDING_CONFIRMATION) {
//             throw new RuntimeException("Cần thanh toán cọc trước khi thanh toán phần còn lại");
//         }

//         BigDecimal amount = type.equals("DEPOSIT")
//                 ? (booking.getDepositAmount() != null && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
//                     ? booking.getDepositAmount()
//                     : (booking.getTotalAmount() != null ? booking.getTotalAmount().multiply(new BigDecimal("0.3")) : BigDecimal.ZERO))
//                 : (booking.getRemainingAmount() != null && booking.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0
//                     ? booking.getRemainingAmount()
//                     : (booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO));

//         if (amount.compareTo(BigDecimal.ZERO) <= 0) {
//             throw new RuntimeException("Số tiền thanh toán không hợp lệ.");
//         }

//         String txCode = (type.equals("DEPOSIT") ? "COC" : "TT") + "-DH" + bookingId + "-" + System.currentTimeMillis();

//         Payment payment = Payment.builder()
//                 .booking(booking)
//                 .amount(amount)
//                 .paymentMethod("QR_VIETQR")
//                 .paymentType(type)
//                 .paymentStatus(PaymentStatus.PENDING_CONFIRMATION)
//                 .transactionCode(txCode)
//                 .build();

//         Payment savedPayment = paymentRepository.save(payment);

//         // Gửi thông báo cho Admin
//         String typeLabel = type.equals("DEPOSIT") ? "tiền cọc" : "phần còn lại";
//         userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
//             notificationService.save(Notification.builder()
//                     .user(admin)
//                     .title("Khách đã chuyển khoản QR #" + bookingId)
//                     .content(String.format("Khách hàng đã quét mã QR thanh toán %s (%s đ) cho đơn #%d. Vui lòng kiểm tra và xác nhận.",
//                             typeLabel, String.format("%,d", amount.longValue()), bookingId))
//                     .createdAt(LocalDateTime.now())
//                     .isRead(false)
//                     .build());
//         });

//         Map<String, Object> result = new HashMap<>();
//         result.put("message", "Đã gửi thông tin thanh toán QR thành công. Vui lòng chờ Admin kiểm tra và xác nhận.");
//         result.put("paymentId", savedPayment.getId());
//         result.put("amount", amount);
//         result.put("transactionCode", txCode);
//         result.put("paymentType", type);
//         result.put("status", "PENDING_CONFIRMATION");
//         return result;
//     }

//     @Override
//     @Transactional
//     public Map<String, Object> confirmPayment(Long paymentId) {
//         Payment payment = paymentRepository.findById(paymentId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch thanh toán #" + paymentId));

//         Booking booking = payment.getBooking();
//         if (booking == null) {
//             throw new RuntimeException("Giao dịch không gắn với đơn hàng nào");
//         }

//         String type = payment.getPaymentType() != null ? payment.getPaymentType().toUpperCase() : "DEPOSIT";

//         if ("DEPOSIT".equals(type)) {
//             payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
//             booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
//         } else {
//             payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
//             booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
//             booking.setRemainingAmount(BigDecimal.ZERO);
//             if (booking.getStatus() == BookingStatus.WORKER_COMPLETED || booking.getStatus() == BookingStatus.PROCESSING) {
//                 booking.setStatus(BookingStatus.COMPLETED);
//             }
//             createSalaryHistoriesForBooking(booking);
//         }

//         payment.setPaidAt(LocalDateTime.now());
//         paymentRepository.save(payment);
//         bookingRepository.save(booking);

//         // Gửi thông báo cho khách hàng
//         if (booking.getCustomer() != null) {
//             String typeVN = "DEPOSIT".equals(type) ? "tiền cọc" : "tất toán hoàn thành";
//             notificationService.save(Notification.builder()
//                     .user(booking.getCustomer())
//                     .title("Thanh toán thành công đơn #" + booking.getId())
//                     .content(String.format("Admin đã xác nhận nhận đủ %s cho đơn hàng #%d.", typeVN, booking.getId()))
//                     .createdAt(LocalDateTime.now())
//                     .isRead(false)
//                     .build());
//         }

//         Map<String, Object> res = new HashMap<>();
//         res.put("message", "Đã xác nhận thanh toán thành công");
//         res.put("paymentId", payment.getId());
//         res.put("bookingId", booking.getId());
//         res.put("paymentStatus", booking.getPaymentStatus());
//         res.put("bookingStatus", booking.getStatus());
//         return res;
//     }

//     @Override
//     @Transactional
//     public Map<String, Object> rejectPayment(Long paymentId, String reason) {
//         Payment payment = paymentRepository.findById(paymentId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch #" + paymentId));

//         payment.setPaymentStatus(PaymentStatus.UNPAID);
//         paymentRepository.save(payment);

//         Booking booking = payment.getBooking();
//         if (booking != null && booking.getCustomer() != null) {
//             notificationService.save(Notification.builder()
//                     .user(booking.getCustomer())
//                     .title("Thanh toán chưa được ghi nhận #" + booking.getId())
//                     .content("Admin chưa nhận được khoản chuyển khoản của bạn cho đơn #" + booking.getId() +
//                             (reason != null && !reason.isBlank() ? ". Lý do: " + reason : ". Vui lòng kiểm tra lại."))
//                     .createdAt(LocalDateTime.now())
//                     .isRead(false)
//                     .build());
//         }

//         return Map.of("message", "Đã từ chối giao dịch thanh toán", "paymentId", paymentId);
//     }

//     @Override
//     public List<Payment> getPendingPayments() {
//         return paymentRepository.findAllByPaymentStatusOrderByIdDesc(PaymentStatus.PENDING_CONFIRMATION);
//     }

//     @Override
//     public List<Payment> getPaymentsByBooking(Long bookingId) {
//         return paymentRepository.findAllByBooking_IdOrderByIdDesc(bookingId);
//     }

//     @Override
//     @Transactional
//     public Map<String, Object> payStaffPayout(Long bookingId, Long staffId, String roleInBooking) {
//         Booking booking = bookingRepository.findById(bookingId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

//         User staff = userRepository.findById(staffId)
//                 .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên #" + staffId));

//         Optional<SalaryHistory> opt = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
//                 bookingId, staffId, roleInBooking != null ? roleInBooking : "STAFF");

//         SalaryHistory sh;
//         if (opt.isPresent()) {
//             sh = opt.get();
//         } else {
//             BigDecimal amount = BigDecimal.ZERO;
//             if ("SURVEYOR".equalsIgnoreCase(roleInBooking)) {
//                 amount = booking.getSurveyFee() != null ? booking.getSurveyFee() : new BigDecimal("50000.00");
//             } else {
//                 BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
//                 BigDecimal survey = booking.getSurveyFee() != null ? booking.getSurveyFee() : BigDecimal.ZERO;
//                 amount = total.subtract(survey).max(BigDecimal.ZERO);
//                 if (amount.compareTo(BigDecimal.ZERO) == 0) {
//                     amount = total.multiply(new BigDecimal("0.7"));
//                 }
//             }
//             sh = SalaryHistory.builder()
//                     .booking(booking)
//                     .worker(staff)
//                     .roleInBooking(roleInBooking != null ? roleInBooking : "STAFF")
//                     .amountEarned(amount)
//                     .paymentStatus(SalaryStatus.UNPAID)
//                     .calculatedAt(LocalDateTime.now())
//                     .build();
//         }

//         sh.setPaymentStatus(SalaryStatus.PAID);
//         salaryHistoryRepository.save(sh);

//         // Kiểm tra xem tất cả nhân viên của đơn này đã được chi trả chưa
//         List<SalaryHistory> allHistories = salaryHistoryRepository.findAllByBooking_Id(bookingId);
//         boolean allPaid = !allHistories.isEmpty() && allHistories.stream().allMatch(h -> h.getPaymentStatus() == SalaryStatus.PAID);
//         if (allPaid) {
//             booking.setStatus(BookingStatus.PAID_TO_STAFF);
//             bookingRepository.save(booking);
//         }

//         // Gửi thông báo cho nhân viên
//         notificationService.save(Notification.builder()
//                 .user(staff)
//                 .title("Đã nhận thanh toán thù lao #" + bookingId)
//                 .content(String.format("Admin đã quyết toán thù lao %s đ cho bạn ở đơn hàng #%d.",
//                         String.format("%,d", sh.getAmountEarned().longValue()), bookingId))
//                 .createdAt(LocalDateTime.now())
//                 .isRead(false)
//                 .build());

//         Map<String, Object> result = new HashMap<>();
//         result.put("message", "Đã xác nhận thanh toán thù lao cho nhân viên thành công");
//         result.put("bookingId", bookingId);
//         result.put("workerId", staffId);
//         result.put("amount", sh.getAmountEarned());
//         result.put("bookingStatus", booking.getStatus());
//         return result;
//     }

//     private void createSalaryHistoriesForBooking(Booking booking) {
//         if (booking == null) return;

//         // 1. Giám sát
//         if (booking.getSurveyor() != null) {
//             Optional<SalaryHistory> exist = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
//                     booking.getId(), booking.getSurveyor().getId(), "SURVEYOR");
//             if (exist.isEmpty()) {
//                 BigDecimal fee = booking.getSurveyFee() != null && booking.getSurveyFee().compareTo(BigDecimal.ZERO) > 0
//                         ? booking.getSurveyFee()
//                         : new BigDecimal("50000.00");
//                 salaryHistoryRepository.save(SalaryHistory.builder()
//                         .booking(booking)
//                         .worker(booking.getSurveyor())
//                         .roleInBooking("SURVEYOR")
//                         .amountEarned(fee)
//                         .paymentStatus(SalaryStatus.UNPAID)
//                         .calculatedAt(LocalDateTime.now())
//                         .build());
//             }
//         }

//         // 2. Đội thợ
//         User tech = booking.getTechnician() != null ? booking.getTechnician() : booking.getPreferredTechnician();
//         if (tech != null) {
//             Optional<SalaryHistory> exist = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
//                     booking.getId(), tech.getId(), "TECHNICIAN");
//             if (exist.isEmpty()) {
//                 BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
//                 BigDecimal survey = booking.getSurveyFee() != null ? booking.getSurveyFee() : BigDecimal.ZERO;
//                 BigDecimal techAmount = total.subtract(survey);
//                 if (techAmount.compareTo(BigDecimal.ZERO) <= 0) {
//                     techAmount = total.multiply(new BigDecimal("0.70"));
//                 }
//                 salaryHistoryRepository.save(SalaryHistory.builder()
//                         .booking(booking)
//                         .worker(tech)
//                         .roleInBooking("TECHNICIAN")
//                         .amountEarned(techAmount)
//                         .paymentStatus(SalaryStatus.UNPAID)
//                         .calculatedAt(LocalDateTime.now())
//                         .build());
//             }
//         }
//     }
// }

package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.enums.SalaryStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.SalaryHistoryRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.CloudinaryService;
import com.example.paintingservice.service.MoMoService;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.PaymentService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentServiceImpl extends BaseServiceImpl<Payment, Long> implements PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final SalaryHistoryRepository salaryHistoryRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MoMoService moMoService;
    private final CloudinaryService cloudinaryService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            ContractRepository contractRepository,
            SalaryHistoryRepository salaryHistoryRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            MoMoService moMoService,
            CloudinaryService cloudinaryService) {
        super(paymentRepository);
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.contractRepository = contractRepository;
        this.salaryHistoryRepository = salaryHistoryRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.moMoService = moMoService;
        this.cloudinaryService = cloudinaryService;
    }

    // =========================================================================
    // MOMO
    // =========================================================================

    @Override
    @Transactional
    public Map<String, Object> createMoMoPayment(Long bookingId, String paymentType) throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
        if (!type.equals("DEPOSIT") && !type.equals("FINAL")) {
            throw new RuntimeException("paymentType phải là DEPOSIT hoặc FINAL");
        }

        PaymentStatus current = booking.getPaymentStatus();
        if (type.equals("DEPOSIT") && (current == PaymentStatus.DEPOSIT_PAID || current == PaymentStatus.FULLY_PAID)) {
            throw new RuntimeException("Đơn hàng đã thanh toán cọc hoặc thanh toán đủ rồi");
        }
        if (type.equals("FINAL") && current != PaymentStatus.DEPOSIT_PAID) {
            throw new RuntimeException("Cần thanh toán cọc trước khi thanh toán phần còn lại");
        }

        BigDecimal amount = type.equals("DEPOSIT")
                ? booking.getDepositAmount()
                : booking.getRemainingAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán không hợp lệ. Kiểm tra lại báo giá của đơn hàng.");
        }

        Map<String, Object> moMoRes = moMoService.createOrder(bookingId, amount.longValue(), type);
        Object errorCodeObj = moMoRes != null ? moMoRes.get("errorCode") : null;
        int errorCode = errorCodeObj != null ? Integer.parseInt(errorCodeObj.toString()) : -1;

        if (errorCode == 0) {
            String orderId = (String) moMoRes.get("orderId");

            Payment payment = Payment.builder()
                    .booking(booking)
                    .amount(amount)
                    .paymentMethod("MOMO")
                    .paymentType(type)
                    .paymentStatus(PaymentStatus.UNPAID)
                    .transactionCode(orderId)
                    .build();

            paymentRepository.save(payment);
        }

        return moMoRes;
    }

    @Override
    @Transactional
    public void processMoMoSuccessCallback(String orderId) {
        Payment payment = paymentRepository.findByTransactionCode(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch: " + orderId));

        if (payment.getPaidAt() != null) {
            return;
        }

        String type = payment.getPaymentType() != null
                ? payment.getPaymentType().toUpperCase()
                : "DEPOSIT";

        if ("DEPOSIT".equals(type)) {
            payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        } else {
            payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
        }
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        if (booking == null) {
            return;
        }

        if ("DEPOSIT".equals(type)) {
            booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        } else if ("FINAL".equals(type)) {
            booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
            booking.setRemainingAmount(BigDecimal.ZERO);
            if (booking.getStatus() == BookingStatus.WORKER_COMPLETED
                    || booking.getStatus() == BookingStatus.PROCESSING) {
                booking.setStatus(BookingStatus.COMPLETED);
            }
            createSalaryHistoriesForBooking(booking);
        }

        bookingRepository.save(booking);
    }

    // =========================================================================
    // QR + ADMIN CONFIRM
    // =========================================================================

    @Override
    @Transactional
    public Map<String, Object> submitQrPayment(
            Long bookingId,
            String paymentType,
            String note,
            MultipartFile proofImage,
            String username) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
        if (!type.equals("DEPOSIT") && !type.equals("FINAL")) {
            throw new RuntimeException("paymentType phải là DEPOSIT hoặc FINAL");
        }

        PaymentStatus current = booking.getPaymentStatus();
        if (type.equals("DEPOSIT")
                && (current == PaymentStatus.DEPOSIT_PAID || current == PaymentStatus.FULLY_PAID)) {
            throw new RuntimeException("Đơn hàng đã được xác nhận thanh toán cọc hoặc hoàn tất");
        }
        if (type.equals("FINAL")
                && current != PaymentStatus.DEPOSIT_PAID
                && current != PaymentStatus.PENDING_CONFIRMATION) {
            throw new RuntimeException("Cần thanh toán cọc trước khi thanh toán phần còn lại");
        }

        BigDecimal amount = type.equals("DEPOSIT")
                ? (booking.getDepositAmount() != null && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                        ? booking.getDepositAmount()
                        : (booking.getTotalAmount() != null
                                ? booking.getTotalAmount().multiply(new BigDecimal("0.3"))
                                : BigDecimal.ZERO))
                : (booking.getRemainingAmount() != null && booking.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0
                        ? booking.getRemainingAmount()
                        : (booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán không hợp lệ.");
        }

        String txCode = (type.equals("DEPOSIT") ? "COC" : "TT")
                + "-DH" + bookingId + "-" + System.currentTimeMillis();

        Payment.PaymentBuilder builder = Payment.builder()
                .booking(booking)
                .amount(amount)
                .paymentMethod("QR_VIETQR")
                .paymentType(type)
                .paymentStatus(PaymentStatus.PENDING_CONFIRMATION)
                .transactionCode(txCode);

        if (note != null && !note.isBlank()) {
            builder.note(note.trim());
        }

        if (proofImage != null && !proofImage.isEmpty()) {
            try {
                String imageUrl = cloudinaryService.uploadImage(
                        proofImage,
                        "payments/booking-" + bookingId);
                builder.proofImage(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Không upload được ảnh biên lai: " + e.getMessage());
            }
        }

        Payment savedPayment = paymentRepository.save(builder.build());

        // Cập nhật booking → frontend hiện "Chờ Admin"
        booking.setPaymentStatus(PaymentStatus.PENDING_CONFIRMATION);

        // Set deadline 24h lần đầu (không ghi đè nếu đã gia hạn)
        if ("DEPOSIT".equals(type) && booking.getDepositDeadline() == null) {
            booking.setDepositDeadline(LocalDateTime.now().plusHours(24));
        }

        bookingRepository.save(booking);

        String typeLabel = type.equals("DEPOSIT") ? "tiền cọc" : "phần còn lại";
        userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
            notificationService.save(Notification.builder()
                    .user(admin)
                    .title("Khách đã chuyển khoản QR #" + bookingId)
                    .content(String.format(
                            "Khách hàng đã quét mã QR thanh toán %s (%s đ) cho đơn #%d. Vui lòng kiểm tra và xác nhận.",
                            typeLabel,
                            String.format("%,d", amount.longValue()),
                            bookingId))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        });

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Đã gửi thông tin thanh toán QR thành công. Vui lòng chờ Admin kiểm tra và xác nhận.");
        result.put("paymentId", savedPayment.getId());
        result.put("amount", amount);
        result.put("transactionCode", txCode);
        result.put("paymentType", type);
        result.put("status", "PENDING_CONFIRMATION");
        result.put("proofImage", savedPayment.getProofImage());
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> confirmPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch thanh toán #" + paymentId));

        Booking booking = payment.getBooking();
        if (booking == null) {
            throw new RuntimeException("Giao dịch không gắn với đơn hàng nào");
        }

        String type = payment.getPaymentType() != null
                ? payment.getPaymentType().toUpperCase()
                : "DEPOSIT";

        if ("DEPOSIT".equals(type)) {
            payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
            booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);

            // Khách hàng đã chuyển cọc -> Giữ ở WAITING_DEPOSIT để Admin ký duyệt hợp đồng
            if (booking.getStatus() == BookingStatus.WAITING_CUSTOMER_SIGNATURE
                    || booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.WAITING_DEPOSIT);
            }
        } else {
            payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
            booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
            booking.setRemainingAmount(BigDecimal.ZERO);
            if (booking.getStatus() == BookingStatus.WORKER_COMPLETED
                    || booking.getStatus() == BookingStatus.PROCESSING) {
                booking.setStatus(BookingStatus.COMPLETED);
            }
            createSalaryHistoriesForBooking(booking);
        }

        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);
        bookingRepository.save(booking);

        if (booking.getCustomer() != null) {
            String typeVN = "DEPOSIT".equals(type) ? "tiền cọc" : "tất toán hoàn thành";
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Thanh toán thành công đơn #" + booking.getId())
                    .content(String.format(
                            "Admin đã xác nhận nhận đủ %s cho đơn hàng #%d.",
                            typeVN, booking.getId()))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Đã xác nhận thanh toán thành công");
        res.put("paymentId", payment.getId());
        res.put("bookingId", booking.getId());
        res.put("paymentStatus", booking.getPaymentStatus());
        res.put("bookingStatus", booking.getStatus());
        return res;
    }

    @Override
    @Transactional
    public Map<String, Object> rejectPayment(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch #" + paymentId));

        payment.setPaymentStatus(PaymentStatus.UNPAID);
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        if (booking != null) {
            // Trả booking về UNPAID nếu đang chờ duyệt
            if (booking.getPaymentStatus() == PaymentStatus.PENDING_CONFIRMATION) {
                booking.setPaymentStatus(PaymentStatus.UNPAID);
                bookingRepository.save(booking);
            }

            if (booking.getCustomer() != null) {
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Thanh toán chưa được ghi nhận #" + booking.getId())
                        .content("Admin chưa nhận được khoản chuyển khoản của bạn cho đơn #" + booking.getId()
                                + (reason != null && !reason.isBlank() ? ". Lý do: " + reason
                                        : ". Vui lòng kiểm tra lại."))
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }
        }

        return Map.of("message", "Đã từ chối giao dịch thanh toán", "paymentId", paymentId);
    }

    @Override
    public List<Payment> getPendingPayments() {
        return paymentRepository.findAllByPaymentStatusOrderByIdDesc(PaymentStatus.PENDING_CONFIRMATION);
    }

    @Override
    public List<Payment> getPaymentsByBooking(Long bookingId) {
        return paymentRepository.findAllByBooking_IdOrderByIdDesc(bookingId);
    }

    @Override
    @Transactional
    public Map<String, Object> extendDepositDeadline(Long bookingId, Integer hours, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn #" + bookingId));

        int h = (hours != null && hours > 0) ? hours : 24;

        LocalDateTime base = booking.getDepositDeadline() != null
                ? booking.getDepositDeadline()
                : LocalDateTime.now();

        booking.setDepositDeadline(base.plusHours(h));
        bookingRepository.save(booking);

        if (booking.getCustomer() != null) {
            notificationService.save(Notification.builder()
                    .user(booking.getCustomer())
                    .title("Gia hạn thời gian nộp cọc #" + bookingId)
                    .content(String.format(
                            "Admin đã gia hạn thêm %d giờ nộp cọc cho đơn #%d.%s",
                            h,
                            bookingId,
                            reason != null && !reason.isBlank() ? " Lý do: " + reason : ""))
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Đã gia hạn thêm " + h + " giờ");
        res.put("depositDeadline", booking.getDepositDeadline());
        return res;
    }

    @Override
    @Transactional
    public Map<String, Object> payStaffPayout(Long bookingId, Long staffId, String roleInBooking) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên #" + staffId));

        Optional<SalaryHistory> opt = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                bookingId, staffId, roleInBooking != null ? roleInBooking : "STAFF");

        SalaryHistory sh;
        if (opt.isPresent()) {
            sh = opt.get();
        } else {
            BigDecimal amount;
            if ("SURVEYOR".equalsIgnoreCase(roleInBooking)) {
                amount = booking.getSurveyFee() != null ? booking.getSurveyFee() : new BigDecimal("50000.00");
            } else {
                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
                BigDecimal survey = booking.getSurveyFee() != null ? booking.getSurveyFee() : BigDecimal.ZERO;
                amount = total.subtract(survey).max(BigDecimal.ZERO);
                if (amount.compareTo(BigDecimal.ZERO) == 0) {
                    amount = total.multiply(new BigDecimal("0.7"));
                }
            }
            sh = SalaryHistory.builder()
                    .booking(booking)
                    .worker(staff)
                    .roleInBooking(roleInBooking != null ? roleInBooking : "STAFF")
                    .amountEarned(amount)
                    .paymentStatus(SalaryStatus.UNPAID)
                    .calculatedAt(LocalDateTime.now())
                    .build();
        }

        sh.setPaymentStatus(SalaryStatus.PAID);
        salaryHistoryRepository.save(sh);

        List<SalaryHistory> allHistories = salaryHistoryRepository.findAllByBooking_Id(bookingId);
        boolean allPaid = !allHistories.isEmpty()
                && allHistories.stream().allMatch(h -> h.getPaymentStatus() == SalaryStatus.PAID);
        if (allPaid) {
            booking.setStatus(BookingStatus.PAID_TO_STAFF);
            bookingRepository.save(booking);
        }

        notificationService.save(Notification.builder()
                .user(staff)
                .title("Đã nhận thanh toán thù lao #" + bookingId)
                .content(String.format(
                        "Admin đã quyết toán thù lao %s đ cho bạn ở đơn hàng #%d.",
                        String.format("%,d", sh.getAmountEarned().longValue()),
                        bookingId))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build());

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Đã xác nhận thanh toán thù lao cho nhân viên thành công");
        result.put("bookingId", bookingId);
        result.put("workerId", staffId);
        result.put("amount", sh.getAmountEarned());
        result.put("bookingStatus", booking.getStatus());
        return result;
    }

    private void createSalaryHistoriesForBooking(Booking booking) {
        if (booking == null)
            return;

        if (booking.getSurveyor() != null) {
            Optional<SalaryHistory> exist = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                    booking.getId(), booking.getSurveyor().getId(), "SURVEYOR");
            if (exist.isEmpty()) {
                BigDecimal fee = booking.getSurveyFee() != null
                        && booking.getSurveyFee().compareTo(BigDecimal.ZERO) > 0
                                ? booking.getSurveyFee()
                                : new BigDecimal("50000.00");
                salaryHistoryRepository.save(SalaryHistory.builder()
                        .booking(booking)
                        .worker(booking.getSurveyor())
                        .roleInBooking("SURVEYOR")
                        .amountEarned(fee)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build());
            }
        }

        User tech = booking.getTechnician() != null
                ? booking.getTechnician()
                : booking.getPreferredTechnician();
        if (tech != null) {
            Optional<SalaryHistory> exist = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                    booking.getId(), tech.getId(), "TECHNICIAN");
            if (exist.isEmpty()) {
                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
                BigDecimal survey = booking.getSurveyFee() != null ? booking.getSurveyFee() : BigDecimal.ZERO;
                BigDecimal techAmount = total.subtract(survey);
                if (techAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    techAmount = total.multiply(new BigDecimal("0.70"));
                }
                salaryHistoryRepository.save(SalaryHistory.builder()
                        .booking(booking)
                        .worker(tech)
                        .roleInBooking("TECHNICIAN")
                        .amountEarned(techAmount)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build());
            }
        }
    }
}