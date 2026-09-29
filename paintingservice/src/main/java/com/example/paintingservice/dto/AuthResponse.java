package com.example.paintingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String email;
    private String role;
    private String staffType;

    // Constructor này để tương thích với dòng new AuthResponse(token) trong AuthController
    public AuthResponse(String token) {
        this.token = token;
    }
}