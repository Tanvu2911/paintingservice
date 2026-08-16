package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.BookingDetailDto;
import com.example.paintingservice.service.BookingDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/booking-details")
@RequiredArgsConstructor
public class BookingDetailController {
    private final BookingDetailService bookingDetailService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('SUPERVISOR')")
    public ResponseEntity<BookingDetailDto> create(@RequestBody BookingDetailDto request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingDetailService.create(request, principal.getName()));
    }

    @GetMapping("/{id}")
    public BookingDetailDto getById(@PathVariable Long id, Principal principal) {
        return bookingDetailService.getById(id, principal.getName());
    }

    @GetMapping("/booking/{bookingId}")
    public List<BookingDetailDto> getByBookingId(@PathVariable Long bookingId, Principal principal) {
        return bookingDetailService.getByBookingId(bookingId, principal.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('SUPERVISOR')")
    public BookingDetailDto update(@PathVariable Long id, @RequestBody BookingDetailDto request, Principal principal) {
        return bookingDetailService.update(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bookingDetailService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{id}/survey", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('ADMIN')")
    public BookingDetailDto updateSurvey(@PathVariable Long id,
            @RequestParam(required = false) String surveyNote,
            @RequestParam(required = false) String materialNote,
            @RequestParam(required = false) List<MultipartFile> files,
            Principal principal) {
        return bookingDetailService.updateSurvey(id, BookingDetailDto.builder()
                .surveyNote(surveyNote).materialNote(materialNote).build(), files, principal.getName());
    }

    @PutMapping("/{id}/material-shortage")
    @PreAuthorize("hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('TECHNICIAN')")
    public BookingDetailDto reportMaterialShortage(@PathVariable Long id,
            @RequestBody BookingDetailDto request,
            Principal principal) {
        return bookingDetailService.reportMaterialShortage(id, request.getMaterialShortage(), principal.getName());
    }

    @PostMapping("/{id}/supervisor-accept")
    @PreAuthorize("hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('ADMIN')")
    public BookingDetailDto supervisorAccept(@PathVariable Long id, Principal principal) {
        return bookingDetailService.supervisorAccept(id, principal.getName());
    }

    @PostMapping("/{id}/customer-accept")
    @PreAuthorize("isAuthenticated()")
    public BookingDetailDto customerAccept(@PathVariable Long id, Principal principal) {
        return bookingDetailService.customerAccept(id, principal.getName());
    }
}
