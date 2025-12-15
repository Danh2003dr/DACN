# FIX: INVENTORY DATA KHÔNG HIỂN THỊ

## 🔍 VẤN ĐỀ

Trang quản lý kho hiển thị "Không có dữ liệu" mặc dù có stats (26 items, 8488 quantity).

## 🔍 NGUYÊN NHÂN

1. **Filter organizationId quá nghiêm ngặt**: 
   - Controller filter theo `location.organizationId`
   - Các inventory items hiện có có thể chưa có field `organizationId`
   - Filter không match → không trả về dữ liệu

2. **Schema đã có nhưng dữ liệu cũ chưa được cập nhật**:
   - Model đã có `location.organizationId` trong schema
   - Service đã set `organizationId` khi tạo mới
   - Nhưng các items cũ chưa có field này

## ✅ GIẢI PHÁP

### 1. **Sửa Filter để tương thích ngược** ✅

Đã sửa filter trong `controllers/inventoryController.js`:
- Cho phép hiển thị items không có `organizationId` (tạm thời)
- Dùng `$and` để kết hợp các filter đúng cách

```javascript
// Tạm thời cho phép items không có organizationId
if (req.user.role !== 'admin' && req.user.organizationId) {
  filter.$and = filter.$and || [];
  filter.$and.push({
    $or: [
      { 'location.organizationId': req.user.organizationId },
      { 'location.organizationId': { $exists: false } },
      { 'location.organizationId': null }
    ]
  });
}
```

### 2. **Script cập nhật organizationId** ✅

Đã tạo script `scripts/update-inventory-organization.js`:
- Cập nhật `organizationId` cho các inventory items hiện có
- Lấy `organizationId` từ `createdBy` user hoặc drug manufacturer

**Cách chạy:**
```bash
node scripts/update-inventory-organization.js
```

### 3. **Model và Service đã được cập nhật** ✅

- ✅ Model có field `location.organizationId`
- ✅ Service set `organizationId` khi tạo inventory mới

## 📋 CÁC THAY ĐỔI

### **models/Inventory.js**
- Thêm `organizationId` vào `location` schema

### **services/inventoryService.js**
- Set `organizationId` khi tạo inventory mới: `organizationId: user.organizationId || null`

### **controllers/inventoryController.js**
- Sửa filter để tương thích với items không có `organizationId`
- Dùng `$and` để kết hợp các filter

### **scripts/update-inventory-organization.js** (mới)
- Script để cập nhật `organizationId` cho các items hiện có

## 🧪 KIỂM TRA

1. **Refresh trang inventory** - Dữ liệu sẽ hiển thị
2. **Chạy script cập nhật** - Để set organizationId cho các items cũ:
   ```bash
   node scripts/update-inventory-organization.js
   ```
3. **Tạo inventory mới** - Sẽ tự động có organizationId

## ⚠️ LƯU Ý

- Tạm thời filter cho phép items không có organizationId
- Sau khi cập nhật dữ liệu, có thể sửa filter để nghiêm ngặt hơn
- Admin vẫn xem được tất cả items

---

*Cập nhật: $(date)*


