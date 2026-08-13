package com.example.paintingservice.service;

import tools.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class MoMoService {

    // ===== THÔNG TIN MOMO SANDBOX (Thay bằng thông tin thật khi lên production) =====
    private final String PARTNER_CODE = "MOMO"; // Hoặc Partner Code từ trang developer của bạn
    private final String ACCESS_KEY = "F8BBA842ECF8"; // Thay bằng AccessKey sandbox của bạn
    private final String SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz"; // Thay bằng SecretKey sandbox của bạn
    
    // Endpoint môi trường Test (Sandbox) của MoMo
    private final String CREATE_ORDER_URL = "https://test-payment.momo.vn/v2/gateway/api/create";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Tạo đơn hàng MoMo và lấy payUrl để redirect người dùng sang cổng thanh toán
     */
    public Map<String, Object> createOrder(Long bookingId, long amount, String paymentType) throws Exception {
        if (amount < 1000) {
            throw new RuntimeException("Số tiền tối thiểu MoMo là 1.000 VNĐ");
        }

        String type = paymentType != null ? paymentType.toUpperCase() : "DEPOSIT";
        
        // Các thông tin cơ bản cho đơn hàng MoMo
        String orderId = PARTNER_CODE + "_" + System.currentTimeMillis() + "_" + bookingId;
        String requestId = orderId;
        String orderInfo = "Thanh toan " + ("DEPOSIT".equals(type) ? "coc" : "con lai") + " don #" + bookingId;
        
        // URL redirect về frontend sau khi thanh toán xong
        String redirectUrl = "http://localhost:5173/customer/bookings/" + bookingId;
        // URL nhận IPN webhook từ MoMo server (nếu bạn có cấu hình public IP/ngrok)
        String ipnUrl = "https://your-domain.com/api/momo/ipn"; 
        
        String requestType = "captureWallet";
        String extraData = ""; // Dữ liệu mã hóa base64 nếu cần truyền thêm

        // --- CÁCH TÍNH CHỮ KÝ (SIGNATURE) CỦA MOMO ---
        // Chuỗi format chuẩn bắt buộc theo đúng thứ tự của MoMo:
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        String rawData = "accessKey=" + ACCESS_KEY +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + ipnUrl +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + PARTNER_CODE +
                "&redirectUrl=" + redirectUrl +
                "&requestId=" + requestId +
                "&requestType=" + requestType;

        String signature = hmacSHA256(SECRET_KEY, rawData);

        // Đóng gói JSON body gửi sang MoMo API
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("partnerCode", PARTNER_CODE);
        requestBody.put("partnerName", "SuaChua247");
        requestBody.put("storeId", "SuaChua247Store");
        requestBody.put("requestId", requestId);
        requestBody.put("amount", amount);
        requestBody.put("orderId", orderId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", redirectUrl);
        requestBody.put("ipnUrl", ipnUrl);
        requestBody.put("lang", "vi");
        requestBody.put("extraData", extraData);
        requestBody.put("requestType", requestType);
        requestBody.put("signature", signature);

        // Gửi request dạng JSON (Khác với ZaloPay dùng form-urlencoded)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(CREATE_ORDER_URL, entity, Map.class);

        Map<String, Object> body = response.getBody();
        if (body == null) {
            throw new RuntimeException("MoMo không trả về dữ liệu phản hồi.");
        }

        // Kiểm tra kết quả trả về từ MoMo (errorCode = 0 là thành công)
        Object errorCodeObj = body.get("errorCode");
        if (errorCodeObj == null || Integer.parseInt(errorCodeObj.toString()) != 0) {
            String message = (String) body.getOrDefault("message", "Tạo đơn hàng MoMo thất bại");
            throw new RuntimeException("MoMo Error: " + message + " | Response: " + body);
        }

        // Trả về toàn bộ body (trong đó có chứa trường "payUrl" để Frontend redirect qua trang thanh toán)
        body.put("orderId", orderId);
        return body;
    }

    /**
     * Xác thực chữ ký IPN Callback từ MoMo gửi về (nếu bạn làm webhook tự động cập nhật trạng thái đơn)
     */
    public boolean verifyIPN(Map<String, String> ipnParams) {
        try {
            String receivedSignature = ipnParams.get("signature");
            
            // Chuỗi rawData để verify IPN theo chuẩn MoMo
            String rawData = "accessKey=" + ACCESS_KEY +
                    "&amount=" + ipnParams.get("amount") +
                    "&extraData=" + ipnParams.get("extraData") +
                    "&message=" + ipnParams.get("message") +
                    "&orderId=" + ipnParams.get("orderId") +
                    "&orderInfo=" + ipnParams.get("orderInfo") +
                    "&orderType=" + ipnParams.get("orderType") +
                    "&partnerCode=" + ipnParams.get("partnerCode") +
                    "&payType=" + ipnParams.get("payType") +
                    "&requestId=" + ipnParams.get("requestId") +
                    "&responseTime=" + ipnParams.get("responseTime") +
                    "&resultCode=" + ipnParams.get("resultCode") +
                    "&transId=" + ipnParams.get("transId");

            String calculatedSignature = hmacSHA256(SECRET_KEY, rawData);
            return calculatedSignature.equals(receivedSignature);
        } catch (Exception e) {
            return false;
        }
    }

    private String hmacSHA256(String key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) sb.append('0');
            sb.append(hex);
        }
        return sb.toString();
    }
}