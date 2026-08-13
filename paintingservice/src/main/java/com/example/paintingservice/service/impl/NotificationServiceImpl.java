package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Notification;
import com.example.paintingservice.repository.NotificationRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.NotificationService;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl extends BaseServiceImpl<Notification, Long> implements NotificationService {

    public NotificationServiceImpl(NotificationRepository repository) {
        super(repository);
    }
}
