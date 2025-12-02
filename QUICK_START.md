# 🚀 Quick Start - Firebase Google Login

## Bước hiện tại: Generate Service Account Key

Bạn đang ở trang **Service accounts** trong Firebase Console.

### 1. Click "Generate new private key" (nút màu xanh)

- File JSON sẽ được download tự động
- Thường lưu vào thư mục Downloads
- Tên file: `drug-traceability-system-d89c1-firebase-adminsdk-xxxxx.json`

### 2. Convert và thêm vào .env

**Cách 1: Dùng script helper (Dễ nhất - Khuyến nghị)**

```bash
# Từ thư mục gốc D:\DACN
cd D:\DACN
node convert-firebase-key.js "C:\Users\YourName\Downloads\drug-traceability-system-d89c1-firebase-adminsdk-xxxxx.json"
```

**Thay `YourName` bằng tên user của bạn và `xxxxx` bằng phần tên file thực tế**

Script sẽ tự động:
- ✅ Convert JSON thành format một dòng
- ✅ Thêm vào file `.env` (hoặc tạo mới nếu chưa có)

**Cách 2: Thủ công**

1. Mở file JSON vừa download
2. Copy toàn bộ nội dung
3. Mở file `.env` ở thư mục gốc (D:\DACN\.env)
4. Thêm dòng:
```env
FIREBASE_SERVICE_ACCOUNT_KEY={paste-toàn-bộ-json-ở-đây}
```

### 3. Kiểm tra cấu hình

```bash
# Từ thư mục gốc D:\DACN
node check-firebase-backend.js
```

Nếu thấy "✅ Firebase Admin SDK đã được khởi tạo thành công!" thì OK!

### 4. Test đăng nhập Google

**Terminal 1 - Start Backend:**
```bash
cd D:\DACN
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd D:\DACN\frontend
npm start
```

**Sau đó:**
1. Mở browser: `http://localhost:3000/login`
2. Click nút **"Đăng nhập với Google"**
3. Chọn Google account và authorize
4. Kiểm tra xem đã đăng nhập thành công chưa

## ✅ Checklist

- [ ] Đã click "Generate new private key"
- [ ] Đã download file JSON
- [ ] Đã chạy `convert-firebase-key.js` hoặc thêm thủ công vào `.env`
- [ ] Đã chạy `check-firebase-backend.js` và thấy success
- [ ] Đã start backend và frontend
- [ ] Đã test đăng nhập Google thành công

## 🆘 Nếu gặp lỗi

### Lỗi: "Firebase Admin SDK chưa được cấu hình"
- Kiểm tra file `.env` có `FIREBASE_SERVICE_ACCOUNT_KEY`
- Restart backend server

### Lỗi: "JSON không hợp lệ"
- Dùng script `convert-firebase-key.js` thay vì copy thủ công

### Lỗi: "Token không hợp lệ"
- Kiểm tra Firebase config trong frontend đã đúng chưa
- Đảm bảo Project ID khớp: `drug-traceability-system-d89c1`

