@echo off
chcp 65001 > nul
echo ===================================================
echo   DỪNG HỆ THỐNG PAINTING SERVICE DOCKER
echo ===================================================
echo.

docker compose down

echo.
echo Đã dừng tất cả các container của hệ thống.
echo.
pause
