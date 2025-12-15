# 📱 Kế Hoạch Hoàn Thiện Mobile App

## 📊 Đánh Giá Hiện Trạng

### ✅ Đã Hoàn Thành

#### 1. **Kiến Trúc & Cấu Trúc**
- ✅ Clean Architecture đầy đủ (Core, Data, Domain, Presentation)
- ✅ State Management: Flutter Riverpod
- ✅ Navigation: GoRouter
- ✅ Dependency Injection: Riverpod Providers
- ✅ Error Handling: Custom Failure classes
- ✅ Logging: Logger service

#### 2. **Dependencies & Services**
- ✅ HTTP Client: Dio với interceptors
- ✅ Local Storage: Hive + SharedPreferences
- ✅ Firebase: Core + Messaging
- ✅ QR Scanner: mobile_scanner
- ✅ Biometric Auth: local_auth (đã setup, chưa implement)
- ✅ Connectivity: connectivity_plus
- ✅ Geolocation: geolocator
- ✅ Permissions: permission_handler
- ✅ Notifications: flutter_local_notifications

#### 3. **Features Đã Implement**
- ✅ Authentication (Login, JWT, Auto-logout)
- ✅ QR Code Scanning (Camera + Manual)
- ✅ Drug Verification (Chi tiết thuốc, Blockchain status)
- ✅ Supply Chain Timeline
- ✅ Offline Mode (Lưu scans, Auto-sync)
- ✅ User Profile
- ✅ Dark Mode
- ✅ Splash Screen

#### 4. **Models & Entities**
- ✅ Drug Model
- ✅ User Model
- ✅ Order Model
- ✅ Supply Chain Model
- ✅ Blockchain Transaction Model
- ✅ Inventory Model
- ✅ Offline Scan Model

---

## 🎯 Kế Hoạch Hoàn Thiện (Ưu Tiên)

### 🔴 **PRIORITY 1: Kết Nối Backend API** (1-2 tuần)

#### 1.1 Hoàn Thiện API Client

**✅ Đã hoàn thành:**
- ✅ `lib/core/api/dio_client.dart` - Đã có base URL, interceptors, error handling
- ✅ `lib/core/api/api_endpoints.dart` - Đã có đầy đủ endpoints (Auth, Drugs, Supply Chain, Blockchain, Inventory, Orders, Offline Sync, Verification History, Notifications, Settings, Reports)
- ✅ `lib/config/env/app_config.dart` - Đã có platform-specific URL handling

**Các Repository đã hoàn thiện:**
- ✅ `lib/data/repositories_impl/auth_repository_impl.dart` - Đã có, đã test
- ✅ `lib/data/repositories_impl/drug_repository_impl.dart` - Đã có, đã test
- ⚠️ `inventory_repository_impl.dart` - Chưa có (không bắt buộc cho MVP)
- ⚠️ `order_repository_impl.dart` - Chưa có (không bắt buộc cho MVP)

#### 1.2 Environment Configuration

**✅ Đã hoàn thành:**
- ✅ `lib/config/env/app_config.dart` - Đã được cấu hình đầy đủ với:
  - Tự động xử lý platform-specific URLs (Android Emulator, iOS Simulator, Web)
  - Fallback values nếu không có `.env`
  - Support cho tất cả các biến môi trường cần thiết
- ✅ `env.example` - Template file đã có sẵn
- ✅ `pubspec.yaml` - Đã có `.env` trong assets

**Cần thực hiện:**
1. **Tạo file `.env` từ template:**
   ```bash
   cd mobile
   cp env.example .env
   ```
   
   Hoặc chạy script có sẵn (Windows):
   ```bash
   create_env.bat
   ```

2. **Cấu hình `API_BASE_URL` trong `.env`:**
   ```env
   # Cho Android Emulator (tự động convert localhost -> 10.0.2.2)
   API_BASE_URL=http://localhost:5000/api
   
   # Cho iOS Simulator
   API_BASE_URL=http://localhost:5000/api
   
   # Cho Physical Device (thay YOUR_IP bằng IP máy tính)
   API_BASE_URL=http://192.168.1.100:5000/api
   
   # Cho Production
   API_BASE_URL=https://your-domain.com/api
   ```

3. **Kiểm tra `.gitignore` có `.env`:**
   ```gitignore
   .env
   .env.local
   ```

**Lưu ý:**
- `app_config.dart` đã tự động xử lý platform-specific URLs
- Nếu không có `.env`, app vẫn chạy với default values
- Xem chi tiết trong `SETUP_ENV.md`

---

### 🟡 **PRIORITY 2: Hoàn Thiện Screens** (2-3 tuần)

#### 2.1 Authentication Screens

**✅ Đã hoàn thành:**
- ✅ `lib/presentation/pages/auth/change_password_screen.dart` - Đã có đầy đủ
  - Form: Current password, New password, Confirm password
  - Validation
  - API call: `POST /auth/change-password`
  - Success/Error handling
  - Password visibility toggles
  - Loading overlay

**Đã cải thiện:**
- ✅ `login_screen.dart` - Đã có, đã test với backend
- ✅ Thêm "Remember me" checkbox - Đã có, lưu credentials
- ✅ Thêm "Forgot password" link - Đã có, navigate đến `/forgot-password`
- ✅ Biometric login - Đã integrate vào login screen

#### 2.2 Drug Verification Screens

**✅ Đã hoàn thành:**
- ✅ `drug_verification_screen.dart` - Đã có, đã test API
- ✅ `manual_verification_screen.dart` - Đã có, đã test API
- ✅ `verification_history_screen.dart` - Đã có đầy đủ
  - List tất cả scans đã thực hiện với pagination
  - Filter: Date range, Status (all, valid, expired, recalled, invalid, warning)
  - Search by drug name, batch number
  - Export to PDF/CSV (Popup menu, ExportService)
  - Empty state, loading state, error handling

#### 2.3 Offline Mode Screens

**✅ Đã hoàn thành:**
- ✅ `lib/presentation/pages/offline/offline_scans_screen.dart` - Đã có đầy đủ
  - List tất cả scans chưa sync
  - Status: Pending (chờ đồng bộ), Synced (đã đồng bộ)
  - Retry button cho từng scan (đã implement `retrySingleScan()`)
  - Delete button với confirmation dialog
  - Sync all button
  - Statistics (Total, Pending, Synced counts)
  - Empty state, loading state, error handling

#### 2.4 Settings Screens

**✅ Đã hoàn thành:**
- ✅ `lib/presentation/pages/settings/settings_screen.dart` - Đã có đầy đủ
  - Biometric Auth toggle (Switch)
  - Notification settings (Switch)
  - Language selection (Dropdown: vi/en)
  - Theme toggle (Switch: Dark mode)
  - About section (App info, Privacy Policy link, Terms of Service link)
  - Logout button với confirmation
- ✅ `lib/presentation/pages/settings/privacy_policy_screen.dart` - Đã có với nội dung đầy đủ
- ✅ `lib/presentation/pages/settings/terms_of_service_screen.dart` - Đã có với nội dung đầy đủ

#### 2.5 Home Screen

**✅ Đã hoàn thành:**
- ✅ `home_page.dart` - Đã có đầy đủ:
  - Quick actions (Scan QR card, Manual Verification card)
  - Recent verifications (5 verifications gần nhất với status badges)
  - Statistics (Today's scans count, Success rate percentage)
  - Sync status indicator (Warning card khi có unsynced scans, link đến `/offline-scans`)
  - Welcome section
  - Real-time data từ VerificationHistoryService và SyncService

---

### 🟢 **PRIORITY 3: Features Nâng Cao** (3-4 tuần)

#### 3.1 Biometric Authentication

**✅ Đã hoàn thành:**
- ✅ `lib/core/services/biometric_service.dart` - Đã có
- ✅ Biometric login đã integrate vào `login_screen.dart`
  - `_handleBiometricLogin()` method
  - Load saved credentials và auto login
  - Biometric button hiển thị khi available
- ⚠️ `biometric_setup_screen.dart` - Chưa có (không bắt buộc, có thể setup trong Settings)

#### 3.2 Notification Navigation

**✅ Đã hoàn thành:**
- ✅ `lib/core/services/notification_service_mobile.dart` - Đã cập nhật với deep links
- ✅ `lib/core/utils/notification_navigator.dart` - Helper mới để handle navigation
- ✅ `lib/config/routes/app_router.dart` - Routes đã có sẵn
- ✅ `lib/main.dart` - Đã set router cho NotificationNavigator

**Implementation:**
- ✅ Handle notification tap với data: drug_verification, supply_chain_update, verification_history
- ✅ Navigate đến đúng screen dựa trên notification type

#### 3.3 Verification History

**✅ Đã hoàn thành:**
- ✅ `lib/presentation/pages/history/verification_history_screen.dart` - Đã có đầy đủ
- ✅ `lib/data/models/verification_history_model.dart` - Đã có
- ✅ `lib/domain/entities/verification_history_entity.dart` - Đã có

**Features:**
- ✅ List view với pagination
- ✅ Filter: Date range, Status, Drug name
- ✅ Search
- ✅ Export to PDF/CSV (ExportService)
- ⚠️ Share verification result - Có thể thêm sau

#### 3.4 Sync Status Indicator

**✅ Đã hoàn thành:**
- ✅ Sync status đã được hiển thị trong HomePage
- ✅ Warning card khi có unsynced scans
- ✅ Link đến `/offline-scans`
- ✅ Statistics (unsynced count)

**Implementation:**
```dart
class SyncStatusIndicator extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncService = ref.watch(syncServiceProvider);
    final isSyncing = ref.watch(isSyncingProvider);
    final pendingCount = ref.watch(pendingScansCountProvider);
    final lastSyncTime = ref.watch(lastSyncTimeProvider);
    
    return Container(
      // Hiển thị sync status
    );
  }
}
```

---

## 📋 Checklist Hoàn Thiện

### Phase 1: Backend Integration (Tuần 1-2)
- [ ] Cấu hình API base URL trong `.env`
- [ ] Test API connection
- [ ] Hoàn thiện `dio_client.dart` với interceptors
- [ ] Test authentication flow
- [ ] Test drug verification API
- [ ] Test offline sync API
- [ ] Fix các lỗi API nếu có

### Phase 2: Screens Implementation (Tuần 3-5)
- [ ] Change Password Screen
- [ ] Offline Scans Screen
- [ ] Settings Screen
- [ ] Verification History Screen
- [ ] Cải thiện Home Screen
- [ ] Test tất cả screens với backend thật

### Phase 3: Advanced Features (Tuần 6-9)
- [ ] Biometric Authentication
- [ ] Notification Navigation
- [ ] Sync Status Indicator
- [ ] Export to PDF/CSV
- [ ] Search & Filter
- [ ] Performance optimization

### Phase 4: Testing & Polish (Tuần 10-11)
- [ ] Unit tests (target: 60% coverage)
- [ ] Widget tests cho các screens chính
- [ ] Integration tests cho critical flows
- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Performance testing

### Phase 5: Release Preparation (Tuần 12)
- [ ] Build production APK/IPA
- [ ] Test trên real devices
- [ ] Prepare release notes
- [ ] Submit to stores (nếu cần)

---

## 🛠️ Technical Tasks

### 1. API Integration

**File: `lib/core/api/dio_client.dart`**
```dart
class DioClient {
  late final Dio _dio;
  
  DioClient() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));
    
    // Add interceptors
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LoggingInterceptor());
    _dio.interceptors.add(ErrorInterceptor());
  }
  
  // Add methods for each API endpoint
  Future<Response> login(String email, String password) async {
    return await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
  }
  
  Future<Response> verifyDrug(String qrCode) async {
    return await _dio.get('/drugs/qr/$qrCode');
  }
  
  // ... more methods
}
```

### 2. Repository Implementation

**File: `lib/data/repositories_impl/drug_repository_impl.dart`**
```dart
class DrugRepositoryImpl implements DrugRepository {
  final DioClient dioClient;
  final HiveInterface hive;
  
  DrugRepositoryImpl({
    required this.dioClient,
    required this.hive,
  });
  
  @override
  Future<Either<Failure, DrugEntity>> verifyDrug(String qrCode) async {
    try {
      // Try API first
      final response = await dioClient.verifyDrug(qrCode);
      final drug = DrugModel.fromJson(response.data);
      return Right(drug.toEntity());
    } on DioException catch (e) {
      // Handle offline: save to Hive
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        // Save to offline queue
        await _saveOfflineScan(qrCode);
        return Left(NetworkFailure('No internet connection'));
      }
      return Left(ServerFailure(e.message ?? 'Unknown error'));
    }
  }
}
```

### 3. State Management

**File: `lib/presentation/blocs/drug_provider.dart`**
```dart
final drugVerificationProvider = StateNotifierProvider.autoDispose<
    DrugVerificationNotifier, DrugVerificationState>(
  (ref) {
    final repository = ref.watch(drugRepositoryProvider);
    return DrugVerificationNotifier(repository);
  },
);

class DrugVerificationNotifier extends StateNotifier<DrugVerificationState> {
  final DrugRepository repository;
  
  DrugVerificationNotifier(this.repository)
      : super(DrugVerificationState.initial());
  
  Future<void> verifyDrug(String qrCode) async {
    state = state.copyWith(isLoading: true);
    
    final result = await repository.verifyDrug(qrCode);
    
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (drug) => state = state.copyWith(
        isLoading: false,
        drug: drug,
        error: null,
      ),
    );
  }
}
```

---

## 📱 Testing Strategy

### Unit Tests
```dart
// test/domain/usecases/verify_drug_usecase_test.dart
void main() {
  group('VerifyDrugUseCase', () {
    test('should return DrugEntity when verification succeeds', () async {
      // Arrange
      final mockRepository = MockDrugRepository();
      when(mockRepository.verifyDrug(any))
          .thenAnswer((_) async => Right(tDrugEntity));
      
      final usecase = VerifyDrugUseCase(mockRepository);
      
      // Act
      final result = await usecase('QR123');
      
      // Assert
      expect(result, isA<Right>());
      verify(mockRepository.verifyDrug('QR123')).called(1);
    });
  });
}
```

### Widget Tests
```dart
// test/presentation/pages/drug_verification_screen_test.dart
void main() {
  testWidgets('should display drug information when verified', (tester) async {
    // Arrange
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: DrugVerificationScreen(),
        ),
      ),
    );
    
    // Act
    await tester.enterText(find.byType(TextField), 'QR123');
    await tester.tap(find.text('Verify'));
    await tester.pumpAndSettle();
    
    // Assert
    expect(find.text('Drug Name'), findsOneWidget);
  });
}
```

---

## 🚀 Quick Start Guide

### 1. Setup Environment
```bash
cd mobile
cp .env.example .env
# Edit .env với API base URL của bạn
```

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Generate Code
```bash
# Generate Hive adapters
flutter pub run build_runner build --delete-conflicting-outputs

# Generate JSON serialization
flutter pub run build_runner build
```

### 4. Run App
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios
```

---

## 📝 Notes

1. **API Base URL**: Đảm bảo backend đang chạy và accessible từ mobile device/emulator
   - Emulator: `http://10.0.2.2:5000` (Android)
   - iOS Simulator: `http://localhost:5000`
   - Real device: `http://YOUR_COMPUTER_IP:5000`

2. **Firebase**: Đã setup, chỉ cần đảm bảo `google-services.json` (Android) và `GoogleService-Info.plist` (iOS) đã được thêm vào project

3. **Offline Mode**: Sử dụng Hive để lưu scans offline, tự động sync khi có mạng

4. **Testing**: Bắt đầu với manual testing, sau đó viết unit tests và widget tests

---

**Last Updated:** 2024-11-29  
**Version:** 1.0.0

