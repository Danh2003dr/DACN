# Hướng dẫn về QR Code trong hệ thống

## Tổng quan

Hệ thống tự động tạo QR code cho mỗi lô thuốc khi được tạo. QR code này chứa thông tin đầy đủ về thuốc và có thể được quét để tra cứu thông tin.

## QR Code có thể quét được không?

**Có, QR code từ thuốc hoàn toàn có thể quét được!**

### ✅ Đảm bảo chất lượng QR code

Hệ thống đã được cấu hình để tạo QR code với chất lượng tốt:

- **Kích thước**: 500x500 pixels (đủ lớn để quét dễ dàng)
- **Error Correction Level**: M (Medium) - cân bằng giữa dung lượng và khả năng sửa lỗi
- **Margin**: 1 - khoảng trắng xung quanh QR code
- **Màu sắc**: Đen trên nền trắng (chuẩn QR code)

### 📋 Nội dung QR code

QR code chứa dữ liệu JSON với các thông tin sau:

```json
{
  "drugId": "DRUG_001",
  "name": "Tên thuốc",
  "batchNumber": "BATCH001",
  "blockchainId": "BLOCKCHAIN_ID",
  "verificationUrl": "http://server/verify/BLOCKCHAIN_ID",
  "manufacturer": "Nhà sản xuất",
  "productionDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "qualityTest": {...},
  "currentStatus": "sản_xuất",
  "currentLocation": {...},
  "isRecalled": false,
  "timestamp": 1234567890
}
```

## Cách quét QR code

### 1. Quét bằng ứng dụng mobile

Ứng dụng mobile có chức năng quét QR code tích hợp:
- Mở ứng dụng
- Chọn chức năng "Quét QR"
- Đưa camera vào QR code
- Hệ thống tự động nhận diện và tra cứu thông tin

### 2. Quét bằng web frontend

Trên web frontend:
- Truy cập trang "Quét Mã QR"
- Chọn một trong các phương thức:
  - **Quét bằng Camera**: Sử dụng camera máy tính/điện thoại
  - **Tải ảnh lên**: Upload ảnh chứa QR code
  - **Nhập thủ công**: Nhập mã blockchainId, drugId hoặc batchNumber

### 3. Quét bằng ứng dụng QR code scanner khác

Bạn có thể sử dụng bất kỳ ứng dụng quét QR code nào:
- Google Lens
- QR Code Reader
- Camera điện thoại (iOS/Android mới)

Sau khi quét, bạn sẽ nhận được:
- **Nếu là JSON**: Copy và dán vào trang web để tra cứu
- **Nếu là URL verification**: Mở URL để xem thông tin thuốc

## Kiểm tra QR code

### Test script

Chạy script test để kiểm tra QR code:

```bash
node scripts/test-qr-code-scan.js
```

Script này sẽ:
1. Tạo QR code mẫu và test quét
2. Test QR code từ database
3. Test QR code từ các file trong thư mục `qr-codes/`

### Kết quả mong đợi

- ✅ QR code có thể quét được
- ✅ Dữ liệu JSON hợp lệ
- ✅ Thông tin khớp với database

## Xử lý sự cố

### QR code không quét được

**Nguyên nhân có thể:**
1. QR code quá nhỏ hoặc mờ
2. Ánh sáng không đủ
3. Camera không đủ độ phân giải
4. QR code bị hỏng hoặc bẩn

**Giải pháp:**
- In QR code với kích thước lớn hơn (tối thiểu 2x2 cm)
- Đảm bảo ánh sáng đủ
- Làm sạch QR code
- Sử dụng camera có độ phân giải cao hơn

### Dữ liệu không khớp

**Nguyên nhân:**
- QR code cũ, chưa được cập nhật
- Dữ liệu trong database đã thay đổi

**Giải pháp:**
- Tạo lại QR code mới cho thuốc
- Sử dụng API `/api/drugs/:id/generate-qr` để tạo lại

## API liên quan

### Tạo QR code

```http
POST /api/drugs/:id/generate-qr
```

Tạo hoặc tạo lại QR code cho một lô thuốc.

### Quét QR code

```http
POST /api/drugs/scan-qr
Content-Type: application/json

{
  "qrData": "..." // JSON string hoặc blockchainId/drugId/batchNumber
}
```

Tra cứu thông tin thuốc từ QR code.

## Lưu trữ QR code

QR code được lưu trữ ở 2 nơi:

1. **Database**: Lưu dưới dạng DataURL trong field `drug.qrCode.imageUrl`
2. **File system**: Có thể export ra file PNG trong thư mục `qr-codes/`

## Best Practices

1. **In QR code**: 
   - Kích thước tối thiểu 2x2 cm
   - Độ phân giải 300 DPI trở lên
   - In trên giấy trắng, không phản quang

2. **Vị trí đặt QR code**:
   - Dễ nhìn thấy
   - Không bị che khuất
   - Tránh góc cạnh, nơi dễ bị rách

3. **Bảo quản**:
   - Tránh ẩm ướt
   - Tránh ánh nắng trực tiếp
   - Sử dụng nhãn chống nước nếu cần

## Kết luận

QR code từ thuốc **hoàn toàn có thể quét được** với các điều kiện:
- ✅ Được tạo với chất lượng tốt (500x500px, error correction M)
- ✅ Chứa đầy đủ thông tin cần thiết
- ✅ Được in/ hiển thị với kích thước đủ lớn
- ✅ Điều kiện ánh sáng và camera đủ tốt

Nếu gặp vấn đề, hãy chạy script test để kiểm tra!

