package com.example.paintingservice.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service chịu trách nhiệm duy nhất về việc upload ảnh Cloudinary
 * trong vòng đời bảo hành (Warranty Image Upload).
 */
public interface WarrantyImageService {

    /**
     * Upload danh sách ảnh sự cố mà khách hàng gửi khi tạo phiếu bảo hành.
     *
     * @param images    danh sách file ảnh
     * @param bookingId mã đơn hàng gốc (dùng làm folder Cloudinary)
     * @return chuỗi URL phân cách bằng dấu phẩy, hoặc "" nếu không có ảnh
     */
    String uploadClaimImages(List<MultipartFile> images, Long bookingId);

    /**
     * Upload ảnh khảo sát hiện trường bảo hành của Giám sát.
     *
     * @param images  danh sách file ảnh
     * @param claimId mã phiếu bảo hành
     * @return chuỗi URL phân cách bằng dấu phẩy, hoặc "" nếu không có ảnh
     */
    String uploadSurveyImages(List<MultipartFile> images, Long claimId);

    /**
     * Upload ảnh nghiệm thu hoàn tất bảo hành của Giám sát.
     *
     * @param images  danh sách file ảnh
     * @param claimId mã phiếu bảo hành
     * @return chuỗi URL phân cách bằng dấu phẩy, hoặc "" nếu không có ảnh
     */
    String uploadResolvedImages(List<MultipartFile> images, Long claimId);

    /**
     * Nối URL mới với danh sách URL cũ đã có (tránh ghi đè ảnh cũ).
     *
     * @param existing URL cũ (có thể null/blank)
     * @param newUrls  URL mới
     * @return chuỗi URL gộp lại
     */
    String mergeImageUrls(String existing, String newUrls);
}
