package com.example.paintingservice.service;

import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.User;

/**
 * Service chịu trách nhiệm duy nhất về thuật toán chấm điểm thông minh (Smart Scoring)
 * và phân công nhân sự (Giám sát viên & Đội thợ thi công) theo nguyên lý Single Responsibility.
 */
public interface BookingDispatchService {

    /**
     * Tự động tìm kiếm và phân công Giám sát viên (SUPERVISOR) phù hợp nhất
     * dựa trên thuật toán Smart Scoring: Khu vực, cân bằng tải, đánh giá sao, kinh nghiệm.
     */
    User autoAssignSupervisor(Booking booking);

    /**
     * Tự động tìm kiếm và phân công Đội thợ thi công (WORKER) phù hợp nhất
     * dựa trên thuật toán Smart Scoring: Thợ ưu tiên, khu vực, chuyên môn, cân bằng tải, đánh giá sao, kinh nghiệm.
     */
    User autoAssignTechnician(Booking booking);

    /**
     * Tự động phân công thợ thi công sau khi đơn hoàn tất đặt cọc / Admin ký hợp đồng.
     */
    User handleWorkerAutoAssignmentAfterDeposit(Booking booking);
}
