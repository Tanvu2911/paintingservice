package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.AuthRequest;
import com.example.paintingservice.dto.AuthResponse;
import com.example.paintingservice.dto.RegisterRequest;
import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.utils.JWTUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.example.paintingservice.repository.StaffProfileRepository;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JWTUtil jwtUtil;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final StaffProfileRepository staffProfileRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            JWTUtil jwtUtil,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            StaffProfileRepository staffProfileRepository) {

        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.staffProfileRepository = staffProfileRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        try {
            String inputEmail = req != null && req.getEmail() != null && !req.getEmail().isBlank()
                    ? req.getEmail().trim()
                    : (req != null && req.getUsername() != null ? req.getUsername().trim() : "");

            if (inputEmail.isBlank() || req == null || req.getPassword() == null || req.getPassword().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email và mật khẩu."));
            }

            // BẮT BUỘC ĐĂNG NHẬP BẰNG EMAIL - Từ chối nếu nhập tên tài khoản không có định
            // dạng email
            if (!inputEmail.contains("@")) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message",
                                "Hệ thống chỉ chấp nhận đăng nhập bằng Email. Vui lòng nhập đúng địa chỉ email."));
            }

            // Chỉ tìm kiếm tài khoản thông qua Email
            User user = userRepository.findByEmailIgnoreCase(inputEmail)
                    .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException(
                            "Email hoặc mật khẩu không chính xác."));

            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            req.getPassword().trim()));

            String token = jwtUtil.generateToken(user.getUsername());

            AuthResponse res = new AuthResponse(token);
            res.setUsername(user.getUsername());
            res.setEmail(user.getEmail());
            res.setRole(user.getRole() != null ? user.getRole().getName() : "ROLE_CUSTOMER");

            staffProfileRepository.findByUser(user)
                    .ifPresent(profile -> {
                        if (profile.getStaffType() != null) {
                            res.setStaffType(profile.getStaffType().name());
                        }
                    });

            return ResponseEntity.ok(res);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email hoặc mật khẩu không chính xác."));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Đăng nhập không thành công: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Đối với cơ chế JWT cơ bản, chỉ cần trả về OK 200.
        // Frontend nhận được phản hồi này sẽ tự động xóa sạch token ở phía client.
        return ResponseEntity.ok().body("{\"message\": \"Logout thành công\"}");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thông tin đăng ký không hợp lệ."));
        }

        String username = req.getUsername() != null ? req.getUsername().trim() : "";
        String email = req.getEmail() != null ? req.getEmail().trim() : "";
        String password = req.getPassword() != null ? req.getPassword().trim() : "";
        String phone = req.getEffectivePhoneNumber();

        if (username.isBlank() || email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng điền đầy đủ tên đăng nhập, email và mật khẩu."));
        }

        // 1. Bắt buộc nhập số điện thoại
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại là bắt buộc. Vui lòng nhập số điện thoại."));
        }

        // 2. Validate định dạng số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0 hoặc +84)
        if (!phone.matches("^(0|\\+84)[35789][0-9]{8}$") && !phone.matches("^0[0-9]{9}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại không đúng định dạng (ví dụ: 0912345678)."));
        }

        // 3. Kiểm tra email hợp lệ
        if (!email.contains("@") || !email.contains(".")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Địa chỉ email không đúng định dạng."));
        }

        // 4. Kiểm tra trùng lặp
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên đăng nhập này đã được sử dụng."));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Địa chỉ email này đã được sử dụng."));
        }

        if (userRepository.existsByPhoneNumber(phone)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại này đã được sử dụng bởi tài khoản khác."));
        }

        // Mặc định đăng ký là Khách hàng
        Role role = roleRepository.findByName("ROLE_CUSTOMER").orElseGet(() -> {
            Role r = new Role();
            r.setName("ROLE_CUSTOMER");
            return roleRepository.save(r);
        });

        User u = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .email(email)
                .phoneNumber(phone)
                .role(role)
                .build();

        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Đăng ký tài khoản thành công!"));
    }
}
