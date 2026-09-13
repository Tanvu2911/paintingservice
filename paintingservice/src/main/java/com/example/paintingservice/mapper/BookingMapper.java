package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.BookingDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.ServiceEntity;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.enums.PaymentStatus;

public class BookingMapper {

    public static BookingDto toDto(Booking booking) {
        if (booking == null) {
            return null;
        }

        PaymentStatus paymentStatus = booking.getPaymentStatus();
        boolean depositPaid = paymentStatus == PaymentStatus.DEPOSIT_PAID
                || paymentStatus == PaymentStatus.FULLY_PAID;
        boolean finalPaid = paymentStatus == PaymentStatus.FULLY_PAID;

        BookingDto dto = BookingDto.builder()
                .id(booking.getId())
                .appointmentDate(booking.getAppointmentDate())
                .appointmentTime(booking.getAppointmentTime())
                .status(booking.getStatus())
                .surveyFee(booking.getSurveyFee())
                .totalAmount(booking.getTotalAmount())
                .depositAmount(booking.getDepositAmount())
                .remainingAmount(booking.getRemainingAmount())
                .estimatedDays(booking.getEstimatedDays())
                .warrantyYears(booking.getWarrantyYears())
                .expectedStartDate(booking.getExpectedStartDate())
                .paymentStatus(paymentStatus)
                .depositPaid(depositPaid)
                .finalPaid(finalPaid)
                .depositPaidAt(booking.getDepositPaidAt())
                .finalPaidAt(booking.getFinalPaidAt())
                .completedAt(booking.getCompletedAt())
                .address(booking.getAddress())
                .description(booking.getDescription())
                .createdAt(booking.getCreatedAt())
                .build();

        if (booking.getCustomer() != null) {
            User customer = booking.getCustomer();
            dto.setCustomerId(customer.getId());
            dto.setCustomerName(getUserDisplayName(customer));
            dto.setCustomerPhone(customer.getPhoneNumber());
            dto.setCustomerEmail(customer.getEmail());
            dto.setCustomerAddress(customer.getAddress());
        }

        if (booking.getSurveyor() != null) {
            Long surveyorId = booking.getSurveyor().getId();
            String surveyorName = getUserDisplayName(booking.getSurveyor());
            String surveyorPhone = booking.getSurveyor().getPhoneNumber();
            String surveyorAvatar = booking.getSurveyor().getAvatar();
            dto.setSurveyorId(surveyorId);
            dto.setSurveyorName(surveyorName);
            dto.setSurveyorPhone(surveyorPhone);
            dto.setSurveyorAvatar(surveyorAvatar);
            dto.setSupervisorId(surveyorId);
            dto.setSupervisorName(surveyorName);
            dto.setSupervisorPhone(surveyorPhone);
            dto.setSupervisorAvatar(surveyorAvatar);
        }

        if (booking.getTechnician() != null) {
            dto.setTechnicianId(booking.getTechnician().getId());
            dto.setTechnicianName(getUserDisplayName(booking.getTechnician()));
            dto.setTechnicianPhone(booking.getTechnician().getPhoneNumber());
            dto.setTechnicianAvatar(booking.getTechnician().getAvatar());
        }

        if (booking.getPreferredTechnician() != null) {
            dto.setPreferredTechnicianId(booking.getPreferredTechnician().getId());
            dto.setPreferredTechnicianName(getUserDisplayName(booking.getPreferredTechnician()));
        }

        if (booking.getPreferredSupervisor() != null) {
            dto.setPreferredSupervisorId(booking.getPreferredSupervisor().getId());
            dto.setPreferredSupervisorName(getUserDisplayName(booking.getPreferredSupervisor()));
            dto.setPreferredSupervisorPhone(booking.getPreferredSupervisor().getPhoneNumber());
            dto.setPreferredSupervisorAvatar(booking.getPreferredSupervisor().getAvatar());
        }

        if (booking.getService() != null) {
            dto.setServiceId(booking.getService().getId());
            dto.setServiceName(booking.getService().getName());
        }

        return dto;
    }

    public static Booking toEntity(BookingDto dto) {
        if (dto == null) {
            return null;
        }

        Booking booking = Booking.builder()
                .id(dto.getId())
                .appointmentDate(dto.getAppointmentDate())
                .appointmentTime(dto.getAppointmentTime())
                .status(dto.getStatus())
                .surveyFee(dto.getSurveyFee())
                .totalAmount(dto.getTotalAmount())
                .depositAmount(dto.getDepositAmount())
                .remainingAmount(dto.getRemainingAmount())
                .estimatedDays(dto.getEstimatedDays())
                .warrantyYears(dto.getWarrantyYears())
                .expectedStartDate(dto.getExpectedStartDate())
                .depositPaidAt(dto.getDepositPaidAt())
                .finalPaidAt(dto.getFinalPaidAt())
                .completedAt(dto.getCompletedAt())
                .address(dto.getAddress())
                .description(dto.getDescription())
                .createdAt(dto.getCreatedAt())
                .build();

        if (dto.getCustomerId() != null) {
            booking.setCustomer(User.builder().id(dto.getCustomerId()).build());
        }

        Long surveyorId = dto.getSurveyorId() != null ? dto.getSurveyorId() : dto.getSupervisorId();
        if (surveyorId != null) {
            booking.setSurveyor(User.builder().id(surveyorId).build());
        }

        if (dto.getTechnicianId() != null) {
            booking.setTechnician(User.builder().id(dto.getTechnicianId()).build());
        }

        if (dto.getPreferredTechnicianId() != null) {
            booking.setPreferredTechnician(User.builder().id(dto.getPreferredTechnicianId()).build());
        }

        if (dto.getPreferredSupervisorId() != null) {
            booking.setPreferredSupervisor(User.builder().id(dto.getPreferredSupervisorId()).build());
        }

        if (dto.getServiceId() != null) {
            booking.setService(ServiceEntity.builder().id(dto.getServiceId()).build());
        }

        return booking;
    }

    /**
     * Updates booking-owned fields without replacing its details, contract, or
     * managed JPA associations. Detail-owned survey data is deliberately absent.
     */
    public static void updateEntity(BookingDto dto, Booking booking) {
        booking.setAppointmentDate(dto.getAppointmentDate());
        booking.setAppointmentTime(dto.getAppointmentTime());
        booking.setStatus(dto.getStatus());
        booking.setSurveyFee(dto.getSurveyFee());
        booking.setTotalAmount(dto.getTotalAmount());
        booking.setDepositAmount(dto.getDepositAmount());
        booking.setRemainingAmount(dto.getRemainingAmount());
        if (dto.getEstimatedDays() != null) booking.setEstimatedDays(dto.getEstimatedDays());
        if (dto.getWarrantyYears() != null) booking.setWarrantyYears(dto.getWarrantyYears());
        if (dto.getExpectedStartDate() != null) booking.setExpectedStartDate(dto.getExpectedStartDate());
        if (dto.getCompletedAt() != null) booking.setCompletedAt(dto.getCompletedAt());
        booking.setPaymentStatus(dto.getPaymentStatus());
        booking.setAddress(dto.getAddress());
        booking.setDescription(dto.getDescription());

        if (dto.getCustomerId() != null) booking.setCustomer(User.builder().id(dto.getCustomerId()).build());
        Long surveyorId = dto.getSurveyorId() != null ? dto.getSurveyorId() : dto.getSupervisorId();
        booking.setSurveyor(surveyorId == null ? null : User.builder().id(surveyorId).build());
        booking.setTechnician(dto.getTechnicianId() == null ? null : User.builder().id(dto.getTechnicianId()).build());
        booking.setPreferredTechnician(dto.getPreferredTechnicianId() == null ? null : User.builder().id(dto.getPreferredTechnicianId()).build());
        if (dto.getPreferredSupervisorId() != null) {
            booking.setPreferredSupervisor(User.builder().id(dto.getPreferredSupervisorId()).build());
        }
        if (dto.getServiceId() != null) booking.setService(ServiceEntity.builder().id(dto.getServiceId()).build());
    }

    private static String getUserDisplayName(User user) {
        if (user == null) return null;
        return user.getUsername();
    }
}
