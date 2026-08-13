package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.SalaryHistoryDto;
import com.example.paintingservice.mapper.SalaryHistoryMapper;
import com.example.paintingservice.service.SalaryHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/salary-histories")
@RequiredArgsConstructor
public class SalaryHistoryController {
    private final SalaryHistoryService salaryHistoryService;

    @GetMapping
    public List<SalaryHistoryDto> getAll() {
        return salaryHistoryService.findAll().stream().map(SalaryHistoryMapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryHistoryDto> getById(@PathVariable Long id) {
        return salaryHistoryService.findById(id)
                .map(SalaryHistoryMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SalaryHistoryDto> create(@Valid @RequestBody SalaryHistoryDto dto) {
        SalaryHistoryDto result = SalaryHistoryMapper.toDto(salaryHistoryService.save(SalaryHistoryMapper.toEntity(dto)));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SalaryHistoryDto> update(@PathVariable Long id, @Valid @RequestBody SalaryHistoryDto dto) {
        if (!salaryHistoryService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dto.setId(id);
        SalaryHistoryDto result = SalaryHistoryMapper.toDto(salaryHistoryService.save(SalaryHistoryMapper.toEntity(dto)));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!salaryHistoryService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        salaryHistoryService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
