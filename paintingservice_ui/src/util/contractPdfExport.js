/**
 * Xuất và in Hợp đồng dịch vụ sơn nhà điện tử định dạng chuẩn A4 PDF
 */
export function exportContractPDF(contract, booking) {
  if (!contract || !booking) return;

  const contractCode = contract.contractCode || `HD-${booking.id}`;
  const createdAt = contract.createdAt
    ? new Date(contract.createdAt).toLocaleDateString("vi-VN")
    : new Date().toLocaleDateString("vi-VN");

  const customerName =
    booking.customerName ||
    booking.customer?.fullName ||
    booking.customer?.username ||
    "Khách hàng";
  const customerPhone =
    booking.customerPhone ||
    booking.customer?.phoneNumber ||
    "Chưa cập nhật";
  const address = booking.address || "Hà Nội, Việt Nam";
  const serviceName =
    booking.serviceName || booking.service?.name || "Dịch vụ sơn sửa nhà";

  const totalAmount = booking.totalAmount
    ? Number(booking.totalAmount).toLocaleString("vi-VN") + " VNĐ"
    : "0 VNĐ";
  const depositAmount = booking.depositAmount
    ? Number(booking.depositAmount).toLocaleString("vi-VN") + " VNĐ"
    : booking.totalAmount
    ? Number(Math.round(Number(booking.totalAmount) * 0.3)).toLocaleString("vi-VN") + " VNĐ"
    : "0 VNĐ";
  const remainingAmount =
    booking.totalAmount && booking.depositAmount
      ? Number(Number(booking.totalAmount) - Number(booking.depositAmount)).toLocaleString("vi-VN") + " VNĐ"
      : "0 VNĐ";

  const expectedStartDate = booking.expectedStartDate
    ? new Date(booking.expectedStartDate).toLocaleDateString("vi-VN")
    : "Theo thỏa thuận hai bên";
  const estimatedDays = booking.estimatedDays || 3;
  const warrantyYears = booking.warrantyYears || 2;

  const customerSignedAt = contract.customerSignedAt
    ? new Date(contract.customerSignedAt).toLocaleString("vi-VN")
    : "";
  const adminSignedAt = contract.adminSignedAt
    ? new Date(contract.adminSignedAt).toLocaleString("vi-VN")
    : "";

  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (!printWindow) {
    alert("Vui lòng cho phép popup trình duyệt để xuất file PDF hợp đồng.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hợp đồng điện tử - ${contractCode}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #111;
      margin: 0;
      padding: 20px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }

    .national-header {
      margin-bottom: 20px;
    }
    .national-title {
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .national-motto {
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      margin-top: 4px;
    }

    .contract-title {
      font-size: 16pt;
      font-weight: bold;
      margin: 25px 0 5px 0;
      color: #0f172a;
    }
    .contract-meta {
      font-size: 11pt;
      color: #475569;
      margin-bottom: 25px;
    }

    .section-title {
      font-weight: bold;
      font-size: 13pt;
      margin-top: 18px;
      margin-bottom: 6px;
      text-transform: uppercase;
      color: #1e293b;
    }

    .info-table {
      width: 100%;
      margin-bottom: 12px;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 4px 0;
      vertical-align: top;
      font-size: 12.5pt;
    }
    .info-table td.label {
      width: 180px;
      color: #334155;
    }

    .terms-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 15px 0;
      white-space: pre-wrap;
      font-size: 11.5pt;
      line-height: 1.6;
    }

    .signatures-container {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 48%;
      text-align: center;
      display: inline-block;
      vertical-align: top;
    }
    .sig-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12pt;
    }
    .sig-subtitle {
      font-size: 10.5pt;
      font-style: italic;
      color: #64748b;
      margin-top: 2px;
    }
    .sig-box {
      height: 90px;
      margin: 10px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sig-img {
      max-height: 85px;
      max-width: 220px;
      object-contain: fit;
    }
    .sig-name {
      font-weight: bold;
      font-size: 12pt;
      margin-top: 5px;
    }
    .sig-time {
      font-size: 10pt;
      color: #059669;
      font-weight: bold;
      margin-top: 3px;
    }
    .stamp-box {
      display: inline-block;
      border: 2px solid #dc2626;
      color: #dc2626;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      transform: rotate(-4deg);
      margin-top: 4px;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="national-header text-center">
    <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
    <div class="national-motto">Độc lập - Tự do - Hạnh phúc</div>
  </div>

  <div class="text-center">
    <div class="contract-title">HỢP ĐỒNG DỊCH VỤ THI CÔNG SƠN SỬA CÔNG TRÌNH</div>
    <div class="contract-meta">
      Mã số HĐ: <strong>${contractCode}</strong> &nbsp;|&nbsp; Ngày lập: ${createdAt}
    </div>
  </div>

  <p class="italic" style="font-size: 11pt; color: #475569; margin-bottom: 15px;">
    - Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;<br/>
    - Căn cứ vào nhu cầu của Khách hàng và năng lực cung cấp dịch vụ của Công ty Dịch Vụ Sơn Nhà 247;
  </p>

  <div class="section-title">ĐIỀU 1: THÔNG TIN CÁC BÊN GIAO KẾT HỢP ĐỒNG</div>
  <table class="info-table">
    <tr>
      <td colspan="2" class="bold" style="color: #0f172a; padding-top: 6px;">BÊN A (BÊN THUÊ THI CÔNG / KHÁCH HÀNG):</td>
    </tr>
    <tr>
      <td class="label">• Họ và tên:</td>
      <td class="bold">${customerName}</td>
    </tr>
    <tr>
      <td class="label">• Số điện thoại:</td>
      <td>${customerPhone}</td>
    </tr>
    <tr>
      <td class="label">• Địa chỉ công trình:</td>
      <td>${address}</td>
    </tr>
    <tr>
      <td colspan="2" class="bold" style="color: #0f172a; padding-top: 10px;">BÊN B (ĐƠN VỊ THI CÔNG DỊCH VỤ):</td>
    </tr>
    <tr>
      <td class="label">• Tên đơn vị:</td>
      <td class="bold">CÔNG TY DỊCH VỤ SƠN NHÀ CHUYÊN NGHIỆP 247</td>
    </tr>
    <tr>
      <td class="label">• Tổng đài CSKH:</td>
      <td>1900 6868 &nbsp;|&nbsp; Hotline kỹ thuật: 0987.654.321</td>
    </tr>
    <tr>
      <td class="label">• Địa chỉ trụ sở:</td>
      <td>Thành phố Hà Nội, Việt Nam</td>
    </tr>
  </table>

  <div class="section-title">ĐIỀU 2: HẠNG MỤC THI CÔNG VÀ KINH PHÍ DỰ TOÁN</div>
  <table class="info-table">
    <tr>
      <td class="label">• Hạng mục dịch vụ:</td>
      <td class="bold">${serviceName}</td>
    </tr>
    <tr>
      <td class="label">• Tổng giá trị dự toán:</td>
      <td class="bold" style="color: #047857; font-size: 13pt;">${totalAmount}</td>
    </tr>
    <tr>
      <td class="label">• Tiền đặt cọc (30%):</td>
      <td class="bold">${depositAmount}</td>
    </tr>
    <tr>
      <td class="label">• Còn lại sau nghiệm thu (70%):</td>
      <td class="bold">${remainingAmount}</td>
    </tr>
    <tr>
      <td class="label">• Ngày bắt đầu dự kiến:</td>
      <td>${expectedStartDate}</td>
    </tr>
    <tr>
      <td class="label">• Thời gian thi công:</td>
      <td>${estimatedDays} ngày làm việc</td>
    </tr>
    <tr>
      <td class="label">• Thời hạn bảo hành:</td>
      <td class="bold">${warrantyYears} năm bảo hành chính hãng</td>
    </tr>
  </table>

  <div class="section-title">ĐIỀU 3: ĐIỀU KHOẢN VÀ CAM KẾT HAI BÊN</div>
  <div class="terms-box">
${contract.content || "1. Bên B cam kết sử dụng vật liệu sơn chính hãng, đúng chủng loại và màu sắc đã thống nhất trong báo cáo khảo sát.\n2. Bên B đảm bảo an toàn lao động, che chắn cẩn thận nội thất và vệ sinh sạch sẽ mặt bằng sau khi hoàn thành.\n3. Bên A có trách nhiệm tạo điều kiện mặt bằng và thanh toán đúng tiến độ hợp đồng (cọc 30% khi ký HĐ, tất toán 70% sau khi nghiệm thu đạt yêu cầu).\n4. Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận trong hợp đồng điện tử này."}
  </div>

  <div class="signatures-container">
    <div class="sig-col">
      <div class="sig-title">ĐẠI DIỆN BÊN A (KHÁCH HÀNG)</div>
      <div class="sig-subtitle">(Ký, ghi rõ họ tên bằng chữ ký điện tử)</div>
      <div class="sig-box">
        ${
          contract.customerSignatureImg
            ? `<img src="${contract.customerSignatureImg}" class="sig-img" alt="Chữ ký khách hàng" />`
            : `<span style="color: #94a3b8; font-style: italic; font-size: 11pt;">(Chưa ký)</span>`
        }
      </div>
      <div class="sig-name">${customerName}</div>
      ${
        customerSignedAt
          ? `<div class="sig-time">✓ Đã ký lúc: ${customerSignedAt}</div>`
          : ""
      }
    </div>

    <div class="sig-col">
      <div class="sig-title">ĐẠI DIỆN BÊN B (ADMIN CÔNG TY)</div>
      <div class="sig-subtitle">(Ký tên và đóng dấu điện tử xác nhận)</div>
      <div class="sig-box">
        ${
          contract.adminSignatureImg
            ? `<img src="${contract.adminSignatureImg}" class="sig-img" alt="Chữ ký Admin" />`
            : `<span style="color: #94a3b8; font-style: italic; font-size: 11pt;">(Chưa ký)</span>`
        }
      </div>
      <div class="sig-name">CÔNG TY DỊCH VỤ SƠN NHÀ 247</div>
      ${
        adminSignedAt
          ? `<div class="sig-time">✓ Ký duyệt lúc: ${adminSignedAt}</div>
             <div class="stamp-box">ĐÃ ĐÓNG DẤU ĐIỆN TỬ</div>`
          : ""
      }
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
