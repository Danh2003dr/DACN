# Fix Lỗi Backup: filePath Required

## 🐛 Vấn đề
Lỗi khi tạo backup: `Backup validation failed: filePath: Path 'filePath' is required.`

## ✅ Giải pháp đã áp dụng

### 1. **Model Backup** (`models/Backup.js`)
- **Thay đổi:** Đổi `filePath` từ `required: true` → `required: false`
- **Lý do:** `filePath` chỉ có sau khi backup hoàn thành, không có khi tạo record ban đầu

### 2. **Backup Service** (`services/backupService.js`)
- **Thay đổi:** Không set `filePath` khi tạo backup record
- **Lý do:** `filePath` sẽ được set sau khi backup hoàn thành (dòng 266)

## 🔄 Cách áp dụng fix

### Bước 1: Restart Backend Server
```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó restart:
npm start
```

### Bước 2: Test lại
1. Mở frontend: `http://localhost:3000/backups`
2. Click "Tạo Backup"
3. Điền thông tin và click "Tạo Backup"
4. Kiểm tra xem có còn lỗi validation không

## 📝 Lưu ý

- **Quan trọng:** Phải restart server để model mới có hiệu lực
- Nếu vẫn lỗi sau khi restart, kiểm tra:
  1. File `models/Backup.js` có `required: false` không
  2. File `services/backupService.js` không set `filePath` khi tạo record
  3. Xem backend logs để biết lỗi cụ thể

## 🔍 Debug

Nếu vẫn lỗi, kiểm tra backend logs:
```bash
# Xem logs khi tạo backup
# Tìm dòng: "❌ [Backup] Error creating backup record:"
```

## 📁 Files đã thay đổi

1. ✅ `models/Backup.js` - Dòng 31: `required: false`
2. ✅ `services/backupService.js` - Dòng 158: Comment về filePath

## ✅ Kết quả mong đợi

Sau khi fix:
- ✅ Tạo backup record thành công với status `in_progress`
- ✅ `filePath` được set sau khi backup hoàn thành
- ✅ Không còn lỗi validation

