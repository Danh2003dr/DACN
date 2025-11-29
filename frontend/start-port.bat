@echo off
REM Batch script để chạy frontend trên port cụ thể
REM Usage: start-port.bat 3000
REM Hoặc: start-port.bat 3001

if "%1"=="" (
    set PORT=3000
) else (
    set PORT=%1
)

echo 🚀 Đang khởi động frontend trên port %PORT%...
set PORT=%PORT%
call npm start

