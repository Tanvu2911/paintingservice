package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.SalaryHistory;
import com.example.paintingservice.repository.SalaryHistoryRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.SalaryHistoryService;
import org.springframework.stereotype.Service;

@Service
public class SalaryHistoryServiceImpl extends BaseServiceImpl<SalaryHistory, Long> implements SalaryHistoryService {

    public SalaryHistoryServiceImpl(SalaryHistoryRepository repository) {
        super(repository);
    }
}
