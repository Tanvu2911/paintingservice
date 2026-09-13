package com.example.paintingservice.service.impl;

import com.example.paintingservice.service.CloudinaryService;
import com.example.paintingservice.service.WarrantyImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Chịu trách nhiệm duy nhất: upload ảnh bảo hành lên Cloudinary.
 * Tách ra từ WarrantyClaimServiceImpl theo Single Responsibility Principle.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyImageServiceImpl implements WarrantyImageService {

    private final CloudinaryService cloudinaryService;

    @Override
    public String uploadClaimImages(List<MultipartFile> images, Long bookingId) {
        return uploadImages(images, "warranty/claim-booking-" + bookingId);
    }

    @Override
    public String uploadSurveyImages(List<MultipartFile> images, Long claimId) {
        return uploadImages(images, "warranty/survey-claim-" + claimId);
    }

    @Override
    public String uploadResolvedImages(List<MultipartFile> images, Long claimId) {
        return uploadImages(images, "warranty/resolved-claim-" + claimId);
    }

    @Override
    public String mergeImageUrls(String existing, String newUrls) {
        if (newUrls == null || newUrls.isBlank()) {
            return existing != null ? existing : "";
        }
        if (existing == null || existing.isBlank()) {
            return newUrls;
        }
        return existing + "," + newUrls;
    }

    // ─── Private helper ────────────────────────────────────────────────────────

    private String uploadImages(List<MultipartFile> images, String folder) {
        if (images == null || images.isEmpty()) return "";
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : images) {
            if (file != null && !file.isEmpty()) {
                try {
                    urls.add(cloudinaryService.uploadImage(file, folder));
                } catch (IOException e) {
                    log.error("Lỗi upload ảnh bảo hành folder={} file={}: {}", folder, file.getOriginalFilename(), e.getMessage());
                }
            }
        }
        return String.join(",", urls);
    }
}
