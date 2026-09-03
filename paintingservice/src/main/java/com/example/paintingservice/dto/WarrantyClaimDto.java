package com.example.paintingservice.dto;

import com.example.paintingservice.enums.WarrantyStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyClaimDto {
    private Long id;
    private Long bookingId;
    private String serviceName;
    private Integer warrantyYears;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String address;

    // Giám sát khảo sát
    private Long surveyorId;
    private String surveyorName;
    private String surveyorPhone;

    // Thợ thi công khắc phục
    private Long technicianId;
    private String technicianName;
    private String technicianPhone;

    // Thợ cũ từng thi công đơn hàng gốc (để gợi ý ưu tiên)
    private Long previousTechnicianId;
    private String previousTechnicianName;
    private String previousTechnicianPhone;

    // Thông tin yêu cầu ban đầu của khách
    private String issueType;
    private String issueTitle;
    private String description;
    private String imageUrls;
    private LocalDate preferredDate;
    private String preferredTime;

    // Báo cáo khảo sát của Giám sát
    private String faultType; // COMPANY_FAULT hoặc CUSTOMER_FAULT
    private String surveyNote;
    private String materialNote;
    private String surveyImages;
    private BigDecimal suggestedPrice; // Giá gợi ý hỗ trợ từ Giám sát
    private BigDecimal finalSupportPrice; // Giá hỗ trợ Admin chốt gửi khách

    private WarrantyStatus status;
    private String adminNote;
    private String resolvedImageUrls;
    private LocalDateTime resolvedAt;

    // Quyết toán thù lao cho Giám sát & Thợ & Nghiệm thu
    private Boolean supervisorAccepted;
    private Boolean customerAccepted;
    private Boolean customerPaid;

    // Giám sát
    private BigDecimal surveyorSalary;
    private Boolean surveyorPaid;
    private LocalDateTime surveyorPaidAt;

    // Thợ thi công
    private BigDecimal workerSalary;
    private Boolean workerPaid;
    private LocalDateTime workerPaidAt;

    private LocalDateTime createdAt;
}
