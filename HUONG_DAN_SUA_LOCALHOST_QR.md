# HƯỚNG DẪN SỬA LỖI LOCALHOST TRONG QR CODE

## 🔍 Vấn đề

Khi quét QR code trên điện thoại:
- **URL hiển thị là `localhost`** → điện thoại không thể truy cập được
- **Màn hình đen không hiển thị gì** → frontend chỉ chạy trên localhost, không accessible từ network

## ✅ Giải pháp đã triển khai

Hệ thống đã được cập nhật để tự động detect IP address của máy tính và sử dụng trong QR code. Tuy nhiên, bạn cần cấu hình thêm để đảm bảo hoạt động tốt nhất.

## 🚨 QUAN TRỌNG: Chạy Frontend trên Network

**Trước khi làm các bước dưới**, bạn PHẢI chạy frontend trên network để điện thoại có thể truy cập:

### Chạy Frontend trên Network:

#### Windows (PowerShell):
```bash
cd frontend
npm run start:network
```

#### Mac/Linux:
```bash
cd frontend
npm run start:network:unix
```

Sau khi start, bạn sẽ thấy:
```
On Your Network:  http://192.168.1.100:3000
```

**Đảm bảo điện thoại có thể truy cập URL này trước khi test QR code!**

## 📝 Các bước cấu hình

### 1. Cấu hình Environment Variables

Mở file `.env` trong thư mục gốc và thêm/sửa các biến sau:

```env
# Client/Frontend URL (cho QR code)
# CÁCH 1: Sử dụng IP address của máy tính
# Ví dụ: http://192.168.1.100:3000
CLIENT_URL=http://192.168.1.100:3000

# Hoặc
FRONTEND_URL=http://192.168.1.100:3000
FRONTEND_PORT=3000
```

**Lưu ý**: Thay `192.168.1.100` bằng IP address thực tế của máy tính bạn.

### 2. Cách lấy IP Address của máy tính

#### Windows:
```bash
ipconfig
```
Tìm `IPv4 Address` trong phần `Wireless LAN adapter Wi-Fi` hoặc `Ethernet adapter`

#### Mac/Linux:
```bash
ifconfig
# hoặc
ip addr show
```
Tìm IP address (thường là dạng `192.168.x.x` hoặc `10.0.x.x`)

### 3. Đảm bảo máy tính và điện thoại cùng mạng

- ✅ Máy tính và điện thoại phải kết nối cùng một mạng WiFi
- ✅ Tắt firewall hoặc cho phép port 3000 và 5000 trong firewall

### 4. Khởi động lại server

Sau khi cập nhật `.env`, khởi động lại cả backend và frontend:

```bash
# Backend
npm run dev

# Frontend (terminal mới)
cd frontend
npm start
```

## 🔧 Cách hệ thống hoạt động

### Backend (`utils/getServerUrl.js`)

Hàm `getServerUrl()` sẽ tự động:
1. **Ưu tiên 1**: Sử dụng `CLIENT_URL` nếu có trong `.env`
2. **Ưu tiên 2**: Sử dụng `FRONTEND_URL` nếu có trong `.env`
3. **Ưu tiên 3**: Tự động detect IP address của máy tính
4. **Fallback**: Sử dụng `localhost` nếu không tìm thấy

### Frontend (`frontend/src/pages/Drugs.js`)

Frontend sẽ:
1. Gọi API `/api/drugs/server-url` để lấy server URL từ backend
2. Sử dụng URL này để tạo `verificationUrl` trong QR code
3. Fallback về `window.location.origin` nếu API lỗi

### Model (`models/Drug.js`)

Model `Drug.generateQRData()` sẽ:
1. Gọi `getServerUrl()` để lấy URL đúng
2. Tạo `verificationUrl` với URL này
3. Fallback về `CLIENT_URL` hoặc `localhost` nếu lỗi

## 📱 Test QR Code

1. **Tạo/Generate QR code mới** trong trang "Quản lý lô thuốc"
2. **Quét QR code bằng camera điện thoại**
3. **Kiểm tra URL** trong QR code:
   - ✅ Nên hiển thị: `http://192.168.x.x:3000/verify/...`
   - ❌ Không nên hiển thị: `http://localhost:3000/verify/...`

## ⚠️ Lưu ý quan trọng

### 1. IP Address thay đổi

- IP address có thể thay đổi mỗi khi kết nối lại WiFi
- Nếu IP thay đổi, bạn cần cập nhật lại `CLIENT_URL` trong `.env` hoặc generate lại QR code

### 2. Firewall

Đảm bảo firewall cho phép truy cập:
- Port 3000 (Frontend)
- Port 5000 (Backend)

### 3. Production

Khi deploy lên production, set `CLIENT_URL` là domain thực:
```env
CLIENT_URL=https://yourdomain.com
```

### 4. QR code cũ

QR code đã được generate trước khi cập nhật vẫn có URL cũ (localhost). Bạn cần:
- Generate lại QR code mới, hoặc
- QR code sẽ tự động cập nhật URL khi frontend load (nếu đã cập nhật code)

## 🔍 Debug

Nếu vẫn gặp vấn đề:

1. **Kiểm tra API server-url**:
   ```bash
   curl http://localhost:5000/api/drugs/server-url
   ```
   Response nên trả về:
   ```json
   {
     "success": true,
     "data": {
       "serverUrl": "http://192.168.x.x:3000",
       "frontendUrl": "http://192.168.x.x:3000"
     }
   }
   ```

2. **Kiểm tra console browser**:
   - Mở Developer Tools (F12)
   - Xem Network tab khi load trang Drugs
   - Kiểm tra request `/api/drugs/server-url`

3. **Kiểm tra QR code data**:
   - Mở QR modal trong trang Drugs
   - Inspect element để xem QR data
   - Kiểm tra `verificationUrl` có đúng IP không

## 📞 Hỗ trợ

Nếu vẫn không giải quyết được, vui lòng:
1. Kiểm tra IP address của máy tính
2. Kiểm tra máy tính và điện thoại có cùng mạng không
3. Kiểm tra firewall settings
4. Cung cấp log từ console và network tab

---

**Ngày cập nhật**: 2025-01-XX  
**Phiên bản**: 1.0

