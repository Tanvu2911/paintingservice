package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.ReviewDto;
import com.example.paintingservice.mapper.ReviewMapper;
import com.example.paintingservice.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping
    public List<ReviewDto> getAll() {
        return reviewService.findAll().stream().map(ReviewMapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewDto> getById(@PathVariable Long id) {
        return reviewService.findById(id)
                .map(ReviewMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewDto> create(@Valid @RequestBody ReviewDto dto) {
        ReviewDto result = ReviewMapper.toDto(reviewService.save(ReviewMapper.toEntity(dto)));
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewDto> update(@PathVariable Long id, @Valid @RequestBody ReviewDto dto) {
        if (!reviewService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dto.setId(id);
        ReviewDto result = ReviewMapper.toDto(reviewService.save(ReviewMapper.toEntity(dto)));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!reviewService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reviewService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
