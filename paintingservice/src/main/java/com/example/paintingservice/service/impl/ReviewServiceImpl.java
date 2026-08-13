package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Review;
import com.example.paintingservice.repository.ReviewRepository;
import com.example.paintingservice.service.BaseServiceImpl;
import com.example.paintingservice.service.ReviewService;
import org.springframework.stereotype.Service;

@Service
public class ReviewServiceImpl extends BaseServiceImpl<Review, Long> implements ReviewService {

    public ReviewServiceImpl(ReviewRepository repository) {
        super(repository);
    }
}
