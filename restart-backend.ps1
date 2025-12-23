# Script PowerShell để restart backend server
Write-Host "🔄 Đang kiểm tra và restart backend server..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra xem có process nào đang listen trên port 5000 không (backend thường chạy ở đây)
$backendProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess

if ($backendProcess) {
    Write-Host "✅ Tìm thấy backend server đang chạy (PID: $backendProcess)" -ForegroundColor Green
    Write-Host "⚠️  Đang dừng process..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Đã dừng backend server" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Không tìm thấy backend server trên port 5000" -ForegroundColor Yellow
    Write-Host "   (Có thể server đang chạy trên port khác hoặc đã dừng)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Bước tiếp theo:" -ForegroundColor Cyan
Write-Host "   1. Mở terminal mới" -ForegroundColor White
Write-Host "   2. Chạy: npm start" -ForegroundColor White
Write-Host "   3. Hoặc: node server.js" -ForegroundColor White
Write-Host ""
Write-Host "💡 Hoặc nếu bạn biết terminal nào đang chạy backend:" -ForegroundColor Cyan
Write-Host "   1. Nhấn Ctrl + C trong terminal đó" -ForegroundColor White
Write-Host "   2. Chạy lại: npm start" -ForegroundColor White
Write-Host ""

