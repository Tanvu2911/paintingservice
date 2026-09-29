package com.example.paintingservice.service;

import java.util.List;
import java.util.Map;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;

import com.example.paintingservice.entity.User;

public interface BookingService extends BaseService<Booking, Long> {

    BookingDto createBooking(BookingDto dto, String currentUsername);

    BookingDto updateBooking(Long id, BookingDto dto, String currentUsername);

    void deleteBooking(Long id, String currentUsername);

    BookingDto assignSupervisor(Long bookingId, Long supervisorUserId);

    List<Booking> findAllBySurveyor_Id(Long surveyorId);

    List<Booking> findSurveyJobsForStaff(Long staffId);

    List<Booking> findAllOrderByIdDesc();

    Map<String, Object> sendQuote(Long id, Map<String, Object> payload);

    Map<String, Object> confirmDeposit(Long id, Map<String, String> payload);

    User autoAssignTechnician(Booking booking);

    User handleWorkerAutoAssignmentAfterDeposit(Booking booking);

    Map<String, Object> assignTeam(Long id, Long technicianId);

    BookingDto acceptJob(Long bookingId, String username);

    BookingDto rejectJob(Long bookingId, String username, String reason);

    BookingDto rejectSurveyJob(Long bookingId, String username, String reason);

    BookingDto rejectQuote(Long bookingId, String username, String reason);

    BookingDto cancelSurvey(Long bookingId, String username, String reason);

    BookingDto startJob(Long id, String username);

    BookingDto completeJob(Long id, String username);
}
