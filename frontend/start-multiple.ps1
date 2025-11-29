# PowerShell script để chạy nhiều instance frontend trên các port khác nhau
# Usage: .\start-multiple.ps1 3000,3001,3002

param(
    [Parameter(Mandatory=$false)]
    [string]$Ports = "3000,3001,3002"
)

$portArray = $Ports -split ','

Write-Host "🚀 Đang khởi động $($portArray.Length) instance frontend..." -ForegroundColor Green
Write-Host "Ports: $Ports" -ForegroundColor Cyan
Write-Host ""

foreach ($port in $portArray) {
    $port = $port.Trim()
    Write-Host "📦 Khởi động instance trên port $port..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; `$env:PORT=$port; npm start" -WindowStyle Normal
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ Đã khởi động tất cả instance!" -ForegroundColor Green
Write-Host "Mỗi instance sẽ mở trong một cửa sổ PowerShell riêng." -ForegroundColor Cyan

