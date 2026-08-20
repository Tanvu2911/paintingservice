package com.example.paintingservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReportDto {

    // =========================
    // RESPONSE
    // =========================

    private Long id;

    private Long bookingId;

    private Long reporterId;

    private String reporterName;

    private LocalDateTime createdAt;

    // =========================
    // REQUEST + RESPONSE
    // =========================

    @NotBlank(message = "Nội dung báo cáo không được để trống")
    private String content;

    @Min(value = 0, message = "Tiến độ không được nhỏ hơn 0%")
    @Max(value = 100, message = "Tiến độ không được lớn hơn 100%")
    private Integer progressPercentage;

    /**
     * Danh sách ảnh tiến độ.
     * Lưu dạng:
     * /uploads/progress/1/a.jpg,/uploads/progress/1/b.jpg
     */
    private String progressImages;

    /**
     * Vật liệu thiếu / phát sinh trong ngày.
     */
    private String materialShortage;

    /**
     * Số tiền vật tư phát sinh trong ngày (VNĐ).
     */
    private java.math.BigDecimal materialCost;
}