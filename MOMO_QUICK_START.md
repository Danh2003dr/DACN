# MoMo Payment - Quick Start Guide

## 🚀 Cấu Hình Nhanh (5 phút)

### Bước 1: Lấy Credentials từ MoMo

1. Đăng nhập https://developers.momo.vn/
2. Tạo Application mới → Chọn **Sandbox**
3. Copy các thông tin:
   - Partner Code
   - Access Key  
   - Secret Key

### Bước 2: Cập nhật `.env`

Thêm vào file `.env`:

```env
MOMO_PARTNER_CODE=YOUR_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_SECRET_KEY
MOMO_ENVIRONMENT=sandbox
MOMO_PARTNER_NAME=Drug Traceability System
MOMO_STORE_ID=MomoTestStore
MOMO_IPN_URL=http://localhost:5000/api/payments/momo/callback
MOMO_REDIRECT_URL=http://localhost:3000/payments/momo/callback
```

### Bước 3: Restart Server

```bash
# Dừng server (Ctrl+C)
npm run dev
```

### Bước 4: Test

1. Vào trang **Hóa đơn** → Chọn một invoice
2. Click **"Ghi nhận thanh toán"**
3. Chọn **"MoMo"** → Nhập số tiền
4. Click **"Ghi nhận thanh toán"**
5. Sẽ redirect đến trang MoMo để thanh toán

## ✅ Xong!

Xem file `MOMO_PAYMENT_SETUP.md` để biết chi tiết và troubleshooting.

