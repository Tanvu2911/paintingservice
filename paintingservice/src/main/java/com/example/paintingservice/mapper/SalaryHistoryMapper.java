package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.SalaryHistoryDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.User;

public class SalaryHistoryMapper {
    public static SalaryHistoryDto toDto(SalaryHistory history) {
        if (history == null) {
            return null;
        }
        User worker = history.getWorker();
        return SalaryHistoryDto.builder()
                .id(history.getId())
                .workerId(worker != null ? worker.getId() : null)
                .workerName(worker != null ? worker.getUsername() : null)
                .workerPhone(worker != null ? worker.getPhoneNumber() : null)
                .bookingId(history.getBooking() != null ? history.getBooking().getId() : null)
                .roleInBooking(history.getRoleInBooking())
                .amountEarned(history.getAmountEarned())
                .paymentStatus(history.getPaymentStatus())
                .calculatedAt(history.getCalculatedAt())
                .build();
    }

    public static SalaryHistory toEntity(SalaryHistoryDto dto) {
        if (dto == null) {
            return null;
        }
        SalaryHistory history = SalaryHistory.builder()
                .id(dto.getId())
                .roleInBooking(dto.getRoleInBooking())
                .amountEarned(dto.getAmountEarned())
                .paymentStatus(dto.getPaymentStatus())
                .calculatedAt(dto.getCalculatedAt())
                .build();
        if (dto.getWorkerId() != null) {
            history.setWorker(User.builder().id(dto.getWorkerId()).build());
        }
        if (dto.getBookingId() != null) {
            history.setBooking(Booking.builder().id(dto.getBookingId()).build());
        }
        return history;
    }
}
