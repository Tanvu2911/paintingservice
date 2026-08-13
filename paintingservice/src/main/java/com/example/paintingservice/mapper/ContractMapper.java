package com.example.paintingservice.mapper;

import com.example.paintingservice.dto.ContractDto;
import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.Contract;

public class ContractMapper {
    public static ContractDto toDto(Contract contract) {
        if (contract == null) {
            return null;
        }
        return ContractDto.builder()
                .id(contract.getId())
                .bookingId(contract.getBooking() != null ? contract.getBooking().getId() : null)
                .contractCode(contract.getContractCode())
                .content(contract.getContent())
                .customerSigned(contract.getCustomerSigned())
                .surveySigned(contract.getSurveySigned())
                // BỔ SUNG 2 DÒNG DƯỚI ĐÂY:
                .customerSignatureImg(contract.getCustomerSignatureImg())
                .surveySignatureImg(contract.getSurveySignatureImg())
                .customerSignedAt(contract.getCustomerSignedAt())
                .surveySignedAt(contract.getSurveySignedAt())
                .customerIp(contract.getCustomerIp())
                .surveyIp(contract.getSurveyIp())
                .pdfUrl(contract.getPdfUrl())
                .createdAt(contract.getCreatedAt())
                .build();
    }

    public static Contract toEntity(ContractDto dto) {
        if (dto == null) {
            return null;
        }
        Contract contract = Contract.builder()
                .id(dto.getId())
                .contractCode(dto.getContractCode())
                .content(dto.getContent())
                .customerSigned(dto.getCustomerSigned())
                .surveySigned(dto.getSurveySigned())
                // BỔ SUNG 2 DÒNG DƯỚI ĐÂY:
                .customerSignatureImg(dto.getCustomerSignatureImg())
                .surveySignatureImg(dto.getSurveySignatureImg())
                .customerSignedAt(dto.getCustomerSignedAt())
                .surveySignedAt(dto.getSurveySignedAt())
                .customerIp(dto.getCustomerIp())
                .surveyIp(dto.getSurveyIp())
                .pdfUrl(dto.getPdfUrl())
                .createdAt(dto.getCreatedAt())
                .build();
                
        if (dto.getBookingId() != null) {
            contract.setBooking(Booking.builder().id(dto.getBookingId()).build());
        }
        return contract;
    }
}