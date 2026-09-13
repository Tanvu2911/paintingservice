package com.example.paintingservice.service;

import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.WarrantyClaim;

import java.math.BigDecimal;

/**
 * Service chịu trách nhiệm duy nhất về việc tạo và gửi thông báo nội bộ
 * cho các sự kiện trong vòng đời bảo hành (Warranty Lifecycle Notifications).
 */
public interface WarrantyNotificationService {

    void notifyClaimCreated(WarrantyClaim claim);

    void notifySurveyorAssigned(WarrantyClaim claim, User surveyor, String adminNote);

    void notifyTechnicianAssigned(WarrantyClaim claim, User technician, String adminNote);

    void notifySurveyReportSubmitted(WarrantyClaim claim);

    void notifySupportPriceRejected(WarrantyClaim claim, String username);

    void notifyCustomerAgreedSupport(WarrantyClaim claim, BigDecimal supportPrice, String note);

    void notifyWorkerStarted(WarrantyClaim claim);

    void notifyTechnicianRejected(WarrantyClaim claim, String technicianName, String reason);

    void notifyWorkerCompleted(WarrantyClaim claim);

    void notifySupervisorAccepted(WarrantyClaim claim);

    void notifyStaffPaid(WarrantyClaim claim, User staff, String role, BigDecimal payAmount);

    void notifyStatusUpdated(WarrantyClaim claim, String adminNote);

    void notifyCustomerPaid(WarrantyClaim claim, BigDecimal price);
}
