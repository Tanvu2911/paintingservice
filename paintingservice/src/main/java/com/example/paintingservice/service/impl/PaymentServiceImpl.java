package com.example.paintingservice.service.impl;

import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.enums.SalaryStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.DailyReportRepository;
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
    private final SalaryHistoryRepository salaryHistoryRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DailyReportRepository dailyReportRepository;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            SalaryHistoryRepository salaryHistoryRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            DailyReportRepository dailyReportRepository) {
        super(paymentRepository);
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.salaryHistoryRepository = salaryHistoryRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.dailyReportRepository = dailyReportRepository;
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

        if (booking.getPaymentStatus() != PaymentStatus.FULLY_PAID
                && booking.getStatus() != BookingStatus.COMPLETED
                && booking.getStatus() != BookingStatus.PAID_TO_STAFF) {
            throw new RuntimeException(
                    "Chỉ có thể quyết toán thù lao cho nhân viên khi khách hàng đã hoàn tất mọi thanh toán!");
        }

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
            if ("SURVEYOR".equalsIgnoreCase(roleInBooking)) {
                BigDecimal baseSurveyor = total.multiply(AppConstants.SUPERVISOR_COMMISSION_RATE);
                sh.setAmountEarned(baseSurveyor.add(materialCostTotal));
            } else if ("TECHNICIAN".equalsIgnoreCase(roleInBooking)) {
                sh.setAmountEarned(total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE));
            }
        } else {
            BigDecimal amount;
            if ("SURVEYOR".equalsIgnoreCase(roleInBooking)) {
                BigDecimal baseSurveyor = total.multiply(AppConstants.SUPERVISOR_COMMISSION_RATE);
                amount = baseSurveyor.add(materialCostTotal);
            } else {
                amount = total.multiply(AppConstants.TECHNICIAN_COMMISSION_RATE);
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
}