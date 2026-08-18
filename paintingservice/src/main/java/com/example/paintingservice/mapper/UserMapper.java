package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.UserDto;
import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.User;

public class UserMapper {

    public static UserDto toDto(User user) {
        if (user == null) {
            return null;
        }

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .status(user.getStatus())
                .roleId(user.getRole() != null
                        ? user.getRole().getId()
                        : null)
                .role(user.getRole() != null
                        ? user.getRole().getName()
                        : null)
                .createdAt(user.getCreatedAt())
                .build();
    }

    public static User toEntity(UserDto dto) {
        if (dto == null) {
            return null;
        }

        User user = User.builder()
                .id(dto.getId())
                .username(dto.getUsername())
                .password(dto.getPassword())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .address(dto.getAddress())
                .status(dto.getStatus())
                .createdAt(dto.getCreatedAt())
                .build();

        if (dto.getRoleId() != null) {
            Role role = new Role();
            role.setId(dto.getRoleId());
            user.setRole(role);
        }

        return user;
    }
}