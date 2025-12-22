# Hướng Dẫn Cấu Hình MoMo Payment Gateway

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Đăng Ký Tài Khoản MoMo Partner](#đăng-ký-tài-khoản-momo-partner)
3. [Lấy Thông Tin Credentials](#lấy-thông-tin-credentials)
4. [Cấu Hình Backend](#cấu-hình-backend)
5. [Cấu Hình Frontend](#cấu-hình-frontend)
6. [Test Trong Sandbox](#test-trong-sandbox)
7. [Deploy Production](#deploy-production)
8. [Troubleshooting](#troubleshooting)

---

## 📖 Tổng Quan

MoMo Payment Gateway là cổng thanh toán điện tử phổ biến tại Việt Nam. Hệ thống đã được tích hợp sẵn MoMo payment, bạn chỉ cần cấu hình credentials và URLs.

### Các thành phần đã tích hợp:
- ✅ Backend service (`services/momoService.js`)
- ✅ API endpoints (`/api/payments/momo/*`)
- ✅ Frontend UI (Invoices, Checkout, Orders)
- ✅ Callback handler tự động

---

## 🔐 Đăng Ký Tài Khoản MoMo Partner

### Bước 1: Truy cập MoMo Partner Portal
1. Truy cập: https://developers.momo.vn/
2. Đăng ký tài khoản hoặc đăng nhập nếu đã có

### Bước 2: Tạo Application
1. Vào **Dashboard** → **Applications**
2. Click **"Tạo ứng dụng mới"** hoặc **"Create New Application"**
3. Điền thông tin:
   - **Tên ứng dụng**: Drug Traceability System (hoặc tên bạn muốn)
   - **Mô tả**: Hệ thống quản lý nguồn gốc thuốc
   - **Loại ứng dụng**: E-commerce / Payment Gateway
   - **Môi trường**: Chọn **Sandbox** để test trước

### Bước 3: Kích hoạt Payment Gateway
1. Trong application vừa tạo, vào tab **"Payment Gateway"**
2. Click **"Kích hoạt"** hoặc **"Activate"**
3. Điền thông tin bổ sung nếu được yêu cầu:
   - Website URL
   - Business information
   - Bank account (cho production)

---

## 🔑 Lấy Thông Tin Credentials

Sau khi tạo application, bạn sẽ có các thông tin sau:

### Trong MoMo Partner Portal:

1. **Partner Code** (Mã đối tác)
   - Vị trí: Dashboard → Application → **Partner Code**
   - Ví dụ: `MOMOBKUN20191114`

2. **Access Key** (Khóa truy cập)
   - Vị trí: Dashboard → Application → **Access Key**
   - Ví dụ: `klm05TvNBzhg7h7j`

3. **Secret Key** (Khóa bí mật)
   - Vị trí: Dashboard → Application → **Secret Key**
   - ⚠️ **QUAN TRỌNG**: Giữ bí mật, không chia sẻ công khai
   - Ví dụ: `at67qH6et8As5lFF`

4. **Store ID** (Mã cửa hàng)
   - Vị trí: Dashboard → Application → **Store ID**
   - Có thể để mặc định hoặc tạo mới
   - Ví dụ: `MomoTestStore`

### Lưu ý:
- **Sandbox** và **Production** có credentials khác nhau
- Sandbox dùng để test, không tính phí
- Production cần xác thực và phê duyệt từ MoMo

---

## ⚙️ Cấu Hình Backend

### Bước 1: Cập nhật file `.env`

Mở file `.env` trong thư mục gốc của project và thêm các biến sau:

```env
# ============================================
# MoMo Payment Gateway Configuration
# ============================================

# Thông tin đăng nhập MoMo (Lấy từ MoMo Partner Portal)
MOMO_PARTNER_CODE=MOMOBKUN20191114
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6et8As5lFF

# Môi trường: 'sandbox' hoặc 'production'
# Sandbox: dùng để test, không tính phí
# Production: môi trường thật, cần phê duyệt từ MoMo
MOMO_ENVIRONMENT=sandbox

# Tên đối tác (hiển thị trong MoMo app)
MOMO_PARTNER_NAME=Drug Traceability System

# Mã cửa hàng (có thể để mặc định)
MOMO_STORE_ID=MomoTestStore

# IPN URL (Instant Payment Notification)
# MoMo sẽ gọi URL này để thông báo kết quả thanh toán
# ⚠️ QUAN TRỌNG: URL này PHẢI là public URL (không thể dùng localhost trong production)
# Development: có thể dùng ngrok hoặc localtunnel để test
# Production: phải là domain thật, có HTTPS
MOMO_IPN_URL=http://localhost:5000/api/payments/momo/callback

# Redirect URL
# URL mà user sẽ được redirect về sau khi thanh toán xong
# Development: http://localhost:3000/payments/momo/callback
# Production: https://yourdomain.com/payments/momo/callback
MOMO_REDIRECT_URL=http://localhost:3000/payments/momo/callback

# API URL và Frontend URL (nếu chưa có)
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Bước 2: Kiểm tra cài đặt package

Đảm bảo đã cài đặt package `uuid`:

```bash
npm install uuid
```

### Bước 3: Restart Backend Server

Sau khi cập nhật `.env`, restart server:

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
npm run dev
```

### Bước 4: Kiểm tra cấu hình

Kiểm tra log khi server khởi động, nếu có lỗi về MoMo credentials, sẽ hiển thị trong console.

---

## 🎨 Cấu Hình Frontend

### Bước 1: Kiểm tra API URL

Đảm bảo frontend có thể kết nối đến backend. Kiểm tra file `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Hoặc nếu chạy trên network:

```env
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

### Bước 2: Tạo Callback Page (Tùy chọn)

Tạo trang callback để hiển thị kết quả thanh toán sau khi user quay lại từ MoMo.

Tạo file `frontend/src/pages/MomoCallback.js`:

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentAPI } from '../utils/api';
import toast from 'react-hot-toast';

const MomoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    const checkPayment = async () => {
      try {
        // Lấy paymentId từ URL params (nếu có)
        const id = searchParams.get('paymentId');
        if (id) {
          setPaymentId(id);
          const response = await paymentAPI.checkMomoPaymentStatus(id);
          if (response.success) {
            if (response.data.status === 'completed') {
              setStatus('success');
              toast.success('Thanh toán thành công!');
            } else {
              setStatus('failed');
              toast.error('Thanh toán thất bại hoặc đang xử lý');
            }
          } else {
            setStatus('failed');
          }
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Error checking payment:', error);
        setStatus('failed');
      }
    };

    checkPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'checking' && (
          <>
            <Loader className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Đang kiểm tra thanh toán...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-4">Giao dịch của bạn đã được xử lý thành công.</p>
            <button
              onClick={() => navigate('/invoices')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại Hóa đơn
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-4">Có lỗi xảy ra trong quá trình thanh toán.</p>
            <button
              onClick={() => navigate('/invoices')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại Hóa đơn
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MomoCallback;
```

Thêm route vào `frontend/src/App.js`:

```javascript
import MomoCallback from './pages/MomoCallback';

// Trong routes:
<Route path="/payments/momo/callback" element={<MomoCallback />} />
```

---

## 🧪 Test Trong Sandbox

### Bước 1: Sử dụng tài khoản test MoMo

MoMo cung cấp tài khoản test để test thanh toán:

1. Tải app **MoMo** trên điện thoại
2. Đăng ký tài khoản test (hoặc dùng tài khoản test được cung cấp)
3. Nạp tiền test vào ví MoMo (trong sandbox, có thể nạp số tiền bất kỳ)

### Bước 2: Test thanh toán

1. **Tạo hóa đơn** trong hệ thống
2. Chọn **"Ghi nhận thanh toán"**
3. Chọn phương thức **"MoMo"**
4. Nhập số tiền
5. Click **"Ghi nhận thanh toán"**
6. Hệ thống sẽ redirect đến trang thanh toán MoMo
7. Đăng nhập và xác nhận thanh toán
8. Sau khi thanh toán, MoMo sẽ redirect về `MOMO_REDIRECT_URL`

### Bước 3: Kiểm tra kết quả

1. **Kiểm tra trong database**:
   - Payment record có status = `completed`
   - Invoice có `paidAmount` được cập nhật
   - Order có `paymentStatus` = `paid`

2. **Kiểm tra logs**:
   - Backend console sẽ hiển thị log khi nhận callback từ MoMo
   - Tìm log có prefix `📱 [MoMo]`

3. **Kiểm tra trong MoMo Partner Portal**:
   - Vào Dashboard → Transactions
   - Xem danh sách giao dịch test

### Bước 4: Test với ngrok (Nếu cần test callback)

Nếu muốn test callback từ MoMo về localhost:

1. **Cài đặt ngrok**:
   ```bash
   npm install -g ngrok
   # hoặc download từ https://ngrok.com/
   ```

2. **Chạy ngrok**:
   ```bash
   ngrok http 5000
   ```

3. **Cập nhật `.env`**:
   ```env
   MOMO_IPN_URL=https://your-ngrok-url.ngrok.io/api/payments/momo/callback
   MOMO_REDIRECT_URL=https://your-ngrok-url.ngrok.io/payments/momo/callback
   ```

4. **Restart server** và test lại

---

## 🚀 Deploy Production

### Bước 1: Chuyển sang Production trong MoMo Portal

1. Vào MoMo Partner Portal
2. Tạo application mới với môi trường **Production**
3. Điền đầy đủ thông tin:
   - Business license
   - Bank account
   - Website URL
   - Các thông tin khác theo yêu cầu

4. **Chờ phê duyệt** từ MoMo (thường 1-3 ngày làm việc)

### Bước 2: Cập nhật Environment Variables

Trên server production, cập nhật `.env`:

```env
# Production credentials (lấy từ MoMo Partner Portal)
MOMO_PARTNER_CODE=YOUR_PRODUCTION_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_PRODUCTION_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_PRODUCTION_SECRET_KEY

# Chuyển sang production
MOMO_ENVIRONMENT=production

# URLs production (PHẢI là HTTPS)
MOMO_IPN_URL=https://yourdomain.com/api/payments/momo/callback
MOMO_REDIRECT_URL=https://yourdomain.com/payments/momo/callback

# API và Frontend URLs
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Bước 3: Đảm bảo HTTPS

- MoMo yêu cầu **HTTPS** cho production
- Cài đặt SSL certificate cho domain
- Đảm bảo cả backend và frontend đều có HTTPS

### Bước 4: Test Production

1. Test với số tiền nhỏ trước
2. Kiểm tra callback được gọi đúng
3. Kiểm tra payment được cập nhật trong database
4. Monitor logs để đảm bảo không có lỗi

---

## 🔧 Troubleshooting

### Lỗi: "Chưa cấu hình MoMo credentials"

**Nguyên nhân**: Thiếu hoặc sai environment variables

**Giải pháp**:
1. Kiểm tra file `.env` có đầy đủ các biến:
   - `MOMO_PARTNER_CODE`
   - `MOMO_ACCESS_KEY`
   - `MOMO_SECRET_KEY`
2. Restart server sau khi cập nhật `.env`
3. Kiểm tra không có khoảng trắng thừa trong giá trị

### Lỗi: "Invalid signature"

**Nguyên nhân**: Secret key không đúng hoặc signature bị sai

**Giải pháp**:
1. Kiểm tra `MOMO_SECRET_KEY` đúng với MoMo Portal
2. Đảm bảo không có ký tự đặc biệt bị encode sai
3. Kiểm tra `MOMO_PARTNER_CODE` đúng

### Lỗi: Callback không được gọi

**Nguyên nhân**: IPN URL không accessible từ internet

**Giải pháp**:
1. **Development**: Dùng ngrok hoặc localtunnel
2. **Production**: 
   - Đảm bảo domain có DNS đúng
   - Kiểm tra firewall không chặn port
   - Đảm bảo server có thể nhận request từ internet
   - Test IPN URL bằng cách gọi trực tiếp từ browser

### Lỗi: "Payment not found" trong callback

**Nguyên nhân**: Payment record chưa được tạo hoặc `momoOrderId` không khớp

**Giải pháp**:
1. Kiểm tra payment được tạo trước khi redirect đến MoMo
2. Kiểm tra `metadata.momoOrderId` trong payment record
3. Kiểm tra log khi tạo payment request

### Lỗi: Redirect về trang trắng

**Nguyên nhân**: `MOMO_REDIRECT_URL` không đúng hoặc frontend chưa có route

**Giải pháp**:
1. Kiểm tra `MOMO_REDIRECT_URL` trong `.env`
2. Đảm bảo frontend có route `/payments/momo/callback`
3. Kiểm tra frontend có thể truy cập được

### Payment status không được cập nhật

**Nguyên nhân**: Callback được gọi nhưng xử lý bị lỗi

**Giải pháp**:
1. Kiểm tra logs trong backend console
2. Kiểm tra database có payment record không
3. Kiểm tra invoice/order có được cập nhật không
4. Test lại với payment mới

### Test với số tiền lớn bị từ chối

**Nguyên nhân**: Sandbox có giới hạn số tiền test

**Giải pháp**:
- Trong sandbox, test với số tiền nhỏ (< 1,000,000 VND)
- Hoặc chuyển sang production (sau khi được phê duyệt)

---

## 📞 Hỗ Trợ

### Tài liệu chính thức MoMo:
- Developer Portal: https://developers.momo.vn/
- API Documentation: https://developers.momo.vn/v3/docs/
- Support: support@momo.vn

### Kiểm tra logs:
- Backend logs: Xem console khi chạy `npm run dev`
- MoMo Partner Portal: Dashboard → Logs → API Logs

### Debug tips:
1. Bật verbose logging trong `services/momoService.js`
2. Kiểm tra network requests trong browser DevTools
3. Kiểm tra database để xem payment records
4. Test từng bước một cách có hệ thống

---

## ✅ Checklist Cấu Hình

- [ ] Đã đăng ký tài khoản MoMo Partner
- [ ] Đã tạo application trong MoMo Portal
- [ ] Đã lấy đầy đủ credentials (Partner Code, Access Key, Secret Key)
- [ ] Đã cập nhật file `.env` với đầy đủ thông tin
- [ ] Đã cài đặt package `uuid`
- [ ] Đã restart backend server
- [ ] Đã test trong sandbox thành công
- [ ] Đã tạo callback page (tùy chọn)
- [ ] Đã test callback được gọi đúng
- [ ] Đã chuẩn bị cho production (nếu cần)

---

**Chúc bạn cấu hình thành công! 🎉**

