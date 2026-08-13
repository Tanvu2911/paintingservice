package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.ServiceEntity;
import com.example.paintingservice.repository.ServiceEntityRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.ServiceEntityService;
import org.springframework.stereotype.Service;

@Service
public class ServiceEntityServiceImpl extends BaseServiceImpl<ServiceEntity, Long> implements ServiceEntityService {

    public ServiceEntityServiceImpl(ServiceEntityRepository repository) {
        super(repository);
    }
}
