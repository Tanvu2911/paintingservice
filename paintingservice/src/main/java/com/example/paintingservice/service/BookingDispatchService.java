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
     * Tự động phân công Giám sát viên với danh sách User ID cần loại trừ.
     */
    User autoAssignSupervisor(Booking booking, java.util.List<Long> excludedUserIds);

    /**
     * Tự động tìm kiếm và phân công Đội thợ thi công (WORKER) phù hợp nhất
     * dựa trên thuật toán Smart Scoring: Thợ ưu tiên, khu vực, chuyên môn, cân bằng tải, đánh giá sao, kinh nghiệm.
     */
    User autoAssignTechnician(Booking booking);

    /**
     * Tự động phân công Đội thợ thi công với danh sách User ID cần loại trừ.
     */
    User autoAssignTechnician(Booking booking, java.util.List<Long> excludedUserIds);

    /**
     * Tự động tìm kiếm và phân công Đội thợ cho từng hạng mục dịch vụ cụ thể.
     */
    User autoAssignTechnicianForService(Booking booking, com.example.paintingservice.entity.ServiceEntity service, java.util.List<Long> excludedUserIds);

    /**
     * Tự động phân công thợ thi công sau khi đơn hoàn tất đặt cọc / Admin ký hợp đồng.
     */
    User handleWorkerAutoAssignmentAfterDeposit(Booking booking);

    /**
     * Tự động phân công lại Giám sát viên sau khi Giám sát viên hiện tại từ chối khảo sát.
     */
    User reassignSupervisorAfterRejection(Booking booking, User rejectedSupervisor, String reason);

    /**
     * Tự động phân công lại Đội thợ thi công sau khi Đội thợ hiện tại từ chối nhận việc.
     */
    User reassignTechnicianAfterRejection(Booking booking, User rejectedTechnician, String reason);
}
