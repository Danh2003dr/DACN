# 🔥 Firebase Setup Guide

## Tổng quan

Hướng dẫn setup Firebase cho mobile app (Android).

## Bước 1: Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project**
3. Đặt tên project
4. Enable Google Analytics (optional)
5. **Create Project**

## Bước 2: Thêm Android App

1. Trong Firebase Console, click **Add App** → **Android**
2. Điền thông tin:
   - Package name: `com.example.drug_traceability_mobile`
   - App nickname: `Drug Traceability Mobile`
   - Debug signing certificate SHA-1: (optional)
3. Click **Register app**
4. Download `google-services.json`
5. Đặt file vào: `android/app/google-services.json`

## Bước 3: Cài đặt Firebase CLI

```bash
npm install -g firebase-tools
```

## Bước 4: Đăng nhập Firebase

```bash
firebase login
```

## Bước 5: Cấu hình FlutterFire

```bash
cd mobile
dart pub global activate flutterfire_cli
flutterfire configure
```

Chọn:
- Firebase project
- Platforms: Android (và iOS nếu cần)

## Bước 6: Kiểm tra

File `lib/firebase_options.dart` đã được tạo và có cấu hình Firebase.

## Lưu ý

- **Web**: Firebase Messaging không hoạt động tốt trên web, app sẽ tự động skip Firebase init trên web
- **Android Emulator**: Đảm bảo emulator có đủ dung lượng (ít nhất 4GB internal storage)
- **Build Errors**: Nếu gặp lỗi, xem `ANDROID_BUILD_FIX.md` (nếu có)

---

**Setup xong!** 🎉

