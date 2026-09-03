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
                .customerSignatureImg(contract.getCustomerSignatureImg())
                .customerSignedAt(contract.getCustomerSignedAt())
                .customerIp(contract.getCustomerIp())
                .adminSigned(contract.getAdminSigned())
                .adminSignatureImg(contract.getAdminSignatureImg())
                .adminSignedAt(contract.getAdminSignedAt())
                .adminIp(contract.getAdminIp())
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
                .customerSignatureImg(dto.getCustomerSignatureImg())
                .customerSignedAt(dto.getCustomerSignedAt())
                .customerIp(dto.getCustomerIp())
                .adminSigned(dto.getAdminSigned())
                .adminSignatureImg(dto.getAdminSignatureImg())
                .adminSignedAt(dto.getAdminSignedAt())
                .adminIp(dto.getAdminIp())
                .pdfUrl(dto.getPdfUrl())
                .createdAt(dto.getCreatedAt())
                .build();

        if (dto.getBookingId() != null) {
            contract.setBooking(Booking.builder().id(dto.getBookingId()).build());
        }
        return contract;
    }
}