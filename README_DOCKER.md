# Hướng Dẫn Triển Khai Docker Cho Dự Án Painting Service

Tài liệu này hướng dẫn chi tiết cách cài đặt môi trường, cấu hình và khởi chạy toàn bộ hệ thống Painting Service (Fullstack) thông qua Docker và Docker Compose.

---

## 1. Kiến trúc hệ thống trong Docker

Hệ thống được đóng gói thành 3 container liên kết với nhau qua mạng ảo nội bộ `app_network`:

```
+-------------------------------------------------------------------------+
|                              HOST (Máy tính)                            |
|                                                                         |
|   Port 80                     Port 8080                   Port 3306     |
+------|----------------------------|---------------------------|---------+
       |                            |                           |
       v                            v                           v
+------------------+       +------------------+       +-------------------+
|     FRONTEND     |       |     BACKEND      |       |      DATABASE     |
|   (Nginx Alpine) | ----> |   (Spring Boot   | ----> |    (MySQL 8.0)    |
|   React + Vite   | /api  |     Java 21)     |       |                   |
+------------------+       +------------------+       +-------------------+
```

- **MySQL 8.0 (`paintingservice_mysql`)**: Lưu trữ cơ sở dữ liệu với volume `mysql_data`, hỗ trợ bộ mã tiếng Việt `utf8mb4_unicode_ci`, có cơ chế healthcheck tự động kiểm tra trạng thái sẵn sàng.
- **Backend (`paintingservice_backend`)**: Ứng dụng Spring Boot 4 / Java 21 được build bằng multi-stage (Maven builder -> Eclipse Temurin JRE 21 Alpine), chạy dưới user bảo mật `appuser`, tự động đợi MySQL healthy mới khởi động.
- **Frontend (`paintingservice_frontend`)**: Ứng dụng React build bằng Vite, phục vụ bằng Nginx 1.25 Alpine, tích hợp reverse proxy cho `/api` sang backend container, nén gzip và hỗ trợ upload ảnh tối đa 50MB.

---

## 2. Chuẩn bị môi trường trên Windows (Nếu chưa có Docker)

Nếu máy tính của bạn chưa cài đặt Docker Desktop, hãy làm theo các bước sau:

### Bước 1: Bật WSL 2 (Windows Subsystem for Linux)
1. Nhấn chuột phải vào nút **Start**, chọn **Terminal (Admin)** hoặc **PowerShell (Administrator)**.
2. Chạy lệnh:
   ```powershell
   wsl --install
   ```
3. Sau khi cài xong, khởi động lại máy tính nếu được yêu cầu.

### Bước 2: Tải và cài đặt Docker Desktop
1. Truy cập trang chủ Docker: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Tải bản **Docker Desktop for Windows** và tiến hành cài đặt (chọn cấu hình mặc định dùng WSL 2 backend).
3. Mở ứng dụng **Docker Desktop** sau khi cài đặt và đợi biểu tượng trạng thái ở góc dưới chuyển sang màu xanh lá (**Docker Engine is running**).

---

## 3. Khởi chạy hệ thống

### Cách 1: Khởi chạy nhanh bằng file Batch (Khuyên dùng trên Windows)
- Bật hệ thống: Nhấp đúp chuột vào file **`docker-start.bat`**.
- Tắt hệ thống: Nhấp đúp chuột vào file **`docker-stop.bat`**.

### Cách 2: Khởi chạy bằng dòng lệnh
Mở Terminal / PowerShell tại thư mục gốc dự án (`d:\SpringBoot\paintingservice`):

1. **Khởi chạy và build các container:**
   ```bash
   docker compose up -d --build
   ```
   *(Tham số `-d` giúp chạy ngầm, `--build` đảm bảo Docker build lại code mới nhất).*

2. **Kiểm tra trạng thái các container:**
   ```bash
   docker compose ps
   ```

---

## 4. Địa chỉ truy cập và tài khoản

Sau khi các container khởi chạy thành công:

| Thành phần | Địa chỉ truy cập | Ghi chú |
| :--- | :--- | :--- |
| **Giao diện Web (Frontend)** | [http://localhost](http://localhost) | Cổng 80 tiêu chuẩn |
| **Backend REST API** | [http://localhost:8080/api](http://localhost:8080/api) | Cổng 8080 |
| **MySQL Database** | `localhost:3307` | Kết nối qua DBeaver / Navicat (cấu hình qua `MYSQL_PORT` trong `.env`) |

### Tài khoản quản trị viên mặc định:
- **Tên đăng nhập:** `admin`
- **Mật khẩu:** `123456`
- **Vai trò:** `ROLE_ADMIN` *(Hệ thống tự động khởi tạo khi backend chạy lần đầu)*

### Thông tin kết nối Database nội bộ:
- **Host:** `localhost` (từ máy ngoài) hoặc `mysql` (từ container backend)
- **Port:** `3307` (từ máy ngoài) hoặc `3306` (nội bộ container backend)
- **Database:** `paintingservice`
- **User:** `paintingservice_user`
- **Password:** `paintingservice_password`
- **Root Password:** `rootpassword`

---

## 5. Các lệnh quản lý thông dụng

```bash
# 1. Xem log tổng thể của toàn bộ hệ thống
docker compose logs -f

# 2. Xem log riêng của backend
docker compose logs -f backend

# 3. Xem log riêng của frontend (Nginx)
docker compose logs -f frontend

# 4. Xem log riêng của database MySQL
docker compose logs -f mysql

# 5. Khởi động lại một dịch vụ cụ thể (ví dụ khi sửa cấu hình)
docker compose restart backend

# 6. Dừng hệ thống nhưng GIỮ NGUYÊN dữ liệu database
docker compose down

# 7. Dừng hệ thống và XÓA TOÀN BỘ dữ liệu database để reset lại từ đầu
docker compose down -v
```

---

## 6. Cấu hình biến môi trường (`.env`)

Mọi thông số hệ thống có thể được tùy chỉnh trong file **`.env`** tại thư mục gốc:
- `CORS_ALLOWED_ORIGINS`: Danh sách domain/port được phép gọi API CORS.
- `JWT_SIGNER_KEY`: Khóa bí mật ký token JWT.
- `CLOUDINARY_*`: Thông tin xác thực Cloudinary để lưu ảnh.
- `VNPAY_*`: Cấu hình tích hợp cổng thanh toán trực tuyến VNPay.

---

## 7. Các tối ưu hóa đã được thực hiện

1. **Layer Caching**: Tách riêng bước tải dependencies (`pom.xml`, `package.json`) để Docker cache lại layer, giúp các lần build tiếp theo chỉ mất vài giây.
2. **Loại trừ file qua `.dockerignore`**: Không copy `target/`, `node_modules/`, `.git/` vào context giúp giảm kích thước build và tránh xung đột thư viện giữa Windows và Linux.
3. **Bảo mật**: Backend Spring Boot chạy dưới người dùng bị giới hạn `appuser` (non-root) bên trong container Alpine JRE.
4. **Hỗ trợ upload ảnh 50MB**: Đã cấu hình `client_max_body_size 50M;` trong Nginx để không bị lỗi HTTP 413 khi tải lên báo cáo tiến độ và nghiệm thu công trình.
5. **Nén Gzip & Caching Static**: Tối ưu tốc độ tải các file giao diện frontend.
