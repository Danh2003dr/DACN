# 🔧 Troubleshooting Guide

## Các Vấn Đề Thường Gặp

### 1. Lỗi Build Android

#### Lỗi: Kotlin Daemon Compilation Failed
```bash
# Giải pháp:
cd android
.\gradlew.bat --stop
cd ..
flutter clean
flutter pub get
flutter run
```

#### Lỗi: Không đủ dung lượng (INSTALL_FAILED_INSUFFICIENT_STORAGE)
1. Mở Android Studio → Device Manager
2. Edit emulator → Show Advanced Settings
3. Tăng Internal Storage lên 8GB
4. Wipe Data (Cold Boot)

#### Lỗi: Java version obsolete warnings
Đã được fix trong `android/app/build.gradle.kts` - Java 17.

---

### 2. Lỗi Đăng Nhập

#### Web: Không kết nối được server
- Kiểm tra backend đang chạy: `http://localhost:5000`
- API URL tự động: Web dùng `localhost`, Android emulator dùng `10.0.2.2`
- Hot restart app (nhấn 'R')

#### Mất chữ khi gõ
Đã được fix - AppInput widget đã có FocusNode management.

---

### 3. Lỗi Firebase

#### Firebase chưa được cấu hình
```bash
# Cài Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Cấu hình FlutterFire
cd mobile
dart pub global activate flutterfire_cli
flutterfire configure
```

#### Lỗi trên Web
App tự động skip Firebase trên web (Firebase Messaging không hoạt động tốt).

---

### 4. Lỗi Quét QR Code

#### Type cast error
Đã được fix - Parse dữ liệu an toàn hơn, handle nested objects.

#### Không hiển thị thông tin
- Kiểm tra backend đang chạy
- Kiểm tra API URL đúng
- Xem logs trong console

---

### 5. Lỗi Blockchain Sync

#### Dữ liệu chưa lên blockchain
```bash
# Kiểm tra trạng thái
npm run check:blockchain

# Sync dữ liệu
npm run sync:blockchain
```

---

## 🚀 Quick Fixes

### Xóa cache và rebuild
```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

### Stop Gradle daemons
```bash
cd mobile/android
.\gradlew.bat --stop
```

### Tạo .env file
Chạy: `create_env.bat` hoặc tạo file `.env` với:
```env
API_BASE_URL=http://10.0.2.2:5000/api
```

---

**Xem thêm:** `DOCUMENTATION_INDEX.md` để tìm tài liệu chi tiết hơn.

