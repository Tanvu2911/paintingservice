package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.RoleDto;
import com.example.paintingservice.mapper.RoleMapper;
import com.example.paintingservice.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    public List<RoleDto> getAll() {
        return roleService.findAll().stream().map(RoleMapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDto> getById(@PathVariable Integer id) {
        return roleService.findById(id)
                .map(RoleMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoleDto> create(@Valid @RequestBody RoleDto dto) {
        RoleDto result = RoleMapper.toDto(roleService.save(RoleMapper.toEntity(dto)));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoleDto> update(@PathVariable Integer id, @Valid @RequestBody RoleDto dto) {
        if (!roleService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dto.setId(id);
        RoleDto result = RoleMapper.toDto(roleService.save(RoleMapper.toEntity(dto)));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!roleService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        roleService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
