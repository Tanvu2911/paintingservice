package com.example.paintingservice.service;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.User;

import java.math.BigDecimal;

/**
 * Service chịu trách nhiệm duy nhất về việc tạo và gửi thông báo đa kênh nội bộ
 * cho các sự kiện liên quan đến đơn hàng (Booking Lifecycle Notifications).
 */
public interface BookingNotificationService {

    void notifyBookingCreated(Booking saved, User autoSupervisor);

    void notifyBookingUpdated(Booking old, BookingDto dto, String currentUsername,
            boolean statusChanged, boolean detailsChanged, boolean technicianChanged);

    void notifyBookingDeleted(Booking booking, String currentUsername);

    void notifySupervisorAssigned(Booking booking, User supervisor, User previousSupervisor);

    void notifyQuoteSent(Booking booking, BigDecimal total, boolean isReQuote);

    void notifyDepositConfirmed(Booking booking, User autoWorker);

    void notifyTeamAssigned(Booking booking, User technician, BigDecimal workerFee);

    void notifyStaffPaid(Booking booking);

    void notifyJobAccepted(Booking booking, String username);

    void notifyJobRejected(Booking booking, String username, String reason);

    void notifyJobStarted(Booking booking, String username);

    void notifyJobCompleted(Booking booking, String username);

    void notifyServiceItemCompleted(Booking booking, String username, String serviceName);

    void notifyAllServiceItemsAccepted(Booking booking, String supervisorUsername);

    void notifySurveyJobRejected(Booking booking, String username, String reason);

    void notifyQuoteRejected(Booking booking, String username, String reason, boolean isAdmin);

    void notifySurveyCancelled(Booking booking, String username, String reason);

    void notifyCustomerAccepted(Booking booking, String customerUsername);
    void notifyServiceItemRejected(Booking booking, String customerUsername, String serviceName, BigDecimal newTotal);
}
