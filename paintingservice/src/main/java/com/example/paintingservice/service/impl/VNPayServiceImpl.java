package com.example.paintingservice.service.impl;

import com.example.paintingservice.config.VNPayConfig;
import com.example.paintingservice.constant.AppConstants;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.Payment;
import com.example.paintingservice.entity.WarrantyClaim;
import com.example.paintingservice.entity.WarrantyReport;
import com.example.paintingservice.enums.BookingStatus;
import com.example.paintingservice.enums.PaymentStatus;
import com.example.paintingservice.enums.WarrantyStatus;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.repository.PaymentRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.repository.WarrantyClaimRepository;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.Contract;
import com.example.paintingservice.service.BookingService;
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
    private final WarrantyClaimRepository warrantyClaimRepository;
    private final NotificationService notificationService;
    private final BookingService bookingService;

    @Override
    @Transactional
    public Map<String, Object> createVNPayPaymentUrl(Long bookingId, String paymentType, HttpServletRequest request)
            throws Exception {
        return createVNPayPaymentUrl(bookingId, paymentType, null, request);
    }

    @Override
    @Transactional
    public Map<String, Object> createVNPayPaymentUrl(Long bookingId, String paymentType, Long claimId,
            HttpServletRequest request) throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng #" + bookingId));

        String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
        boolean isWarranty = "WARRANTY_SUPPORT".equals(type) || "WARRANTY".equals(type);

        if (!type.equals("DEPOSIT") && !type.equals("FINAL") && !isWarranty) {
            throw new RuntimeException(
                    "Loại thanh toán phải là DEPOSIT (cọc), FINAL (tất toán), hoặc WARRANTY_SUPPORT (phí hỗ trợ bảo hành)");
        }

        BigDecimal amount = BigDecimal.ZERO;
        String vnp_TxnRef;
        String orderInfo;

        if (isWarranty) {
            WarrantyClaim claim = null;
            if (claimId != null) {
                claim = warrantyClaimRepository.findById(claimId).orElse(null);
            }
            if (claim == null) {
                List<WarrantyClaim> claims = warrantyClaimRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
                claim = claims.stream()
                        .filter(c -> c.getReport() != null && c.getReport().getFinalSupportPrice() != null
                                && c.getReport().getFinalSupportPrice().compareTo(BigDecimal.ZERO) > 0)
                        .findFirst()
                        .orElse(null);
            }

            if (claim == null || claim.getReport() == null || claim.getReport().getFinalSupportPrice() == null
                    || claim.getReport().getFinalSupportPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Không tìm thấy thông tin chi phí hỗ trợ sửa chữa bảo hành cho đơn này!");
            }

            amount = claim.getReport().getFinalSupportPrice();
            vnp_TxnRef = "VNP_BH_" + claim.getId() + "_" + bookingId + "_" + System.currentTimeMillis();
            orderInfo = "Thanh toan phi ho tro sua chua bao hanh #" + claim.getId() + " don hang #" + bookingId;
        } else {
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

            amount = type.equals("DEPOSIT")
                    ? (booking.getDepositAmount() != null && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                            ? booking.getDepositAmount()
                            : (booking.getTotalAmount() != null
                                    ? booking.getTotalAmount().multiply(AppConstants.DEPOSIT_RATE)
                                    : BigDecimal.ZERO))
                    : (booking.getRemainingAmount() != null
                            && booking.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0
                                    ? booking.getRemainingAmount()
                                    : (booking.getTotalAmount() != null
                                            ? (booking.getDepositAmount() != null
                                                    && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                                                            ? booking.getTotalAmount()
                                                                    .subtract(booking.getDepositAmount())
                                                            : booking.getTotalAmount()
                                                                    .multiply(AppConstants.REMAINING_RATE))
                                            : BigDecimal.ZERO));

            vnp_TxnRef = (type.equals("DEPOSIT") ? "VNP_COC_" : "VNP_TT_") + bookingId + "_"
                    + System.currentTimeMillis();
            orderInfo = "Thanh toan " + (type.equals("DEPOSIT") ? "coc 30%" : "tat toan") + " don hang #"
                    + bookingId;
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán không hợp lệ.");
        }

        long amountInVND = amount.longValue() * 100; // VNPay nhân 100

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

        String returnUrl = vnPayConfig.getVnp_ReturnUrl();
        if (request != null) {
            String origin = request.getHeader("Origin");
            if (origin == null || origin.isBlank()) {
                String referer = request.getHeader("Referer");
                if (referer != null && !referer.isBlank()) {
                    try {
                        java.net.URI uri = new java.net.URI(referer);
                        origin = uri.getScheme() + "://" + uri.getAuthority();
                    } catch (Exception ignored) {
                    }
                }
            }
            if (origin != null && !origin.isBlank() && !origin.equalsIgnoreCase("null")) {
                returnUrl = origin + "/customer/payment-callback";
            }
        }

        vnp_Params.put("vnp_ReturnUrl", returnUrl);
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

        Map<String, String> simParams = new HashMap<>();
        simParams.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
        simParams.put("vnp_BankCode", "NCB");
        simParams.put("vnp_CardType", "ATM");
        simParams.put("vnp_OrderInfo", orderInfo);
        simParams.put("vnp_PayDate", new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
        simParams.put("vnp_ResponseCode", "00");
        simParams.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        simParams.put("vnp_TransactionNo", String.valueOf(System.currentTimeMillis()));
        simParams.put("vnp_TransactionStatus", "00");
        simParams.put("vnp_TxnRef", vnp_TxnRef);

        StringBuilder simQuery = new StringBuilder();
        List<String> simFieldNames = new ArrayList<>(simParams.keySet());
        Collections.sort(simFieldNames);
        for (Iterator<String> simItr = simFieldNames.iterator(); simItr.hasNext(); ) {
            String fieldName = simItr.next();
            String fieldValue = simParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                simQuery.append(fieldName).append("=")
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (simItr.hasNext()) {
                    simQuery.append("&");
                }
            }
        }
        String simHash = VNPayConfig.hashAllFields(simParams, vnPayConfig.getSecretKey());
        simQuery.append("&vnp_SecureHash=").append(simHash);
        String simulationUrl = returnUrl + "?" + simQuery.toString();

        Map<String, Object> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);
        result.put("simulationUrl", simulationUrl);
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
            boolean isWarranty = "WARRANTY_SUPPORT".equals(type) || "WARRANTY".equals(type)
                    || (vnp_TxnRef != null && vnp_TxnRef.startsWith("VNP_BH_"));

            if (isWarranty) {
                Long claimId = null;
                if (vnp_TxnRef != null && vnp_TxnRef.startsWith("VNP_BH_")) {
                    try {
                        String[] parts = vnp_TxnRef.split("_");
                        if (parts.length >= 3) {
                            claimId = Long.parseLong(parts[2]);
                        }
                    } catch (Exception ignored) {
                    }
                }

                WarrantyClaim claim = null;
                if (claimId != null) {
                    claim = warrantyClaimRepository.findById(claimId).orElse(null);
                }
                if (claim == null && booking != null) {
                    List<WarrantyClaim> claims = warrantyClaimRepository
                            .findByBookingIdOrderByCreatedAtDesc(booking.getId());
                    claim = claims.stream().findFirst().orElse(null);
                }

                if (claim != null) {
                    WarrantyReport report = claim.getReport();
                    if (report != null) {
                        report.setCustomerAccepted(true);
                        if (report.getResolvedAt() == null) {
                            report.setResolvedAt(LocalDateTime.now());
                        }
                    }
                    if (claim.getStatus() == WarrantyStatus.WORKER_COMPLETED
                            || (report != null && Boolean.TRUE.equals(report.getSupervisorAccepted()))) {
                        claim.setStatus(WarrantyStatus.COMPLETED);
                    }
                    warrantyClaimRepository.save(claim);

                    // Báo Admin
                    final WarrantyClaim finalClaim = claim;
                    userRepository.findAllByRole_Name("ROLE_ADMIN").forEach(admin -> {
                        notificationService.save(Notification.builder()
                                .user(admin)
                                .title(String.format("Khách thanh toán VNPay phí bảo hành #%d",
                                        finalClaim.getBooking().getId()))
                                .content(String.format(
                                        "Khách hàng đã thanh toán %,.0f VNĐ qua cổng VNPay Sandbox cho phiếu bảo hành #%d.",
                                        payment.getAmount(), finalClaim.getBooking().getId()))
                                .createdAt(LocalDateTime.now())
                                .isRead(false)
                                .build());
                    });

                    // Báo Thợ
                    if (claim.getTechnician() != null) {
                        notificationService.save(Notification.builder()
                                .user(claim.getTechnician())
                                .title(String.format("Khách đã thanh toán phí bảo hành #%d",
                                        finalClaim.getBooking().getId()))
                                .content(String.format(
                                        "Khách hàng đã thanh toán phí bảo hành %,.0f VNĐ qua VNPay Sandbox cho đơn #%d. Admin sẽ tiến hành quyết toán thù lao cho bạn.",
                                        payment.getAmount(), finalClaim.getBooking().getId()))
                                .createdAt(LocalDateTime.now())
                                .isRead(false)
                                .build());
                    }
                }

                payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
                payment.setPaidAt(LocalDateTime.now());
                payment.setNote(String.format("VNPay GD: %s, Ngân hàng: %s (Phí hỗ trợ BH #%s)", vnp_TransactionNo,
                        vnp_BankCode, claim != null ? claim.getId() : ""));
                paymentRepository.save(payment);

                if (booking != null && booking.getCustomer() != null) {
                    notificationService.save(Notification.builder()
                            .user(booking.getCustomer())
                            .title("Thanh toán phí hỗ trợ bảo hành thành công #" + booking.getId())
                            .content(String.format(
                                    "Bạn đã hoàn tất thanh toán %,.0f VNĐ chi phí hỗ trợ bảo hành qua cổng VNPay Sandbox.",
                                    payment.getAmount()))
                            .createdAt(LocalDateTime.now())
                            .isRead(false)
                            .build());
                }
            } else if ("DEPOSIT".equals(type)) {
                payment.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                booking.setDepositPaidAt(LocalDateTime.now());
                payment.setPaidAt(LocalDateTime.now());
                payment.setNote(String.format("VNPay GD: %s, Ngân hàng: %s", vnp_TransactionNo, vnp_BankCode));
                paymentRepository.save(payment);

                // Tự động ký duyệt hợp đồng nếu chưa ký
                Contract contract = contractRepository.findByBookingId(booking.getId()).orElse(null);
                if (contract != null && !Boolean.TRUE.equals(contract.getAdminSigned())) {
                    contract.setAdminSigned(true);
                    contract.setAdminSignedAt(LocalDateTime.now());
                    contractRepository.save(contract);
                }

                // Tự động phân công thợ thi công thông minh (Smart Auto-Dispatch)
                User autoWorker = bookingService.handleWorkerAutoAssignmentAfterDeposit(booking);

                if (autoWorker == null && booking.getCustomer() != null) {
                    notificationService.save(Notification.builder()
                            .user(booking.getCustomer())
                            .title("Thanh toán cọc VNPay thành công #" + booking.getId())
                            .content(String.format(
                                    "Giao dịch đặt cọc 30%% cho đơn hàng #%d qua VNPay đã thành công. Hệ thống đang tìm kiếm và phân công đội thợ thi công phù hợp nhất.",
                                    booking.getId()))
                            .createdAt(LocalDateTime.now())
                            .isRead(false)
                            .build());
                }
            } else {
                payment.setPaymentStatus(PaymentStatus.FULLY_PAID);
                booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
                booking.setRemainingAmount(BigDecimal.ZERO);
                booking.setFinalPaidAt(LocalDateTime.now());
                if (booking.getCompletedAt() == null) {
                    booking.setCompletedAt(LocalDateTime.now());
                }
                if (booking.getStatus() == BookingStatus.WORKER_COMPLETED
                        || booking.getStatus() == BookingStatus.PROCESSING
                        || booking.getStatus() == BookingStatus.WAITING_FINAL_PAYMENT) {
                    booking.setStatus(BookingStatus.COMPLETED);
                }

                payment.setPaidAt(LocalDateTime.now());
                payment.setNote(String.format("VNPay GD: %s, Ngân hàng: %s", vnp_TransactionNo, vnp_BankCode));
                paymentRepository.save(payment);
                bookingRepository.save(booking);

                if (booking.getCustomer() != null) {
                    notificationService.save(Notification.builder()
                            .user(booking.getCustomer())
                            .title("Thanh toán VNPay thành công #" + booking.getId())
                            .content(String.format(
                                    "Giao dịch thanh toán tất toán cho đơn hàng #%d qua VNPay đã thành công.",
                                    booking.getId()))
                            .createdAt(LocalDateTime.now())
                            .isRead(false)
                            .build());
                }
            }

            response.put("status", "SUCCESS");
            response.put("message", "Thanh toán VNPay thành công");
            response.put("success", true);
            response.put("bookingId", booking != null ? booking.getId() : null);
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

    @Override
    @Transactional
    public Map<String, Object> simulateVNPayPayment(Long bookingId, String paymentType, Long claimId, HttpServletRequest request)
            throws Exception {
        Map<String, Object> orderData = createVNPayPaymentUrl(bookingId, paymentType, claimId, request);
        String vnp_TxnRef = (String) orderData.get("transactionCode");
        BigDecimal amount = (BigDecimal) orderData.get("amount");

        Map<String, String> simFields = new HashMap<>();
        simFields.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
        simFields.put("vnp_BankCode", "NCB");
        simFields.put("vnp_CardType", "ATM");
        simFields.put("vnp_OrderInfo", "Thanh toan thu nghiem Sandbox cho don #" + bookingId);
        simFields.put("vnp_PayDate", new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
        simFields.put("vnp_ResponseCode", "00");
        simFields.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        simFields.put("vnp_TransactionNo", String.valueOf(System.currentTimeMillis()));
        simFields.put("vnp_TransactionStatus", "00");
        simFields.put("vnp_TxnRef", vnp_TxnRef);

        String secureHash = VNPayConfig.hashAllFields(simFields, vnPayConfig.getSecretKey());
        simFields.put("vnp_SecureHash", secureHash);

        return processVNPayCallback(simFields);
    }
}
