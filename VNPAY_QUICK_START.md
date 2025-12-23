# VNPay Quick Start Guide

## 🚀 Bắt Đầu Nhanh

### Bước 1: Cấu hình Environment Variables

Copy phần VNPay config từ file `env.example` vào file `.env` của bạn:

```env
# VNPay Configuration - Sandbox
VNPAY_TMN_CODE=7YP6Y1J7
VNPAY_HASH_SECRET=HLCMR0NYU4CFTM2R3VB429HCMFONAGD3
VNPAY_ENVIRONMENT=sandbox
VNPAY_RETURN_URL=http://localhost:3000/payments/vnpay/callback
VNPAY_IPN_URL=http://localhost:5000/api/payments/vnpay/ipn
VNPAY_ENABLE_LOG=true
```

### Bước 2: Restart Server

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại
npm start
```

### Bước 3: Test Payment

1. **Gọi API tạo payment URL**:
```bash
POST http://localhost:5000/api/payments/vnpay/create
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "orderId": "order_123",
  "amount": 100000,
  "orderInfo": "Test payment VNPay"
}
```

2. **Copy `paymentUrl` từ response** và mở trong browser

3. **Thanh toán với thẻ test**:
   - Ngân hàng: NCB
   - Số thẻ: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - OTP: `123456`

4. **Kiểm tra kết quả**:
   - Browser sẽ redirect về `/payments/vnpay/callback`
   - IPN sẽ được gọi ngầm về `/api/payments/vnpay/ipn`
   - Check database để xem payment status đã được cập nhật chưa

## 📚 Thông Tin Bổ Sung

- Xem chi tiết trong: `VNPAY_SETUP.md`
- Credentials đầy đủ: `VNPAY_CREDENTIALS.md`
- Tài liệu VNPay: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html

## 🔗 Links Hữu Ích

- **Merchant Admin**: https://sandbox.vnpayment.vn/merchantv2/
- **Test Case (SIT)**: https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login
- **Demo**: https://sandbox.vnpayment.vn/apis/vnpay-demo/
- **Code Demo**: https://sandbox.vnpayment.vn/apis/vnpay-demo/code-demo-tích-hợp

