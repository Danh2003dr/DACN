# 🔧 Hướng Dẫn Setup & Kết Nối Backend API

## 📋 Mục Lục

1. [Setup Environment Variables](#setup-environment-variables)
2. [Kết Nối Backend API](#kết-nối-backend-api)
3. [Debugging](#debugging)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Setup Environment Variables

### ✅ Kiểm Tra Hiện Trạng

**Đã Có Sẵn:**
- ✅ `lib/config/env/app_config.dart` - Đã được cấu hình đầy đủ với:
  - Tự động xử lý platform-specific URLs (Android Emulator, iOS Simulator, Web)
  - Fallback values nếu không có `.env`
  - Support cho tất cả các biến môi trường cần thiết
- ✅ `env.example` - Template file với tất cả các biến môi trường
- ✅ `lib/core/api/dio_client.dart` - Đã có sẵn với interceptors
- ✅ `lib/core/api/api_endpoints.dart` - Đã có đầy đủ endpoints

**Cần Tạo:**
- ⚠️ File `.env` - Chưa có, cần tạo từ `env.example`

---

### 📋 Các Bước Setup

#### Bước 1: Tạo file `.env`

**Trên Windows:**
```bash
cd mobile
copy env.example .env
```

**Trên Linux/Mac:**
```bash
cd mobile
cp env.example .env
```

**Hoặc tạo thủ công:**
Tạo file `.env` trong thư mục `mobile/` với nội dung:

```env
# Backend API Configuration
API_BASE_URL=http://localhost:5000/api

# App Configuration
APP_NAME=Drug Traceability System
APP_VERSION=1.0.0
ENV_TYPE=dev
```

#### Bước 2: Cấu hình API Base URL

Mở file `.env` và cập nhật `API_BASE_URL` theo platform bạn đang sử dụng:

**Cho Android Emulator:**
```env
API_BASE_URL=http://localhost:5000/api
```
**Lưu ý:** `app_config.dart` sẽ tự động convert `localhost` → `10.0.2.2` cho Android Emulator

**Cho iOS Simulator:**
```env
API_BASE_URL=http://localhost:5000/api
```

**Cho Physical Device (Android/iOS):**
```env
# Thay YOUR_IP bằng IP máy tính của bạn
API_BASE_URL=http://192.168.1.100:5000/api
```

**Cách lấy IP máy tính:**
- **Windows:** Mở Command Prompt, chạy `ipconfig`, tìm "IPv4 Address"
- **Mac/Linux:** Mở Terminal, chạy `ifconfig` hoặc `ip addr`, tìm IP của network interface

**Cho Production:**
```env
API_BASE_URL=https://your-domain.com/api
```

#### Bước 3: Kiểm tra `.gitignore`

Đảm bảo file `.env` đã được thêm vào `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

#### Bước 4: Test Configuration

Chạy app và kiểm tra console logs:

```dart
// Trong main.dart hoặc app_config.dart, bạn sẽ thấy:
print('🌐 API Base URL: ${AppConfig.apiBaseUrl}');
```

---

### 📝 Chi Tiết Các Biến Môi Trường

#### Bắt Buộc:

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `API_BASE_URL` | URL của backend API | `http://localhost:5000/api` |

#### Tùy Chọn:

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `APP_NAME` | Tên ứng dụng | `Drug Traceability System` |
| `APP_VERSION` | Phiên bản ứng dụng | `1.0.0` |
| `ENV_TYPE` | Môi trường: `dev`, `staging`, `prod` | `dev` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID (nếu cần override) | `null` |
| `FIREBASE_API_KEY` | Firebase API Key (nếu cần override) | `null` |

---

### 🔍 Cách AppConfig Hoạt Động

#### 1. Platform-Specific URL Handling

`app_config.dart` tự động xử lý URLs cho từng platform:

```dart
// Web: http://localhost:5000/api
// Android Emulator: http://10.0.2.2:5000/api (tự động convert)
// iOS Simulator: http://localhost:5000/api
// Physical Device: Giữ nguyên URL từ .env
```

#### 2. Fallback Values

Nếu không có file `.env` hoặc biến không được định nghĩa, app sẽ sử dụng giá trị mặc định:

```dart
// Nếu không có .env
apiBaseUrl → 'http://10.0.2.2:5000/api' (Android) hoặc 'http://localhost:5000/api' (Web/iOS)
appName → 'Drug Traceability System'
appVersion → '1.0.0'
envType → 'dev'
```

#### 3. Error Handling

App sẽ không crash nếu:
- File `.env` không tồn tại
- Biến môi trường không được định nghĩa
- Giá trị không hợp lệ

---

## 🔌 Kết Nối Backend API

### ✅ Đã Hoàn Thành

1. **API Endpoints**
   - ✅ Tạo file `lib/core/api/api_endpoints.dart` với tất cả các endpoints
   - ✅ Cập nhật `auth_repository_impl.dart` để sử dụng `ApiEndpoints`
   - ✅ Cập nhật `drug_repository_impl.dart` để sử dụng `ApiEndpoints`

2. **Configuration**
   - ✅ `lib/config/env/app_config.dart` - Đã có sẵn, tự động xử lý platform-specific URLs
   - ✅ `lib/core/api/dio_client.dart` - Đã có sẵn với interceptors
   - ✅ Tạo file `env.example` làm template

---

### 📋 Các Bước Kết Nối

#### Bước 1: Kiểm tra Backend đang chạy

Đảm bảo backend server đang chạy và accessible:

```bash
# Test từ terminal
curl http://localhost:5000/api/auth/login
```

#### Bước 2: Test kết nối từ app

1. Chạy app:
```bash
flutter run
```

2. Thử đăng nhập với credentials hợp lệ
3. Kiểm tra console logs để xem API calls

---

### 📝 API Endpoints Reference

#### Authentication
```dart
ApiEndpoints.login              // POST /auth/login
ApiEndpoints.logout             // POST /auth/logout
ApiEndpoints.changePassword     // POST /auth/change-password
ApiEndpoints.forgotPassword     // POST /auth/forgot-password
ApiEndpoints.resetPassword      // POST /auth/reset-password
ApiEndpoints.getCurrentUser     // GET /auth/me
ApiEndpoints.updateProfile      // PUT /auth/profile
```

#### Drugs
```dart
ApiEndpoints.drugs                              // GET /drugs
ApiEndpoints.drugById('123')                    // GET /drugs/123
ApiEndpoints.drugByQR('QR123')                  // GET /drugs/qr/QR123
ApiEndpoints.scanQR                             // POST /drugs/scan-qr
ApiEndpoints.verifyDrug                         // POST /drugs/verify
ApiEndpoints.drugSupplyChains('123')            // GET /drugs/123/supply-chains
ApiEndpoints.drugBlockchainTransactions('123')   // GET /drugs/123/blockchain-transactions
```

#### Supply Chain
```dart
ApiEndpoints.supplyChains              // GET /supply-chain
ApiEndpoints.supplyChainById('123')    // GET /supply-chain/123
ApiEndpoints.supplyChainSteps('123')   // GET /supply-chain/123/steps
ApiEndpoints.addSupplyChainStep('123') // POST /supply-chain/123/steps
```

#### Blockchain
```dart
ApiEndpoints.blockchainTransactions              // GET /blockchain/transactions
ApiEndpoints.blockchainTransactionById('123')    // GET /blockchain/transactions/123
ApiEndpoints.blockchainVerify                    // POST /blockchain/verify
ApiEndpoints.blockchainDrugs                     // GET /blockchain/drugs
ApiEndpoints.blockchainDrugById('123')           // GET /blockchain/drugs/123
```

#### Offline Sync
```dart
ApiEndpoints.syncScans                  // POST /scans/sync
ApiEndpoints.offlineScans               // GET /scans/offline
ApiEndpoints.offlineScanById('123')     // GET /scans/offline/123
ApiEndpoints.retryOfflineScan('123')    // POST /scans/offline/123/retry
```

#### Verification History
```dart
ApiEndpoints.verificationHistory        // GET /verifications
ApiEndpoints.verificationById('123')   // GET /verifications/123
ApiEndpoints.exportVerifications        // GET /verifications/export
```

---

### 🧪 Testing

#### Test Authentication
```dart
final authRepo = AuthRepositoryImpl(DioClient());
final result = await authRepo.login('email@example.com', 'password');
result.fold(
  (failure) => print('Error: ${failure.message}'),
  (data) => print('Success: ${data['token']}'),
);
```

#### Test Drug Verification
```dart
final drugRepo = DrugRepositoryImpl(DioClient());
final result = await drugRepo.verifyDrug('QR_CODE_HERE');
result.fold(
  (failure) => print('Error: ${failure.message}'),
  (data) => print('Drug: ${data.name}'),
);
```

---

## 🔍 Debugging

### Kiểm tra API Base URL

Thêm log trong `main.dart`:

```dart
print('🌐 API Base URL: ${AppConfig.apiBaseUrl}');
```

### Kiểm tra Network Requests

DioClient đã có logging tự động. Xem console logs:
- `Request: POST /auth/login`
- `Response: 200 /auth/login`
- `Error: 401 /auth/login`

---

## 🐛 Troubleshooting

### Vấn đề: App không load `.env` file

**Giải pháp:**
1. Kiểm tra file `.env` có trong thư mục `mobile/` không
2. Kiểm tra file có được thêm vào `pubspec.yaml`:
   ```yaml
   flutter:
     assets:
       - .env
   ```
3. Restart app sau khi tạo/sửa `.env`

### Vấn đề: API calls fail với "Connection refused"

**Giải pháp:**
1. Kiểm tra backend server có đang chạy không
2. Kiểm tra `API_BASE_URL` có đúng không
3. Cho Physical Device: Đảm bảo máy tính và device cùng mạng WiFi
4. Cho Physical Device: Kiểm tra firewall có block port 5000 không

### Vấn đề: Android Emulator không kết nối được

**Giải pháp:**
- Sử dụng `http://localhost:5000/api` trong `.env`
- `app_config.dart` sẽ tự động convert thành `http://10.0.2.2:5000/api`
- Hoặc dùng trực tiếp `http://10.0.2.2:5000/api`

### Vấn đề: iOS Simulator không kết nối được

**Giải pháp:**
- Sử dụng `http://localhost:5000/api` trong `.env`
- Đảm bảo backend đang chạy trên máy Mac

### Vấn đề: Connection Timeout

```
Error: Connection timeout
```

**Giải pháp:**
- Kiểm tra backend có đang chạy không
- Kiểm tra firewall có block port 5000 không
- Kiểm tra API_BASE_URL có đúng không

### Vấn đề: 401 Unauthorized

```
Error: 401 Unauthorized
```

**Giải pháp:**
- Token hết hạn → Đăng nhập lại
- Token không hợp lệ → Clear app data và đăng nhập lại

### Vấn đề: 404 Not Found

```
Error: 404 Not Found
```

**Giải pháp:**
- Endpoint không tồn tại → Kiểm tra `api_endpoints.dart`
- Path parameter sai → Kiểm tra cách gọi API

---

## 📚 Tài Liệu Tham Khảo

- [Flutter dotenv package](https://pub.dev/packages/flutter_dotenv)
- [Android Emulator Networking](https://developer.android.com/studio/run/emulator-networking)
- [iOS Simulator Networking](https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device)
- [Dio HTTP Client](https://pub.dev/packages/dio)

---

## 📚 Next Steps

Sau khi kết nối API thành công:

1. ✅ Test tất cả các API endpoints
2. ✅ Implement các screens (Change Password, Offline Scans, Verification History, Settings)
3. ✅ Thêm error handling tốt hơn
4. ✅ Thêm loading states
5. ✅ Thêm retry logic cho failed requests

---

**Last Updated:** 2024-12-06

