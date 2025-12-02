# ⚡ Quick Setup - 5 Phút

Hướng dẫn setup nhanh hệ thống với Firebase Google Login.

## 🚀 Bước 1: Cài Đặt Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

## 🔧 Bước 2: Cấu Hình Environment

### Backend (.env)

```bash
# Copy template
cp env.example .env
```

Chỉnh sửa `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/drug-traceability
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### Frontend (.env) - Optional

```bash
cd frontend
# Tạo file .env (optional - đã có fallback)
```

## 🔥 Bước 3: Setup Firebase (5 phút)

### 3.1. Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới: "Drug Traceability System"
3. Vào **Authentication** → **Sign-in method** → Bật **Google**

### 3.2. Lấy Firebase Config

**Frontend:**
1. **Project Settings** (⚙️) → **General** → **Your apps** → **Web** (</>)
2. Copy config và thêm vào `frontend/.env` (hoặc dùng fallback trong code)

**Backend:**
1. **Project Settings** → **Service accounts** → **Generate new private key**
2. Download file JSON
3. Chạy:
```bash
node convert-firebase-key.js "path/to/firebase-adminsdk-xxxxx.json"
```

### 3.3. Kiểm Tra

```bash
# Backend
node check-firebase-backend.js

# Frontend
cd frontend
node check-firebase-config.js
```

## 🗄️ Bước 4: Start MongoDB

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

## ▶️ Bước 5: Start App

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## ✅ Test

1. Vào `http://localhost:3000/login`
2. Click **"Đăng nhập với Google"**
3. Chọn Google account
4. ✅ Đăng nhập thành công!

---

**Xem chi tiết:** `INSTALLATION_GUIDE.md`

