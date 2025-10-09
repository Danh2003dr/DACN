# HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC TẠI BỆNH VIỆN BẰNG BLOCKCHAIN

## Tổng quan
Hệ thống được phát triển để giải quyết vấn đề nghiêm trọng về thuốc giả và thuốc kém chất lượng tại Việt Nam thông qua công nghệ blockchain.

## Tính năng chính
- ✅ **Quản lý tài khoản người dùng** với phân quyền rõ ràng
- ✅ **Xác thực và bảo mật** với JWT và bcrypt
- ✅ **API RESTful** đầy đủ cho quản lý users
- 🔄 **Smart Contract** (đang phát triển)
- 🔄 **Frontend React** (đang phát triển)
- 🔄 **Quét mã QR** (đang phát triển)

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

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
```bash
cp env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
MONGODB_URI=mongodb://localhost:27017/drug-traceability
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

### 3. Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên localhost:27017

### 4. Chạy server
```bash
# Development
npm run dev

# Production
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
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

## Phát triển tiếp theo

### 1. Smart Contract
- [ ] Viết smart contract bằng Solidity
- [ ] Deploy lên Ethereum testnet
- [ ] Tích hợp Web3.js

### 2. Frontend
- [ ] React.js application
- [ ] Giao diện quét mã QR
- [ ] Dashboard quản lý

### 3. Tính năng bổ sung
- [ ] Quản lý lô thuốc
- [ ] Theo dõi chuỗi cung ứng
- [ ] Báo cáo và thống kê
- [ ] Thông báo real-time

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
