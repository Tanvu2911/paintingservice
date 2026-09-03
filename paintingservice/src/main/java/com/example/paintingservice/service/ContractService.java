package com.example.paintingservice.service;

import com.example.paintingservice.dto.ContractDto;
import com.example.paintingservice.entity.Contract;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

import java.util.Map;

public interface ContractService extends BaseService<Contract, Long> {
    Map<String, Long> getMonthlyStats();
    ContractDto createContract(ContractDto dto, HttpServletRequest request);
    ContractDto updateContract(Long id, ContractDto dto, Authentication auth, HttpServletRequest request);
    ContractDto signContract(Long id, Map<String, String> payload, Authentication auth, HttpServletRequest request);
    ContractDto confirmDeposit(Long id, Map<String, String> payload);
}
