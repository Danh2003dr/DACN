# DỮ LIỆU THUỐC ĐÃ ĐƯỢC KIỂM ĐỊNH

## Tổng quan
Dự án đã được bổ sung dữ liệu thật của các thuốc đã được kiểm định từ Cục Quản lý Dược - Bộ Y tế Việt Nam. Dữ liệu này bao gồm thông tin chi tiết về các loại thuốc dược liệu đã được cấp phép lưu hành.

## Danh sách thuốc đã được thêm

### 1. Công ty TNHH Dược liệu Hà Nội GMP (Thanh Hóa)
- **Cao khô dược liệu - Lô 218** (DRUG_84976694)
- **Cao đặc dược liệu - Lô 218** (DRUG_3E8743EB)  
- **Cao khô dược liệu - Lô 219** (DRUG_275AB16D)

### 2. Công ty TNHH Đông dược Phúc Hưng (Hà Nội)
- **Cao khô dược liệu - Lô 218 (Phúc Hưng)** (DRUG_4876C34E)
- **Cao đặc dược liệu - Lô 220** (DRUG_0F4FA9CE)

## Thông tin chi tiết

### Thông tin kiểm định
- **Cơ quan kiểm định**: Cục Quản lý Dược - Bộ Y tế
- **Kết quả kiểm định**: Đạt tiêu chuẩn chất lượng
- **Chứng nhận**: Theo quy định tại điểm c khoản 8 Điều 56 Luật dược số 44/2024/QH15

### Thông tin đóng gói
- **Cao khô**: Túi 1kg, 2kg, 5kg, 10kg (túi PE/túi nhôm)
- **Cao đặc**: Thùng 1 túi x 5kg; thùng 1 túi x 10kg; thùng 2 túi x 10kg
- **Tiêu chuẩn**: NSX (Nhà sản xuất)
- **Tuổi thọ**: 24-36 tháng

### Thông tin bảo quản
- **Nhiệt độ**: 15°C - 25°C
- **Độ ẩm**: 45% - 65%
- **Nhạy cảm với ánh sáng**: Có (tùy loại)
- **Hướng dẫn**: Bảo quản nơi khô ráo, thoáng mát

## QR Code
Tất cả các thuốc đã được tạo QR code với thông tin:
- Mã thuốc duy nhất
- Thông tin nhà sản xuất
- Ngày sản xuất và hạn sử dụng
- Kết quả kiểm định
- URL xác minh

## Cách sử dụng

### 1. Xem thông tin thuốc
```bash
node scripts/show-verified-drugs.js
```

### 2. Tạo QR code mới
```bash
node scripts/generate-qr-codes.js
```

### 3. Thêm thuốc mới
```bash
node scripts/setup-verified-drugs-simple.js
```

## Cấu trúc dữ liệu

### Model Drug đã được cập nhật
- Thêm field `packaging` cho thông tin đóng gói
- Hỗ trợ dạng bào chế `cao khô` và `cao đặc`
- QR code với thông tin đầy đủ

### Thông tin nhà sản xuất
- **Công ty TNHH Dược liệu Hà Nội GMP**
  - Địa chỉ: Lô 87,88, Khu E, KCN Tây Bắc Ga, Phường Đông Lĩnh, Thành phố Thanh Hóa, Tỉnh Thanh Hóa
  - Mã tổ chức: MFG_HANOI_GMP

- **Công ty TNHH Đông dược Phúc Hưng**
  - Địa chỉ: Số 96-98 Nguyễn Viết Xuân, Phường Quang Trung, Quận Hà Đông, Thành phố Hà Nội
  - Mã tổ chức: MFG_PHUC_HUNG

## Lưu ý quan trọng

1. **Dữ liệu thật**: Tất cả thông tin thuốc đều dựa trên dữ liệu thật từ Cục Quản lý Dược
2. **Tuân thủ pháp luật**: Thông tin tuân thủ Luật dược số 44/2024/QH15
3. **Bảo mật**: QR code chứa thông tin xác thực và có thể truy xuất nguồn gốc
4. **Cập nhật**: Có thể thêm thuốc mới theo cùng cấu trúc dữ liệu

## API Endpoints

### Lấy danh sách thuốc đã kiểm định
```
GET /api/drugs/verified
```

### Tìm thuốc theo QR code
```
POST /api/drugs/verify-qr
Body: { "qrData": "..." }
```

### Lấy thông tin chi tiết thuốc
```
GET /api/drugs/:drugId
```

## Tương lai

Dự án có thể mở rộng để:
- Tích hợp với blockchain để lưu trữ bất biến
- Kết nối với hệ thống quản lý của Bộ Y tế
- Thêm tính năng theo dõi chuỗi cung ứng
- Tích hợp với ứng dụng di động để quét QR code
