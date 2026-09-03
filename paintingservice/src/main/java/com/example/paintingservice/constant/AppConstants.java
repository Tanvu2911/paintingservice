package com.example.paintingservice.constant;

import java.math.BigDecimal;

public final class AppConstants {

    private AppConstants() {
        // Utility class
    }

    // ==================== TỶ LỆ THANH TOÁN ====================
    public static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.30"); // 30% Đặt cọc
    public static final BigDecimal REMAINING_RATE = new BigDecimal("0.70"); // 70% Tất toán
    public static final BigDecimal DEFAULT_SURVEY_FEE = new BigDecimal("50000.00"); // 50.000 VNĐ phí khảo sát

    // ==================== TỶ LỆ THÙ LAO NHÂN SỰ ====================
    public static final BigDecimal TECHNICIAN_COMMISSION_RATE = new BigDecimal("0.60"); // 60% cho Đội thợ
    public static final BigDecimal SUPERVISOR_COMMISSION_RATE = new BigDecimal("0.10"); // 10% cho Giám sát

    // ==================== VAI TRÒ HỆ THỐNG ====================
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";
    public static final String ROLE_STAFF = "ROLE_STAFF";
    public static final String ROLE_TECHNICIAN = "ROLE_TECHNICIAN";
    public static final String ROLE_SUPERVISOR = "ROLE_SUPERVISOR";

    // ==================== CLOUDINARY FOLDERS ====================
    public static final String FOLDER_CONTRACT_SIGNATURES = "signatures/contracts";
    public static final String FOLDER_WARRANTY_SIGNATURES = "signatures/warranties";
    public static final String FOLDER_SURVEY_IMAGES = "survey";
    public static final String FOLDER_PROGRESS_IMAGES = "progress";
}
