# Sửa Lỗi: 'momo' is not a valid enum value

## 🔴 Lỗi
```
Order validation failed: paymentMethod: 'momo' is not a valid enum value for path `paymentMethod`.
```

## ✅ Giải Pháp

Model `Order.js` đã được cập nhật với 'momo' trong enum, nhưng server cần được **restart** để áp dụng thay đổi.

### Bước 1: Dừng Server Hiện Tại

1. Tìm terminal đang chạy backend server
2. Nhấn `Ctrl + C` để dừng server

### Bước 2: Restart Server

```bash
npm run dev
```

hoặc

```bash
npm start
```

### Bước 3: Kiểm Tra

Sau khi restart, thử tạo đơn hàng với payment method "MoMo" lại.

## 🔍 Kiểm Tra Model

Đảm bảo file `models/Order.js` có dòng sau:

```javascript
paymentMethod: {
  type: String,
  enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'momo', 'other'],
  default: 'bank_transfer'
},
```

Nếu chưa có 'momo', thêm vào enum.

## ⚠️ Lưu Ý

- **Luôn restart server** sau khi thay đổi models
- Mongoose cache models khi khởi động, nên cần restart để load lại
- Nếu vẫn lỗi sau khi restart, kiểm tra:
  1. File `models/Order.js` đã được lưu chưa
  2. Server đã restart chưa
  3. Không có lỗi syntax trong model

