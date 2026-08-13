package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.NotificationDto;
import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.entity.User;

public class NotificationMapper {
    public static NotificationDto toDto(Notification notification) {
        if (notification == null) {
            return null;
        }
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public static Notification toEntity(NotificationDto dto) {
        if (dto == null) {
            return null;
        }
        Notification notification = Notification.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .isRead(dto.getIsRead())
                .createdAt(dto.getCreatedAt())
                .build();
        if (dto.getUserId() != null) {
            notification.setUser(User.builder().id(dto.getUserId()).build());
        }
        return notification;
    }
}
