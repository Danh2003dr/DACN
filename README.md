# HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC TẠI BỆNH VIỆN BẰNG BLOCKCHAIN

## Tổng quan
Hệ thống được phát triển để giải quyết vấn đề nghiêm trọng về thuốc giả và thuốc kém chất lượng tại Việt Nam thông qua công nghệ blockchain.

## 📚 Tài Liệu

### 🚀 Cài Đặt & Setup
- ⚡ **[SETUP_QUICK.md](./SETUP_QUICK.md)** - Setup nhanh trong 5 phút
- 📦 **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - Hướng dẫn cài đặt hoàn chỉnh (bao gồm Firebase)
- 🔥 **[FIREBASE_COMPLETE_SETUP.md](./FIREBASE_COMPLETE_SETUP.md)** - Setup Firebase Authentication chi tiết
- 📋 **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Mục lục tất cả tài liệu

### 📖 Tài Liệu Khác
- 📋 **[TONG_HOP_DU_AN_DA_LAM.md](./TONG_HOP_DU_AN_DA_LAM.md)** - Tổng hợp tất cả các phần đã làm của dự án ⭐ NEW
- 📘 **Hướng dẫn sử dụng chi tiết giao diện hệ thống**: xem file `HUONG_DAN_SU_DUNG.md`
- ⚙️ **Hướng dẫn nhanh triển khai & deploy smart contract**: xem file `QUICK_START_BLOCKCHAIN.md`
- 🧠 **Mô tả kiến trúc & nghiệp vụ hệ thống**: xem file `MO_TA_HE_THONG.md`
- 📥 **[IMPORT_GUIDE.md](./IMPORT_GUIDE.md)** - Hướng dẫn import dữ liệu từ PDF/CSV/Excel
- 💳 **[MOMO_PAYMENT_SETUP.md](./MOMO_PAYMENT_SETUP.md)** - Hướng dẫn cấu hình thanh toán MoMo ⭐ NEW
- ⚡ **[MOMO_QUICK_START.md](./MOMO_QUICK_START.md)** - Hướng dẫn nhanh cấu hình MoMo (5 phút) ⭐ NEW

## Tính năng chính

### Core Features
- ✅ **Quản lý tài khoản người dùng** với phân quyền rõ ràng (Admin, Manufacturer, Distributor, Hospital, Patient)
- ✅ **Xác thực và bảo mật** với JWT và bcrypt
- ✅ **Firebase Authentication** - Đăng nhập Google ⭐ NEW
- ✅ **API RESTful** đầy đủ cho tất cả modules
- ✅ **Quản lý lô thuốc** với blockchain integration
- ✅ **Theo dõi chuỗi cung ứng** real-time
- ✅ **Chữ ký số** theo chuẩn Việt Nam (VNCA) với Timestamp Authority
- ✅ **Hệ thống điểm tín nhiệm** (Trust Score) cho nhà cung ứng
- ✅ **Đánh giá và xếp hạng** (Reviews & Ratings)
- ✅ **Quản lý nhiệm vụ** (Tasks Management)
- ✅ **Thông báo** (Notifications)
- ✅ **Báo cáo và phân tích** (Reports & Analytics)
- ✅ **Quét mã QR** để tra cứu nguồn gốc thuốc
- ✅ **Frontend React** với UI/UX hiện đại, responsive
- ✅ **Blockchain Integration** với Smart Contracts

## Cấu trúc dự án
```
DACN/
├── models/
│   └── User.js                 # User model với phân quyền
├── controllers/
│   ├── authController.js       # Xử lý authentication
│   └── userController.js       # Xử lý user management
├── middleware/
│   └── auth.js                 # Authentication & authorization
├── routes/
│   ├── auth.js                 # Auth routes
│   └── users.js                # User management routes
├── utils/
│   └── validation.js           # Input validation
├── server.js                   # Main server file
├── package.json                # Dependencies
└── env.example                 # Environment variables template
```

## Cài đặt và chạy

### ⚡ Quick Start (5 phút)

Xem file **[SETUP_QUICK.md](./SETUP_QUICK.md)** để setup nhanh.

### 📦 Cài Đặt Chi Tiết

Xem file **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** để có hướng dẫn cài đặt hoàn chỉnh, bao gồm:
- Cài đặt dependencies
- Cấu hình MongoDB
- **Cấu hình Firebase Authentication (Google Login)**
- Cấu hình environment variables
- Test và troubleshooting

### Tóm Tắt Nhanh

```bash
# 1. Cài đặt
npm install
cd frontend && npm install && cd ..

# 2. Cấu hình
cp env.example .env
# Chỉnh sửa .env với thông tin của bạn

# 3. Setup Firebase (xem INSTALLATION_GUIDE.md)

# 4. Start MongoDB
# Windows: net start MongoDB
# Mac/Linux: sudo systemctl start mongod

# 5. Chạy
npm run dev          # Terminal 1: Backend
cd frontend && npm start  # Terminal 2: Frontend
```

Server sẽ chạy tại: `http://localhost:5000`  
Frontend sẽ chạy tại: `http://localhost:3000`

### 5. Hướng dẫn deploy nhanh Dev/Prod

- **Môi trường Development (demo, localhost)**  
  - Backend: chạy bằng `npm run dev` (hoặc `npm start`), MongoDB local, blockchain có thể ở **mock mode** nếu chưa cấu hình Infura/private key.  
  - Frontend: vào thư mục `frontend` và chạy `npm start`, cấu hình `REACT_APP_API_URL` nếu cần truy cập backend từ máy khác trong LAN.

- **Môi trường Production đơn giản (1 server)**  
  1. Cài Node.js (>=16), MongoDB trên server.  
  2. Copy mã nguồn, chạy `npm install` ở thư mục gốc và `npm install` trong `frontend`.  
  3. Cấu hình file `.env` với các biến:
     - Thông tin MongoDB, JWT, PORT, `NODE_ENV=production`
     - Thông tin blockchain: `BLOCKCHAIN_NETWORK`, `INFURA_PROJECT_ID`, `PRIVATE_KEY` (hoặc `MNEMONIC`)
     - Cấu hình HSM (nếu dùng) trong `config/hsmConfig.js`
  4. Build frontend: `cd frontend && npm run build`, sau đó cấu hình web server (Nginx/Apache) trỏ vào thư mục `frontend/build`.  
  5. Chạy backend bằng process manager (PM2, systemd…) với lệnh `node server.js`.  
  6. Kiểm tra:
     - `http://<server>:5000/api/health` trả về `success: true`
     - Giao diện React truy cập được backend qua `REACT_APP_API_URL`.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập (email/password)
- `POST /api/auth/firebase` - Đăng nhập bằng Firebase (Google) ⭐ NEW
- `GET /api/auth/google` - Đăng nhập bằng Google OAuth (Passport.js)
- `POST /api/auth/register` - Đăng ký (Admin only)
- `PUT /api/auth/change-password` - Đổi mật khẩu
- `PUT /api/auth/first-change-password` - Đổi mật khẩu lần đầu
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/update-profile` - Cập nhật profile
- `POST /api/auth/logout` - Đăng xuất

### User Management
- `GET /api/users` - Lấy danh sách users (Admin only)
- `GET /api/users/stats` - Thống kê users (Admin only)
- `GET /api/users/:id` - Lấy thông tin user theo ID
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user (Admin only)
- `PUT /api/users/:id/toggle-lock` - Khóa/mở khóa user (Admin only)
- `PUT /api/users/:id/reset-password` - Reset mật khẩu (Admin only)

### Utility
- `GET /api/health` - Health check
- `GET /api` - API documentation

### API Documentation mở rộng
- Backend cung cấp endpoint tài liệu API tổng quan tại: `GET /api` (liệt kê các nhóm endpoint chính).  
- Có thể import tập request từ Postman/REST Client dựa trên các endpoint liệt kê ở mục này.  
- Khi triển khai production, khuyến nghị bổ sung file Postman Collection hoặc tài liệu OpenAPI cho từng môi trường.

## Vai trò người dùng

### 1. Admin
- Quản lý toàn bộ hệ thống
- Tạo/xóa/sửa tài khoản users
- Xem thống kê và báo cáo
- Reset mật khẩu users

### 2. Nhà sản xuất (Manufacturer)
- Quản lý lô thuốc
- Ghi thông tin lên blockchain
- Tạo mã QR cho thuốc

### 3. Nhà phân phối (Distributor)
- Cập nhật trạng thái vận chuyển
- Quản lý kho hàng
- Xác nhận giao nhận

### 4. Bệnh viện (Hospital)
- Quản lý kho thuốc
- Cấp phát thuốc cho bệnh nhân
- Xác nhận nhận hàng

### 5. Bệnh nhân (Patient)
- Quét mã QR tra cứu nguồn gốc
- Xem thông tin thuốc
- Đánh giá chất lượng

## Tài khoản mặc định cho demo

Sau khi khởi động server, tạo tài khoản mặc định:
```bash
POST /api/auth/create-default-accounts
Authorization: Bearer <admin_token>
```

Tài khoản mặc định:
- **Admin**: username: `admin`, password: `default123`
- **Manufacturer**: username: `manufacturer1`, password: `default123`
- **Distributor**: username: `distributor1`, password: `default123`
- **Hospital**: username: `hospital1`, password: `default123`
- **Patient**: username: `patient1`, password: `default123`

## Bảo mật

### 1. Mã hóa mật khẩu
- Sử dụng bcrypt với salt rounds = 12
- Mật khẩu không được lưu dạng plain text

### 2. JWT Authentication
- Token có thời hạn 7 ngày
- Refresh token (sẽ implement sau)

### 3. Rate Limiting
- Giới hạn số request từ 1 IP
- Chống brute force attack

### 4. Account Locking
- Khóa tài khoản sau 5 lần đăng nhập sai
- Thời gian khóa: 2 giờ

### 5. Input Validation
- Sử dụng Joi để validate input
- Sanitize dữ liệu trước khi lưu

### 6. Báo cáo Security Audit

- Xem file `SECURITY_AUDIT.md` để biết chi tiết:
  - Kết quả rà soát phân quyền backend/frontend.
  - Đánh giá các lỗ hổng phổ biến (Injection, XSS, CSRF, IDOR, misconfiguration).
  - Chiến lược quản lý secrets (.env, HSM, private key blockchain).
  - Kết quả `npm run audit` và kế hoạch nâng cấp dependencies trong giai đoạn triển khai thực tế.

## Testing

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin",
    "password": "default123"
  }'
```

### 3. Lấy thông tin user
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token>"
```

## Checklist trước khi release

Trước mỗi lần release phiên bản mới, nên kiểm tra nhanh:

- [ ] Backend chạy ổn định, `GET /api/health` trả về `success: true`
- [ ] Frontend build thành công, các trang chính (Dashboard, Drugs, Supply Chain, QR Scanner, Settings) không lỗi JavaScript
- [ ] Đã cấu hình đúng `.env` cho môi trường deploy (MongoDB, JWT, Blockchain, HSM, CORS, ALLOWED_ORIGINS)
- [ ] Đã chạy `npm run audit` và ghi nhận kết quả (không còn lỗ hổng nghiêm trọng trong dependencies chính của backend/frontend)
- [ ] Smart contract đã deploy đúng network, `CONTRACT_ADDRESS_*` được cập nhật
- [ ] Tối thiểu 1–2 luồng nghiệp vụ chính đã test lại: đăng nhập, tạo lô thuốc, ghi lên blockchain, quét QR/verify

## Công nghệ sử dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Joi** - Input validation

### Security
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP logging
- **Compression** - Response compression

## 📊 Trạng thái dự án

### ✅ Đã hoàn thành
- [x] Authentication & Authorization với JWT
- [x] User Management với phân quyền
- [x] Drug Management (Quản lý lô thuốc)
- [x] Supply Chain Tracking (Theo dõi chuỗi cung ứng)
- [x] Digital Signatures (Chữ ký số theo chuẩn VNCA)
- [x] Trust Score System (Hệ thống điểm tín nhiệm)
- [x] Reviews & Ratings (Đánh giá và xếp hạng)
- [x] Tasks Management (Quản lý nhiệm vụ)
- [x] Notifications (Thông báo)
- [x] Reports & Analytics (Báo cáo và phân tích)
- [x] QR Code Scanner (Quét mã QR)
- [x] Blockchain Integration cơ bản
- [x] Frontend React với UI/UX hiện đại

### 🔄 Đang phát triển
- [ ] Performance Optimization
- [ ] Comprehensive Testing
- [ ] Security Audit
- [x] Documentation hoàn chỉnh ✅

### 📝 Xem chi tiết
Xem **[ROADMAP.md](./ROADMAP.md)** để biết chi tiết về hướng phát triển và kế hoạch dài hạn của dự án.

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Liên hệ

- Email: your-email@example.com
- Project Link: [https://github.com/yourusername/drug-traceability-blockchain](https://github.com/yourusername/drug-traceability-blockchain)
