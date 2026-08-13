package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.RoleDto;
import com.example.paintingservice.entity.Role;

public class RoleMapper {
    public static RoleDto toDto(Role role) {
        if (role == null) {
            return null;
        }
        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .build();
    }

    public static Role toEntity(RoleDto dto) {
        if (dto == null) {
            return null;
        }
        return Role.builder()
                .id(dto.getId())
                .name(dto.getName())
                .build();
    }
}
