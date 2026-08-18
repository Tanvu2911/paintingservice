package com.example.paintingservice.config;

import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.security.JwtRequestFilter;
import com.example.paintingservice.service.AppUserDetailsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {
    AppUserDetailsService userDetailsService;
    JwtRequestFilter jwtRequestFilter;
    UserRepository userRepository;
    RoleRepository roleRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) {
//        + cors: là cầu nối cho phép 2 port có thể liên lạc với nhau,
//        vd: react (port: 3000) axios đến spring (port: 8080)
//        + session: Một cách lưu thông tin người đăng nhập vào cookie hệ thống,
//        ở đây ta dùng jwt token nên tắt session đi
//        + csrf: Thưởng đi cùng với session để tránh tấn công giả mạo
//        ở đây không dùng đến session nên bỏ cái này nốt
        httpSecurity.cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/login", "/api/register", "/status", "/health", "/api/payments/vnpay/**", "/api/payments/momo/ipn", "/api/payments/zalopay/callback").permitAll()
                        .anyRequest().authenticated()
                ).sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }
    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // 1. Kiểm tra và tạo Role ADMIN nếu chưa có
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElse(null);
            if (adminRole == null) {
                adminRole = new Role();
                adminRole.setName("ROLE_ADMIN");
                roleRepository.save(adminRole);
            }

            // 2. Kiểm tra và tạo tài khoản admin mặc định nếu chưa có
            if (userRepository.findByUsername("admin") == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder().encode("123456"));
                admin.setEmail("admin@suachua247.com");
                admin.setPhoneNumber("0987654321");
                admin.setAddress("Hà Nội");
                admin.setStatus(UserStatus.ACTIVE);
                admin.setRole(adminRole);

                userRepository.save(admin);
                System.out.println(">>> Đã khởi tạo thành công tài khoản mặc định: admin / 123456");
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder());

        return new ProviderManager(authenticationProvider);
    }
}
