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
import java.util.Set;

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

    @NotNull(message = "roleId is required")
    private Integer roleId;

    private LocalDateTime createdAt;
}
