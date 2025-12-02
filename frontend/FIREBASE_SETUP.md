# Firebase Authentication Setup Guide

Hướng dẫn cấu hình Firebase Authentication cho đăng nhập Google trên web.

## 1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **Authentication** → **Sign-in method**
4. Bật **Google** provider

## 2. Cấu hình Frontend

### 2.1. Lấy Firebase Config

1. Vào **Project Settings** (⚙️) → **General**
2. Scroll xuống **Your apps** → chọn **Web** (</>)
3. Nếu chưa có Web app, click **Add app** → chọn **Web** (</>)
4. Copy Firebase config object (hoặc các giá trị riêng lẻ)

**Lưu ý:** Bạn KHÔNG cần Web client ID và Web client secret từ phần "Web SDK configuration" trong Google Sign-in settings. Firebase SDK sẽ tự động xử lý.

### 2.2. Thêm vào Environment Variables

Tạo file `.env` trong thư mục `frontend`:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 2.3. Kiểm tra cấu hình

Chạy script kiểm tra:
```bash
cd frontend
node check-firebase-config.js
```

## 3. Cấu hình Backend

### 3.1. Lấy Service Account Key

1. Vào **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download file JSON

### 3.2. Thêm vào Environment Variables

Thêm vào file `.env` ở thư mục gốc:

**Option 1: Service Account Key (Recommended)**
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Option 2: Project ID only (Simpler, but less secure)**
```env
FIREBASE_PROJECT_ID=your-project-id
```

## 4. Cấu hình OAuth Consent Screen (Google Cloud)

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** → **OAuth consent screen**
4. Cấu hình:
   - User Type: **External** (hoặc Internal nếu dùng G Suite)
   - App name, User support email
   - Authorized domains: thêm domain của bạn
5. Thêm scopes: `email`, `profile`
6. Thêm test users (nếu ở chế độ Testing)

## 5. Authorized Domains

1. Vào Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Thêm domain của bạn (ví dụ: `localhost`, `yourdomain.com`)

## 6. Kiểm tra cấu hình

### Frontend
```bash
cd frontend
node check-firebase-config.js
```

### Backend
```bash
node check-firebase-backend.js
```

## 7. Test

1. Start backend: `npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Vào trang login: `http://localhost:3000/login`
4. Click "Đăng nhập với Google"
5. Chọn Google account và authorize
6. Kiểm tra xem đã đăng nhập thành công chưa

## Troubleshooting

### Lỗi: "Firebase Admin SDK chưa được cấu hình"
- Kiểm tra file `.env` có `FIREBASE_SERVICE_ACCOUNT_KEY` hoặc `FIREBASE_PROJECT_ID`
- Restart backend server

### Lỗi: "Token không hợp lệ"
- Kiểm tra Firebase config trong frontend `.env`
- Đảm bảo Firebase project ID khớp giữa frontend và backend

### Lỗi: "Popup bị chặn"
- Cho phép popup cho domain của bạn
- Thử dùng `signInWithRedirect` thay vì `signInWithPopup`

### Lỗi: "OAuth consent screen"
- Đảm bảo đã cấu hình OAuth consent screen trong Google Cloud Console
- Thêm domain vào authorized domains

## Notes

- Firebase Authentication hoạt động độc lập với Passport.js Google OAuth
- User có thể đăng nhập bằng cả 2 cách (Firebase hoặc Passport.js)
- Firebase UID được lưu trong field `firebaseUid` của User model
- Nếu user đã có email trong hệ thống, Firebase sẽ tự động liên kết

