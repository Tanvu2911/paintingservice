package com.example.paintingservice.service.impl;

import com.example.paintingservice.config.VNPayConfig;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayServiceImpl implements VNPayService {

    private final VNPayConfig vnPayConfig;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public Map<String, Object> createVNPayPaymentUrl(Long bookingId, String paymentType, HttpServletRequest request)
            throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
        if (!type.equals("DEPOSIT") && !type.equals("FINAL")) {
            throw new RuntimeException("Loại thanh toán phải là DEPOSIT (cọc) hoặc FINAL (tất toán)");
        }

        PaymentStatus current = booking.getPaymentStatus();
        if (type.equals("DEPOSIT") && (current == PaymentStatus.DEPOSIT_PAID || current == PaymentStatus.FULLY_PAID)) {
            throw new RuntimeException("Đơn hàng đã được thanh toán cọc hoặc hoàn tất!");
        }
        if (type.equals("FINAL")) {
            if (current == PaymentStatus.FULLY_PAID) {
                throw new RuntimeException("Đơn hàng đã được tất toán hoàn tất!");
            }
            boolean hasPaidDeposit = current == PaymentStatus.DEPOSIT_PAID
                    || current == PaymentStatus.PENDING_CONFIRMATION
                    || booking.getStatus() == BookingStatus.DEPOSIT_CONFIRMED
                    || booking.getStatus() == BookingStatus.ASSIGNED
                    || booking.getStatus() == BookingStatus.PROCESSING
                    || booking.getStatus() == BookingStatus.WORKER_COMPLETED
                    || booking.getStatus() == BookingStatus.WAITING_FINAL_PAYMENT
                    || booking.getStatus() == BookingStatus.COMPLETED;
            if (!hasPaidDeposit) {
                throw new RuntimeException("Cần thanh toán tiền cọc trước khi thanh toán phần còn lại!");
            }
            if (booking.getStatus() != BookingStatus.WAITING_FINAL_PAYMENT
                    && booking.getStatus() != BookingStatus.COMPLETED
                    && booking.getStatus() != BookingStatus.WORKER_COMPLETED) {
                throw new RuntimeException(
                        "Công trình chưa thi công xong hoặc chưa được nghiệm thu để thanh toán tất toán!");
            }
        }

        BigDecimal amount = type.equals("DEPOSIT")
                ? (booking.getDepositAmount() != null && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                        ? booking.getDepositAmount()
                        : (booking.getTotalAmount() != null ? booking.getTotalAmount().multiply(new BigDecimal("0.3"))
                                : BigDecimal.ZERO))
                : (booking.getRemainingAmount() != null && booking.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0
                        ? booking.getRemainingAmount()
                        : (booking.getTotalAmount() != null
                                ? (booking.getDepositAmount() != null
                                        && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                                                ? booking.getTotalAmount().subtract(booking.getDepositAmount())
                                                : booking.getTotalAmount().multiply(new BigDecimal("0.7")))
                                : BigDecimal.ZERO));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán không hợp lệ.");
        }

        // Tạo mã giao dịch duy nhất
        String vnp_TxnRef = (type.equals("DEPOSIT") ? "VNP_COC_" : "VNP_TT_") + bookingId + "_"
                + System.currentTimeMillis();
        long amountInVND = amount.longValue() * 100; // VNPay nhân 100

        String orderInfo = "Thanh toan " + (type.equals("DEPOSIT") ? "coc 30%" : "tat toan") + " don hang #"
                + bookingId;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", VNPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VNPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amountInVND));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", VNPayConfig.getIpAddress(request));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Tạo chuỗi query và hash SHA512
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;

        // Lưu bản ghi Payment trước ở trạng thái UNPAID
        Payment payment = Payment.builder()
                .booking(booking)
                .amount(amount)
                .paymentMethod("VNPAY")
                .paymentType(type)
                .paymentStatus(PaymentStatus.UNPAID)
                .transactionCode(vnp_TxnRef)
                .note(orderInfo)
                .build();
        paymentRepository.save(payment);

        Map<String, Object> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);
        result.put("transactionCode", vnp_TxnRef);
        result.put("amount", amount);
        result.put("paymentType", type);
        result.put("bookingId", bookingId);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> processVNPayCallback(Map<String, String> fields) {
        Map<String, Object> response = new HashMap<>();

        Map<String, String> vnp_Params = new HashMap<>();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (entry.getKey().startsWith("vnp_")) {
                vnp_Params.put(entry.getKey(), entry.getValue());
            }
        }

        String vnp_SecureHash = vnp_Params.remove("vnp_SecureHash");
        vnp_Params.remove("vnp_SecureHashType");

        String signValue = VNPayConfig.hashAllFields(vnp_Params, vnPayConfig.getSecretKey());

        if (!signValue.equalsIgnoreCase(vnp_SecureHash)) {
            response.put("status", "INVALID_SIGNATURE");
            response.put("message", "Chữ ký bảo mật không hợp lệ");
            response.put("success", false);
            return response;
        }

        String vnp_TxnRef = vnp_Params.get("vnp_TxnRef");
        String vnp_ResponseCode = vnp_Params.get("vnp_ResponseCode");
        String vnp_TransactionNo = vnp_Params.get("vnp_TransactionNo");
        String vnp_BankCode = vnp_Params.get("vnp_BankCode");

        Optional<Payment> paymentOpt = paymentRepository.findByTransactionCode(vnp_TxnRef);
        if (paymentOpt.isEmpty()) {
            response.put("status", "PAYMENT_NOT_FOUND");
            response.put("message", "Không tìm thấy thông tin giao dịch");
            response.put("success", false);
            return response;
        }

        Payment payment = paymentOpt.get();
        Booking booking = payment.getBooking();

        if ("00".equals(vnp_ResponseCode)) {
            // Thanh toán thành công
            String type = payment.getPaymentType() != null ? payment.getPaymentType().toUpperCase() : "DEPOSIT";

            if ("DEPOSIT".equals(type)) {
                payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                booking.setDepositPaidAt(LocalDateTime.now());

                // Khách hàng đã chuyển cọc xong -> Chờ Admin ký duyệt hợp đồng điện tử
                // KHÔNG tự động ký adminSigned, Admin phải vào ký trên giao diện OrderDetail
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
                        || booking.getStatus() == BookingStatus.PROCESSING
                        || booking.getStatus() == BookingStatus.WAITING_FINAL_PAYMENT) {
                    booking.setStatus(BookingStatus.COMPLETED);
                }
            }

            payment.setPaidAt(LocalDateTime.now());
            payment.setNote(String.format("VNPay GD: %s, Ngân hàng: %s", vnp_TransactionNo, vnp_BankCode));
            paymentRepository.save(payment);
            bookingRepository.save(booking);

            // Gửi thông báo cho khách hàng & admin
            if (booking.getCustomer() != null) {
                String notiContent = "DEPOSIT".equals(type)
                        ? String.format(
                                "Giao dịch đặt cọc 30%% cho đơn hàng #%d qua VNPay đã thành công. Đang chờ Admin ký duyệt hợp đồng điện tử.",
                                booking.getId())
                        : String.format("Giao dịch thanh toán tất toán cho đơn hàng #%d qua VNPay đã thành công.",
                                booking.getId());
                notificationService.save(Notification.builder()
                        .user(booking.getCustomer())
                        .title("Thanh toán VNPay thành công #" + booking.getId())
                        .content(notiContent)
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build());
            }

            response.put("status", "SUCCESS");
            response.put("message", "Thanh toán VNPay thành công");
            response.put("success", true);
            response.put("bookingId", booking.getId());
            response.put("paymentType", type);
            response.put("amount", payment.getAmount());
            response.put("transactionNo", vnp_TransactionNo);
        } else {
            // Thanh toán thất bại hoặc hủy
            payment.setPaymentStatus(PaymentStatus.UNPAID);
            paymentRepository.save(payment);

            response.put("status", "FAILED");
            response.put("message", "Giao dịch không thành công (Mã phản hồi: " + vnp_ResponseCode + ")");
            response.put("success", false);
            response.put("bookingId", booking != null ? booking.getId() : null);
        }

        return response;
    }
}
