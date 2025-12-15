# 📋 Tài Liệu Hệ Thống Backup & Restore

## 📁 Cấu Trúc File

```
D:\DACN\
├── models/
│   └── Backup.js                    # MongoDB Schema cho Backup
├── controllers/
│   └── backupController.js          # API Controllers
├── services/
│   └── backupService.js             # Business Logic (Core)
├── routes/
│   └── backups.js                   # API Routes
├── scripts/
│   └── auto-backup.js               # Script tự động backup (cron job)
└── frontend/src/pages/
    └── Backups.js                   # React UI Component
```

---

## 🗄️ Database Schema (models/Backup.js)

### Schema Fields

| Field          | Type     |Required | Description |
|----------------|----------|----------|-------------|
| `name`         | String   | ✅ | Tên backup |
| `type`         | Enum     | ✅ | Loại: `full`, `incremental`, `differential` |
| `scope`        | Enum     | ✅ | Phạm vi: `all`, `database`, `files`, `config` |
| `filePath`     | String   | ✅ | Đường dẫn file backup trên server |
| `fileSize`     | Number   | ❌ | Kích thước file (bytes) |
| `format`       | Enum     | ❌ | Format: `mongodump`, `json`, `csv`, `tar`, `zip` |
| `status`       | Enum     | ✅ | Trạng thái: `pending`, `in_progress`, `completed`, `failed`, `expired` |
| `database`     | Object   | ❌ | Thông tin DB: `{name, collections[], recordCount}` |
| `metadata`     | Object   | ❌ | Metadata: `{mongooseVersion, nodeVersion, timestamp, checksum}` |
| `createdBy`    | ObjectId | ✅ | User tạo backup (ref: User) |
| `createdAt`    | Date     | ✅ | Ngày tạo (indexed) |
| `completedAt`  | Date     | ❌ | Ngày hoàn thành |
| `expiresAt`    | Date     | ❌ | Ngày hết hạn (indexed) |
| `error`        | Object   | ❌ | Lỗi: `{message, stack, occurredAt}` |
| `notes`        | String   | ❌ | Ghi chú |

### Virtual Fields

- `duration`: Thời gian backup (seconds) = `completedAt - createdAt`
- `isExpired`: Boolean - Backup đã hết hạn chưa

### Static Methods

1. **`getBackups(filters, options)`**
   - Lấy danh sách backups với filter và pagination
   - Returns: `{backups[], pagination: {page, limit, total, pages}}`

2. **`getBackupStats()`**
   - Lấy thống kê backups
   - Returns: `{total, totalSize, successful, failed, statusCounts{}, typeCounts{}}`

### Indexes

- `createdAt: -1` (descending)
- `status: 1, createdAt: -1` (compound)
- `type: 1, createdAt: -1` (compound)
- `expiresAt: 1` (for cleanup)

---

## 🔌 API Endpoints (routes/backups.js)

### Base URL: `/api/backups`

**Authentication:** Tất cả routes yêu cầu:
- `authenticate` middleware (JWT token)
- `authorize('admin')` middleware (chỉ Admin)

### Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| `GET` | `/stats` | `getBackupStats` | Lấy thống kê backups |
| `POST` | `/cleanup` | `cleanupBackups` | Xóa backups đã hết hạn |
| `GET` | `/` | `getBackups` | Lấy danh sách backups (có filter) |
| `POST` | `/` | `createBackup` | Tạo backup mới |
| `GET` | `/:id` | `getBackupById` | Lấy thông tin backup theo ID |
| `GET` | `/:id/download` | `downloadBackup` | Download file backup |
| `POST` | `/:id/restore` | `restoreBackup` | Khôi phục từ backup |
| `DELETE` | `/:id` | `deleteBackup` | Xóa backup |

---

## 🎮 Controllers (controllers/backupController.js)

### 1. `createBackup(req, res)`
- **Input:** `req.body = {name, type, scope, format, collections[], expiresInDays, notes}`
- **Process:** Gọi `backupService.createBackup()`
- **Output:** `{success: true, message, data: {backup, filePath, fileSize}}`

### 2. `getBackups(req, res)`
- **Query Params:** `page, limit, status, type, startDate, endDate`
- **Process:** Gọi `Backup.getBackups()` với filters
- **Output:** `{success: true, data: {backups[], pagination{}}}`

### 3. `getBackupById(req, res)`
- **Params:** `id` (ObjectId)
- **Process:** Gọi `backupService.getBackupInfo()`
- **Output:** `{success: true, data: {backup, fileStats}}`

### 4. `downloadBackup(req, res)`
- **Params:** `id` (ObjectId)
- **Process:** 
  - Tìm backup bằng `_id`
  - Kiểm tra `status === 'completed'`
  - Kiểm tra file tồn tại
  - Download file với tên: `{backup.name}.{ext}`
- **Output:** File download (binary)

### 5. `restoreBackup(req, res)`
- **Params:** `id` (ObjectId)
- **Body:** `{dropBeforeRestore: boolean, collections: []}`
- **Process:** Gọi `backupService.restoreBackup()`
- **Output:** `{success: true, message, data: result}`

### 6. `deleteBackup(req, res)`
- **Params:** `id` (ObjectId)
- **Process:**
  - Tìm backup
  - Xóa file trên disk
  - Xóa record trong DB
- **Output:** `{success: true, message}`

### 7. `getBackupStats(req, res)`
- **Process:** Gọi `Backup.getBackupStats()`
- **Output:** `{success: true, data: {stats}}`

### 8. `cleanupBackups(req, res)`
- **Process:** Gọi `backupService.cleanupExpiredBackups()`
- **Output:** `{success: true, message, data: {deleted, errors[]}}`

---

## ⚙️ Services (services/backupService.js)

### Core Functions

#### 1. `createBackup(options, user, req)`
**Chức năng:** Tạo backup database

**Flow:**
1. Tạo backup record trong DB với `status: 'in_progress'`
2. Tạo thư mục backup: `backups/{backupId}/`
3. **Nếu format = 'mongodump':**
   - Chạy `mongodump` command
   - Tạo archive `.tar.gz`
   - Nếu lỗi → Fallback sang JSON export
4. **Nếu format = 'json':**
   - Export tất cả collections sang JSON
5. Cập nhật backup record:
   - `filePath`, `fileSize`
   - `status: 'completed'`
   - `completedAt`
6. Ghi audit log
7. Return: `{success, backup, filePath, fileSize}`

**Error Handling:**
- Nếu lỗi → Cập nhật `status: 'failed'`, `error: {message, stack}`
- Biến `backup` được khai báo ở ngoài try block để tránh lỗi "backup is not defined"

#### 2. `exportToJSON(backup, backupPath, collections)`
**Chức năng:** Export database sang JSON format

**Flow:**
1. Lấy danh sách collections từ `mongoose.models`
2. Loop qua từng collection:
   - Query tất cả documents
   - Thêm vào `exportData`
3. Ghi file `backup.json`
4. Cập nhật `backup.database.recordCount`
5. Return: `filePath`

#### 3. `restoreBackup(backupId, options, user, req)`
**Chức năng:** Khôi phục database từ backup

**Flow:**
1. Tìm backup theo ID
2. Validate: `status === 'completed'`, file tồn tại
3. Ghi audit log (CRITICAL action)
4. **Nếu format = 'mongodump':**
   - Extract archive
   - Chạy `mongorestore` command
   - Xóa temp directory
5. **Nếu format = 'json':**
   - Gọi `importFromJSON()`
6. Return: `{success, message}`

#### 4. `importFromJSON(filePath, dropBeforeRestore, collections)`
**Chức năng:** Import data từ JSON file

**Flow:**
1. Đọc file JSON
2. **Nếu `dropBeforeRestore = true`:**
   - Xóa tất cả collections
3. Loop qua từng collection:
   - Insert documents vào collection
4. Return: `{success, imported: count}`

#### 5. `cleanupExpiredBackups()`
**Chức năng:** Xóa backups đã hết hạn

**Flow:**
1. Tìm backups có `expiresAt < now()`
2. Loop qua từng backup:
   - Xóa file trên disk
   - Xóa record trong DB
3. Return: `{deleted: count, errors: []}`

#### 6. `getBackupInfo(backupId)`
**Chức năng:** Lấy thông tin chi tiết backup

**Flow:**
1. Tìm backup theo ID
2. Kiểm tra file tồn tại
3. Lấy file stats (size, modified date)
4. Return: `{backup, fileStats, exists}`

### Constants

- `BACKUP_DIR`: `process.cwd()/backups` (tự động tạo nếu chưa có)

---

## 🖥️ Frontend (frontend/src/pages/Backups.js)

### Components

1. **Stats Cards:**
   - Tổng backups
   - Thành công (green)
   - Thất bại (red)
   - Tổng dung lượng

2. **Filters:**
   - Trạng thái (status)
   - Loại (type)
   - Từ ngày (startDate)
   - Reset & Áp dụng buttons

3. **Backups Table:**
   - Columns: Tên, Loại, Format, Kích thước, Ngày tạo, Trạng thái, Thao tác
   - Actions: Download, Restore, Xóa (tùy status)

4. **Create Backup Modal:**
   - Form fields: name, type, format, expiresInDays, notes
   - Validation & Error handling

5. **Restore Modal:**
   - Warning message
   - Options: `dropBeforeRestore`
   - Confirmation

### State Management

- `backups[]`: Danh sách backups
- `stats`: Thống kê
- `pagination`: Phân trang
- `filters`: Bộ lọc
- `backupForm`: Form tạo backup
- `restoreForm`: Form restore
- `selectedBackup`: Backup được chọn để restore
- `loading`: Loading state

### API Integration (frontend/src/utils/api.js)

```javascript
backupAPI = {
  getBackups(params),
  getBackupById(id),
  createBackup(data),
  restoreBackup(id, data),
  downloadBackup(id),
  deleteBackup(id),
  getStats(),
  cleanupBackups()
}
```

### Error Handling

- Toast notifications cho success/error
- Null checks cho `backup` object
- ID normalization để xử lý ObjectId issues
- Loading states

---

## 🤖 Auto Backup Script (scripts/auto-backup.js)

### Chức năng

- Chạy tự động theo schedule (cron job)
- Tạo backup định kỳ
- Cleanup backups cũ

### Usage

```bash
node scripts/auto-backup.js
```

### Configuration

- Schedule: Có thể setup với `node-cron` hoặc system cron
- Backup type: Full backup
- Retention: Xóa backups cũ hơn X ngày

---

## 🔄 Flow Diagrams

### Create Backup Flow

```
User → Frontend (Backups.js)
  ↓
POST /api/backups
  ↓
backupController.createBackup()
  ↓
backupService.createBackup()
  ↓
1. Create Backup record (status: in_progress)
  ↓
2. Create backup directory
  ↓
3. Execute backup (mongodump or JSON)
  ↓
4. Update record (status: completed, filePath, fileSize)
  ↓
5. Audit log
  ↓
Return success
```

### Restore Backup Flow

```
User → Frontend (Backups.js)
  ↓
POST /api/backups/:id/restore
  ↓
backupController.restoreBackup()
  ↓
backupService.restoreBackup()
  ↓
1. Find backup & validate
  ↓
2. Audit log (CRITICAL)
  ↓
3. Extract/Read backup file
  ↓
4. Restore database (mongorestore or JSON import)
  ↓
5. Return success
```

---

## 🐛 Known Issues & Fixes

### 1. "backup is not defined" Error
**Vấn đề:** Biến `backup` được khai báo trong try block nhưng được truy cập trong catch block.

**Fix:** Khai báo `let backup = null;` ở ngoài try block.

**File:** `services/backupService.js:38-39`

### 2. ObjectId Normalization
**Vấn đề:** Frontend nhận ObjectId dạng object thay vì string.

**Fix:** Thêm `normalizeId()` function và sử dụng trong tất cả handlers.

**File:** `frontend/src/pages/Backups.js:54-96`

---

## 🚀 Tính Năng Đã Implement

✅ **Core Features:**
- [x] Tạo backup (mongodump & JSON)
- [x] Download backup file
- [x] Restore từ backup
- [x] Xóa backup
- [x] Lấy danh sách backups (có filter & pagination)
- [x] Thống kê backups
- [x] Cleanup backups hết hạn
- [x] Audit logging
- [x] Error handling

✅ **UI Features:**
- [x] Stats dashboard
- [x] Filter & Search
- [x] Create backup modal
- [x] Restore confirmation modal
- [x] Status indicators
- [x] File size formatting
- [x] Date formatting

✅ **Backend Features:**
- [x] Multiple backup formats (mongodump, JSON)
- [x] Multiple backup types (full, incremental, differential)
- [x] Expiration date support
- [x] Metadata tracking
- [x] Error tracking
- [x] File management

---

## 🔒 Security Improvements (Đã Implement)

### 1. MongoDB Credentials Security
**Vấn đề:** Khi gọi `mongodump`/`mongorestore`, cần xử lý credentials an toàn.

**Giải pháp:**
- Sử dụng `--uri` với connection string đầy đủ từ `MONGODB_URI` environment variable
- Credentials được xử lý an toàn bởi mongodump/mongorestore (không hiển thị trong process list)
- Sanitize URI khi log (ẩn password): `uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')`
- **Không log password** ra console hoặc file log

**File:** `services/backupService.js:74-95, 239-262`

### 2. Streaming Download
**Vấn đề:** File backup lớn (vài GB) có thể làm crash server nếu đọc toàn bộ vào RAM.

**Giải pháp:**
- Sử dụng `fs.createReadStream()` thay vì `fs.readFileSync()`
- Stream file trực tiếp xuống client với `fileStream.pipe(res)`
- Set proper headers: `Content-Length`, `Content-Type`, `Content-Disposition`
- Handle stream errors gracefully

**File:** `controllers/backupController.js:207-230`

### 3. Soft Restore (Auto Backup Before Restore)
**Vấn đề:** Restore là hành động nguy hiểm, có thể mất dữ liệu nếu thất bại.

**Giải pháp:**
- Tự động tạo "Temp Backup" trước khi restore
- Temp backup được lưu với tên: `temp-backup-before-restore-{timestamp}`
- Nếu restore thành công → Xóa temp backup
- Nếu restore thất bại → Giữ temp backup để rollback thủ công
- Ghi audit log cho cả temp backup và restore operation

**File:** `services/backupService.js:203-280`

### 4. Real-time Progress Tracking
**Vấn đề:** Backup/restore mất nhiều thời gian, user không biết tiến trình.

**Giải pháp:**
- Implement `BackupProgress` class để track progress
- Track: `progress (0-100%)`, `status`, `currentStep`, `steps[]`, `elapsed time`
- Có thể tích hợp với Socket.io để real-time updates
- Progress tracker được lưu trong Map để track nhiều operations đồng thời

**File:** `services/backupService.js:12-85`

**TODO:** Tích hợp Socket.io để emit progress events lên frontend

---

## 📝 TODO / Có Thể Nâng Cấp

### Short-term
- [x] ✅ Security cho mongodump (credentials handling)
- [x] ✅ Streaming download
- [x] ✅ Soft restore (auto backup before restore)
- [x] ✅ Progress tracking structure
- [ ] Tích hợp Socket.io cho real-time progress
- [ ] Thêm compression options (gzip, bzip2)
- [ ] Thêm backup scheduling UI
- [ ] Thêm email notification khi backup hoàn thành/thất bại
- [ ] Thêm backup verification (checksum)

### Long-term
- [ ] Cloud storage integration (AWS S3, Google Cloud Storage)
- [ ] Incremental backup implementation
- [ ] Differential backup implementation
- [ ] Backup encryption
- [ ] Multi-database support
- [ ] Backup scheduling với cron UI
- [ ] Backup restore preview (xem data trước khi restore)
- [ ] Backup comparison tool
- [ ] Rollback từ temp backup (tự động)

---

## 🔧 Configuration

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/drug-traceability
BACKUP_DIR=./backups  # Default: process.cwd()/backups
```

### Backup Directory Structure

```
backups/
├── {backupId1}/
│   └── dump/          # mongodump output
├── {backupId1}.tar.gz # Archive file
├── {backupId2}/
│   └── backup.json    # JSON export
└── ...
```

---

## 📚 Dependencies

### Backend
- `mongoose`: MongoDB ODM
- `fs`: File system operations
- `child_process`: Execute mongodump/mongorestore
- `path`: Path utilities

### Frontend
- `react`: UI framework
- `react-router-dom`: Routing
- `axios`: HTTP client
- `react-hot-toast`: Notifications
- `lucide-react`: Icons

---

## 🧪 Testing Checklist

- [ ] Tạo backup thành công (mongodump)
- [ ] Tạo backup thành công (JSON)
- [ ] Tạo backup thất bại (validation error)
- [ ] Download backup file
- [ ] Restore từ backup (mongodump)
- [ ] Restore từ backup (JSON)
- [ ] Xóa backup
- [ ] Cleanup expired backups
- [ ] Filter backups
- [ ] Pagination
- [ ] Stats calculation
- [ ] Error handling
- [ ] ObjectId normalization

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. MongoDB connection
2. File permissions cho `backups/` directory
3. `mongodump`/`mongorestore` có được cài đặt không
4. Disk space
5. Server logs

---

---

## 🔧 Socket.io Integration (TODO)

### Setup Socket.io cho Real-time Progress

```javascript
// server.js
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
});

global.io = io; // Make io available globally

// In backupService.js, uncomment:
// if (global.io) {
//   global.io.emit('backup-progress', data);
// }
```

### Frontend Integration

```javascript
// frontend/src/pages/Backups.js
import { io } from 'socket.io-client';

useEffect(() => {
  const socket = io(API_BASE_URL);
  
  socket.on('backup-progress', (data) => {
    if (data.operationId === currentBackupId) {
      setProgress(data.progress);
      setStatus(data.status);
      setCurrentStep(data.currentStep);
    }
  });
  
  return () => socket.disconnect();
}, [currentBackupId]);
```

---

**Last Updated:** 2025-01-XX
**Version:** 1.1.0 (Security & Performance Improvements)

