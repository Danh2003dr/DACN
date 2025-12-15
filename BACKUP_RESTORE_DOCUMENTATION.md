# 📦 Tài Liệu Backup & Restore - Chi Tiết Các Phần Đã Làm

## 📋 Tổng quan

Hệ thống Backup & Restore cho phép quản trị viên sao lưu và khôi phục dữ liệu database một cách an toàn và hiệu quả. Hệ thống hỗ trợ nhiều định dạng backup, theo dõi tiến trình real-time, và tự động quản lý vòng đời của các file backup.

---

## 🎯 Các Tính Năng Đã Phát Triển

### 1. **Tạo Backup** ✅
- Tạo backup database với nhiều loại và định dạng
- Hỗ trợ backup toàn bộ (full) hoặc từng phần (incremental, differential)
- Hỗ trợ nhiều định dạng: MongoDB Dump (tar.gz), JSON
- Theo dõi tiến trình backup real-time
- Tự động tạo metadata và checksum

### 2. **Quản Lý Backups** ✅
- Xem danh sách backups với pagination
- Lọc backups theo trạng thái, loại, ngày tháng
- Xem chi tiết backup theo ID
- Thống kê tổng quan (tổng số, thành công, thất bại, dung lượng)

### 3. **Download Backup** ✅
- Download file backup về máy
- Streaming download để xử lý file lớn (vài GB)
- Tự động tìm file nếu đường dẫn thay đổi
- Theo dõi tiến trình download
- Xử lý duplicate requests

### 4. **Restore Database** ✅
- Khôi phục database từ backup
- Hỗ trợ restore toàn bộ hoặc từng collection
- Tùy chọn xóa dữ liệu cũ trước khi restore
- Theo dõi tiến trình restore real-time
- Validation và rollback nếu có lỗi

### 5. **Xóa Backup** ✅
- Xóa backup theo ID
- Tự động xóa file backup trên disk
- Validation và kiểm tra quyền truy cập

### 6. **Cleanup Backups** ✅
- Tự động xóa backups đã hết hạn
- Xóa backups theo tiêu chí (ngày, dung lượng, số lượng)
- Logging chi tiết các thao tác cleanup

### 7. **Theo Dõi Tiến Trình** ✅
- Progress tracking cho backup/restore operations
- Real-time updates (có thể tích hợp Socket.io)
- Lưu trữ lịch sử các bước thực hiện

---

## 📁 Cấu Trúc Files

### Backend

#### 1. **Model** (`models/Backup.js`)
- Schema định nghĩa cấu trúc backup record
- Static methods: `getBackups()`, `getStats()`
- Virtual fields và indexes
- Validation và middleware

#### 2. **Controller** (`controllers/backupController.js`)
- `createBackup()` - Tạo backup mới
- `getBackups()` - Lấy danh sách backups
- `getBackupById()` - Lấy backup theo ID
- `downloadBackup()` - Download file backup
- `restoreBackup()` - Restore database từ backup
- `deleteBackup()` - Xóa backup
- `getBackupStats()` - Lấy thống kê
- `cleanupBackups()` - Cleanup expired backups
- `getBackupProgress()` - Lấy progress của operation

#### 3. **Service** (`services/backupService.js`)
- `createBackup()` - Logic tạo backup
- `restoreBackup()` - Logic restore database
- `exportToJSON()` - Export database sang JSON
- `importFromJSON()` - Import database từ JSON
- `BackupProgress` class - Theo dõi tiến trình
- Progress tracking system

#### 4. **Routes** (`routes/backups.js`)
- Tất cả routes yêu cầu authentication và admin role
- RESTful API endpoints

#### 5. **Scripts** (`scripts/auto-backup.js`)
- Script tự động tạo backup theo lịch
- Có thể tích hợp với cron jobs

### Frontend

#### 1. **Page** (`frontend/src/pages/Backups.js`)
- Giao diện quản lý backups
- Form tạo backup
- Bảng danh sách backups
- Modal restore và download
- Thống kê và filters

---

## 🔌 API Endpoints

### 1. **POST /api/backups**
Tạo backup mới

**Request Body:**
```json
{
  "name": "Backup name",
  "type": "full" | "incremental" | "differential",
  "scope": "all" | "database" | "files" | "config",
  "format": "mongodump" | "json",
  "collections": ["collection1", "collection2"], // Optional
  "expiresInDays": 30, // Optional, default: 30
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo backup thành công.",
  "data": {
    "backup": { ... },
    "operationId": "backup-1234567890"
  }
}
```

### 2. **GET /api/backups**
Lấy danh sách backups

**Query Parameters:**
- `page` - Số trang (default: 1)
- `limit` - Số lượng mỗi trang (default: 50)
- `status` - Lọc theo trạng thái
- `type` - Lọc theo loại
- `startDate` - Ngày bắt đầu
- `endDate` - Ngày kết thúc

**Response:**
```json
{
  "success": true,
  "data": {
    "backups": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 100
    }
  }
}
```

### 3. **GET /api/backups/:id**
Lấy backup theo ID

**Response:**
```json
{
  "success": true,
  "data": {
    "backup": { ... }
  }
}
```

### 4. **GET /api/backups/:id/download**
Download file backup

**Response:**
- File stream với headers:
  - `Content-Disposition: attachment; filename="..."`
  - `Content-Type: application/gzip` hoặc `application/json`
  - `Content-Length: ...`
  - `X-Backup-Name: ...`
  - `X-Backup-Format: ...`
  - `X-Backup-Size: ...`

### 5. **POST /api/backups/:id/restore**
Restore database từ backup

**Request Body:**
```json
{
  "dropBeforeRestore": true, // Optional, default: false
  "collections": ["collection1", "collection2"] // Optional, restore specific collections
}
```

**Response:**
```json
{
  "success": true,
  "message": "Restore thành công.",
  "data": {
    "operationId": "restore-1234567890"
  }
}
```

### 6. **DELETE /api/backups/:id**
Xóa backup

**Response:**
```json
{
  "success": true,
  "message": "Xóa backup thành công."
}
```

### 7. **GET /api/backups/stats**
Lấy thống kê backups

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "totalSize": 2147483648,
    "successful": 95,
    "failed": 5,
    "statusCounts": {
      "completed": 95,
      "failed": 5
    },
    "typeCounts": {
      "full": 50,
      "incremental": 30,
      "differential": 20
    }
  }
}
```

### 8. **POST /api/backups/cleanup**
Cleanup expired backups

**Request Body:**
```json
{
  "deleteExpired": true, // Optional, default: true
  "maxAge": 30, // Optional, days
  "maxSize": 10737418240, // Optional, bytes (10GB)
  "maxCount": 100 // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup hoàn thành.",
  "data": {
    "deleted": 10,
    "freedSpace": 1073741824
  }
}
```

### 9. **GET /api/backups/progress/:operationId**
Lấy progress của backup/restore operation

**Response:**
```json
{
  "success": true,
  "data": {
    "operationId": "backup-1234567890",
    "operationType": "backup",
    "progress": 75,
    "status": "in_progress",
    "currentStep": "Đang nén file...",
    "steps": [...],
    "elapsed": 5000
  }
}
```

---

## 🗄️ Database Schema

### Backup Model

```javascript
{
  name: String, // Tên backup
  type: String, // 'full' | 'incremental' | 'differential'
  scope: String, // 'all' | 'database' | 'files' | 'config'
  filePath: String, // Đường dẫn file backup
  fileSize: Number, // Kích thước file (bytes)
  format: String, // 'mongodump' | 'json' | 'csv' | 'tar' | 'zip'
  status: String, // 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired'
  database: {
    name: String,
    collections: [String],
    recordCount: Number
  },
  metadata: {
    mongooseVersion: String,
    nodeVersion: String,
    timestamp: Date,
    checksum: String
  },
  createdBy: ObjectId, // Reference to User
  createdAt: Date,
  completedAt: Date,
  expiresAt: Date,
  error: {
    message: String,
    stack: String
  },
  notes: String
}
```

---

## 🔧 Các Tính Năng Kỹ Thuật

### 1. **Progress Tracking**
- Class `BackupProgress` để theo dõi tiến trình
- Lưu trữ trong Map với operationId
- Có thể tích hợp Socket.io cho real-time updates
- Lưu lịch sử các bước thực hiện

### 2. **Streaming Download**
- Sử dụng `fs.createReadStream()` để stream file
- Tránh đọc toàn bộ file vào RAM
- Hỗ trợ file lớn (vài GB)
- Theo dõi bytes streamed và progress

### 3. **Duplicate Request Prevention**
- Track active downloads trong Map
- Tránh duplicate requests từ cùng user
- Trả về 409 Conflict nếu có request đang xử lý

### 4. **Auto File Path Resolution**
- Tự động tìm file nếu đường dẫn thay đổi
- Thử nhiều đường dẫn có thể
- Tự động cập nhật filePath trong database

### 5. **Error Handling**
- Try-catch cho tất cả operations
- Logging chi tiết lỗi
- Rollback nếu restore fail
- Cleanup resources khi có lỗi

### 6. **Validation**
- Validate user permissions
- Validate backup status trước khi restore
- Validate file existence trước khi download
- Validate ObjectId format

---

## 🐛 Các Vấn Đề Đã Fix

### 1. **filePath Required Error**
**Vấn đề:** Lỗi validation `filePath: Path 'filePath' is required` khi tạo backup

**Giải pháp:**
- Đổi `filePath` từ `required: true` → `required: false` trong model
- Set `filePath: ''` khi tạo backup record
- Cập nhật `filePath` sau khi backup hoàn thành
- Xóa model cache để đảm bảo load model mới nhất

**Files đã sửa:**
- `models/Backup.js` - Dòng 31: `required: false`, `default: ''`
- `services/backupService.js` - Dòng 158: Set `filePath: ''`
- `services/backupService.js` - Dòng 6-12: Xóa model cache

### 2. **File Not Found Error**
**Vấn đề:** Lỗi "File không tồn tại" khi download backup

**Giải pháp:**
- Tự động tìm file trong các đường dẫn có thể
- Tự động cập nhật filePath trong database nếu tìm thấy
- Logging chi tiết các đường dẫn đã thử

**Files đã sửa:**
- `controllers/backupController.js` - Dòng 254-302: Auto file path resolution

---

## 📊 Thống Kê

### Tính năng đã hoàn thành:
- ✅ Tạo backup (full, incremental, differential)
- ✅ Download backup
- ✅ Restore database
- ✅ Xóa backup
- ✅ Cleanup expired backups
- ✅ Thống kê backups
- ✅ Theo dõi tiến trình
- ✅ Progress tracking
- ✅ Error handling
- ✅ Validation và security

### API Endpoints: 9 endpoints
### Files đã tạo/sửa: 6 files
### Lines of code: ~2000+ lines

---

## 🚀 Cách Sử Dụng

### 1. Tạo Backup
```bash
POST /api/backups
{
  "name": "Daily Backup",
  "type": "full",
  "format": "mongodump",
  "expiresInDays": 30
}
```

### 2. Xem Danh Sách Backups
```bash
GET /api/backups?page=1&limit=10&status=completed
```

### 3. Download Backup
```bash
GET /api/backups/:id/download
```

### 4. Restore Database
```bash
POST /api/backups/:id/restore
{
  "dropBeforeRestore": false,
  "collections": ["drugs", "users"]
}
```

### 5. Xóa Backup
```bash
DELETE /api/backups/:id
```

### 6. Cleanup Backups
```bash
POST /api/backups/cleanup
{
  "deleteExpired": true,
  "maxAge": 30
}
```

---

## 📝 Lưu Ý Quan Trọng

1. **Permissions:** Tất cả endpoints yêu cầu admin role
2. **File Storage:** Backups được lưu trong thư mục `backups/`
3. **Large Files:** Sử dụng streaming cho file lớn
4. **Progress Tracking:** Có thể tích hợp Socket.io cho real-time updates
5. **Auto Cleanup:** Có thể setup cron job để tự động cleanup
6. **Security:** Validate tất cả inputs và check permissions

---

## 🔄 Các Cải Tiến Có Thể Thực Hiện

1. **Cloud Storage Integration**
   - Upload backups lên AWS S3, Google Cloud Storage
   - Tự động sync backups lên cloud

2. **Scheduled Backups**
   - Tích hợp cron jobs
   - Tự động tạo backup theo lịch

3. **Compression**
   - Nén backups để tiết kiệm dung lượng
   - Hỗ trợ nhiều thuật toán nén

4. **Encryption**
   - Mã hóa backups trước khi lưu
   - Bảo mật dữ liệu nhạy cảm

5. **Backup Verification**
   - Tự động verify backups sau khi tạo
   - Kiểm tra integrity của file backup

6. **Notification System**
   - Gửi email khi backup hoàn thành
   - Thông báo khi backup fail

---

## 📅 Ngày tạo tài liệu: 2025-12-07

## 👤 Tác giả: AI Assistant (Auto)

---

## 📚 Tài Liệu Liên Quan

- `BACKUP_FIX_SUMMARY.md` - Tóm tắt các fix đã thực hiện
- `BACKUP_QR_SCAN_FIX.md` - Tài liệu về fix QR scan (khác)
- `models/Backup.js` - Model definition
- `services/backupService.js` - Service logic
- `controllers/backupController.js` - Controller handlers
- `routes/backups.js` - API routes

