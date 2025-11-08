# HƯỚNG DẪN NHANH - QUÉT QR TỪ ĐIỆN THOẠI

## ⚡ Giải pháp nhanh (3 bước)

### Bước 1: Lấy IP address của máy tính

#### Windows:
```bash
ipconfig
```
Tìm `IPv4 Address` (ví dụ: `192.168.1.100` hoặc `172.16.0.2`)

#### Mac/Linux:
```bash
ifconfig | grep "inet "
```

### Bước 2: Chạy Frontend

**File `frontend/.env` đã được tạo** với `HOST=0.0.0.0`. Chỉ cần:

```bash
cd frontend
npm start
```

Sau khi start, bạn sẽ thấy:
```
Compiled successfully!

You can now view drug-traceability-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000  👈 Dùng URL này để truy cập từ điện thoại
```

**Lưu ý**: 
- File `frontend/.env` đã có `HOST=0.0.0.0` → frontend sẽ accessible từ network
- Frontend sẽ tự động detect API URL dựa trên hostname hiện tại

### Bước 3: Cấu hình Backend (nếu cần)

Backend đã được cấu hình để bind trên `0.0.0.0` (accessible từ network). Chỉ cần:

```bash
npm start
```

## 📱 Test từ điện thoại

1. **Đảm bảo máy tính và điện thoại cùng WiFi**
2. **Mở trình duyệt trên điện thoại**
3. **Truy cập**: `http://YOUR_IP:3000` (thay YOUR_IP bằng IP từ bước 1)
4. **Kiểm tra**: Phải hiển thị trang login

## 🔧 Nếu vẫn không được

### 1. Kiểm tra Firewall

**Windows**:
```powershell
# Cho phép port 3000
netsh advfirewall firewall add rule name="React App" dir=in action=allow protocol=TCP localport=3000

# Cho phép port 5000
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=5000
```

### 2. Tạo file `.env` trong `frontend/`

Tạo file `frontend/.env`:
```env
HOST=0.0.0.0
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

Sau đó chạy:
```bash
cd frontend
npm start
```

### 3. Cập nhật API URL (tự động)

Frontend đã được cập nhật để tự động detect API URL. Nếu vẫn cần cấu hình thủ công:

Tạo file `frontend/.env`:
```env
REACT_APP_API_URL=http://YOUR_IP:5000/api
```

Thay `YOUR_IP` bằng IP của máy tính.

## ✅ Sau khi setup xong

1. **Generate QR code mới** trong trang "Quản lý lô thuốc"
2. **Quét QR code** từ điện thoại
3. **Kiểm tra URL** trong QR code phải là: `http://YOUR_IP:3000/verify/...` (KHÔNG phải localhost)

## 🎯 Tóm tắt

| Bước | Mô tả | Lệnh |
|------|-------|------|
| 1 | Lấy IP máy tính | `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux) |
| 2 | Chạy Frontend | `cd frontend && npm start` (file .env đã có HOST=0.0.0.0) |
| 3 | Chạy Backend | `npm start` (đã bind trên 0.0.0.0) |
| 4 | Test từ điện thoại | Truy cập `http://YOUR_IP:3000` |

---

**Lưu ý**: Mỗi lần IP thay đổi (khi kết nối lại WiFi), bạn cần generate lại QR code mới!

