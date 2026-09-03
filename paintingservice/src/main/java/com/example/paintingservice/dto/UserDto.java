package com.example.paintingservice.dto;

import com.example.paintingservice.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;

    @NotBlank(message = "username is required")
    private String username;

    private String password;

    @Email(message = "email should be valid")
    private String email;

    private String phoneNumber;
    private String address;
    private UserStatus status;
    private Integer roleId;
    private String role;
    private String avatar;
    private LocalDateTime createdAt;
}
