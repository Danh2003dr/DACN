# 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

## 📋 Mục lục
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt MongoDB](#cài-đặt-mongodb)
3. [Cài đặt Dependencies](#cài-đặt-dependencies)
4. [Cấu hình Environment](#cấu-hình-environment)
5. [Import dữ liệu demo](#import-dữ-liệu-demo)
6. [Chạy Backend](#chạy-backend)
7. [Chạy Frontend](#chạy-frontend)
8. [Truy cập hệ thống](#truy-cập-hệ-thống)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu cầu hệ thống

- **Node.js**: >= 16.0.0
- **MongoDB**: >= 4.4 (hoặc MongoDB Atlas)
- **npm**: >= 8.0.0
- **Git**: (tùy chọn)

### Kiểm tra phiên bản:
```bash
node --version
npm --version
mongod --version
```

---

## 🗄️ Cài đặt MongoDB

### **Cách 1: MongoDB Atlas (Khuyến nghị - Miễn phí)**

1. **Tạo tài khoản MongoDB Atlas:**
   - Truy cập: https://cloud.mongodb.com/
   - Đăng ký tài khoản miễn phí
   - Tạo cluster miễn phí (M0 Sandbox)

2. **Lấy connection string:**
   - Vào Database → Connect
   - Chọn "Connect your application"
   - Copy connection string
   - Ví dụ: `mongodb+srv://username:password@cluster.mongodb.net/drug-traceability?retryWrites=true&w=majority`

3. **Cập nhật file .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drug-traceability?retryWrites=true&w=majority
   ```

### **Cách 2: MongoDB Local (Windows)**

1. **Cài đặt MongoDB:**
   ```bash
   # Với Chocolatey
   choco install mongodb
   
   # Hoặc tải từ: https://www.mongodb.com/try/download/community
   ```

2. **Tạo thư mục data:**
   ```bash
   mkdir C:\data\db
   ```

3. **Khởi động MongoDB:**
   ```bash
   # Cách 1: Dùng Windows Service
   net start MongoDB
   
   # Cách 2: Chạy trực tiếp
   mongod --dbpath C:\data\db
   ```

4. **Kiểm tra MongoDB đã chạy:**
   ```bash
   # Mở terminal mới
   mongosh mongodb://127.0.0.1:27017
   ```

### **Cách 3: Docker (Nếu có Docker)**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## 📦 Cài đặt Dependencies

### 1. Cài đặt Backend dependencies:
```bash
# Di chuyển vào thư mục dự án
cd C:\Users\thanh\DACN

# Cài đặt packages
npm install
```

### 2. Cài đặt Frontend dependencies:
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt packages
npm install

# Quay lại thư mục gốc
cd ..
```

---

## ⚙️ Cấu hình Environment

### 1. Tạo file .env:
```bash
# Copy từ file mẫu
copy env.example .env
```

### 2. Chỉnh sửa file .env:

Mở file `.env` và cập nhật các thông tin sau:

```env
# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/drug-traceability
# Hoặc nếu dùng Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drug-traceability?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
FRONTEND_PORT=3000

# Blockchain Configuration (Tùy chọn - có thể để mặc định)
ETHEREUM_NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_private_key_for_blockchain_transactions
CONTRACT_ADDRESS=0x...

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

**Lưu ý quan trọng:**
- Thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên bảo mật
- Thay đổi `ENCRYPTION_KEY` thành chuỗi 32 ký tự
- Nếu dùng MongoDB Atlas, cập nhật `MONGODB_URI`

---

## 📊 Import dữ liệu demo

Sau khi MongoDB đã chạy, import dữ liệu demo vào database:

```bash
# Chạy script setup dữ liệu demo
node scripts/setup-demo-data.js
```

**Hoặc các script khác:**
```bash
# Script đơn giản
node scripts/simple-setup.js

# Script với supply chain đầy đủ
node scripts/setup-complete-supply-chain.js

# Script với drugs đã verify
node scripts/setup-verified-drugs.js
```

**Kết quả:**
- ✅ Đã tạo 5 tài khoản demo (Admin, Manufacturer, Distributor, Hospital, Patient)
- ✅ Đã tạo dữ liệu thuốc mẫu
- ✅ Tất cả tài khoản có mật khẩu: `default123`

---

## 🔧 Chạy Backend

### Cách 1: Chạy Production mode
```bash
npm start
```

### Cách 2: Chạy Development mode (tự động restart khi có thay đổi)
```bash
npm run dev
```

**Kết quả mong đợi:**
```
MongoDB Connected: 127.0.0.1
Server is running on 0.0.0.0:5000
Environment: development
Local: http://localhost:5000
Network: http://192.168.x.x:5000
Health check: http://localhost:5000/api/health
API docs: http://localhost:5000/api
```

**Kiểm tra Backend:**
- Mở trình duyệt: http://localhost:5000/api/health
- Nếu thấy `{"success":true,"message":"Server is running"}` → Backend đã chạy thành công!

---

## 🎨 Chạy Frontend

Mở terminal mới và chạy:

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Chạy frontend
npm start
```

**Kết quả mong đợi:**
```
Compiled successfully!

You can now view drug-traceability in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Lưu ý:**
- Frontend sẽ tự động mở trình duyệt tại http://localhost:3000
- Nếu không tự mở, bạn có thể mở thủ công

---

## 🌐 Truy cập hệ thống

### URLs quan trọng:

| Mục đích | URL |
|----------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5000/api |
| **API Docs** | http://localhost:5000/api |
| **Health Check** | http://localhost:5000/api/health |
| **Verify Drug** | http://localhost:3000/verify/{blockchainId} |

### Tài khoản đăng nhập:

| Vai trò | Username | Password | Quyền hạn |
|---------|----------|----------|-----------|
| **Admin** | `admin` | `default123` | Quản lý toàn hệ thống |
| **Manufacturer** | `manufacturer1` | `default123` | Quản lý lô thuốc |
| **Distributor** | `distributor1` | `default123` | Vận chuyển thuốc |
| **Hospital** | `hospital1` | `default123` | Quản lý kho thuốc |
| **Patient** | `patient1` | `default123` | Tra cứu thuốc |

**⚠️ Lưu ý:** Lần đầu đăng nhập sẽ yêu cầu đổi mật khẩu!

---

## 🔍 Kiểm tra hệ thống

### 1. Kiểm tra Backend:
```bash
# Health check
curl http://localhost:5000/api/health

# Hoặc mở trình duyệt
# http://localhost:5000/api/health
```

### 2. Kiểm tra MongoDB:
```bash
# Kết nối MongoDB shell
mongosh mongodb://127.0.0.1:27017/drug-traceability

# Xem collections
show collections

# Đếm số users
db.users.countDocuments()

# Đếm số drugs
db.drugs.countDocuments()
```

### 3. Kiểm tra Frontend:
- Mở http://localhost:3000
- Thử đăng nhập với tài khoản `admin` / `default123`

---

## 🛠️ Troubleshooting

### ❌ Lỗi: MongoDB connection error

**Nguyên nhân:** MongoDB chưa chạy hoặc connection string sai

**Giải pháp:**
```bash
# Kiểm tra MongoDB có chạy không
netstat -ano | findstr :27017

# Nếu không có, khởi động MongoDB
net start MongoDB

# Hoặc kiểm tra MONGODB_URI trong file .env
```

### ❌ Lỗi: Port 5000 đã được sử dụng

**Giải pháp:**
```bash
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay <PID> bằng số PID tìm được)
taskkill /PID <PID> /F

# Hoặc đổi port trong file .env
PORT=5001
```

### ❌ Lỗi: Port 3000 đã được sử dụng

**Giải pháp:**
```bash
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# Hoặc đổi port trong frontend/package.json
# Thêm vào scripts: "start": "set PORT=3001 && react-scripts start"
```

### ❌ Lỗi: Cannot find module

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
rm package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

### ❌ Lỗi: Frontend không kết nối được Backend

**Giải pháp:**
1. Kiểm tra Backend đang chạy: http://localhost:5000/api/health
2. Kiểm tra CORS trong `server.js`
3. Kiểm tra `FRONTEND_URL` trong file `.env`
4. Xem console trong trình duyệt (F12) để xem lỗi chi tiết

### ❌ Lỗi: JWT_SECRET không được set

**Giải pháp:**
```bash
# Đảm bảo file .env tồn tại và có JWT_SECRET
# Tạo JWT_SECRET ngẫu nhiên:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy kết quả vào JWT_SECRET trong .env
```

---

## 📝 Scripts hữu ích

### Backend scripts:
```bash
# Chạy server
npm start              # Production
npm run dev            # Development (với nodemon)

# Setup dữ liệu
node scripts/setup-demo-data.js
node scripts/simple-setup.js
```

### Frontend scripts:
```bash
cd frontend
npm start              # Chạy development server
npm run build          # Build production
```

---

## 🎯 Quy trình chạy dự án (Tóm tắt)

1. ✅ **Khởi động MongoDB** (Atlas hoặc Local)
2. ✅ **Cài đặt dependencies**: `npm install` (backend) và `cd frontend && npm install` (frontend)
3. ✅ **Tạo file .env** từ `env.example` và cấu hình
4. ✅ **Import dữ liệu demo**: `node scripts/setup-demo-data.js`
5. ✅ **Chạy Backend**: `npm start` hoặc `npm run dev`
6. ✅ **Chạy Frontend**: `cd frontend && npm start`
7. ✅ **Truy cập**: http://localhost:3000

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Kiểm tra Browser Developer Tools (F12)
3. Kiểm tra Network requests
4. Xem file `README_SETUP.md` và `HUONG_DAN_SU_DUNG.md`

**Chúc bạn chạy dự án thành công! 🎉**


