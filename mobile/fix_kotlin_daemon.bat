@echo off
echo ========================================
echo  Fix Kotlin Daemon Compilation Error
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Stopping Gradle daemons...
cd android
call gradlew.bat --stop
cd ..
echo Done!
echo.

echo [2/6] Cleaning Flutter build cache...
call flutter clean
echo Done!
echo.

echo [3/6] Removing Gradle cache directories...
if exist android\.gradle (
    rmdir /s /q android\.gradle
    echo Removed android\.gradle
)
if exist android\build (
    rmdir /s /q android\build
    echo Removed android\build
)
if exist android\app\build (
    rmdir /s /q android\app\build
    echo Removed android\app\build
)
if exist build (
    rmdir /s /q build
    echo Removed build directory
)
echo Done!
echo.

echo [4/6] Stopping Java processes (Kotlin daemon)...
taskkill /F /IM java.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo [5/6] Getting Flutter dependencies...
call flutter pub get
echo Done!
echo.

echo [6/6] Ready to rebuild!
echo.
echo ========================================
echo  Next steps:
echo  1. Close all running emulators
echo  2. Restart emulator
echo  3. Run: flutter run
echo ========================================
echo.
pause

