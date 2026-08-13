package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Contract;
import com.example.paintingservice.repository.ContractRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.ContractService;
import org.springframework.stereotype.Service;

@Service
public class ContractServiceImpl extends BaseServiceImpl<Contract, Long> implements ContractService {

    public ContractServiceImpl(ContractRepository repository) {
        super(repository);
    }
}
