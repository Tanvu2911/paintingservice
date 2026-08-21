package com.example.paintingservice.controllers;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.dto.RejectJobDto;
import com.example.paintingservice.mapper.BookingMapper;
import com.example.paintingservice.repository.BookingRepository;
import com.example.paintingservice.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookingDto> getAll() {
        return bookingService.findAll().stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/me")
    public List<BookingDto> getMyBookings(Authentication authentication) {
        return bookingRepository.findAllByCustomer_Username(authentication.getName()).stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/technician")
    @PreAuthorize("hasRole('STAFF') or hasRole('TECHNICIAN')")
    public List<BookingDto> getTechnicianTasks(Authentication authentication) {
        return bookingRepository.findAllByTechnician_Username(authentication.getName()).stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDto> getById(@PathVariable Long id) {
        return bookingService.findById(id)
                .map(BookingMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDto> create(@Valid @RequestBody BookingDto dto, Authentication authentication) {
        BookingDto created = bookingService.createBooking(dto, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
    public ResponseEntity<BookingDto> update(@PathVariable Long id,
                                             @Valid @RequestBody BookingDto dto,
                                             Authentication authentication) {
        BookingDto updated = bookingService.updateBooking(id, dto, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        bookingService.deleteBooking(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // ==================== PHÂN CÔNG GIÁM SÁT KHẢO SÁT ====================
    @PostMapping("/{id}/assign-supervisor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignSupervisor(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        if (payload.get("supervisorId") == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu supervisorId"));
        }
        Long supervisorId = Long.valueOf(payload.get("supervisorId").toString());
        BookingDto bookingDto = bookingService.assignSupervisor(id, supervisorId);
        return ResponseEntity.ok(Map.of(
                "message", "Phân công giám sát thành công",
                "booking", bookingDto
        ));
    }

    // ==================== ADMIN GỬI BÁO GIÁ & LẬP HỢP ĐỒNG CHI TIẾT ====================
    @PostMapping("/{id}/send-quote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendQuote(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(bookingService.sendQuote(id, payload));
    }

    // ==================== ADMIN XÁC NHẬN CỌC & KÝ HỢP ĐỒNG ====================
    @PostMapping("/{id}/confirm-deposit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirmDeposit(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(bookingService.confirmDeposit(id, payload));
    }

    // ==================== PHÂN CÔNG ĐỘI THỢ (KÝ XONG MỚI ĐƯỢC PHÂN) ====================
    @PostMapping("/{id}/assign-team")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTeam(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Object teamIdObj = payload.get("teamId") != null ? payload.get("teamId") : payload.get("technicianId");
        if (teamIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu teamId hoặc technicianId"));
        }
        Long technicianId = Long.valueOf(teamIdObj.toString());
        return ResponseEntity.ok(bookingService.assignTeam(id, technicianId));
    }

    // ==================== THANH TOÁN NHÂN VIÊN ====================
    @PostMapping("/{id}/pay-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payStaff(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.payStaff(id));
    }

    // ==================== CÁC API CỦA ĐỘI THỢ & GIÁM SÁT ====================
    @PostMapping("/{id}/accept-job")
    public ResponseEntity<BookingDto> acceptJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(bookingService.acceptJob(id, principal.getName()));
    }

    @PostMapping("/{id}/reject-job")
    public ResponseEntity<BookingDto> rejectJob(
            @PathVariable Long id,
            @RequestBody(required = false) RejectJobDto dto,
            Principal principal) {
        String reason = dto != null ? dto.getReason() : null;
        return ResponseEntity.ok(bookingService.rejectJob(id, principal.getName(), reason));
    }

    @PostMapping("/{id}/reject-survey")
    @PreAuthorize("hasRole('STAFF') or hasRole('SUPERVISOR') or hasRole('ADMIN') or hasRole('TECHNICIAN')")
    public ResponseEntity<BookingDto> rejectSurveyJob(
            @PathVariable Long id,
            @RequestBody(required = false) RejectJobDto dto,
            Principal principal) {
        String reason = dto != null ? dto.getReason() : null;
        return ResponseEntity.ok(bookingService.rejectSurveyJob(id, principal.getName(), reason));
    }

    @PostMapping("/{id}/reject-quote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDto> rejectQuote(
            @PathVariable Long id,
            @RequestBody(required = false) RejectJobDto dto,
            Principal principal) {
        String reason = dto != null ? dto.getReason() : null;
        return ResponseEntity.ok(bookingService.rejectQuote(id, principal.getName(), reason));
    }

    @PostMapping("/{id}/start-job")
    @PreAuthorize("hasRole('STAFF') or hasRole('TECHNICIAN')")
    public ResponseEntity<BookingDto> startJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(bookingService.startJob(id, principal.getName()));
    }

    @PostMapping("/{id}/complete-job")
    @PreAuthorize("hasRole('STAFF') or hasRole('TECHNICIAN')")
    public ResponseEntity<BookingDto> completeJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(bookingService.completeJob(id, principal.getName()));
    }
}
