package com.example.paintingservice.service;

import java.util.List;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;

public interface BookingService extends BaseService<Booking, Long> {
    
    // Thêm phương thức phân công Giám sát viên cho đơn hàng
    Booking assignSupervisor(Long bookingId, Long supervisorUserId);
    List<Booking> findAllBySurveyor_Id(Long surveyorId);

    BookingDto acceptJob(Long bookingId, String username);

    BookingDto rejectJob(Long bookingId, String username, String reason);
    BookingDto rejectSurveyJob(Long bookingId, String username, String reason);
    BookingDto rejectQuote(Long bookingId, String username, String reason);

    BookingDto startJob(Long id, String username);

    BookingDto completeJob(Long id, String username);
}
