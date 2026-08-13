package com.example.paintingservice.dto;

import com.example.paintingservice.enums.StaffType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffProfileDto {

    private Long id;

    // Thông tin User
    private Long userId;
    private String username;
    private String email;
    private String phoneNumber;
    private String password;
    private String address;

    // Thông tin Staff Profile
    private String specialty;
    private Integer experienceYears;
    private Double rating;
    private Boolean available;
    private StaffType staffType;
}