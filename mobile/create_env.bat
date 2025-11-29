@echo off
echo Creating .env file for Android Emulator...
echo.

set API_URL=http://10.0.2.2:5000/api
echo API_BASE_URL=%API_URL%
echo ENV_TYPE=dev
echo APP_NAME=Drug Traceability System
echo APP_VERSION=1.0.0

(
echo # API Configuration
echo # For Android Emulator: use 10.0.2.2 instead of localhost
echo # For Physical Device: use your computer's IP address ^(e.g., 192.168.x.x^)
echo API_BASE_URL=%API_URL%
echo.
echo # Environment
echo ENV_TYPE=dev
echo.
echo # App Configuration
echo APP_NAME=Drug Traceability System
echo APP_VERSION=1.0.0
) > .env

echo.
echo ✅ File .env created successfully!
echo API URL: %API_URL%
echo.
echo Note: For physical device, edit .env and change API_BASE_URL to your computer's IP
echo Example: API_BASE_URL=http://192.168.100.195:5000/api
echo.
pause

