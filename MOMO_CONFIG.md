# Cấu Hình MoMo - Thông Tin Từ Portal

## 📋 Thông Tin Credentials

### Môi Trường PRODUCTION

Từ MoMo Business Portal (https://business.momo.vn/portal/app/payment-integration-center):

- **Partner Code**: `MOMOSWSW20251223`
- **Access Key**: `ATWCDAwowhtxxMfE`
- **Secret Key**: `W6ycQ1EjFelK3iHVxbd5R9P5p4Kpkq9M`
- **API Endpoint**: `https://payment.momo.vn/v2/gateway/api/create`

### ⚠️ Lưu Ý Quan Trọng

1. **Partner Code ở PRODUCTION và TEST là khác nhau!**
   - Khi chuyển toggle sang TEST trong MoMo Portal, bạn sẽ thấy Partner Code khác
   - Cần lấy credentials riêng cho từng môi trường

2. **Môi trường TEST (Sandbox)**
   - Dùng để test, không tính phí
   - Cần chuyển toggle sang "TEST" trong MoMo Portal để lấy credentials
   - Set `MOMO_ENVIRONMENT=sandbox` trong `.env`

3. **Môi trường PRODUCTION**
   - Môi trường thật, tính phí thật
   - Chỉ dùng sau khi đã test kỹ trong sandbox
   - Set `MOMO_ENVIRONMENT=production` trong `.env`

## 🔧 Cấu Hình File `.env`

### Cho PRODUCTION (Môi trường thật):

```env
MOMO_PARTNER_CODE=MOMOSWSW20251223
MOMO_ACCESS_KEY=ATWCDAwowhtxxMfE
MOMO_SECRET_KEY=W6ycQ1EjFelK3iHVxbd5R9P5p4Kpkq9M
MOMO_ENVIRONMENT=production
MOMO_PARTNER_NAME=Drug Traceability System
MOMO_STORE_ID=MomoTestStore
MOMO_IPN_URL=https://yourdomain.com/api/payments/momo/callback
MOMO_REDIRECT_URL=https://yourdomain.com/payments/momo/callback
```

### Cho TEST/Sandbox (Môi trường test):

1. Vào MoMo Portal → Chuyển toggle sang **"TEST"**
2. Copy credentials mới (sẽ khác với PRODUCTION)
3. Cập nhật `.env`:

```env
MOMO_PARTNER_CODE=<Lấy từ TEST environment>
MOMO_ACCESS_KEY=<Lấy từ TEST environment>
MOMO_SECRET_KEY=<Lấy từ TEST environment>
MOMO_ENVIRONMENT=sandbox
MOMO_PARTNER_NAME=Drug Traceability System
MOMO_STORE_ID=MomoTestStore
MOMO_IPN_URL=http://localhost:5000/api/payments/momo/callback
MOMO_REDIRECT_URL=http://localhost:3000/payments/momo/callback
```

## 🚀 Các Bước Tiếp Theo

1. **Test trong Sandbox trước:**
   - Chuyển toggle sang TEST trong MoMo Portal
   - Lấy credentials TEST
   - Set `MOMO_ENVIRONMENT=sandbox`
   - Test thanh toán với số tiền nhỏ

2. **Sau khi test thành công:**
   - Chuyển toggle về PRODUCTION
   - Dùng credentials PRODUCTION (đã có ở trên)
   - Set `MOMO_ENVIRONMENT=production`
   - Cập nhật IPN_URL và REDIRECT_URL thành HTTPS domain thật

3. **Restart server:**
   ```bash
   npm run dev
   ```

## 📞 Hỗ Trợ

- MoMo Business Portal: https://business.momo.vn/portal
- Hotline: 1900 636 652
- Email: merchant.care@momo.vn

