# HƯỚNG DẪN SETUP HỆ THỐNG

## 🚨 **VẤN ĐỀ HIỆN TẠI:**
- Backend không kết nối được MongoDB
- Frontend không kết nối được backend
- Cần khởi động MongoDB hoặc sử dụng cloud

## 🔧 **GIẢI PHÁP NHANH:**

### **Cách 1: MongoDB Atlas (Khuyến nghị - Miễn phí)**

1. **Tạo tài khoản MongoDB Atlas:**
   - Truy cập: https://cloud.mongodb.com/
   - Đăng ký tài khoản miễn phí
   - Tạo cluster miễn phí (M0 Sandbox)

2. **Lấy connection string:**
   - Vào Database → Connect
   - Chọn "Connect your application"
   - Copy connection string

3. **Cập nhật file .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drug-traceability?retryWrites=true&w=majority
   ```

### **Cách 2: MongoDB Local**

1. **Cài đặt MongoDB:**
   ```bash
   # Windows với Chocolatey
   choco install mongodb
   
   # Hoặc tải từ: https://www.mongodb.com/try/download/community
   ```

2. **Khởi động MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # Hoặc chạy mongod.exe
   mongod --dbpath C:\data\db
   ```

3. **Tạo thư mục data:**
   ```bash
   mkdir C:\data\db
   ```

### **Cách 3: Docker (Nếu có Docker)**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🚀 **SAU KHI CÓ MONGODB:**

### **1. Tạo dữ liệu demo:**
```bash
node scripts/setup-demo-data.js
```

### **2. Khởi động backend:**
```bash
npm start
```

### **3. Khởi động frontend:**
```bash
cd frontend
npm start
```

## 📱 **TÀI KHOẢN DEMO:**

| Vai trò | Username | Password | Quyền hạn |
|---------|----------|----------|-----------|
| **Admin** | admin | default123 | Quản lý toàn hệ thống |
| **Manufacturer** | manufacturer1 | default123 | Quản lý lô thuốc |
| **Distributor** | distributor1 | default123 | Vận chuyển thuốc |
| **Hospital** | hospital1 | default123 | Quản lý kho thuốc |
| **Patient** | patient1 | default123 | Tra cứu thuốc |

## 🔗 **TRUY CẬP HỆ THỐNG:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## ⚠️ **LƯU Ý:**
- Lần đầu đăng nhập sẽ yêu cầu đổi mật khẩu
- Đảm bảo cả backend và frontend đều chạy
- Kiểm tra kết nối MongoDB trước khi chạy backend

## 🆘 **NẾU VẪN LỖI:**
1. Kiểm tra MongoDB đã chạy chưa
2. Kiểm tra port 5000 và 3000 có bị chiếm không
3. Kiểm tra firewall và antivirus
4. Thử restart máy tính

