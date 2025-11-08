# HƯỚNG DẪN CHẠY FRONTEND ĐỂ TRUY CẬP TỪ ĐIỆN THOẠI

## 🔍 Vấn đề

Khi quét QR code trên điện thoại, màn hình đen không hiển thị gì vì:
- Frontend mặc định chỉ chạy trên `localhost` (127.0.0.1)
- Điện thoại không thể truy cập `localhost` của máy tính
- Cần chạy frontend trên network interface (0.0.0.0) để accessible từ điện thoại

## ✅ Giải pháp

### Cách 1: Sử dụng file .env (Khuyến nghị - Đã tạo sẵn)

**File `frontend/.env` đã được tạo** với `HOST=0.0.0.0`. Chỉ cần:

```bash
cd frontend
npm start
```

Frontend sẽ tự động chạy trên network và hiển thị URL để truy cập từ điện thoại.

### Cách 2: Tạo file .env trong thư mục frontend

1. Tạo file `frontend/.env`:
```env
HOST=0.0.0.0
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
REACT_APP_API_URL=http://YOUR_IP_ADDRESS:5000/api
```

**Lưu ý**: Thay `YOUR_IP_ADDRESS` bằng IP address của máy tính (ví dụ: `192.168.1.100` hoặc `172.16.0.2`)

2. Chạy frontend bình thường:
```bash
cd frontend
npm start
```

### Cách 3: Set environment variables trực tiếp

#### Windows (PowerShell):
```powershell
cd frontend
$env:HOST="0.0.0.0"
$env:DANGEROUSLY_DISABLE_HOST_CHECK="true"
npm start
```

#### Windows (CMD):
```cmd
cd frontend
set HOST=0.0.0.0
set DANGEROUSLY_DISABLE_HOST_CHECK=true
npm start
```

#### Mac/Linux:
```bash
cd frontend
HOST=0.0.0.0 DANGEROUSLY_DISABLE_HOST_CHECK=true npm start
```

## 📱 Kiểm tra kết nối

### 1. Lấy IP address của máy tính

#### Windows:
```bash
ipconfig
```
Tìm `IPv4 Address` (ví dụ: `192.168.1.100` hoặc `172.16.0.2`)

#### Mac/Linux:
```bash
ifconfig
# hoặc
ip addr show
```

### 2. Đảm bảo máy tính và điện thoại cùng mạng

- ✅ Máy tính và điện thoại phải kết nối cùng một mạng WiFi
- ✅ Tắt firewall hoặc cho phép port 3000 và 5000 trong firewall

### 3. Test từ điện thoại

Sau khi start frontend với `HOST=0.0.0.0`, bạn sẽ thấy thông báo:
```
Compiled successfully!

You can now view drug-traceability-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000
```

**Truy cập từ điện thoại**:
- Mở trình duyệt trên điện thoại
- Vào địa chỉ: `http://192.168.1.100:3000` (thay bằng IP của bạn)
- Kiểm tra xem có hiển thị trang login không

## 🔧 Cấu hình API URL

### Tự động (Đã cập nhật)

Frontend đã được cập nhật để tự động detect API URL:
- Nếu truy cập từ IP (không phải localhost), sẽ tự động dùng IP đó cho API
- Ví dụ: Nếu truy cập `http://192.168.1.100:3000`, API sẽ là `http://192.168.1.100:5000/api`

### Cấu hình thủ công

Nếu muốn cấu hình thủ công, tạo file `frontend/.env`:
```env
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

**Lưu ý**: Thay `192.168.1.100` bằng IP address thực tế của máy tính

## 🚀 Quy trình hoàn chỉnh

### 1. Backend

```bash
# Terminal 1
npm start
# Hoặc
npm run dev
```

Backend sẽ chạy trên `http://localhost:5000` hoặc `http://0.0.0.0:5000`

### 2. Frontend

```bash
# Terminal 2
cd frontend
npm run start:network  # Windows
# hoặc
npm run start:network:unix  # Mac/Linux
```

Frontend sẽ chạy trên:
- Local: `http://localhost:3000`
- Network: `http://YOUR_IP:3000`

### 3. Test QR Code

1. **Tạo/generate QR code mới** trong trang "Quản lý lô thuốc"
2. **Quét QR code bằng camera điện thoại**
3. **Kiểm tra URL** trong QR code:
   - ✅ Nên hiển thị: `http://192.168.x.x:3000/verify/...`
   - ❌ Không nên hiển thị: `http://localhost:3000/verify/...`

### 4. Kiểm tra kết nối

- ✅ Frontend có thể truy cập từ điện thoại
- ✅ Backend có thể truy cập từ điện thoại (qua frontend)
- ✅ QR code mở đúng URL và hiển thị thông tin

## ⚠️ Lưu ý quan trọng

### 1. Firewall

Đảm bảo firewall cho phép truy cập:
- **Port 3000** (Frontend)
- **Port 5000** (Backend)

**Windows Firewall**:
```powershell
# Cho phép port 3000
netsh advfirewall firewall add rule name="React App" dir=in action=allow protocol=TCP localport=3000

# Cho phép port 5000
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=5000
```

### 2. IP Address thay đổi

- IP address có thể thay đổi mỗi khi kết nối lại WiFi
- Nếu IP thay đổi, bạn cần:
  - Cập nhật `REACT_APP_API_URL` trong `.env`
  - Hoặc generate lại QR code mới

### 3. Backend cũng cần accessible từ network

Đảm bảo backend cũng chạy trên `0.0.0.0`:

**File `server.js`** hoặc cấu hình:
```javascript
app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
```

### 4. HTTPS trong Production

Khi deploy lên production:
- Sử dụng HTTPS
- Cấu hình domain thật
- Set `CLIENT_URL=https://yourdomain.com` trong `.env`

## 🔍 Debug

### Nếu vẫn không truy cập được từ điện thoại:

1. **Kiểm tra IP address**:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Kiểm tra frontend có chạy trên network không**:
   - Xem console khi start frontend
   - Phải có dòng: `On Your Network:  http://X.X.X.X:3000`

3. **Kiểm tra firewall**:
   - Tắt firewall tạm thời để test
   - Hoặc thêm exception cho port 3000 và 5000

4. **Kiểm tra cùng mạng**:
   - Máy tính và điện thoại phải cùng WiFi
   - Thử ping từ điện thoại đến IP của máy tính

5. **Kiểm tra backend có accessible không**:
   - Từ điện thoại, truy cập: `http://YOUR_IP:5000/api/drugs/server-url`
   - Phải trả về JSON response

## 📞 Troubleshooting

### Lỗi: "Cannot GET /"
- ✅ Kiểm tra frontend đã start chưa
- ✅ Kiểm tra đúng URL và port

### Lỗi: "Network Error" hoặc "Failed to fetch"
- ✅ Kiểm tra backend đã start chưa
- ✅ Kiểm tra `REACT_APP_API_URL` trong `.env`
- ✅ Kiểm tra firewall

### Lỗi: "This site can't be reached"
- ✅ Kiểm tra máy tính và điện thoại cùng mạng
- ✅ Kiểm tra IP address có đúng không
- ✅ Kiểm tra firewall

---

**Ngày cập nhật**: 2025-01-XX  
**Phiên bản**: 1.0

