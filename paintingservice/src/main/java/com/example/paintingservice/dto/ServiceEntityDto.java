package com.example.paintingservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceEntityDto {
    private Long id;

    @NotBlank(message = "name is required")
    private String name;

    private String description;

    @NotNull(message = "basePrice is required")
    private BigDecimal basePrice;

    private LocalDateTime createdAt;
}
