package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.PaymentService;
import com.example.paintingservice.service.MoMoService;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Service;


@Service
public class PaymentServiceImpl extends BaseServiceImpl<Payment, Long> implements PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final MoMoService moMoService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            MoMoService moMoService) {
        super(paymentRepository);
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.moMoService = moMoService;
    }

    @Override
    @Transactional
    public Map<String, Object> createMoMoPayment(Long bookingId, String paymentType) throws Exception {
        
        // Thay thế đoạn gọi calculateAmountForBooking bằng đoạn code lấy số tiền trực tiếp này:
Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
if (!type.equals("DEPOSIT") && !type.equals("FINAL")) {
    throw new RuntimeException("paymentType phải là DEPOSIT hoặc FINAL");
}

// Kiểm tra trạng thái thanh toán hiện tại của Booking
PaymentStatus current = booking.getPaymentStatus();
if (type.equals("DEPOSIT") && (current == PaymentStatus.DEPOSIT_PAID || current == PaymentStatus.FULLY_PAID)) {
    throw new RuntimeException("Đơn hàng đã thanh toán cọc hoặc thanh toán đủ rồi");
}
if (type.equals("FINAL") && current != PaymentStatus.DEPOSIT_PAID) {
    throw new RuntimeException("Cần thanh toán cọc trước khi thanh toán phần còn lại");
}

// Lấy số tiền tương ứng dựa vào loại thanh toán
BigDecimal amount = type.equals("DEPOSIT")
        ? booking.getDepositAmount()
        : booking.getRemainingAmount();

if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
    throw new RuntimeException("Số tiền thanh toán không hợp lệ. Kiểm tra lại báo giá của đơn hàng.");
}

// Gọi MoMoService để tạo đơn
Map<String, Object> moMoRes = moMoService.createOrder(bookingId, amount.longValue(), type);
        // MoMo trả về errorCode == 0 là thành công
        Object errorCodeObj = moMoRes != null ? moMoRes.get("errorCode") : null;
        int errorCode = errorCodeObj != null ? Integer.parseInt(errorCodeObj.toString()) : -1;

        if (errorCode == 0) {
            String orderId = (String) moMoRes.get("orderId");

            // Lưu lịch sử giao dịch ở trạng thái UNPAID (chờ callback/IPN)
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

        // Đã xử lý rồi thì bỏ qua (Idempotent)
        if (payment.getPaidAt() != null) {
            return;
        }

        String type = payment.getPaymentType() != null
                ? payment.getPaymentType().toUpperCase()
                : "DEPOSIT";

        // Cập nhật trạng thái bảng Payment
        if ("DEPOSIT".equals(type)) {
            payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        } else {
            payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
        }
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Cập nhật trạng thái bảng Booking
        Booking booking = payment.getBooking();
        if (booking == null) {
            return;
        }

        if ("DEPOSIT".equals(type)) {
            booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
        } else if ("FINAL".equals(type)) {
            booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
            booking.setRemainingAmount(BigDecimal.ZERO);
        }

        bookingRepository.save(booking);
    }
}