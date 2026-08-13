package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.ServiceEntityDto;
import com.example.paintingservice.mapper.ServiceEntityMapper;
import com.example.paintingservice.service.ServiceEntityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceEntityController {
    private final ServiceEntityService serviceEntityService;

    @GetMapping
    public List<ServiceEntityDto> getAll() {
        return serviceEntityService.findAll().stream().map(ServiceEntityMapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceEntityDto> getById(@PathVariable Long id) {
        return serviceEntityService.findById(id)
                .map(ServiceEntityMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceEntityDto> create(@Valid @RequestBody ServiceEntityDto dto) {
        ServiceEntityDto result = ServiceEntityMapper.toDto(serviceEntityService.save(ServiceEntityMapper.toEntity(dto)));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceEntityDto> update(@PathVariable Long id, @Valid @RequestBody ServiceEntityDto dto) {
        if (!serviceEntityService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dto.setId(id);
        ServiceEntityDto result = ServiceEntityMapper.toDto(serviceEntityService.save(ServiceEntityMapper.toEntity(dto)));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!serviceEntityService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        serviceEntityService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
