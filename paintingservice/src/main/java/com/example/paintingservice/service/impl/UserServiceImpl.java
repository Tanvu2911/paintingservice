package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.User;
import com.example.paintingservice.repository.UserRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl extends BaseServiceImpl<User, Long> implements UserService {

    public UserServiceImpl(UserRepository repository) {
        super(repository);
    }
}
