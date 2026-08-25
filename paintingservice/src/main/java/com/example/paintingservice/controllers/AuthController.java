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
            if (req == null || req.getUsername() == null || req.getUsername().isBlank() ||
                req.getPassword() == null || req.getPassword().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng điền tên đăng nhập và mật khẩu."));
            }

            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getUsername().trim(),
                            req.getPassword().trim()));

            User user = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại trên hệ thống."));

            String token = jwtUtil.generateToken(user.getUsername());

            AuthResponse res = new AuthResponse(token);
            res.setUsername(user.getUsername());
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
                    .body(Map.of("message", "Tên đăng nhập hoặc mật khẩu không chính xác."));
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
        Optional<User> existing = userRepository.findByUsername(req.getUsername());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("username_taken");
        }

        // Mặc định đăng ký là Khách hàng
        Role role = roleRepository.findByName("ROLE_CUSTOMER").orElseGet(() -> {
            Role r = new Role(); r.setName("ROLE_CUSTOMER"); return roleRepository.save(r);
        });
        //  Role role = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> {
        //     Role r = new Role(); r.setName("ROLE_ADMIN"); return roleRepository.save(r);
        // });

        User u = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .email(req.getEmail())
                .role(role)
                .build();

        userRepository.save(u);
        return ResponseEntity.ok().build();
    }
}
