package com.example.paintingservice.service;

import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.BookingDetail;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service chịu trách nhiệm duy nhất về việc sinh văn bản hợp đồng kinh tế sơn sửa
 * và xử lý định dạng lịch sử đàm phán hợp đồng.
 */
public interface ContractGenerationService {

    /**
     * Sinh văn bản hợp đồng thi công sơn sửa hoàn chỉnh, chuẩn pháp lý.
     */
    String generateContractContent(
            Booking booking,
            BigDecimal total,
            BigDecimal deposit,
            Integer estimatedDays,
            Integer warrantyYears,
            List<BookingDetail> details
    );

    /**
     * Trích xuất và lưu trữ đề xuất thương lượng vào khối lịch sử thương lượng trong mô tả đơn hàng.
     */
    String archiveNegotiationToDescription(String rawDescription, BigDecimal newTotalAmount);
}
