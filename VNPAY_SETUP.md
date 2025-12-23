# Hướng Dẫn Tích Hợp VNPay Payment Gateway

## 📋 Tổng Quan

Hệ thống đã được tích hợp VNPay Payment Gateway sử dụng thư viện `vnpay` chính thức (https://vnpay.js.org).

### Các thành phần đã tích hợp:
- ✅ Backend service (`services/vnpayService.js`)
- ✅ API endpoints (`/api/payments/vnpay/*`)
- ✅ Xử lý Return URL và IPN
- ✅ Tự động tạo mã đơn hàng duy nhất để tránh lỗi "Order already exists"

---

## 🔐 Đăng Ký Tài Khoản VNPay

### Bước 1: Truy cập VNPay Sandbox
1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản hoặc đăng nhập nếu đã có

### Bước 2: Lấy Thông Tin Credentials
Sau khi đăng nhập hoặc nhận từ email, bạn sẽ có:
- **vnp_TmnCode**: Mã website tích hợp (Terminal ID)
- **vnp_HashSecret**: Chuỗi bí mật (Secret Key)

> 💡 **Lưu ý**: Nếu bạn đã nhận được thông tin từ VNPay qua email, 
> xem file `VNPAY_CREDENTIALS.md` để copy nhanh credentials vào file `.env`

---

## ⚙️ Cấu Hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# VNPay Configuration
VNPAY_TMN_CODE=7YP6Y1J7
VNPAY_HASH_SECRET=HLCMR0NYU4CFTM2R3VB429HCMFONAGD3
VNPAY_ENVIRONMENT=sandbox  # hoặc 'production'
VNPAY_RETURN_URL=http://localhost:3000/payments/vnpay/callback
VNPAY_IPN_URL=http://localhost:5000/api/payments/vnpay/ipn
VNPAY_ENABLE_LOG=true  # Bật log để debug (tùy chọn)
```

> 💡 **Lưu ý**: 
> - Credentials trên là cho môi trường Sandbox (TEST)
> - Để lấy credentials Production, liên hệ VNPay
> - File `env.example` đã có sẵn template này, bạn chỉ cần copy vào `.env`

---

## 🔌 API Endpoints

### 1. Tạo Payment URL
**POST** `/api/payments/vnpay/create`
- **Authentication**: Required
- **Body**:
```json
{
  "invoiceId": "optional_invoice_id",
  "orderId": "optional_order_id",
  "amount": 100000,
  "bankCode": "optional_bank_code",
  "orderInfo": "Nội dung đơn hàng"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderId": "202312151430251234"
  }
}
```

### 2. Return URL (Redirect)
**GET** `/api/payments/vnpay/return`
- **Authentication**: Not required (VNPay redirect về đây)
- **Query params**: Tự động từ VNPay
- **Behavior**: Redirect về frontend với kết quả

### 3. IPN (Instant Payment Notification)
**GET** `/api/payments/vnpay/ipn`
- **Authentication**: Not required (VNPay gọi ngầm)
- **Query params**: Tự động từ VNPay
- **Response**: JSON chuẩn `{ RspCode: '00', Message: 'Success' }`

---

## 💳 Thông Tin Test Card (Sandbox)

### Ngân hàng Test: NCB
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày hết hạn**: Bất kỳ (ví dụ: `12/25`)
- **CVV/CVC**: Bất kỳ (ví dụ: `123`)
- **OTP**: `123456`

### Lưu ý:
- Chỉ sử dụng trong môi trường Sandbox
- Không sử dụng thẻ thật trong môi trường test
- OTP luôn là `123456` trong Sandbox

---

## 🧪 Test Flow

### 1. Tạo Payment URL
```bash
curl -X POST http://localhost:5000/api/payments/vnpay/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderId": "order_123",
    "amount": 100000,
    "orderInfo": "Test payment"
  }'
```

### 2. Redirect đến Payment URL
Mở URL trả về trong browser, điền thông tin test card và thanh toán.

### 3. Kiểm tra kết quả
- VNPay sẽ redirect về `/payments/vnpay/callback` trên frontend
- IPN sẽ được gọi ngầm về `/api/payments/vnpay/ipn`

---

## 🔒 Tính Năng Bảo Mật

### 1. Xác thực chữ ký (Checksum)
- Tất cả callbacks từ VNPay đều được xác thực chữ ký SHA512
- Đảm bảo tính toàn vẹn của dữ liệu

### 2. Kiểm tra số tiền
- So sánh số tiền từ VNPay với database
- Tránh gian lận bằng cách thay đổi số tiền

### 3. Kiểm tra trạng thái đơn hàng
- Tránh xử lý 2 lần cùng một giao dịch
- Chỉ cập nhật khi status là 'pending'

### 4. Mã đơn hàng duy nhất
- Sử dụng `moment().format('YYYYMMDDHHmmss') + random(4 số)`
- Đảm bảo mỗi giao dịch có mã duy nhất
- Tránh lỗi "Order already exists"

---

## 🚀 Deploy Production

### 1. Đăng ký tài khoản Production
- Liên hệ VNPay để đăng ký tài khoản production
- Nhận credentials production

### 2. Cập nhật Environment Variables
```env
VNPAY_ENVIRONMENT=production
VNPAY_TMN_CODE=your_production_tmn_code
VNPAY_HASH_SECRET=your_production_hash_secret
VNPAY_RETURN_URL=https://yourdomain.com/payments/vnpay/callback
VNPAY_IPN_URL=https://yourdomain.com/api/payments/vnpay/ipn
```

### 3. Cấu hình IPN URL với VNPay
- **QUAN TRỌNG**: Merchant cần gửi IPN URL cho VNPay để họ cấu hình
- IPN URL phải là public URL (có HTTPS trong production)
- VNPay sẽ gọi IPN URL để cập nhật trạng thái thanh toán (server-to-server)

### 4. Cấu hình IP Whitelist (nếu cần)
- Một số trường hợp cần thêm IP của server vào whitelist trên VNPay dashboard
- Kiểm tra với VNPay support để xác nhận

---

## 📝 Lưu Ý Quan Trọng

1. **Return URL và IPN URL** phải được cấu hình đúng trong VNPay dashboard
2. **IPN URL** phải có thể truy cập từ internet (không thể là localhost)
3. **Test Mode** sẽ tự động bật khi `VNPAY_ENVIRONMENT=sandbox`
4. **Mã đơn hàng (vnp_TxnRef)** được tạo tự động để tránh trùng lặp

---

## 🐛 Troubleshooting

### Lỗi "Order already exists"
- **Nguyên nhân**: Mã đơn hàng trùng lặp
- **Giải pháp**: Code đã tự động xử lý bằng cách thêm random vào timestamp

### Lỗi "Checksum failed"
- **Nguyên nhân**: Hash secret không đúng hoặc dữ liệu bị thay đổi
- **Giải pháp**: Kiểm tra lại `VNPAY_HASH_SECRET` trong `.env`

### IPN không được gọi
- **Nguyên nhân**: IPN URL không thể truy cập từ internet
- **Giải pháp**: Sử dụng ngrok hoặc deploy lên server có public IP

---

## 📚 Tài Liệu Tham Khảo

- [VNPay Documentation](https://sandbox.vnpayment.vn/apis/)
- [vnpay.js.org](https://vnpay.js.org)
- [VNPay Sandbox](https://sandbox.vnpayment.vn/)

