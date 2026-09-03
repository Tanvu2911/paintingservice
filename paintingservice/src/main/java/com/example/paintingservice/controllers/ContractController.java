package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.ContractDto;
import com.example.paintingservice.mapper.ContractMapper;
import com.example.paintingservice.service.ContractService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    public List<ContractDto> getAll() {
        return contractService.findAll().stream()
                .map(ContractMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDto> getById(@PathVariable Long id) {
        return contractService.findById(id)
                .map(ContractMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/stats/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> getMonthlyStats() {
        return contractService.getMonthlyStats();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContractDto> create(@Valid @RequestBody ContractDto dto, HttpServletRequest request) {
        ContractDto result = contractService.createContract(dto, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ContractDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ContractDto dto,
            Authentication auth,
            HttpServletRequest request) {
        ContractDto result = contractService.updateContract(id, dto, auth, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ContractDto> sign(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication auth,
            HttpServletRequest request) {
        ContractDto result = contractService.signContract(id, payload, auth, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/confirm-deposit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContractDto> confirmDeposit(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        ContractDto result = contractService.confirmDeposit(id, payload);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!contractService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        contractService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}