package com.example.paintingservice.service;

import java.util.List;
import java.util.Map;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;

public interface BookingService extends BaseService<Booking, Long> {

    BookingDto createBooking(BookingDto dto, String currentUsername);

    BookingDto updateBooking(Long id, BookingDto dto, String currentUsername);

    void deleteBooking(Long id, String currentUsername);

    BookingDto assignSupervisor(Long bookingId, Long supervisorUserId);

    List<Booking> findAllBySurveyor_Id(Long surveyorId);

    Map<String, Object> sendQuote(Long id, Map<String, Object> payload);

    Map<String, Object> confirmDeposit(Long id, Map<String, String> payload);

    Map<String, Object> assignTeam(Long id, Long technicianId);

    Map<String, Object> payStaff(Long id);

    BookingDto acceptJob(Long bookingId, String username);

    BookingDto rejectJob(Long bookingId, String username, String reason);

    BookingDto rejectSurveyJob(Long bookingId, String username, String reason);

    BookingDto rejectQuote(Long bookingId, String username, String reason);

    BookingDto startJob(Long id, String username);

    BookingDto completeJob(Long id, String username);
}

