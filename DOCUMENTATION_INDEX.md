# 📚 Mục Lục Tài Liệu

Danh sách tất cả tài liệu trong dự án, được phân loại theo chủ đề.

## 🚀 Cài Đặt & Setup

### Quick Start
- **[SETUP_QUICK.md](./SETUP_QUICK.md)** - Setup nhanh trong 5 phút ⚡

### Hướng Dẫn Chi Tiết
- **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - Hướng dẫn cài đặt hoàn chỉnh 📦
  - Yêu cầu hệ thống
- Cài đặt dependencies
- Cấu hình MongoDB
- **Cấu hình Firebase Authentication**
- Cấu hình environment variables
- Test và troubleshooting

### Firebase Authentication
- **[FIREBASE_COMPLETE_SETUP.md](./FIREBASE_COMPLETE_SETUP.md)** - Setup Firebase hoàn chỉnh 🔥
  - Tạo Firebase project
- Bật Google Sign-in
- Cấu hình frontend
- Cấu hình backend
- Authorized domains
- Test và troubleshooting

- **[frontend/FIREBASE_SETUP.md](./frontend/FIREBASE_SETUP.md)** - Firebase setup cho frontend
- **[BACKEND_ENV_SETUP.md](./BACKEND_ENV_SETUP.md)** - Firebase setup cho backend
- **[QUICK_START.md](./QUICK_START.md)** - Quick start với Firebase

### Environment Variables
- **[env.example](./env.example)** - Template cho backend `.env`
- **[frontend/.env.example](./frontend/.env.example)** - Template cho frontend `.env`

### Helper Scripts
- **[convert-firebase-key.js](./convert-firebase-key.js)** - Convert Firebase Service Account Key
- **[check-firebase-backend.js](./check-firebase-backend.js)** - Kiểm tra backend Firebase config
- **[frontend/check-firebase-config.js](./frontend/check-firebase-config.js)** - Kiểm tra frontend Firebase config

---

## 🧪 Testing & Debugging

### Testing
- **[TEST_FIREBASE_LOGIN.md](./TEST_FIREBASE_LOGIN.md)** - Hướng dẫn test đăng nhập Google
- **[DEBUG_FIREBASE.md](./DEBUG_FIREBASE.md)** - Debug Firebase authentication
- **[FIREBASE_LOGIN_FIX.md](./FIREBASE_LOGIN_FIX.md)** - Chi tiết các fix đã thực hiện

### Troubleshooting
- **[mobile/TROUBLESHOOTING.md](./mobile/TROUBLESHOOTING.md)** - Troubleshooting cho mobile app
- **[frontend/ENV_SETUP.md](./frontend/ENV_SETUP.md)** - Setup environment cho frontend

---

## 📱 Mobile App

### Development
- **[mobile/README.md](./mobile/README.md)** - Tổng quan mobile app
- **[mobile/IMPLEMENTATION_GUIDE.md](./mobile/IMPLEMENTATION_GUIDE.md)** - Hướng dẫn implement features
- **[mobile/ROADMAP.md](./mobile/ROADMAP.md)** - Roadmap phát triển mobile app
- **[mobile/FIREBASE_SETUP.md](./mobile/FIREBASE_SETUP.md)** - Firebase setup cho mobile

---

## 📖 User Guides

### Hướng Dẫn Sử Dụng
- **[HUONG_DAN_SU_DUNG.md](./HUONG_DAN_SU_DUNG.md)** - Hướng dẫn sử dụng giao diện hệ thống

### System Documentation
- **[MO_TA_HE_THONG.md](./MO_TA_HE_THONG.md)** - Mô tả kiến trúc & nghiệp vụ hệ thống
- **[QUICK_START_BLOCKCHAIN.md](./QUICK_START_BLOCKCHAIN.md)** - Hướng dẫn triển khai blockchain

---

## 🔐 Security

- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Security audit report

---

## 📋 Quick Reference

### Setup Checklist

**Backend:**
1. `npm install`
2. `cp env.example .env` → Chỉnh sửa `.env`
3. Setup Firebase: `node convert-firebase-key.js <json-file>`
4. `npm run dev`

**Frontend:**
1. `cd frontend && npm install`
2. (Optional) Tạo `frontend/.env` với Firebase config
3. `npm start`

**Firebase:**
1. Tạo project trong Firebase Console
2. Bật Google Sign-in
3. Lấy config cho frontend
4. Lấy Service Account Key cho backend

### Test Commands

```bash
# Check backend Firebase
node check-firebase-backend.js

# Check frontend Firebase
cd frontend && node check-firebase-config.js

# Health check
curl http://localhost:5000/api/health
```

---

## 🗂️ File Structure

```
DACN/
├── INSTALLATION_GUIDE.md          # Hướng dẫn cài đặt hoàn chỉnh
├── SETUP_QUICK.md                  # Quick setup (5 phút)
├── FIREBASE_COMPLETE_SETUP.md      # Firebase setup chi tiết
├── QUICK_START.md                  # Quick start với Firebase
├── BACKEND_ENV_SETUP.md            # Backend environment setup
├── TEST_FIREBASE_LOGIN.md          # Test guide
├── DEBUG_FIREBASE.md               # Debug guide
├── FIREBASE_LOGIN_FIX.md           # Fix details
├── convert-firebase-key.js         # Helper script
├── check-firebase-backend.js       # Check script
├── env.example                     # Backend .env template
├── frontend/
│   ├── FIREBASE_SETUP.md           # Frontend Firebase setup
│   ├── ENV_SETUP.md                # Frontend env setup
│   ├── check-firebase-config.js    # Check script
│   └── .env.example                # Frontend .env template
└── mobile/
    ├── ROADMAP.md                  # Mobile roadmap
    ├── IMPLEMENTATION_GUIDE.md     # Implementation guide
    └── TROUBLESHOOTING.md          # Troubleshooting
```

---

## 🎯 Bắt Đầu Ở Đâu?

### Nếu bạn mới bắt đầu:
1. Đọc **[SETUP_QUICK.md](./SETUP_QUICK.md)** để setup nhanh
2. Nếu cần chi tiết, xem **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)**

### Nếu bạn muốn setup Firebase:
1. Đọc **[FIREBASE_COMPLETE_SETUP.md](./FIREBASE_COMPLETE_SETUP.md)**
2. Follow từng bước trong guide

### Nếu bạn gặp lỗi:
1. Xem **[DEBUG_FIREBASE.md](./DEBUG_FIREBASE.md)**
2. Xem **[TEST_FIREBASE_LOGIN.md](./TEST_FIREBASE_LOGIN.md)**
3. Check console logs và backend logs

---

**Last Updated:** 2024-11-30
