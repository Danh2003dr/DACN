# HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG BẢN ĐỒ ĐỊA CHỈ

## Tổng quan
Hệ thống đã được tích hợp tính năng bản đồ địa chỉ để người dùng có thể chọn vị trí chính xác khi nhập địa chỉ. Tính năng này đặc biệt hữu ích cho hệ thống quản lý chuỗi cung ứng thuốc.

## Tính năng chính

### ✅ 1. Nhập địa chỉ thông thường
- Người dùng có thể nhập địa chỉ trực tiếp vào ô input
- Hệ thống sẽ tự động lưu địa chỉ đã nhập

### ✅ 2. Bản đồ tương tác
- Click nút "Hiện bản đồ" để mở bản đồ tương tác
- Bản đồ hiển thị các vị trí quan trọng tại Việt Nam
- Click vào các vị trí trên bản đồ để chọn địa chỉ

### ✅ 3. Tìm kiếm địa chỉ
- Sử dụng ô tìm kiếm để tìm địa chỉ cụ thể
- Hệ thống gợi ý các địa chỉ phổ biến
- Click vào gợi ý để chọn địa chỉ

### ✅ 4. Thông tin vị trí
- Hiển thị tọa độ chính xác (latitude, longitude)
- Hiển thị địa chỉ đã chọn
- Hướng dẫn sử dụng

## Cách sử dụng

### Bước 1: Truy cập tính năng
1. Đăng nhập vào hệ thống
2. Vào menu "Demo Bản Đồ" hoặc "Profile"
3. Tìm phần nhập địa chỉ

### Bước 2: Nhập địa chỉ
**Cách 1: Nhập trực tiếp**
1. Gõ địa chỉ vào ô input đầu tiên
2. Địa chỉ sẽ được lưu tự động

**Cách 2: Sử dụng bản đồ**
1. Click nút "Hiện bản đồ"
2. Sử dụng ô tìm kiếm để tìm địa chỉ
3. Hoặc click vào các vị trí trên bản đồ
4. Địa chỉ sẽ được cập nhật tự động

### Bước 3: Xác nhận địa chỉ
1. Kiểm tra địa chỉ đã chọn
2. Xem tọa độ chính xác
3. Click "Cập nhật hồ sơ" để lưu

## Các vị trí có sẵn

Hệ thống đã tích hợp sẵn các vị trí quan trọng:

### 🏥 Bệnh viện
- **Bệnh viện Chợ Rẫy** - Quận 5, TP.HCM
- **Bệnh viện Bạch Mai** - Quận Đống Đa, Hà Nội  
- **Bệnh viện Vinmec** - Quận Hai Bà Trưng, Hà Nội

### 🏭 Nhà sản xuất
- **Công ty Dược phẩm MediPhar** - Quận 10, TP.HCM
- **Công ty Pharmexim** - Quận Hai Bà Trưng, Hà Nội
- **Công ty Dược liệu Hà Nội GMP** - Thanh Hóa
- **Công ty Đông dược Phúc Hưng** - Quận Hà Đông, Hà Nội

## Ứng dụng trong hệ thống

### 1. Quản lý người dùng
- **Địa chỉ cá nhân**: Địa chỉ nhà của người dùng
- **Địa chỉ tổ chức**: Địa chỉ công ty/bệnh viện

### 2. Quản lý chuỗi cung ứng
- **Vị trí sản xuất**: Địa chỉ nhà máy
- **Vị trí phân phối**: Địa chỉ kho hàng
- **Vị trí bệnh viện**: Địa chỉ bệnh viện
- **Vị trí bệnh nhân**: Địa chỉ nhà bệnh nhân

### 3. Truy xuất nguồn gốc
- **Theo dõi hành trình**: Từ sản xuất đến bệnh nhân
- **Vị trí hiện tại**: Nơi thuốc đang ở
- **Lịch sử di chuyển**: Các vị trí đã qua

## Lợi ích

### ✅ Độ chính xác cao
- Tọa độ GPS chính xác
- Không bị nhầm lẫn địa chỉ
- Dễ dàng xác minh vị trí

### ✅ Tiện lợi sử dụng
- Giao diện thân thiện
- Tìm kiếm nhanh chóng
- Click để chọn địa chỉ

### ✅ Tích hợp tốt
- Hoạt động với tất cả vai trò
- Lưu trữ trong database
- API đầy đủ

## Cấu trúc dữ liệu

### Địa chỉ cá nhân
```json
{
  "address": "Số 123 Đường ABC, Phường 1, Quận 1, TP.HCM",
  "coordinates": {
    "lat": 10.8231,
    "lng": 106.6297
  }
}
```

### Địa chỉ tổ chức
```json
{
  "organizationInfo": {
    "name": "Công ty ABC",
    "address": "Số 456 Đường XYZ, Phường 2, Quận 2, TP.HCM",
    "coordinates": {
      "lat": 10.7603,
      "lng": 106.6889
    }
  }
}
```

## API Endpoints

### Cập nhật profile
```
PUT /api/auth/update-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Tên người dùng",
  "email": "email@example.com",
  "phone": "0123456789",
  "address": "Địa chỉ đã chọn từ bản đồ",
  "organizationInfo": {
    "name": "Tên tổ chức",
    "address": "Địa chỉ tổ chức",
    "phone": "0123456789",
    "email": "org@example.com"
  }
}
```

## Troubleshooting

### Lỗi thường gặp

1. **Bản đồ không hiển thị**
   - Kiểm tra kết nối internet
   - Refresh trang web
   - Kiểm tra console để xem lỗi

2. **Không tìm thấy địa chỉ**
   - Thử tìm kiếm với từ khóa khác
   - Sử dụng địa chỉ tổng quát hơn
   - Nhập trực tiếp vào ô input

3. **Tọa độ không chính xác**
   - Click lại vào vị trí trên bản đồ
   - Sử dụng tìm kiếm thay vì click
   - Kiểm tra địa chỉ đã chọn

### Hỗ trợ kỹ thuật

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console browser (F12)
2. Chụp ảnh màn hình lỗi
3. Gửi thông tin cho admin

## Tương lai

### Tính năng sắp tới
- **Bản đồ thật**: Tích hợp Google Maps/OpenStreetMap
- **Tìm kiếm nâng cao**: Autocomplete địa chỉ
- **Lưu vị trí yêu thích**: Bookmark địa chỉ thường dùng
- **Tính toán khoảng cách**: Khoảng cách giữa các vị trí
- **Tối ưu mobile**: Responsive trên điện thoại

### Cải tiến
- **Performance**: Tải bản đồ nhanh hơn
- **UX**: Giao diện thân thiện hơn
- **Accuracy**: Độ chính xác cao hơn
- **Integration**: Tích hợp sâu hơn với hệ thống

---

**Lưu ý**: Tính năng bản đồ địa chỉ đang trong giai đoạn phát triển. Một số tính năng có thể chưa hoàn thiện. Vui lòng báo cáo lỗi nếu gặp phải.
