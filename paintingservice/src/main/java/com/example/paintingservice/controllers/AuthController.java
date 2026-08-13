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
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getUsername(),
                        req.getPassword()));

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow();

        String token = jwtUtil.generateToken(user.getUsername());

        AuthResponse res = new AuthResponse(token);
        res.setUsername(user.getUsername());
        res.setRole(user.getRole().getName());

        staffProfileRepository.findByUser(user)
                .ifPresent(profile ->
                        res.setStaffType(profile.getStaffType().name()));

        return ResponseEntity.ok(res);
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
