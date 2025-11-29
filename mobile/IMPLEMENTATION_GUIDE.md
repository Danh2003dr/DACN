# Implementation Guide - 3 Critical Features

Hướng dẫn triển khai 3 tính năng quan trọng cho demo.

## 📋 Tổng quan

Đã implement 3 tính năng:
1. **Offline Mode cho QR Scanner** - Lưu scans khi offline, sync khi online
2. **Profile & Settings Screen** - Màn hình hồ sơ với settings
3. **Push Notifications (Firebase)** - Thông báo đẩy với Firebase Messaging

---

## 🔧 1. Offline Mode cho QR Scanner

### Cấu trúc:

#### Files đã tạo:
- `lib/data/models/offline_scan_model.dart` - Hive model cho offline scans
- `lib/core/services/connectivity_service.dart` - Service check connectivity
- `lib/core/services/sync_service.dart` - Service sync offline scans
- `lib/core/providers/services_provider.dart` - Riverpod providers

#### Files đã modify:
- `lib/data/repositories_impl/drug_repository_impl.dart` - Check connectivity trước khi call API
- `lib/main.dart` - Register Hive adapter

### Cách hoạt động:

1. **Khi Online:**
   - `DrugRepositoryImpl.verifyDrug()` check connectivity
   - Nếu online → Call API bình thường

2. **Khi Offline:**
   - Lưu scan vào Hive box `offline_scans`
   - Return mock data với flag `isOffline: true`
   - UI hiển thị warning "Chế độ offline"

3. **Khi Online lại:**
   - `SyncService` tự động detect connectivity change
   - Sync tất cả offline scans lên server
   - Mark scans là `synced: true`

### Sử dụng:

```dart
// DrugRepositoryImpl tự động check connectivity
final result = await drugRepository.verifyDrug(qrData);

// Result có thể có flag 'isOffline: true'
if (result['isOffline'] == true) {
  // Hiển thị warning offline
}
```

### Hive Setup:

Adapter đã được register trong `main.dart`:
```dart
if (!Hive.isAdapterRegistered(0)) {
  Hive.registerAdapter(OfflineScanModelAdapter());
}
```

---

## 👤 2. Profile & Settings Screen

### Files đã tạo:
- `lib/presentation/pages/profile/profile_screen.dart` - Profile screen
- `lib/presentation/blocs/theme_provider.dart` - Theme state management

### Features:

1. **User Info Display:**
   - Avatar (CircleAvatar với chữ cái đầu)
   - Name, Email, Role

2. **Settings:**
   - **Change Password** - Navigate (TODO: implement screen)
   - **Dark Mode Toggle** - Switch giữa Light/Dark/System
   - **Logout** - Clear auth & redirect to login

3. **Theme Management:**
   - `ThemeProvider` lưu preference vào SharedPreferences
   - Auto-apply theme khi app start

### Routing:

Đã thêm route `/profile` vào `app_router.dart`.

Access từ HomePage: Icon button trên AppBar.

### Sử dụng:

```dart
// Navigate to profile
context.push('/profile');

// Toggle theme
ref.read(themeProvider.notifier).setThemeMode(ThemeMode.dark);
```

---

## 🔔 3. Push Notifications (Firebase)

### Files đã tạo:
- `lib/core/services/notification_service.dart` - Notification service

### Features:

1. **Firebase Messaging Setup:**
   - Initialize Firebase Messaging
   - Request permissions
   - Get FCM token

2. **Local Notifications:**
   - Show local notifications khi app ở foreground
   - Handle notification tap

3. **Background Handling:**
   - Background message handler
   - Handle app opened from notification

### Firebase Setup Required:

1. **Add Firebase to project:**
   ```bash
   flutterfire configure
   ```

2. **Android Setup:**
   - Add `google-services.json` to `android/app/`
   - Update `android/build.gradle` và `android/app/build.gradle`

3. **iOS Setup:**
   - Add `GoogleService-Info.plist` to `ios/Runner/`
   - Enable Push Notifications capability

### Initialization:

Service được init trong `main.dart`:
```dart
final notificationService = NotificationService();
await notificationService.init();
```

### Sử dụng:

```dart
// Subscribe to topic
await NotificationService().subscribeToTopic('drug_recalls');

// Get FCM token
final token = NotificationService().fcmToken;
```

### Notification Payload Example:

```json
{
  "notification": {
    "title": "Cảnh báo thuốc",
    "body": "Thuốc ABC123 đã bị thu hồi"
  },
  "data": {
    "type": "drug_recall",
    "drugId": "drug123"
  }
}
```

---

## 📦 Dependencies đã thêm:

```yaml
firebase_core: ^2.24.2
firebase_messaging: ^14.7.9
flutter_local_notifications: ^16.3.0
connectivity_plus: ^5.0.2  # Đã có sẵn
```

---

## 🚀 Setup Instructions:

### 1. Install Dependencies:
```bash
cd mobile
flutter pub get
```

### 2. Generate Hive Adapters:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Firebase Setup (cho Notifications):
```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase
flutterfire configure
```

### 4. Run App:
```bash
flutter run
```

---

## ⚠️ Notes:

1. **Offline Mode:**
   - Hive chỉ hoạt động trên mobile (không phải web)
   - Adapter phải được register trước khi mở box

2. **Notifications:**
   - Firebase cần được configure đúng cách
   - Android cần `google-services.json`
   - iOS cần `GoogleService-Info.plist`
   - Background handler phải là top-level function

3. **Theme:**
   - Theme preference được lưu trong SharedPreferences
   - Key: `theme_mode`

---

## 🐛 Troubleshooting:

### Offline scans không sync:
- Check connectivity service đang chạy
- Check Hive box đã mở
- Check logs trong `SyncService._syncOfflineScans()`

### Notifications không hoạt động:
- Check Firebase đã configure
- Check permissions đã được grant
- Check FCM token đã được lấy
- Check background handler đã được register

### Theme không apply:
- Check `ThemeProvider` đã được watch trong `MyApp`
- Check SharedPreferences có lưu theme mode

---

## ✅ Testing Checklist:

- [ ] QR Scanner hoạt động khi online
- [ ] QR Scanner lưu vào offline khi mất mạng
- [ ] Offline scans tự động sync khi có mạng lại
- [ ] Profile screen hiển thị đúng user info
- [ ] Dark mode toggle hoạt động
- [ ] Logout clear data và redirect
- [ ] Notifications hiển thị khi app ở foreground
- [ ] Notifications mở app khi tap (terminated state)
- [ ] Background notifications được handle

---

## 📝 Next Steps:

1. Implement Change Password screen
2. Add navigation từ notification tap đến drug detail
3. Add notification settings (enable/disable)
4. Add offline scan history screen
5. Add sync status indicator

