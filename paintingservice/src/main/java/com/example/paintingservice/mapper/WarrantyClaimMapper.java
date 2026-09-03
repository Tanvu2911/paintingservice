package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.WarrantyClaimDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.entity.User;
import com.example.paintingservice.entity.WarrantyClaim;
import com.example.paintingservice.entity.WarrantyReport;
import com.example.paintingservice.enums.SalaryStatus;

import java.util.List;

public class WarrantyClaimMapper {

    public static WarrantyClaimDto toDto(WarrantyClaim entity) {
        return toDto(entity, null);
    }

    public static WarrantyClaimDto toDto(WarrantyClaim entity, List<SalaryHistory> salaries) {
        if (entity == null)
            return null;

        WarrantyClaimDto.WarrantyClaimDtoBuilder builder = WarrantyClaimDto.builder()
                .id(entity.getId())
                .issueType(entity.getIssueType())
                .issueTitle(entity.getIssueTitle())
                .description(entity.getDescription())
                .imageUrls(entity.getImageUrls())
                .preferredDate(entity.getPreferredDate())
                .preferredTime(entity.getPreferredTime())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt());

        // Lấy thông tin khảo sát & nghiệm thu từ bảng 1-1 WarrantyReport
        WarrantyReport report = entity.getReport();
        if (report != null) {
            builder.faultType(report.getFaultType())
                    .surveyNote(report.getSurveyNote())
                    .materialNote(report.getMaterialNote())
                    .surveyImages(report.getSurveyImages())
                    .suggestedPrice(report.getSuggestedPrice())
                    .finalSupportPrice(report.getFinalSupportPrice())
                    .adminNote(report.getAdminNote())
                    .resolvedImageUrls(report.getResolvedImageUrls())
                    .resolvedAt(report.getResolvedAt())
                    .supervisorAccepted(report.getSupervisorAccepted())
                    .customerAccepted(report.getCustomerAccepted())
                    .customerPaid(report.getCustomerAccepted());
        }

        // Lấy thông tin thù lao từ bảng SalaryHistory
        if (salaries != null && !salaries.isEmpty()) {
            for (SalaryHistory sh : salaries) {
                if ("SURVEYOR".equalsIgnoreCase(sh.getRoleInBooking())) {
                    builder.surveyorSalary(sh.getAmountEarned())
                            .surveyorPaid(sh.getPaymentStatus() == SalaryStatus.PAID)
                            .surveyorPaidAt(sh.getPaidAt());
                } else if ("TECHNICIAN".equalsIgnoreCase(sh.getRoleInBooking()) || "WORKER".equalsIgnoreCase(sh.getRoleInBooking())) {
                    builder.workerSalary(sh.getAmountEarned())
                            .workerPaid(sh.getPaymentStatus() == SalaryStatus.PAID)
                            .workerPaidAt(sh.getPaidAt());
                }
            }
        }

        WarrantyClaimDto dto = builder.build();

        if (entity.getBooking() != null) {
            Booking b = entity.getBooking();
            dto.setBookingId(b.getId());
            dto.setAddress(b.getAddress());
            dto.setWarrantyYears(b.getWarrantyYears() != null ? b.getWarrantyYears() : 2);
            if (b.getService() != null) {
                dto.setServiceName(b.getService().getName());
            }

            // Map thợ cũ từng thi công đơn hàng gốc
            if (b.getTechnician() != null) {
                User pt = b.getTechnician();
                dto.setPreviousTechnicianId(pt.getId());
                dto.setPreviousTechnicianName(pt.getUsername());
                dto.setPreviousTechnicianPhone(pt.getPhoneNumber());
            }
        }

        if (entity.getCustomer() != null) {
            User c = entity.getCustomer();
            dto.setCustomerId(c.getId());
            dto.setCustomerName(c.getUsername());
            dto.setCustomerPhone(c.getPhoneNumber());
        }

        if (entity.getSurveyor() != null) {
            User s = entity.getSurveyor();
            dto.setSurveyorId(s.getId());
            dto.setSurveyorName(s.getUsername());
            dto.setSurveyorPhone(s.getPhoneNumber());
        }

        if (entity.getTechnician() != null) {
            User t = entity.getTechnician();
            dto.setTechnicianId(t.getId());
            dto.setTechnicianName(t.getUsername());
            dto.setTechnicianPhone(t.getPhoneNumber());
        }

        return dto;
    }
}
