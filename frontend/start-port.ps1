# PowerShell script để chạy frontend trên port cụ thể
# Usage: .\start-port.ps1 3000
# Hoặc: .\start-port.ps1 3001

param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 3000
)

Write-Host "🚀 Đang khởi động frontend trên port $Port..." -ForegroundColor Green

$env:PORT = $Port
npm start

