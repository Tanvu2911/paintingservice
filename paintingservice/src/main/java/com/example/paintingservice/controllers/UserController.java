package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.StaffProfileDto;
import com.example.paintingservice.dto.UserDto;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.mapper.UserMapper;
import com.example.paintingservice.service.UserService;
import com.example.paintingservice.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder; // Thêm import này
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // 1. Tiêm BCryptPasswordEncoder vào đây
    // Khai báo thêm các repository cần thiết trong UserController

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> getAll(@RequestParam(required = false) String role) {
        List<User> users = userService.findAll();

        if (role != null && !role.trim().isEmpty()) {
            return users.stream()
                    .filter(u -> u.getRole() != null && role.equalsIgnoreCase(u.getRole().getName()))
                    .map(UserMapper::toDto)
                    .collect(Collectors.toList());
        }
        return users.stream().map(UserMapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/technicians")
    public List<UserDto> getTechnicians() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "ROLE_TECHNICIAN".equals(u.getRole().getName()))
                .map(UserMapper::toDto)
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleStatus(@PathVariable Long id, @RequestBody Map<String, String> statusRequest) {
        String statusStr = statusRequest.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            User user = userOptional.get();
            UserStatus newStatus = UserStatus.valueOf(statusStr.toUpperCase());
            user.setStatus(newStatus);
            userRepository.save(user);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getById(@PathVariable Long id) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOptional.get();

        UserDto dto = UserMapper.toDto(user);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOptional.get();
        UserDto dto = UserMapper.toDto(user);
        return ResponseEntity.ok(dto);
    }

    // 🛠️ ĐÃ SỬA: Mã hóa password khi tạo mới tài khoản
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> create(@Valid @RequestBody UserDto dto) {
        User userEntity = UserMapper.toEntity(dto);

        // Tiến hành mã hóa mật khẩu nhận được từ React trước khi lưu xuống DB
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            userEntity.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        UserDto result = UserMapper.toDto(userService.save(userEntity));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // 🛠️ ĐÃ SỬA: Tối ưu hóa việc cập nhật mật khẩu (Mã hóa nếu mới / Giữ nguyên
    // nếu trống)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('TECHNICIAN') or hasRole('CUSTOMER')")
    public ResponseEntity<UserDto> update(@PathVariable Long id, @Valid @RequestBody UserDto dto,
            org.springframework.security.core.Authentication authentication) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User existingUser = userOptional.get();

        // Kiểm tra bảo mật: Chỉ Admin hoặc chính chủ sở hữu mới được cập nhật
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !existingUser.getUsername().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        dto.setId(id);
        User userEntity = UserMapper.toEntity(dto);

        // Logic kiểm tra mật khẩu:
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            // Nếu admin nhập mật khẩu mới -> Tiến hành mã hóa mật khẩu mới đó
            userEntity.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            // Nếu admin để trống mật khẩu -> Giữ lại chuỗi mật khẩu đã mã hóa cũ từ cơ sở
            // dữ liệu
            userEntity.setPassword(existingUser.getPassword());
        }

        UserDto result = UserMapper.toDto(userService.save(userEntity));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!userService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}