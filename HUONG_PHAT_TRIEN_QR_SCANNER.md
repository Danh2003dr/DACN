# HƯỚNG PHÁT TRIỂN TÍNH NĂNG QUÉT MÃ QR

## 📋 MỤC LỤC
1. [Hiện trạng](#hiện-trạng)
2. [Hướng phát triển ngắn hạn (1-2 tháng)](#hướng-phát-triển-ngắn-hạn)
3. [Hướng phát triển trung hạn (3-6 tháng)](#hướng-phát-triển-trung-hạn)
4. [Hướng phát triển dài hạn (6-12 tháng)](#hướng-phát-triển-dài-hạn)
5. [Các tính năng nâng cao](#các-tính-năng-nâng-cao)

---

## 📊 HIỆN TRẠNG

### ✅ Tính năng hiện có

#### Frontend (QRScanner.js)
- ✅ **Quét QR bằng camera (BrowserMultiFormatReader)** - ĐÃ LÀM
  - Sử dụng `BrowserMultiFormatReader` từ `@zxing/library`
  - Có `startCameraScan()`, `stopCameraScan()`, `videoRef`
  - Hiển thị khung căn chỉnh QR code khi quét
  - Xử lý lỗi camera không khả dụng

- ✅ **Tải ảnh lên để quét QR** - ĐÃ LÀM
  - Có `handleFileUpload()` với `decodeFromImage()`
  - Hỗ trợ upload file ảnh
  - Xử lý lỗi khi không đọc được QR từ ảnh

- ✅ **Nhập mã QR thủ công** - ĐÃ LÀM
  - Có `showManualInput`, `manualQR` state
  - Form nhập tay với `handleManualSubmit()`
  - Hỗ trợ nhập blockchainId, drugId, batchNumber

- ✅ **Lịch sử quét (lưu trong localStorage, tối đa 10 lần)** - ĐÃ LÀM
  - `scanHistory` state, `saveToHistory()` function
  - Lưu vào localStorage với key `qrScanHistory`
  - Giới hạn 10 lần quét gần nhất (`slice(0, 9)`)
  - Hiển thị lịch sử với icon success/error
  - Có nút xóa lịch sử (`clearHistory()`)

- ✅ **Hiển thị thông tin thuốc sau khi quét** - ĐÃ LÀM
  - Hiển thị đầy đủ: tên, batchNumber, activeIngredient, dosage, form
  - Hiển thị: productionDate, expiryDate, qualityTest, manufacturer
  - Hiển thị distribution history (hành trình phân phối)
  - Card layout đẹp với grid 2 cột

- ⚠️ **Cảnh báo thuốc hết hạn, bị thu hồi** - ĐÃ LÀM (PARTIAL)
  - Backend check và trả về warning/error
  - Frontend hiển thị `isExpired`, `isNearExpiry`, `daysUntilExpiry` từ drugInfo
  - Hiển thị màu đỏ nếu hết hạn, màu cam nếu gần hết hạn
  - ⚠️ CHƯA: Frontend chưa hiển thị modal cảnh báo lớn cho thuốc bị thu hồi/hết hạn

- ✅ **Xử lý verification URL** - ĐÃ LÀM
  - Extract blockchainId/drugId từ URL `/verify/...` trong `processQRData()`
  - Bỏ qua các URL scheme không hợp lệ (tel:, mailto:, sms:)

#### Backend
- ✅ **API `/api/drugs/scan-qr` - Quét và tra cứu thuốc** - ĐÃ LÀM
  - Route: `POST /api/drugs/scan-qr` với `authenticate` middleware
  - Controller: `scanQRCode()` trong `drugController.js`
  - Sử dụng `Drug.findByQRCode(qrData)` để tìm thuốc

- ✅ **API `/api/drugs/verify/:blockchainId` - Xác minh công khai (public)** - ĐÃ LÀM
  - Route: `GET /api/drugs/verify/:blockchainId` (public, không cần authenticate)
  - Controller: `verifyQRCode()` trong `drugController.js`
  - Hỗ trợ nhiều định dạng: blockchainId, drugId, batchNumber

- ✅ **Kiểm tra thuốc bị thu hồi (`isRecalled`)** - ĐÃ LÀM
  - Check trong `scanQRCode()`: `if (drug.isRecalled)`
  - Trả về status 400 với message cảnh báo
  - Kèm theo `recallReason` và `recallDate`

- ✅ **Kiểm tra thuốc hết hạn (`isExpired`)** - ĐÃ LÀM
  - Check trong `scanQRCode()`: `if (drug.isExpired)`
  - Sử dụng virtual `isExpired` từ Drug model
  - Trả về status 400 với message cảnh báo
  - Kèm theo `expiryDate` và `daysExpired`

- ✅ **Kiểm tra thuốc gần hết hạn (`isNearExpiry` - 30 ngày)** - ĐÃ LÀM
  - Check trong `scanQRCode()`: `if (drug.isNearExpiry)`
  - Sử dụng virtual `isNearExpiry` từ Drug model (30 ngày)
  - Trả về status 200 với `warning` message
  - Kèm theo `daysUntilExpiry`

- ✅ **Tìm kiếm linh hoạt (blockchainId, drugId, batchNumber, từ SupplyChain)** - ĐÃ LÀM
  - `Drug.findByQRCode()`: thử parse JSON, tìm theo blockchainId, drugId
  - `verifyQRCode()`: thử 5 cách:
    1. Tìm theo `blockchain.blockchainId`
    2. Tìm theo `drugId` (nếu bắt đầu bằng "DRUG_")
    3. Tìm theo `batchNumber`
    4. Tìm theo `drugId` (trường hợp khác)
    5. Tìm từ `SupplyChain` (qrCode.blockchainId, qrCode.code, drugBatchNumber)

#### Blockchain Integration
- ⚠️ **Verify với blockchain (nếu có `blockchainId`)** - ĐÃ LÀM (PARTIAL)
  - ✅ Trong `verifyQRCode()`: có gọi `blockchainService.getDrugBatchFromBlockchain()`
  - ✅ Check `drug.blockchain?.isOnBlockchain` trước khi fetch
  - ✅ Trả về `blockchainData` trong response
  - ❌ CHƯA: `scanQRCode()` KHÔNG fetch blockchain data
  - ❌ CHƯA: Frontend không hiển thị blockchain data từ `scanQRCode()`

- ⚠️ **Hiển thị thông tin blockchain trong kết quả** - ĐÃ LÀM (PARTIAL)
  - ✅ Có nút "Xem trên blockchain" trong QRScanner (mở link `/verify/${blockchainId}`)
  - ❌ CHƯA: Không hiển thị trực tiếp blockchain data (transactionHash, blockNumber, v.v.) trong kết quả scan
  - ✅ Hiển thị trong `verifyQRCode` response (nhưng frontend chưa dùng endpoint này)

### ⚠️ Hạn chế hiện tại

1. **Lịch sử quét**: Chỉ lưu local (localStorage), không đồng bộ với server
2. **Không có offline mode**: Cần kết nối internet để quét
3. **Không có analytics**: Không theo dõi số lần quét, thống kê
4. **Thiếu thông báo real-time**: Không có push notification
5. **Chưa có mobile app**: Chỉ có web app
6. **Không có batch scanning**: Chỉ quét từng mã một
7. **Thiếu validation nâng cao**: Chưa có kiểm tra chữ ký số, hash validation
8. **Không có export**: Không xuất lịch sử quét ra file

---

## 🚀 HƯỚNG PHÁT TRIỂN NGẮN HẠN (1-2 tháng)

### 1. Cải thiện UX/UI

#### 1.1. Giao diện quét nâng cao
- [ ] Thêm hiệu ứng loading khi quét
- [ ] Hiển thị khung căn chỉnh QR code khi quét camera
- [ ] Thêm âm thanh/phản hồi rung khi quét thành công
- [ ] Dark mode cho giao diện quét
- [ ] Tự động phóng to vùng có QR code trong ảnh

#### 1.2. Cải thiện hiển thị kết quả
- [ ] Card layout đẹp hơn cho thông tin thuốc
- [ ] Thêm biểu đồ timeline cho hành trình phân phối
- [ ] Hiển thị bản đồ vị trí (nếu có GPS data)
- [ ] Thêm ảnh sản phẩm (nếu có)
- [ ] Thêm nút "Chia sẻ" kết quả

#### 1.3. Xử lý lỗi tốt hơn
- [ ] Hướng dẫn cụ thể khi không tìm thấy QR code
- [ ] Gợi ý các bước khắc phục khi quét lỗi
- [ ] Retry mechanism tự động
- [ ] Hiển thị lỗi chi tiết hơn (QR không hợp lệ, thuốc giả, v.v.)

### 2. Lưu trữ và đồng bộ lịch sử

#### 2.1. Lưu lịch sử lên server
- [ ] Tạo API `/api/scan-history` để lưu lịch sử quét
- [ ] Model `ScanHistory` trong database
- [ ] Đồng bộ giữa localStorage và server
- [ ] Lọc và tìm kiếm lịch sử quét
- [ ] Phân trang cho lịch sử quét

**Database Schema:**
```javascript
{
  userId: ObjectId,
  qrData: String,
  drugId: ObjectId,
  scanResult: {
    success: Boolean,
    message: String,
    drugData: Object,
    blockchainData: Object
  },
  scanMethod: String, // 'camera', 'upload', 'manual'
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  deviceInfo: {
    userAgent: String,
    platform: String
  },
  timestamp: Date
}
```

#### 2.2. Export lịch sử
- [ ] Export ra CSV
- [ ] Export ra PDF
- [ ] In trực tiếp từ trình duyệt
- [ ] Lọc theo ngày, thuốc, kết quả

### 3. Validation và bảo mật nâng cao

#### 3.1. Kiểm tra chữ ký số
- [ ] Validate digital signature từ blockchain
- [ ] Kiểm tra data hash
- [ ] Xác minh tính toàn vẹn của dữ liệu

#### 3.2. Phát hiện thuốc giả
- [ ] So sánh QR code với dữ liệu blockchain
- [ ] Kiểm tra tính nhất quán của thông tin
- [ ] Phát hiện QR code bị sao chép/nhân bản
- [ ] Cảnh báo nếu QR code đã được quét nhiều lần tại nhiều địa điểm khác nhau

#### 3.3. Rate limiting
- [ ] Giới hạn số lần quét trong một khoảng thời gian
- [ ] Chống spam/abuse
- [ ] IP-based rate limiting

### 4. Thông báo và cảnh báo

#### 4.1. Cảnh báo nâng cao
- [ ] Cảnh báo thuốc gần hết hạn (có thể cấu hình số ngày)
- [ ] Cảnh báo thuốc bị thu hồi
- [ ] Cảnh báo thuốc nghi ngờ giả
- [ ] Thông báo khi có cập nhật mới về thuốc đã quét

#### 4.2. Thông báo real-time (WebSocket)
- [ ] Thông báo khi có cảnh báo mới
- [ ] Cập nhật trạng thái thuốc real-time
- [ ] Thông báo khi thuốc được cập nhật trên blockchain

---

## 🔧 HƯỚNG PHÁT TRIỂN TRUNG HẠN (3-6 tháng)

### 1. Offline Mode

#### 1.1. Service Worker & PWA
- [ ] Tích hợp Service Worker
- [ ] Cache dữ liệu thuốc phổ biến
- [ ] Offline scanning với cached data
- [ ] Đồng bộ khi có kết nối

#### 1.2. IndexedDB
- [ ] Lưu trữ dữ liệu thuốc trong IndexedDB
- [ ] Tìm kiếm offline
- [ ] Cache blockchain data

### 2. Analytics và Thống kê

#### 2.1. Dashboard Analytics (cho Admin)
- [ ] Số lần quét theo ngày/tuần/tháng
- [ ] Top thuốc được quét nhiều nhất
- [ ] Phân tích theo địa điểm
- [ ] Tỷ lệ quét thành công/thất bại
- [ ] Biểu đồ xu hướng

#### 2.2. Thống kê cho người dùng
- [ ] Số lần quét của bản thân
- [ ] Lịch sử quét theo thời gian
- [ ] Thống kê thuốc đã quét

**API Endpoints:**
```javascript
GET /api/analytics/scan-stats        // Thống kê quét (admin)
GET /api/analytics/user-scan-stats   // Thống kê của user
GET /api/analytics/top-drugs         // Top thuốc được quét
GET /api/analytics/scan-locations    // Phân tích theo địa điểm
```

### 3. Batch Scanning

#### 3.1. Quét nhiều QR cùng lúc
- [ ] Upload nhiều ảnh cùng lúc
- [ ] Quét liên tiếp nhiều QR
- [ ] Export kết quả batch scan
- [ ] Hiển thị kết quả dạng bảng

#### 3.2. Import từ file
- [ ] Import danh sách QR code từ CSV/Excel
- [ ] Xử lý hàng loạt
- [ ] Báo cáo kết quả import

### 4. Tích hợp GPS và Bản đồ

#### 4.1. Lưu vị trí quét
- [ ] Lấy GPS khi quét (với permission)
- [ ] Lưu tọa độ vào lịch sử
- [ ] Hiển thị bản đồ vị trí quét

#### 4.2. Phân tích địa lý
- [ ] Heat map các vị trí quét
- [ ] Phát hiện bất thường (quét tại nhiều nơi xa nhau)
- [ ] Theo dõi hành trình của thuốc

### 5. Cải thiện Blockchain Integration

#### 5.1. Real-time Blockchain Verification
- [ ] Verify trực tiếp với blockchain mỗi lần quét
- [ ] Cache kết quả verify
- [ ] Hiển thị transaction hash, block number
- [ ] Link đến blockchain explorer

#### 5.2. Smart Contract Events
- [ ] Lắng nghe events từ smart contract
- [ ] Cập nhật trạng thái real-time
- [ ] Thông báo khi có thay đổi trên blockchain

---

## 🌟 HƯỚNG PHÁT TRIỂN DÀI HẠN (6-12 tháng)

### 1. Mobile App (React Native / Flutter)

#### 1.1. Native App Features
- [ ] Quét QR nhanh hơn với native camera
- [ ] Push notifications
- [ ] Offline mode đầy đủ
- [ ] Background scanning
- [ ] Widget để quét nhanh

#### 1.2. Platform-specific Features
- [ ] iOS: Widget, Shortcuts
- [ ] Android: Quick settings tile, NFC scanning

### 2. AI và Machine Learning

#### 2.1. Phát hiện QR code giả
- [ ] Model ML để phát hiện QR code bị làm giả
- [ ] Phân tích pattern của QR code
- [ ] So sánh với database QR code hợp lệ

#### 2.2. OCR và Image Recognition
- [ ] Nhận diện thông tin thuốc từ ảnh nhãn
- [ ] Extract thông tin từ bao bì
- [ ] So sánh với dữ liệu trong hệ thống

#### 2.3. Predictive Analytics
- [ ] Dự đoán xu hướng quét
- [ ] Phát hiện bất thường (anomaly detection)
- [ ] Gợi ý thuốc liên quan

### 3. Tích hợp với hệ thống khác

#### 3.1. HIS (Hospital Information System)
- [ ] Tích hợp với hệ thống quản lý bệnh viện
- [ ] Đồng bộ dữ liệu bệnh nhân
- [ ] Tự động cập nhật hồ sơ bệnh án

#### 3.2. E-commerce Platforms
- [ ] Tích hợp với sàn thương mại điện tử
- [ ] Verify thuốc khi mua online
- [ ] Hiển thị thông tin trong giỏ hàng

#### 3.3. Government Systems
- [ ] Tích hợp với hệ thống của Bộ Y tế
- [ ] Báo cáo tự động
- [ ] Đồng bộ dữ liệu kiểm định

### 4. Multi-language và Internationalization

#### 4.1. Hỗ trợ nhiều ngôn ngữ
- [ ] Tiếng Việt, Tiếng Anh, v.v.
- [ ] Tự động detect ngôn ngữ
- [ ] Localization cho từng quốc gia

#### 4.2. Hỗ trợ nhiều định dạng QR
- [ ] QR Code, Data Matrix, PDF417
- [ ] Barcode (EAN-13, Code 128, v.v.)
- [ ] NFC tags

### 5. Advanced Security

#### 5.1. End-to-end Encryption
- [ ] Mã hóa dữ liệu truyền tải
- [ ] Bảo vệ thông tin người dùng
- [ ] GDPR compliance

#### 5.2. Two-Factor Authentication
- [ ] 2FA cho các tác vụ quan trọng
- [ ] Biometric authentication (fingerprint, face ID)

---

## 🎯 CÁC TÍNH NĂNG NÂNG CAO

### 1. QR Code Generation với Watermark
- [ ] Thêm watermark vào QR code
- [ ] Chống sao chép
- [ ] Invisible watermark

### 2. QR Code với Expiry Date
- [ ] QR code tự động hết hạn
- [ ] Dynamic QR code
- [ ] Time-based validation

### 3. QR Code với Encryption
- [ ] Mã hóa dữ liệu trong QR code
- [ ] Chỉ hệ thống mới decode được
- [ ] Bảo vệ thông tin nhạy cảm

### 4. Social Features
- [ ] Chia sẻ kết quả quét lên social media
- [ ] Đánh giá thuốc
- [ ] Comment và review

### 5. Gamification
- [ ] Điểm thưởng khi quét
- [ ] Badges và achievements
- [ ] Leaderboard

---

## 📝 KẾ HOẠCH TRIỂN KHAI

### Phase 1: Cải thiện UX/UI (Tuần 1-2)
1. Cải thiện giao diện quét
2. Cải thiện hiển thị kết quả
3. Xử lý lỗi tốt hơn

### Phase 2: Lưu trữ và Analytics (Tuần 3-4)
1. Lưu lịch sử lên server
2. Export lịch sử
3. Dashboard analytics cơ bản

### Phase 3: Validation và Bảo mật (Tuần 5-6)
1. Kiểm tra chữ ký số
2. Phát hiện thuốc giả
3. Rate limiting

### Phase 4: Offline Mode (Tuần 7-8)
1. Service Worker
2. IndexedDB
3. Offline scanning

### Phase 5: Mobile App (Tháng 3-4)
1. React Native app
2. Native features
3. Push notifications

### Phase 6: AI và ML (Tháng 5-6)
1. Phát hiện QR giả
2. OCR
3. Predictive analytics

---

## 🔗 TÀI LIỆU THAM KHẢO

### Libraries & Tools
- **@zxing/library**: QR code scanning library (đang dùng)
- **react-qr-code**: QR code generation (đang dùng)
- **qrcode.react**: Alternative QR code library
- **html5-qrcode**: Alternative scanning library
- **PWA Builder**: Tạo PWA
- **Workbox**: Service Worker management

### APIs & Services
- **Google Maps API**: Hiển thị bản đồ
- **Geolocation API**: Lấy vị trí GPS
- **WebSocket**: Real-time notifications
- **IndexedDB**: Offline storage

### Blockchain
- **Web3.js / Ethers.js**: Tương tác với blockchain
- **IPFS**: Lưu trữ dữ liệu phi tập trung
- **Smart Contracts**: Validation logic

---

## 📌 GHI CHÚ

- **Ưu tiên**: Các tính năng Phase 1-3 nên được ưu tiên vì cải thiện trải nghiệm người dùng ngay lập tức
- **Mobile App**: Nên bắt đầu sau khi web app đã ổn định
- **AI/ML**: Cần có dataset và model training, tốn thời gian và tài nguyên
- **Tích hợp**: Cần phối hợp với các bên thứ ba, có thể phức tạp

---

**Tác giả**: Hệ thống quản lý nguồn gốc xuất xứ thuốc  
**Ngày cập nhật**: 2025-01-XX  
**Phiên bản**: 1.0

