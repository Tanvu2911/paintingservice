package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.WarrantyClaim;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.enums.SalaryStatus;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.SalaryHistoryRepository;
import com.example.paintingservice.repository.StaffProfileRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.WarrantyNotificationService;
import com.example.paintingservice.service.WarrantyPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Chịu trách nhiệm duy nhất: ghi nhận thanh toán thù lao nhân sự bảo hành
 * và lưu Payment khi khách thanh toán phí hỗ trợ.
 * Tách ra từ WarrantyClaimServiceImpl theo Single Responsibility Principle.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WarrantyPaymentServiceImpl implements WarrantyPaymentService {

    private static final BigDecimal DEFAULT_SURVEYOR_PAY  = new BigDecimal("100000");
    private static final BigDecimal DEFAULT_TECHNICIAN_PAY = new BigDecimal("200000");

    private final SalaryHistoryRepository salaryHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final WarrantyNotificationService warrantyNotificationService;

    @Override
    public void payStaff(WarrantyClaim claim, Long staffId, String role, BigDecimal amount, String adminUsername) {
        boolean isSurveyor = "SURVEYOR".equalsIgnoreCase(role);
        User staff = resolveStaff(claim, staffId, isSurveyor);
        BigDecimal payAmount = resolvePayAmount(amount, isSurveyor);
        String roleKey = isSurveyor ? "SURVEYOR" : "TECHNICIAN";

        SalaryHistory sh = salaryHistoryRepository
                .findByWarrantyClaimIdAndRoleInBooking(claim.getId(), roleKey)
                .orElse(null);

        if (sh == null) {
            sh = SalaryHistory.builder()
                    .booking(claim.getBooking())
                    .warrantyClaim(claim)
                    .worker(staff)
                    .roleInBooking(roleKey)
                    .amountEarned(payAmount)
                    .paymentStatus(SalaryStatus.PAID)
                    .calculatedAt(LocalDateTime.now())
                    .paidAt(LocalDateTime.now())
                    .build();
        } else {
            sh.setWorker(staff);
            sh.setAmountEarned(payAmount);
            sh.setPaymentStatus(SalaryStatus.PAID);
            sh.setPaidAt(LocalDateTime.now());
        }
        salaryHistoryRepository.save(sh);

        warrantyNotificationService.notifyStaffPaid(claim, staff, role, payAmount);
        log.info("Đã thanh toán thù lao bảo hành claimId={} role={} amount={}", claim.getId(), role, payAmount);
    }

    @Override
    public BigDecimal recordCustomerPayment(WarrantyClaim claim) {
        BigDecimal price = BigDecimal.ZERO;
        if (claim.getReport() != null && claim.getReport().getFinalSupportPrice() != null) {
            price = claim.getReport().getFinalSupportPrice();
        }

        if (price.compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = Payment.builder()
                    .booking(claim.getBooking())
                    .amount(price)
                    .paymentMethod("VNPAY_SANDBOX")
                    .paymentType("WARRANTY_SUPPORT")
                    .paymentStatus(PaymentStatus.FULLY_PAID)
                    .transactionCode("VNP_BH_" + claim.getId() + "_" + claim.getBooking().getId())
                    .paidAt(LocalDateTime.now())
                    .note(String.format("Khách hàng thanh toán phí hỗ trợ sửa chữa bảo hành #%d", claim.getId()))
                    .build();
            paymentRepository.save(payment);
            log.info("Đã ghi nhận thanh toán phí bảo hành claimId={} amount={}", claim.getId(), price);
        }
        return price;
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private User resolveStaff(WarrantyClaim claim, Long staffId, boolean isSurveyor) {
        if (isSurveyor) {
            User staff = claim.getSurveyor();
            if (staff == null) throw new RuntimeException("Phiếu bảo hành chưa được gán Giám Sát!");
            return staff;
        } else {
            User staff = claim.getTechnician();
            if (staff == null) throw new RuntimeException("Phiếu bảo hành chưa được gán Đội Thợ!");
            return staff;
        }
    }

    private BigDecimal resolvePayAmount(BigDecimal amount, boolean isSurveyor) {
        if (amount != null && amount.compareTo(BigDecimal.ZERO) >= 0) return amount;
        return isSurveyor ? DEFAULT_SURVEYOR_PAY : DEFAULT_TECHNICIAN_PAY;
    }
}
