@echo off
echo ========================================
echo Generating Task Model Files
echo ========================================
echo.

cd /d %~dp0

echo Running build_runner...
flutter pub run build_runner build --delete-conflicting-outputs

echo.
echo ========================================
echo Done! Check for any errors above.
echo ========================================
pause

