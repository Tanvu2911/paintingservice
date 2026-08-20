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
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.PaymentService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

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
    private final com.example.paintingservice.repository.DailyReportRepository dailyReportRepository;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            ContractRepository contractRepository,
            SalaryHistoryRepository salaryHistoryRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            com.example.paintingservice.repository.DailyReportRepository dailyReportRepository) {
        super(paymentRepository);
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.contractRepository = contractRepository;
        this.salaryHistoryRepository = salaryHistoryRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.dailyReportRepository = dailyReportRepository;
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
            booking.setDepositPaidAt(LocalDateTime.now());

            if (booking.getStatus() == BookingStatus.WAITING_CUSTOMER_SIGNATURE
                    || booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.WAITING_DEPOSIT);
            }
        } else {
            payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
            booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
            booking.setRemainingAmount(BigDecimal.ZERO);
            booking.setFinalPaidAt(LocalDateTime.now());
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
    public Map<String, Object> payStaffPayout(Long bookingId, Long staffId, String roleInBooking) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên #" + staffId));

        Optional<SalaryHistory> opt = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                bookingId, staffId, roleInBooking != null ? roleInBooking : "STAFF");

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;

        // Tổng tiền vật tư phát sinh từ tất cả báo cáo ngày của đơn này
        BigDecimal materialCostTotal = dailyReportRepository.findAllByBooking_Id(bookingId).stream()
                .map(r -> r.getMaterialCost() != null ? r.getMaterialCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        SalaryHistory sh;
        if (opt.isPresent()) {
            sh = opt.get();
            // Nếu là Giám sát, cập nhật lại số tiền gồm 10% + chi phí vật tư phát sinh nếu
            // chưa chốt
            if ("SURVEYOR".equalsIgnoreCase(roleInBooking)) {
                BigDecimal baseSurveyor = total.multiply(new BigDecimal("0.10"));
                sh.setAmountEarned(baseSurveyor.add(materialCostTotal));
            } else if ("TECHNICIAN".equalsIgnoreCase(roleInBooking)) {
                sh.setAmountEarned(total.multiply(new BigDecimal("0.60")));
            }
        } else {
            BigDecimal amount;
            if ("SURVEYOR".equalsIgnoreCase(roleInBooking)) {
                // Giám sát nhận: 10% giá trị hợp đồng + hoàn tiền vật liệu phát sinh
                BigDecimal baseSurveyor = total.multiply(new BigDecimal("0.10"));
                amount = baseSurveyor.add(materialCostTotal);
            } else {
                // Đội thợ nhận: 60% giá trị hợp đồng
                amount = total.multiply(new BigDecimal("0.60"));
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
        sh.setPaidAt(LocalDateTime.now());
        salaryHistoryRepository.save(sh);

        // Kiểm tra xem tất cả các nhân sự được phân công (Giám sát & Kỹ thuật) đã được trả đủ chưa
        boolean surveyorPaid = true;
        if (booking.getSurveyor() != null) {
            Optional<SalaryHistory> supSh = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                    bookingId, booking.getSurveyor().getId(), "SURVEYOR");
            surveyorPaid = supSh.isPresent() && supSh.get().getPaymentStatus() == SalaryStatus.PAID;
        }

        boolean techPaid = true;
        User tech = booking.getTechnician() != null ? booking.getTechnician() : booking.getPreferredTechnician();
        if (tech != null) {
            Optional<SalaryHistory> techSh = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                    bookingId, tech.getId(), "TECHNICIAN");
            techPaid = techSh.isPresent() && techSh.get().getPaymentStatus() == SalaryStatus.PAID;
        }

        if (surveyorPaid && techPaid) {
            booking.setStatus(BookingStatus.PAID_TO_STAFF);
            bookingRepository.save(booking);
        }

        notificationService.save(Notification.builder()
                .user(staff)
                .title("Đã nhận thanh toán thù lao #" + bookingId)
                .content(String.format(
                        "Admin đã quyết toán thù lao %s đ cho bạn ở đơn hàng #%d (Bao gồm thù lao theo tỷ lệ & hoàn tiền vật tư nếu có).",
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
        result.put("materialReimbursement", materialCostTotal);
        result.put("bookingStatus", booking.getStatus());
        return result;
    }

    private void createSalaryHistoriesForBooking(Booking booking) {
        if (booking == null)
            return;

        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;

        // Tổng tiền vật tư phát sinh từ tất cả báo cáo ngày
        BigDecimal materialCostTotal = dailyReportRepository.findAllByBooking_Id(booking.getId()).stream()
                .map(r -> r.getMaterialCost() != null ? r.getMaterialCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 1. Quyết toán cho Giám sát viên: 10% Hợp đồng + Hoàn tiền vật tư phát sinh
        if (booking.getSurveyor() != null) {
            Optional<SalaryHistory> exist = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                    booking.getId(), booking.getSurveyor().getId(), "SURVEYOR");

            BigDecimal surveyorShare = total.multiply(new BigDecimal("0.10")).add(materialCostTotal);
            if (surveyorShare.compareTo(BigDecimal.ZERO) == 0 && booking.getSurveyFee() != null) {
                surveyorShare = booking.getSurveyFee().add(materialCostTotal);
            }

            if (exist.isEmpty()) {
                salaryHistoryRepository.save(SalaryHistory.builder()
                        .booking(booking)
                        .worker(booking.getSurveyor())
                        .roleInBooking("SURVEYOR")
                        .amountEarned(surveyorShare)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build());
            } else {
                SalaryHistory sh = exist.get();
                if (sh.getPaymentStatus() != SalaryStatus.PAID) {
                    sh.setAmountEarned(surveyorShare);
                    salaryHistoryRepository.save(sh);
                }
            }
        }

        // 2. Quyết toán cho Đội thợ thi công: 60% Hợp đồng
        User tech = booking.getTechnician() != null
                ? booking.getTechnician()
                : booking.getPreferredTechnician();
        if (tech != null) {
            Optional<SalaryHistory> exist = salaryHistoryRepository.findByBooking_IdAndWorker_IdAndRoleInBooking(
                    booking.getId(), tech.getId(), "TECHNICIAN");

            BigDecimal workerShare = total.multiply(new BigDecimal("0.60"));

            if (exist.isEmpty()) {
                salaryHistoryRepository.save(SalaryHistory.builder()
                        .booking(booking)
                        .worker(tech)
                        .roleInBooking("TECHNICIAN")
                        .amountEarned(workerShare)
                        .paymentStatus(SalaryStatus.UNPAID)
                        .calculatedAt(LocalDateTime.now())
                        .build());
            } else {
                SalaryHistory sh = exist.get();
                if (sh.getPaymentStatus() != SalaryStatus.PAID) {
                    sh.setAmountEarned(workerShare);
                    salaryHistoryRepository.save(sh);
                }
            }
        }
    }
}