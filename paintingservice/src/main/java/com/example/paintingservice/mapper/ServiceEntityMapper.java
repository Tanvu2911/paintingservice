package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.ServiceEntityDto;
import com.example.paintingservice.entity.ServiceEntity;

public class ServiceEntityMapper {
    public static ServiceEntityDto toDto(ServiceEntity entity) {
        if (entity == null) {
            return null;
        }
        return ServiceEntityDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .basePrice(entity.getBasePrice())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static ServiceEntity toEntity(ServiceEntityDto dto) {
        if (dto == null) {
            return null;
        }
        return ServiceEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .basePrice(dto.getBasePrice())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
