# 🏥 Hệ thống Quản lý Nguồn gốc Xuất xứ Thuốc bằng Blockchain

## 🎯 Tổng quan
Hệ thống quản lý chuỗi cung ứng thuốc sử dụng công nghệ blockchain để đảm bảo tính minh bạch, an toàn và chống giả mạo trong việc theo dõi nguồn gốc xuất xứ của các lô thuốc tại bệnh viện.

## 🚀 Khởi động hệ thống

### 1. Khởi động Backend
```bash
cd D:\DACN
npm start
```
- Backend chạy trên: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

### 2. Khởi động Frontend
```bash
cd D:\DACN\frontend
npm start
```
- Frontend chạy trên: http://localhost:3000

### 3. Đảm bảo MongoDB đang chạy
- MongoDB local: `mongod`
- Hoặc sử dụng MongoDB Atlas

## 🔐 Đăng nhập hệ thống

### Tài khoản Admin
- **URL**: http://localhost:3000
- **Username**: `admin`
- **Password**: `default123`

### Các tài khoản khác
- **Manufacturer**: `manufacturer` / `default123`
- **Distributor**: `distributor` / `default123`
- **Hospital**: `hospital` / `default123`
- **Inspector**: `inspector` / `default123`

## 📋 Tính năng chính

### 1. Quản lý Lô Thuốc
- ✅ **Tạo lô thuốc mới** với thông tin chi tiết
- ✅ **Ghi dữ liệu lên blockchain** tự động
- ✅ **Tạo QR Code** chứa blockchain ID
- ✅ **Xem thông tin blockchain** chi tiết
- ✅ **Thu hồi lô thuốc** trên blockchain
- ✅ **Theo dõi chuỗi cung ứng**

### 2. Xác minh Blockchain
- ✅ **Trang verify công khai**: `/verify/{blockchainId}`
- ✅ **Quét QR code** để xem thông tin
- ✅ **Chữ ký số** và hash dữ liệu
- ✅ **Lịch sử giao dịch** đầy đủ

### 3. Quản lý Người dùng
- ✅ **Phân quyền theo role** (Admin, Manufacturer, Distributor, Hospital, Inspector)
- ✅ **Quản lý tài khoản** (Admin only)
- ✅ **Xác thực JWT** bảo mật

## 🔗 Thông tin Blockchain

### Smart Contract
- **File**: `contracts/DrugTraceability.sol`
- **ABI**: `build/contracts/DrugTraceability.json`
- **Network**: Ethereum Sepolia (có thể cấu hình)

### Blockchain Data
Mỗi lô thuốc được ghi lên blockchain với:
- **Blockchain ID** duy nhất
- **Transaction Hash** và Block Number
- **Chữ ký số** để xác thực
- **Hash dữ liệu** đảm bảo tính toàn vẹn
- **Timestamp** và trạng thái xác nhận
- **Lịch sử giao dịch** (create, update, recall, distribute)

## 📱 Cách sử dụng

### 1. Tạo lô thuốc mới
1. Đăng nhập với tài khoản Admin/Manufacturer
2. Vào "Quản lý Thuốc"
3. Click "Tạo lô thuốc mới"
4. Điền thông tin chi tiết
5. Click "Tạo" → Hệ thống tự động ghi lên blockchain

### 2. Xem thông tin blockchain
1. Trong danh sách lô thuốc, click icon 🔗 (blockchain)
2. Xem modal với thông tin chi tiết:
   - Blockchain ID
   - Transaction Hash
   - Block Number
   - Chữ ký số
   - Lịch sử giao dịch

### 3. Xác minh QR Code
1. Click icon QR Code để xem QR
2. Quét QR code hoặc truy cập URL verify
3. Xem thông tin đầy đủ trên trang verify

### 4. Quản lý người dùng (Admin only)
1. Vào "Quản lý Người dùng"
2. Xem danh sách tài khoản
3. Tạo/sửa/xóa tài khoản

## 🌐 URLs quan trọng

- **Hệ thống chính**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
- **Verify Drug**: http://localhost:3000/verify/{blockchainId}
- **API Docs**: http://localhost:5000/api

## 🔧 Cấu hình

### Environment Variables (.env)
```
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/drug-traceability

# JWT
JWT_SECRET=drug_traceability_super_secret_jwt_key_2024
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Blockchain
ETHEREUM_NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_private_key

# Client
CLIENT_URL=http://localhost:3001
```

### Blockchain Network
- **Development**: Mock mode (hoạt động ngay)
- **Testnet**: Sepolia (cần cấu hình Infura)
- **Mainnet**: Ethereum (production)

## 📊 Dữ liệu Demo

Hệ thống có sẵn:
- **5 tài khoản** với các role khác nhau
- **2 lô thuốc** với blockchain data
- **Smart contract ABI** đầy đủ
- **Mock transactions** để test

## 🛠️ Troubleshooting

### Lỗi thường gặp

1. **Port 5000 đã được sử dụng**
   ```bash
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. **MongoDB connection error**
   - Đảm bảo MongoDB đang chạy
   - Kiểm tra MONGODB_URI trong .env

3. **Blockchain connection error**
   - Hệ thống tự động chuyển sang mock mode
   - Không ảnh hưởng đến chức năng chính

4. **Frontend không kết nối được backend**
   - Kiểm tra backend đang chạy trên port 5000
   - Kiểm tra CORS configuration

## 🎉 Tính năng nổi bật

- ✅ **Blockchain Integration** hoàn chỉnh
- ✅ **QR Code** với blockchain ID
- ✅ **Chữ ký số** và timestamp
- ✅ **Mock Mode** hoạt động ngay
- ✅ **Role-based Access Control**
- ✅ **Responsive UI** với Tailwind CSS
- ✅ **Real-time Verification**
- ✅ **Supply Chain Tracking**

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Logs trong terminal
2. Browser Developer Tools
3. Network requests
4. Database connection

**Hệ thống đã sẵn sàng sử dụng với đầy đủ tính năng blockchain!** 🚀
