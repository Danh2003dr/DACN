# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ CHUỖI CUNG ỨNG THUỐC HOÀN CHỈNH

## Tổng quan
Hệ thống quản lý chuỗi cung ứng thuốc đã được hoàn thiện với dữ liệu thật từ Cục Quản lý Dược - Bộ Y tế Việt Nam. Hệ thống bao gồm đầy đủ các tính năng từ sản xuất đến bệnh nhân với blockchain và QR code.

## Cài đặt và thiết lập

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
```bash
cp env.example .env
```

Chỉnh sửa file `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/drug-traceability
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên localhost:27017

### 4. Thiết lập hệ thống hoàn chỉnh
```bash
# Chạy script thiết lập toàn bộ hệ thống
node scripts/setup-complete-supply-chain-system.js
```

Hoặc chạy từng bước riêng lẻ:
```bash
# Bước 1: Thiết lập dữ liệu thuốc đã được kiểm định
node scripts/setup-verified-drugs.js

# Bước 2: Tạo các tổ chức thật và chuỗi cung ứng
node scripts/setup-complete-supply-chain.js

# Bước 3: Tạo QR codes và tích hợp blockchain
node scripts/generate-complete-qr-codes.js

# Bước 4: Thiết lập kiểm tra chất lượng
node scripts/setup-quality-control.js

# Bước 5: Tạo báo cáo và thống kê
node scripts/generate-supply-chain-reports.js
```

### 5. Khởi động server
```bash
# Development
npm run dev

# Production
npm start
```

## Dữ liệu thật đã được thiết lập

### Thuốc đã được kiểm định
- **Cao khô dược liệu - Lô 218** (Công ty TNHH Dược liệu Hà Nội GMP)
- **Cao đặc dược liệu - Lô 218** (Công ty TNHH Dược liệu Hà Nội GMP)
- **Cao khô dược liệu - Lô 219** (Công ty TNHH Dược liệu Hà Nội GMP)
- **Cao khô dược liệu - Lô 218 (Phúc Hưng)** (Công ty TNHH Đông dược Phúc Hưng)
- **Cao đặc dược liệu - Lô 220** (Công ty TNHH Đông dược Phúc Hưng)

### Tổ chức tham gia
- **Nhà sản xuất**: Công ty TNHH Dược liệu Hà Nội GMP (Thanh Hóa), Công ty TNHH Đông dược Phúc Hưng (Hà Nội)
- **Nhà phân phối**: Công ty Cổ phần Dược phẩm MediPhar (TP.HCM), Công ty TNHH Thương mại Dược phẩm Pharmexim (Hà Nội)
- **Bệnh viện**: Bệnh viện Bạch Mai (Hà Nội), Bệnh viện Chợ Rẫy (TP.HCM), Bệnh viện Đa khoa Quốc tế Vinmec (Hà Nội)
- **Bệnh nhân**: Nguyễn Văn A (Hà Nội), Trần Thị B (TP.HCM)

## Tính năng chính

### 1. Quản lý chuỗi cung ứng
- **Tạo hành trình**: Nhà sản xuất tạo hành trình cho lô thuốc
- **Theo dõi vận chuyển**: Nhà phân phối cập nhật trạng thái vận chuyển
- **Nhận hàng**: Bệnh viện xác nhận nhận hàng
- **Lưu kho**: Quản lý kho hàng tại bệnh viện
- **Cấp phát**: Cấp phát thuốc cho bệnh nhân

### 2. Truy xuất nguồn gốc
- **QR Code**: Quét mã QR để xem thông tin thuốc
- **Blockchain**: Thông tin được lưu trữ trên blockchain
- **Lịch sử**: Theo dõi toàn bộ hành trình từ sản xuất đến bệnh nhân
- **Xác thực**: Xác minh tính xác thực của thuốc

### 3. Kiểm tra chất lượng
- **Nhiệt độ**: Kiểm tra nhiệt độ bảo quản (15-25°C)
- **Độ ẩm**: Kiểm tra độ ẩm (45-65%)
- **Tính toàn vẹn**: Kiểm tra bao bì và tính toàn vẹn
- **Hạn sử dụng**: Kiểm tra hạn sử dụng
- **Chất lượng đặc biệt**: Kiểm tra theo loại thuốc (cao khô, cao đặc)

### 4. Báo cáo và thống kê
- **Báo cáo tổng quan**: Thống kê tổng thể hệ thống
- **Báo cáo chi tiết**: Thông tin chi tiết từng chuỗi cung ứng
- **Báo cáo chất lượng**: Thống kê kiểm tra chất lượng
- **Báo cáo blockchain**: Thông tin tích hợp blockchain
- **Báo cáo theo thời gian**: Thống kê theo ngày/tháng

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (Admin only)
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/update-profile` - Cập nhật profile

### Supply Chain Management
- `POST /api/supply-chain` - Tạo hành trình chuỗi cung ứng
- `GET /api/supply-chain` - Lấy danh sách hành trình
- `GET /api/supply-chain/:id` - Lấy thông tin hành trình
- `POST /api/supply-chain/:id/steps` - Thêm bước mới
- `GET /api/supply-chain/qr/:batchNumber` - Truy xuất qua QR code
- `POST /api/supply-chain/:id/recall` - Thu hồi thuốc

### Drug Management
- `GET /api/drugs` - Lấy danh sách thuốc
- `GET /api/drugs/:id` - Lấy thông tin thuốc
- `POST /api/drugs/verify-qr` - Xác minh QR code
- `GET /api/drugs/verified` - Lấy thuốc đã kiểm định

### Reports
- `GET /api/reports/overview` - Báo cáo tổng quan
- `GET /api/reports/quality` - Báo cáo chất lượng
- `GET /api/reports/blockchain` - Báo cáo blockchain
- `GET /api/reports/timeseries` - Báo cáo theo thời gian

## Tài khoản mặc định

Sau khi thiết lập, các tài khoản sau sẽ được tạo:

### Admin
- **Username**: `admin`
- **Password**: `default123`
- **Quyền**: Quản lý toàn bộ hệ thống

### Nhà sản xuất
- **Username**: `hanoi_gmp`
- **Password**: `default123`
- **Tổ chức**: Công ty TNHH Dược liệu Hà Nội GMP

- **Username**: `phuc_hung`
- **Password**: `default123`
- **Tổ chức**: Công ty TNHH Đông dược Phúc Hưng

### Nhà phân phối
- **Username**: `mediphar_dist`
- **Password**: `default123`
- **Tổ chức**: Công ty Cổ phần Dược phẩm MediPhar

- **Username**: `pharmexim_dist`
- **Password**: `default123`
- **Tổ chức**: Công ty TNHH Thương mại Dược phẩm Pharmexim

### Bệnh viện
- **Username**: `bachmai_hospital`
- **Password**: `default123`
- **Tổ chức**: Bệnh viện Bạch Mai

- **Username**: `chogay_hospital`
- **Password**: `default123`
- **Tổ chức**: Bệnh viện Chợ Rẫy

- **Username**: `vinmec_hospital`
- **Password**: `default123`
- **Tổ chức**: Bệnh viện Đa khoa Quốc tế Vinmec

### Bệnh nhân
- **Username**: `patient_nguyen_van_a`
- **Password**: `default123`
- **Tên**: Nguyễn Văn A

- **Username**: `patient_tran_thi_b`
- **Password**: `default123`
- **Tên**: Trần Thị B

## Cấu trúc dữ liệu

### Thư mục quan trọng
```
DACN/
├── qr-codes/           # QR codes đã tạo
├── reports/            # Báo cáo và thống kê
├── scripts/            # Scripts thiết lập
├── models/             # Database models
├── controllers/        # API controllers
├── routes/            # API routes
└── services/          # Business logic
```

### Files báo cáo
- `reports/supply-chain-overview.json` - Báo cáo tổng quan
- `reports/supply-chain-detailed.json` - Báo cáo chi tiết
- `reports/supply-chain-quality.json` - Báo cáo chất lượng
- `reports/supply-chain-blockchain.json` - Báo cáo blockchain
- `reports/supply-chain-master-report.json` - Báo cáo tổng hợp

## Truy cập hệ thống

### Backend API
- **URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **API Documentation**: `http://localhost:5000/api`

### Frontend (nếu có)
- **URL**: `http://localhost:3000`
- **Quản lý chuỗi cung ứng**: `http://localhost:3000/supply-chain`
- **Quản lý thuốc**: `http://localhost:3000/drugs`
- **Xác minh QR code**: `http://localhost:3000/verify`
- **Báo cáo thống kê**: `http://localhost:3000/reports`

## Tính năng nâng cao

### 1. Blockchain Integration
- **Smart Contract**: Lưu trữ thông tin thuốc trên blockchain
- **Digital Signature**: Chữ ký số để xác thực
- **Transaction History**: Lịch sử giao dịch blockchain
- **Gas Optimization**: Tối ưu hóa chi phí giao dịch

### 2. Quality Control
- **Real-time Monitoring**: Giám sát thời gian thực
- **Automated Alerts**: Cảnh báo tự động
- **Quality Standards**: Tiêu chuẩn chất lượng GMP
- **Compliance**: Tuân thủ quy định pháp luật

### 3. Security
- **JWT Authentication**: Xác thực bằng JWT
- **Role-based Access**: Phân quyền theo vai trò
- **Data Encryption**: Mã hóa dữ liệu
- **Audit Trail**: Theo dõi truy cập

## Troubleshooting

### Lỗi thường gặp

1. **MongoDB connection error**
   ```bash
   # Kiểm tra MongoDB đang chạy
   mongod --version
   # Khởi động MongoDB
   mongod
   ```

2. **Port already in use**
   ```bash
   # Thay đổi port trong .env
   PORT=5001
   ```

3. **Permission denied**
   ```bash
   # Cấp quyền cho scripts
   chmod +x scripts/*.js
   ```

### Logs và Debug
```bash
# Xem logs chi tiết
npm run dev

# Debug mode
DEBUG=* npm run dev
```

## Mở rộng hệ thống

### 1. Thêm thuốc mới
```bash
node scripts/setup-verified-drugs.js
```

### 2. Tạo QR codes mới
```bash
node scripts/generate-complete-qr-codes.js
```

### 3. Cập nhật báo cáo
```bash
node scripts/generate-supply-chain-reports.js
```

## Liên hệ và hỗ trợ

- **Email**: support@drug-traceability.com
- **Documentation**: [GitHub Repository](https://github.com/yourusername/drug-traceability-blockchain)
- **Issues**: [GitHub Issues](https://github.com/yourusername/drug-traceability-blockchain/issues)

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Lưu ý**: Hệ thống đã được thiết lập với dữ liệu thật từ Cục Quản lý Dược - Bộ Y tế Việt Nam. Tất cả thông tin thuốc và tổ chức đều dựa trên dữ liệu thực tế và tuân thủ quy định pháp luật hiện hành.
