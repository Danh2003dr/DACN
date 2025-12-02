# 🔥 Firebase Authentication - Setup Hoàn Chỉnh

Hướng dẫn setup Firebase Authentication cho đăng nhập Google trên web.

## 📋 Tổng Quan

Hệ thống hỗ trợ **2 cách đăng nhập Google**:

1. **Firebase Authentication** (Khuyến nghị) ⭐
   - Dùng Firebase SDK
   - Popup-based
   - Dễ setup, bảo mật cao
   - Endpoint: `POST /api/auth/firebase`

2. **Passport.js Google OAuth** (Legacy)
   - Dùng Passport.js
   - Redirect-based
   - Cần cấu hình OAuth consent screen
   - Endpoint: `GET /api/auth/google`

**Tài liệu này tập trung vào Firebase Authentication.**

---

## 🎯 Bước 1: Tạo Firebase Project

### 1.1. Tạo Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** hoặc chọn project hiện có
3. Đặt tên: **"Drug Traceability System"**
4. Chọn Google Analytics (optional)
5. Click **"Create project"**

### 1.2. Bật Google Sign-in

1. Vào **Authentication** → **Sign-in method**
2. Click **Google** → **Enable**
3. Chọn **Support email** (ví dụ: `danh1924.d@gmail.com`)
4. Chọn **Project public-facing name** (ví dụ: `Drug Traceability System`)
5. Click **Save**

✅ Google Sign-in đã được bật!

---

## 🔧 Bước 2: Cấu Hình Frontend

### 2.1. Lấy Firebase Config

1. Vào **Project Settings** (⚙️) → **General**
2. Scroll xuống **Your apps**
3. Nếu chưa có Web app:
   - Click **Add app** → chọn **Web** (</>)
   - Đặt tên app (ví dụ: "drug_traceability_mobile (web)")
   - Click **Register app**
4. Copy Firebase config object

### 2.2. Thêm vào Frontend

**Option 1: Dùng Environment Variables (Recommended)**

Tạo file `frontend/.env`:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyACqT54Gs7kFLR9L0mxBywlGn3tlb2Nko0
REACT_APP_FIREBASE_AUTH_DOMAIN=drug-traceability-system-d89c1.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=drug-traceability-system-d89c1
REACT_APP_FIREBASE_STORAGE_BUCKET=drug-traceability-system-d89c1.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=874430072046
REACT_APP_FIREBASE_APP_ID=1:874430072046:web:9f7e282ff5b05895eb1fff
REACT_APP_FIREBASE_MEASUREMENT_ID=G-4BLHL8MNOY
```

**Option 2: Dùng Fallback Config**

Nếu không tạo `.env`, app vẫn hoạt động vì đã có fallback config trong `frontend/src/config/firebase.js`.

### 2.3. Kiểm Tra

```bash
cd frontend
node check-firebase-config.js
```

Nếu thấy "✅ Tất cả Firebase config đã được cấu hình!" thì OK!

---

## 🔐 Bước 3: Cấu Hình Backend

### 3.1. Lấy Service Account Key

1. Vào **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Click **"Generate key"** trong modal
4. File JSON sẽ được download (ví dụ: `drug-traceability-system-d89c1-firebase-adminsdk-xxxxx.json`)

### 3.2. Thêm vào Backend

**Cách 1: Dùng Script Helper (Dễ nhất)**

```bash
# Từ thư mục gốc
node convert-firebase-key.js "C:\Users\YourName\Downloads\drug-traceability-system-d89c1-firebase-adminsdk-xxxxx.json"
```

Script sẽ tự động:
- ✅ Convert JSON thành format một dòng
- ✅ Thêm vào file `.env` (hoặc tạo mới)

**Cách 2: Thêm Thủ Công**

1. Mở file JSON vừa download
2. Copy toàn bộ nội dung
3. Mở file `.env` ở thư mục gốc
4. Thêm dòng:
```env
FIREBASE_SERVICE_ACCOUNT_KEY={paste-toàn-bộ-json-ở-đây}
```

**Lưu ý:** JSON phải là một dòng, không có khoảng trắng thừa.

### 3.3. Kiểm Tra

```bash
# Từ thư mục gốc
node check-firebase-backend.js
```

Nếu thấy "✅ Firebase Admin SDK đã được khởi tạo thành công!" thì OK!

---

## 🌐 Bước 4: Cấu Hình Authorized Domains

### 4.1. Thêm Domain

1. Vào **Authentication** → **Settings** → **Authorized domains**
2. Kiểm tra có `localhost` (thường đã có sẵn)
3. Nếu deploy, thêm domain của bạn:
   - Click **"Add domain"**
   - Nhập domain (ví dụ: `yourdomain.com`)
   - Click **"Add"**

### 4.2. Cấu Hình OAuth Consent Screen (Optional)

Nếu gặp lỗi "OAuth consent screen", cấu hình:

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** → **OAuth consent screen**
4. Cấu hình:
   - **User Type:** External (hoặc Internal nếu dùng G Suite)
   - **App name:** Drug Traceability System
   - **User support email:** your-email@gmail.com
   - **Authorized domains:** Thêm domain của bạn
5. Thêm scopes: `email`, `profile`
6. Click **"Save and Continue"**

---

## ✅ Bước 5: Test

### 5.1. Start Backend

```bash
npm run dev
```

Kiểm tra:
- Server chạy tại `http://localhost:5000`
- Health check: `http://localhost:5000/api/health` → `{"success":true}`
- Console hiển thị: "✅ Firebase Admin SDK đã được khởi tạo"

### 5.2. Start Frontend

```bash
cd frontend
npm start
```

Kiểm tra:
- App chạy tại `http://localhost:3000`
- Trang login hiển thị đúng
- Nút "Đăng nhập với Google" có logo Google

### 5.3. Test Đăng Nhập Google

1. Vào `http://localhost:3000/login`
2. **Mở Browser Console** (F12 → Console tab)
3. Click nút **"Đăng nhập với Google"**
4. **Cho phép popup** nếu bị chặn:
   - Click icon popup bị chặn trên address bar
   - Chọn "Always allow popups from this site"
   - Refresh trang
5. Chọn Google account và authorize
6. Kiểm tra Console logs:
   - ✅ `Starting Google login...`
   - ✅ `Firebase auth success, user: ...`
   - ✅ `Got ID token, length: ...`
   - ✅ `Sending token to backend...`
   - ✅ `Backend response: {...}`
   - ✅ `Redirecting to: /dashboard`
7. ✅ Đăng nhập thành công và redirect đến dashboard!

---

## 🔍 Troubleshooting

### Lỗi: "Firebase Admin SDK chưa được cấu hình"

**Nguyên nhân:** Chưa thêm Service Account Key vào `.env`

**Giải pháp:**
1. Chạy: `node check-firebase-backend.js`
2. Nếu fail, kiểm tra `.env` có `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Dùng script: `node convert-firebase-key.js <path-to-json>`
4. Restart backend: `npm run dev`

### Lỗi: "Backend chưa sẵn sàng"

**Nguyên nhân:** Backend chưa start hoặc không kết nối được

**Giải pháp:**
1. Kiểm tra backend đang chạy: `http://localhost:5000/api/health`
2. Start backend: `npm run dev`
3. Kiểm tra CORS settings trong `server.js`

### Lỗi: "Popup bị chặn"

**Nguyên nhân:** Browser chặn popup

**Giải pháp:**
1. Click icon popup bị chặn trên address bar
2. Chọn "Always allow popups from this site"
3. Refresh trang và thử lại

### Lỗi: "Token không hợp lệ"

**Nguyên nhân:** Firebase config không đúng hoặc Project ID không khớp

**Giải pháp:**
1. Kiểm tra Firebase config trong `frontend/src/config/firebase.js`
2. Đảm bảo Project ID khớp giữa frontend và backend
3. Kiểm tra Service Account Key đúng project chưa

### Lỗi: "OAuth consent screen"

**Nguyên nhân:** Chưa cấu hình OAuth consent screen

**Giải pháp:**
1. Vào Google Cloud Console
2. Cấu hình OAuth consent screen (xem Bước 4.2)
3. Thêm domain vào authorized domains

### Lỗi: "Unauthorized domain"

**Nguyên nhân:** Domain chưa được thêm vào authorized domains

**Giải pháp:**
1. Vào Firebase Console → Authentication → Settings → Authorized domains
2. Thêm domain của bạn (ví dụ: `localhost`, `yourdomain.com`)

---

## 📊 Kiểm Tra Cấu Hình

### Checklist

**Firebase Console:**
- [ ] Project đã được tạo
- [ ] Google Sign-in đã được bật
- [ ] Web app đã được thêm
- [ ] Authorized domains đã cấu hình

**Frontend:**
- [ ] Firebase config đã thêm vào `.env` (hoặc dùng fallback)
- [ ] `check-firebase-config.js` pass
- [ ] App chạy được và hiển thị nút "Đăng nhập với Google"

**Backend:**
- [ ] Service Account Key đã thêm vào `.env`
- [ ] `check-firebase-backend.js` pass
- [ ] Backend start không lỗi
- [ ] Console hiển thị "✅ Firebase Admin SDK đã được khởi tạo"

**Test:**
- [ ] Đăng nhập Google thành công
- [ ] Redirect đến dashboard đúng
- [ ] User được tạo/link đúng trong database

---

## 🎯 Expected Flow

1. User click "Đăng nhập với Google"
2. Firebase popup hiện ra (hoặc redirect)
3. User chọn Google account và authorize
4. Firebase trả về ID token
5. Frontend gửi ID token lên `/api/auth/firebase`
6. Backend verify token với Firebase Admin SDK
7. Backend tìm/tạo user và tạo JWT token
8. Frontend lưu JWT và redirect đến `/dashboard`

---

## 📚 Tài Liệu Tham Khảo

- **Quick Setup:** `SETUP_QUICK.md`
- **Installation Guide:** `INSTALLATION_GUIDE.md`
- **Troubleshooting:** `DEBUG_FIREBASE.md`
- **Test Guide:** `TEST_FIREBASE_LOGIN.md`
- **Fix Details:** `FIREBASE_LOGIN_FIX.md`

---

## 🆘 Cần Hỗ Trợ?

1. Kiểm tra **Console logs** (F12) để xem lỗi chi tiết
2. Kiểm tra **Backend logs** trong terminal
3. Chạy các script kiểm tra:
   - `node check-firebase-backend.js`
   - `cd frontend && node check-firebase-config.js`
4. Xem các file troubleshooting trong thư mục gốc

---

**Last Updated:** 2024-11-30  
**Version:** 1.0.0

