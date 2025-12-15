@echo off
echo ====================================
echo Restarting server...
echo ====================================
echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo All Node.js processes stopped successfully.
) else (
    echo No Node.js processes found or already stopped.
)
echo.
timeout /t 2 /nobreak >nul
echo Starting server...
cd /d "%~dp0"
call npm start
pause
