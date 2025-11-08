# HƯỚNG DẪN CẤU HÌNH IP CHO QR CODE

## 📋 Xác định IP address đúng

Sau khi chạy `ipconfig`, bạn sẽ thấy nhiều IP addresses. Cần chọn **IP đúng** để truy cập từ điện thoại:

### ✅ IP đúng (sử dụng)
- **WiFi adapter**: `192.168.100.195` (IPv4 Address từ "Wireless LAN adapter WiFi")
- Đây là IP trên local network, có thể truy cập từ điện thoại cùng WiFi

### ❌ IP sai (KHÔNG sử dụng)
- **CloudflareWARP/VPN**: `172.16.0.2` 
- Đây là IP từ VPN, không phải IP thực của máy trên local network
- Điện thoại không thể truy cập được

## 🔧 Cấu hình IP trong .env

### Bước 1: Cập nhật file `.env` ở root

Mở file `.env` và thêm/sửa dòng:

```env
CLIENT_URL=http://192.168.100.195:3000
FRONTEND_URL=http://192.168.100.195:3000
```

**Hoặc sử dụng PowerShell:**

```powershell
# Đọc file .env hiện tại
$envContent = Get-Content .env

# Cập nhật CLIENT_URL
$envContent = $envContent -replace 'CLIENT_URL=.*', 'CLIENT_URL=http://192.168.100.195:3000'

# Thêm nếu chưa có
if ($envContent -notmatch 'CLIENT_URL') {
    $envContent += "CLIENT_URL=http://192.168.100.195:3000"
}

# Lưu lại
$envContent | Set-Content .env
```

### Bước 2: Khởi động lại Backend

```bash
npm start
```

Backend sẽ đọc `CLIENT_URL` từ `.env` và sử dụng để tạo QR code.

## 🧪 Test

### 1. Test truy cập Frontend từ điện thoại

1. **Chạy Frontend:**
   ```bash
   cd frontend
   npm start
   ```

2. **Từ điện thoại (cùng WiFi):**
   - Mở trình duyệt
   - Truy cập: `http://192.168.100.195:3000`
   - Phải hiển thị trang login

### 2. Test QR Code

1. **Generate QR code mới** trong trang "Quản lý lô thuốc"
2. **Kiểm tra URL trong QR code:**
   - Mở QR code bằng camera điện thoại
   - URL phải là: `http://192.168.100.195:3000/verify/...`
   - **KHÔNG được là** `localhost` hoặc `172.16.0.2`

3. **Quét QR code:**
   - Phải hiển thị thông tin thuốc
   - Không được màn hình đen

## 🔄 Khi IP thay đổi

Khi bạn:
- Kết nối lại WiFi khác
- Router đổi IP address
- Thay đổi mạng

**Cần làm:**
1. Chạy `ipconfig` để lấy IP mới
2. Cập nhật `CLIENT_URL` trong `.env`
3. Khởi động lại Backend
4. **Generate lại QR code mới** (QR code cũ vẫn dùng IP cũ)

## 🛠️ Tự động detect IP (Backup)

Nếu không set `CLIENT_URL`, hệ thống sẽ tự động detect IP:
- Ưu tiên: WiFi adapter
- Tránh: VPN adapters (CloudflareWARP, TAP, etc.)
- Ưu tiên IP trong dải `192.168.x.x` hoặc `10.x.x.x`

Nhưng **khuyến nghị**: Set `CLIENT_URL` thủ công để đảm bảo chính xác.

---

**IP hiện tại của bạn**: `192.168.100.195`

