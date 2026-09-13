package com.example.paintingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormerStaffDto {
    private Long userId;
    private String username;
    private String fullName;
    private String phoneNumber;
    private String avatar;
    private String staffType; // SUPERVISOR or WORKER
    private String specialty;
    private String serviceArea;
    private Integer experienceYears;
    private Double rating;
    private Boolean available;
    private Long bookingCountWithCustomer; // Số đơn hàng từng làm việc với khách
    private String lastServiceName; // Tên dịch vụ gần nhất từng làm
}
