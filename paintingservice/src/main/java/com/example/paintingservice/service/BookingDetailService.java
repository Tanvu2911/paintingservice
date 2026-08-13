package com.example.paintingservice.service;

import com.example.paintingservice.dto.BookingDetailDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BookingDetailService {
    BookingDetailDto create(BookingDetailDto request, String username);
    BookingDetailDto getById(Long id, String username);
    List<BookingDetailDto> getByBookingId(Long bookingId, String username);
    BookingDetailDto update(Long id, BookingDetailDto request, String username);
    void delete(Long id);
    BookingDetailDto updateSurvey(Long id, BookingDetailDto request, List<MultipartFile> files, String username);
    BookingDetailDto reportMaterialShortage(Long id, String materialShortage, String username);
    BookingDetailDto supervisorAccept(Long id, String username);
    BookingDetailDto customerAccept(Long id, String username);
}
