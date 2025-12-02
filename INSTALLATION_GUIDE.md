# 📦 Hướng Dẫn Cài Đặt Hoàn Chỉnh

Hướng dẫn chi tiết cài đặt hệ thống Drug Traceability với Firebase Authentication.

## 📋 Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết

- **Node.js** >= 16.x (khuyến nghị 18.x hoặc 20.x)
- **MongoDB** >= 5.0 (hoặc MongoDB Atlas)
- **npm** hoặc **yarn**
- **Git** (để clone repository)

### Kiểm Tra Cài Đặt

```bash
# Kiểm tra Node.js
node --version

# Kiểm tra npm
npm --version

# Kiểm tra MongoDB
mongod --version
```

---

## 🚀 Bước 1: Clone Repository

```bash
git clone <repository-url>
cd DACN
```

---

## 🔧 Bước 2: Cài Đặt Dependencies

### 2.1. Backend Dependencies

```bash
# Từ thư mục gốc
npm install
```

### 2.2. Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## ⚙️ Bước 3: Cấu Hình Environment Variables

### 3.1. Backend Environment (.env)

Tạo file `.env` ở **thư mục gốc** (cùng cấp với `package.json`):

```bash
# Copy từ template
cp env.example .env
```

Chỉnh sửa file `.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/drug-traceability

# JWT Secret (tạo một chuỗi ngẫu nhiên mạnh)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Firebase Admin SDK (CHO ĐĂNG NHẬP GOOGLE)
# Option 1: Service Account Key (Recommended)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Option 2: Project ID only (Simpler, but requires default credentials)
# FIREBASE_PROJECT_ID=your-project-id

# Google OAuth (Optional - nếu dùng Passport.js)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Blockchain (Optional - có thể để trống nếu chưa cấu hình)
# BLOCKCHAIN_NETWORK=ethereum
# INFURA_PROJECT_ID=your-infura-project-id
# PRIVATE_KEY=your-private-key
```

### 3.2. Frontend Environment (.env)

Tạo file `.env` trong thư mục `frontend`:

```bash
cd frontend
# Tạo file .env
```

Nội dung file `frontend/.env`:

```env
# Firebase Configuration (CHO ĐĂNG NHẬP GOOGLE)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API URL (optional - sẽ tự động detect)
# REACT_APP_API_URL=http://localhost:5000/api
```

**Lưu ý:** Nếu không tạo file `.env`, app vẫn hoạt động vì đã có fallback config trong `firebase.js`.

---

## 🔥 Bước 4: Cấu Hình Firebase

### 4.1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** hoặc chọn project hiện có
3. Đặt tên project (ví dụ: "Drug Traceability System")

### 4.2. Bật Google Sign-in

1. Vào **Authentication** → **Sign-in method**
2. Click **Google** → **Enable**
3. Chọn **Support email** và **Project public-facing name**
4. Click **Save**

### 4.3. Lấy Firebase Config cho Frontend

1. Vào **Project Settings** (⚙️) → **General**
2. Scroll xuống **Your apps**
3. Nếu chưa có Web app, click **Add app** → chọn **Web** (</>)
4. Copy các giá trị và thêm vào `frontend/.env`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

### 4.4. Lấy Service Account Key cho Backend

1. Vào **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download file JSON
4. Chạy script để tự động thêm vào `.env`:

```bash
# Từ thư mục gốc
node convert-firebase-key.js "path/to/downloaded-firebase-adminsdk-xxxxx.json"
```

Hoặc thêm thủ công vào `.env` (thư mục gốc):

```env
FIREBASE_SERVICE_ACCOUNT_KEY={paste-toàn-bộ-json-ở-đây}
```

### 4.5. Cấu Hình Authorized Domains

1. Vào **Authentication** → **Settings** → **Authorized domains**
2. Đảm bảo có `localhost` (thường đã có sẵn)
3. Nếu deploy, thêm domain của bạn

### 4.6. Kiểm Tra Cấu Hình

**Frontend:**
```bash
cd frontend
node check-firebase-config.js
```

**Backend:**
```bash
# Từ thư mục gốc
node check-firebase-backend.js
```

Nếu thấy "✅ Đã được cấu hình" thì OK!

---

## 🗄️ Bước 5: Cấu Hình MongoDB

### 5.1. Local MongoDB

1. **Cài đặt MongoDB:**
   - Windows: Download từ [mongodb.com](https://www.mongodb.com/try/download/community)
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   # hoặc
   mongod
   ```

3. **Kiểm tra:**
   ```bash
   mongosh
   # Hoặc
   mongo
   ```

### 5.2. MongoDB Atlas (Cloud)

1. Tạo account tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster mới
3. Lấy connection string
4. Thêm vào `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drug-traceability
   ```

---

## 🧪 Bước 6: Kiểm Tra Cài Đặt

### 6.1. Kiểm Tra Backend

```bash
# Từ thư mục gốc
npm run dev
```

Kiểm tra:
- Server chạy tại `http://localhost:5000`
- Health check: `http://localhost:5000/api/health` → `{"success":true}`
- Firebase Admin SDK: Xem console có "✅ Firebase Admin SDK đã được khởi tạo"

### 6.2. Kiểm Tra Frontend

```bash
cd frontend
npm start
```

Kiểm tra:
- App chạy tại `http://localhost:3000`
- Trang login hiển thị đúng
- Nút "Đăng nhập với Google" có logo Google

### 6.3. Test Đăng Nhập Google

1. Vào `http://localhost:3000/login`
2. Mở **Browser Console** (F12)
3. Click **"Đăng nhập với Google"**
4. Cho phép popup nếu bị chặn
5. Chọn Google account
6. Kiểm tra:
   - Console logs hiển thị các bước
   - Redirect đến `/dashboard`
   - Đăng nhập thành công

---

## 📝 Bước 7: Tạo Dữ Liệu Demo (Optional)

### 7.1. Tạo Tài Khoản Mặc Định

Sau khi đăng nhập với tài khoản admin, gọi API:

```bash
POST http://localhost:5000/api/auth/create-default-accounts
Authorization: Bearer <admin_token>
```

Hoặc dùng script:

```bash
node scripts/seed-real-data-all-roles.js
```

### 7.2. Tạo Dữ Liệu Blockchain (Optional)

```bash
node scripts/seed-blockchain-transactions.js
```

---

## 🔍 Troubleshooting

### Lỗi: "MongoDB connection failed"

**Giải pháp:**
- Kiểm tra MongoDB đang chạy: `mongosh` hoặc `mongo`
- Kiểm tra `MONGODB_URI` trong `.env` đúng chưa
- Kiểm tra firewall không chặn port 27017

### Lỗi: "Firebase Admin SDK chưa được cấu hình"

**Giải pháp:**
1. Chạy: `node check-firebase-backend.js`
2. Nếu fail, kiểm tra `.env` có `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Restart backend: `npm run dev`

### Lỗi: "Backend chưa sẵn sàng"

**Giải pháp:**
1. Kiểm tra backend đang chạy: `http://localhost:5000/api/health`
2. Kiểm tra CORS settings trong `server.js`
3. Kiểm tra `REACT_APP_API_URL` trong frontend `.env`

### Lỗi: "Popup bị chặn"

**Giải pháp:**
1. Click icon popup bị chặn trên address bar
2. Chọn "Always allow popups from this site"
3. Refresh trang và thử lại

### Lỗi: "Token không hợp lệ"

**Giải pháp:**
1. Kiểm tra Firebase config trong `frontend/src/config/firebase.js`
2. Đảm bảo Project ID khớp giữa frontend và backend
3. Kiểm tra Service Account Key đúng chưa

### Lỗi: "Port 5000 already in use"

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

Hoặc đổi port trong `.env`:
```env
PORT=5001
```

---

## ✅ Checklist Cài Đặt

### Backend
- [ ] Node.js >= 16.x đã cài
- [ ] `npm install` đã chạy thành công
- [ ] File `.env` đã tạo và cấu hình
- [ ] MongoDB đang chạy
- [ ] `npm run dev` chạy không lỗi
- [ ] Health check trả về `{"success":true}`
- [ ] Firebase Admin SDK đã được khởi tạo

### Frontend
- [ ] `cd frontend && npm install` đã chạy thành công
- [ ] File `frontend/.env` đã tạo (optional)
- [ ] Firebase config đã được thêm
- [ ] `npm start` chạy không lỗi
- [ ] Trang login hiển thị đúng
- [ ] Nút "Đăng nhập với Google" có logo

### Firebase
- [ ] Firebase project đã tạo
- [ ] Google Sign-in đã được bật
- [ ] Firebase config đã thêm vào frontend
- [ ] Service Account Key đã thêm vào backend
- [ ] Authorized domains đã cấu hình
- [ ] `check-firebase-config.js` và `check-firebase-backend.js` đều pass

### Test
- [ ] Backend health check OK
- [ ] Frontend chạy được
- [ ] Đăng nhập Google thành công
- [ ] Redirect đến dashboard đúng

---

## 🎯 Quick Start (Tóm Tắt)

```bash
# 1. Clone và cài đặt
git clone <repo>
cd DACN
npm install
cd frontend && npm install && cd ..

# 2. Cấu hình
# - Tạo .env ở thư mục gốc (copy từ env.example)
# - Tạo frontend/.env (optional)
# - Cấu hình Firebase (xem Bước 4)

# 3. Kiểm tra
node check-firebase-backend.js
cd frontend && node check-firebase-config.js && cd ..

# 4. Start
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start

# 5. Test
# - Vào http://localhost:3000/login
# - Click "Đăng nhập với Google"
```

---

## 📚 Tài Liệu Tham Khảo

- **Firebase Setup:** Xem `frontend/FIREBASE_SETUP.md`
- **Backend Setup:** Xem `BACKEND_ENV_SETUP.md`
- **Troubleshooting:** Xem `DEBUG_FIREBASE.md`
- **Test Guide:** Xem `TEST_FIREBASE_LOGIN.md`

---

## 🆘 Cần Hỗ Trợ?

Nếu gặp vấn đề:

1. Kiểm tra **Console logs** (F12) để xem lỗi chi tiết
2. Kiểm tra **Backend logs** trong terminal
3. Chạy các script kiểm tra:
   - `node check-firebase-backend.js`
   - `cd frontend && node check-firebase-config.js`
4. Xem các file troubleshooting:
   - `DEBUG_FIREBASE.md`
   - `TEST_FIREBASE_LOGIN.md`
   - `FIREBASE_LOGIN_FIX.md`

---

**Last Updated:** 2024-11-30  
**Version:** 1.0.0

