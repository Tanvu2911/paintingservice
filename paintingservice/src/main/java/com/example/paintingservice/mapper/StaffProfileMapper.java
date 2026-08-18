package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.StaffProfileDto;
import com.example.paintingservice.entity.StaffProfile;
import com.example.paintingservice.entity.User;

public class StaffProfileMapper {

    public static StaffProfileDto toDto(StaffProfile staffProfile) {

        if (staffProfile == null) {
            return null;
        }

        User user = staffProfile.getUser();

        return StaffProfileDto.builder()
                .id(staffProfile.getId())
                

                .userId(user != null ? user.getId() : null)
                .username(user != null ? user.getUsername() : null)
                .password(user != null ? user.getPassword(): null) 
                .email(user != null ? user.getEmail() : null)
                .phoneNumber(user != null ? user.getPhoneNumber() : null)
                .address(user != null ? user.getAddress() : null)

                .specialty(staffProfile.getSpecialty())
                .experienceYears(staffProfile.getExperienceYears())
                .rating(staffProfile.getRating())
                .available(staffProfile.getAvailable())
                .staffType(staffProfile.getStaffType())
                .serviceArea(staffProfile.getServiceArea())
                .bankName(staffProfile.getBankName())
                .bankAccountNumber(staffProfile.getBankAccountNumber())
                .bankAccountName(staffProfile.getBankAccountName())

                .build();
    }

    public static StaffProfile toEntity(StaffProfileDto dto) {

        if (dto == null) {
            return null;
        }

        StaffProfile staffProfile = StaffProfile.builder()
                .id(dto.getId())
                .specialty(dto.getSpecialty())
                .experienceYears(dto.getExperienceYears())
                .rating(dto.getRating())
                .available(dto.getAvailable())
                .staffType(dto.getStaffType())
                .serviceArea(dto.getServiceArea())
                .bankName(dto.getBankName())
                .bankAccountNumber(dto.getBankAccountNumber())
                .bankAccountName(dto.getBankAccountName())
                .build();

        // Chỉ cần gán userId
        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            staffProfile.setUser(user);
        }

        return staffProfile;
    }
}