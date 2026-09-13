@echo off
chcp 65001 > nul
echo ===================================================
echo   KHỞI CHẠY HỆ THỐNG PAINTING SERVICE QUA DOCKER
echo ===================================================
echo.

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Docker Desktop chưa được bật hoặc chưa cài đặt!
    echo Vui lòng cài đặt và mở Docker Desktop trước khi chạy file này.
    echo Hướng dẫn cài đặt xem tại: README_DOCKER.md
    echo.
    pause
    exit /b 1
)

echo [1/3] Đang kiểm tra cấu hình .env...
if not exist ".env" (
    echo Đang tạo file .env từ .env.example...
    copy ".env.example" ".env"
)

echo [2/3] Đang tiến hành build và khởi động các container...
docker compose up -d --build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   TRIỂN KHAI THÀNH CÔNG!
    echo ===================================================
    echo - Giao diện người dùng (Frontend): http://localhost
    echo - Backend API:                      http://localhost:8080/api
    echo - Cơ sở dữ liệu MySQL:              localhost:3307
    echo.
    echo Tài khoản quản trị viên mặc định:
    echo - Username: admin
    echo - Password: 123456
    echo.
    echo Lệnh xem log:
    echo   docker compose logs -f
    echo ===================================================
) else (
    echo.
    echo [LỖI] Quá trình khởi chạy Docker Compose thất bại! Vui lòng kiểm tra lại log.
)

echo.
pause
