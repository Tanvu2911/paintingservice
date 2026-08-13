package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Role;
import com.example.paintingservice.repository.RoleRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.RoleService;
import org.springframework.stereotype.Service;

@Service
public class RoleServiceImpl extends BaseServiceImpl<Role, Integer> implements RoleService {

    public RoleServiceImpl(RoleRepository repository) {
        super(repository);
    }
}
