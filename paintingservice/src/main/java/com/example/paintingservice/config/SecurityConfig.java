package com.example.paintingservice.config;

import com.example.paintingservice.entity.Role;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.UserStatus;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.security.JwtRequestFilter;
import com.example.paintingservice.service.AppUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final AppUserDetailsService userDetailsService;
    private final JwtRequestFilter jwtRequestFilter;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}")
    private String allowedOriginsStr;

    @Value("${app.default-admin.username:admin}")
    private String defaultAdminUsername;

    @Value("${app.default-admin.password:123456}")
    private String defaultAdminPassword;

    @Value("${app.default-admin.email:admin@suachua247.com}")
    private String defaultAdminEmail;

    @Value("${app.default-admin.phone:0987654321}")
    private String defaultAdminPhone;

    @Value("${app.default-admin.address:Hà Nội}")
    private String defaultAdminAddress;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) {
        httpSecurity.cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/login",
                                "/api/register",
                                "/status",
                                "/health",
                                "/error",
                                "/api/payments/vnpay/**",
                                "/api/payments/momo/ipn",
                                "/api/payments/zalopay/callback"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // 1. Kiểm tra và tạo các Role cơ bản nếu chưa có
            List<String> requiredRoles = List.of("ROLE_ADMIN", "ROLE_STAFF", "ROLE_CUSTOMER", "ROLE_TECHNICIAN", "ROLE_SUPERVISOR");
            for (String roleName : requiredRoles) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role r = new Role();
                    r.setName(roleName);
                    roleRepository.save(r);
                }
            }

            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElse(null);

            // 2. Khởi tạo tài khoản admin mặc định từ cấu hình nếu chưa có
            if (userRepository.findByUsername(defaultAdminUsername) == null) {
                User admin = new User();
                admin.setUsername(defaultAdminUsername);
                admin.setPassword(passwordEncoder().encode(defaultAdminPassword));
                admin.setEmail(defaultAdminEmail);
                admin.setPhoneNumber(defaultAdminPhone);
                admin.setAddress(defaultAdminAddress);
                admin.setStatus(UserStatus.ACTIVE);
                admin.setRole(adminRole);

                userRepository.save(admin);
                log.info(">>> Đã khởi tạo thành công tài khoản quản trị mặc định: {}", defaultAdminUsername);
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

        List<String> origins = Arrays.stream(allowedOriginsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

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
