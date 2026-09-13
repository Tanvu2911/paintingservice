package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.NotificationDto;
import com.example.paintingservice.mapper.NotificationMapper;
import com.example.paintingservice.service.NotificationService;
import com.example.paintingservice.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public List<NotificationDto> getAll() {
        return notificationService.findAll().stream().map(NotificationMapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/me")
    public List<NotificationDto> getMyNotifications(Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).get().getId();
        return notificationService.findAll().stream()
                .filter(n -> n.getUser().getId().equals(userId))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Mới nhất lên đầu
                .map(NotificationMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationDto> getById(@PathVariable Long id) {
        return notificationService.findById(id)
                .map(NotificationMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // API đánh dấu tất cả thông báo của tôi là đã đọc
    @PutMapping("/me/read")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).get().getId();
        notificationService.findAll().stream()
                .filter(n -> n.getUser().getId().equals(userId) && (n.getIsRead() == null || !n.getIsRead()))
                .forEach(n -> {
                    n.setIsRead(true);
                    notificationService.save(n);
                });
        return ResponseEntity.ok().build();
    }

    // API đánh dấu 1 thông báo cụ thể của tôi là đã đọc
    @PutMapping("/me/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).get().getId();
        notificationService.findById(id).ifPresent(n -> {
            if (n.getUser() != null && n.getUser().getId().equals(userId)) {
                n.setIsRead(true);
                notificationService.save(n);
            }
        });
        return ResponseEntity.ok().build();
    }

    // API xóa tất cả thông báo của tôi
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAllMyNotifications(Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).get().getId();
        notificationService.findAll().stream()
                .filter(n -> n.getUser().getId().equals(userId))
                .forEach(n -> notificationService.deleteById(n.getId()));
        return ResponseEntity.noContent().build();
    }

    // API xóa một thông báo cụ thể của tôi
    @DeleteMapping("/me/{id}")
    public ResponseEntity<Void> deleteMyNotification(@PathVariable Long id, Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).get().getId();
        notificationService.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                notificationService.deleteById(id);
            }
        });
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationDto> create(@Valid @RequestBody NotificationDto dto) {
        NotificationDto result = NotificationMapper.toDto(notificationService.save(NotificationMapper.toEntity(dto)));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationDto> update(@PathVariable Long id, @Valid @RequestBody NotificationDto dto) {
        if (!notificationService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dto.setId(id);
        NotificationDto result = NotificationMapper.toDto(notificationService.save(NotificationMapper.toEntity(dto)));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!notificationService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        notificationService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
