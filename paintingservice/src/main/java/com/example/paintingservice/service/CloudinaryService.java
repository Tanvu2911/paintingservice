package com.example.paintingservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload 1 ảnh, trả về secure_url
     * folder: "survey/bookingId" hoặc "progress/bookingId"
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "image",
                "overwrite", false));
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Upload ảnh dạng Base64 Data URI (VD: data:image/png;base64,...)
     * Nếu chuỗi đã là URL http(s) thì giữ nguyên.
     * Có fallback nếu lỗi mạng/Cloudinary.
     */
    public String uploadBase64(String base64Data, String folder) {
        if (base64Data == null || base64Data.isBlank()) {
            return null;
        }

        // Nếu đã là link Cloudinary hoặc URL http/https thì không cần upload lại
        if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
            return base64Data;
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(base64Data, ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "overwrite", false));
            return (String) uploadResult.get("secure_url");
        } catch (Exception e) {
            log.warn("Không thể tải ảnh Base64 lên Cloudinary: {}. Sử dụng dữ liệu gốc làm fallback.", e.getMessage());
            return base64Data;
        }
    }

    /**
     * Xóa ảnh theo public_id (nếu cần)
     */
    public void deleteImage(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}