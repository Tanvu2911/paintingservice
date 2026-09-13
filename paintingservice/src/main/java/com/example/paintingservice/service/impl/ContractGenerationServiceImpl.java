package com.example.paintingservice.service.impl;

import com.example.paintingservice.entity.Booking;
import com.example.paintingservice.entity.BookingDetail;
import com.example.paintingservice.service.ContractGenerationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ContractGenerationServiceImpl implements ContractGenerationService {

    @Override
    public String generateContractContent(
            Booking booking,
            BigDecimal total,
            BigDecimal deposit,
            Integer estimatedDays,
            Integer warrantyYears,
            List<BookingDetail> details
    ) {
        Long id = booking.getId();
        String customerName = booking.getCustomer() != null ? booking.getCustomer().getUsername() : "Khách hàng";
        String customerPhone = booking.getCustomer() != null ? booking.getCustomer().getPhoneNumber() : "Chưa cung cấp";

        NumberFormat nf = NumberFormat.getInstance(Locale.of("vi", "VN"));
        BigDecimal remaining = total.subtract(deposit);

        StringBuilder sb = new StringBuilder();
        sb.append("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n");
        sb.append("Độc lập - Tự do - Hạnh phúc\n\n");
        sb.append("HỢP ĐỒNG THI CÔNG SƠN SỬA & DỊCH VỤ DÂN DỤNG\n");
        sb.append("Mã đơn hàng: #").append(id).append("\n");
        sb.append("Thời gian lập: ")
                .append(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now()))
                .append("\n\n");
        sb.append("THÔNG TIN CÁC BÊN:\n");
        sb.append("Bên A (Khách hàng): ").append(customerName).append("\n");
        sb.append("Số điện thoại: ").append(customerPhone).append("\n");
        sb.append("Địa điểm thi công: ")
                .append(booking.getAddress() != null ? booking.getAddress() : "Theo thông tin đăng ký")
                .append("\n\n");
        sb.append("Bên B (Đơn vị thi công): CÔNG TY DỊCH VỤ SƠN SỬA 24/7\n");
        sb.append("Hotline hỗ trợ: 1900 1234 - 0355.880.362\n\n");
        sb.append("I. HIỆN TRẠNG KHẢO SÁT & TIẾN ĐỘ THI CÔNG:\n");
        sb.append("- Mô tả ban đầu: ")
                .append(booking.getDescription() != null ? booking.getDescription() : "Khách hàng không ghi chú")
                .append("\n");
        sb.append("- Thời gian thi công dự kiến: ").append(estimatedDays != null ? estimatedDays : 3).append(" ngày làm việc.\n");
        if (booking.getExpectedStartDate() != null) {
            sb.append("- Ngày bắt đầu thi công cam kết: ").append(booking.getExpectedStartDate()).append("\n");
        }
        if (details != null && !details.isEmpty()) {
            BookingDetail bd = details.get(0);
            if (bd.getSurveyNote() != null && !bd.getSurveyNote().isBlank()) {
                sb.append("- Ghi chú hiện trạng khảo sát: ").append(bd.getSurveyNote()).append("\n");
            }
            if (bd.getMaterialNote() != null && !bd.getMaterialNote().isBlank()) {
                sb.append("- Chủng loại vật tư đề xuất: ").append(bd.getMaterialNote()).append("\n");
            }
        }
        sb.append("\nII. GIÁ TRỊ HỢP ĐỒNG & PHƯƠNG THỨC THANH TOÁN:\n");
        sb.append("- Tổng chi phí thi công: ").append(nf.format(total)).append(" VNĐ\n");
        sb.append("- Số tiền đặt cọc (xác nhận đơn): ").append(nf.format(deposit)).append(" VNĐ\n");
        sb.append("- Số tiền còn lại (thanh toán sau nghiệm thu): ")
                .append(nf.format(remaining))
                .append(" VNĐ\n");
        sb.append("- Phương thức thanh toán: Chuyển khoản VNPay / VietQR.\n\n");
        sb.append("III. QUY TRÌNH THI CÔNG & TIÊU CHUẨN KỸ THUẬT:\n");
        sb.append("1. Che chắn cẩn thận sàn nhà, nội thất và tài sản xung quanh khu vực thi công.\n");
        sb.append("2. Xử lý bề mặt: Sủi dơ, dặm vá bột trét tại các vị trí nứt vỡ, xả nhám phẳng mịn bề mặt.\n");
        sb.append("3. Thi công lớp sơn lót kháng kiềm / chống thấm chuyên dụng (01 lớp chuẩn).\n");
        sb.append("4. Thi công lớp sơn phủ hoàn thiện màu sắc theo đúng yêu cầu (02 lớp chuẩn kỹ thuật).\n");
        sb.append("5. Vệ sinh công nghiệp khu vực thi công và bàn giao mặt bằng sạch đẹp.\n\n");
        sb.append("IV. CHẾ ĐỘ BẢO HÀNH & CAM KẾT CHẤT LƯỢNG:\n");
        sb.append("- Cam kết 100% sử dụng vật tư sơn chính hãng, đúng chủng loại thỏa thuận.\n");
        sb.append("- Thời hạn bảo hành công trình: ").append(warrantyYears != null ? warrantyYears : 2)
                .append(" năm kể từ ngày ký biên bản nghiệm thu.\n");
        sb.append("- Điều kiện bảo hành: Khắc phục miễn phí các lỗi bong tróc, bay màu do kỹ thuật thi công.\n\n");
        sb.append("V. ĐIỀU KHOẢN KÝ KẾT:\n");
        sb.append("- Hợp đồng có hiệu lực kể từ khi Bên A thực hiện ký điện tử và đặt cọc thành công.\n");
        sb.append("- Bên B cam kết triển khai đúng tiến độ và phân công nhân sự chuyên nghiệp sau khi xác nhận tiền cọc.");

        return sb.toString();
    }

    @Override
    public String archiveNegotiationToDescription(String rawDesc, BigDecimal newTotalAmount) {
        if (rawDesc == null ||
                (!rawDesc.contains("[Đề xuất thương lượng") &&
                 !rawDesc.contains("[Thương lượng giá") &&
                 !rawDesc.contains("Giá đề xuất:"))) {
            return rawDesc;
        }

        NumberFormat nfTemp = NumberFormat.getInstance(Locale.of("vi", "VN"));
        String timeStr = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(LocalDateTime.now());

        // 1. Extract negotiation proposal details
        Pattern pattern = Pattern.compile(
                "(?s)\\[(?:Đề xuất thương lượng[^\\]]*|Thương lượng giá[^\\]]*)\\]\\s*(.*?)(?=(\\[Lịch sử|\\[Mô tả|$))");
        Matcher m = pattern.matcher(rawDesc);
        String historyEntry = "";
        if (m.find()) {
            String fullMatch = m.group(0);
            String meta = fullMatch.contains("(") && fullMatch.contains(")")
                    ? fullMatch.substring(fullMatch.indexOf("(") + 1, fullMatch.lastIndexOf(")"))
                            .replace("(", "").replace(")", "").trim()
                    : "Đã gửi đề xuất";
            String msg = m.group(1).trim();
            historyEntry = String.format(
                    "• Lần thương lượng (%s): %s. Ghi chú: \"%s\" → Admin đã cập nhật lại báo giá: %sđ",
                    timeStr, meta.isEmpty() ? "Đã gửi đề xuất" : meta,
                    msg.isEmpty() ? "Không có ghi chú" : msg, nfTemp.format(newTotalAmount));
        } else {
            historyEntry = String.format(
                    "• Lần thương lượng (%s) → Admin đã cập nhật lại báo giá: %sđ", timeStr,
                    nfTemp.format(newTotalAmount));
        }

        // 2. Remove active negotiation block completely
        String withoutActive = pattern.matcher(rawDesc).replaceAll("").trim();
        withoutActive = withoutActive.replaceAll(
                "(?s)\\[(?:Đề xuất thương lượng|Thương lượng giá)[^\\]]*\\]\\s*", "").trim();

        // 3. Append to negotiation history block
        if (!historyEntry.isEmpty()) {
            if (withoutActive.contains("[Lịch sử thương lượng:")) {
                withoutActive = withoutActive.replace("[Lịch sử thương lượng:",
                        "[Lịch sử thương lượng:\n" + historyEntry);
            } else {
                withoutActive = "[Lịch sử thương lượng:\n" + historyEntry + "\n]\n\n" + withoutActive;
            }
        }

        return withoutActive.trim().isBlank() ? null : withoutActive.trim();
    }
}
