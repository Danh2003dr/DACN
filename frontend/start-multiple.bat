@echo off
REM Batch script để chạy nhiều instance frontend trên các port khác nhau
REM Usage: start-multiple.bat 3000 3001 3002

if "%1"=="" (
    echo Usage: start-multiple.bat 3000 3001 3002
    echo Hoặc: start-multiple.bat (sẽ dùng port mặc định 3000, 3001, 3002)
    set PORT1=3000
    set PORT2=3001
    set PORT3=3002
) else (
    set PORT1=%1
    set PORT2=%2
    set PORT3=%3
)

echo 🚀 Đang khởi động nhiều instance frontend...
echo.

echo 📦 Khởi động instance trên port %PORT1%...
start "Frontend Port %PORT1%" cmd /k "set PORT=%PORT1% && npm start"

timeout /t 2 /nobreak >nul

if not "%PORT2%"=="" (
    echo 📦 Khởi động instance trên port %PORT2%...
    start "Frontend Port %PORT2%" cmd /k "set PORT=%PORT2% && npm start"
    timeout /t 2 /nobreak >nul
)

if not "%PORT3%"=="" (
    echo 📦 Khởi động instance trên port %PORT3%...
    start "Frontend Port %PORT3%" cmd /k "set PORT=%PORT3% && npm start"
    timeout /t 2 /nobreak >nul
)

echo.
echo ✅ Đã khởi động tất cả instance!
echo Mỗi instance sẽ mở trong một cửa sổ CMD riêng.

