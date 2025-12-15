# TÀI LIỆU QUẢN LÝ KHO - DRUG TRACEABILITY SYSTEM

## 📋 DANH SÁCH CHỨC NĂNG ĐÃ HOÀN THÀNH

### 1. **Xem danh sách tồn kho** ✅
- **Endpoint**: `GET /api/inventory`
- **Chức năng**: 
  - Lấy danh sách tồn kho với phân trang
  - Lọc theo: locationId, drugId, status, lowStock, nearExpiry, expired
  - Tìm kiếm theo: drugName, batchNumber, drugId
  - Sắp xếp theo drugName và expiryDate
- **Phân quyền hiện tại**: 
  - ✅ Authenticated (tất cả user đã đăng nhập)
  - ⚠️ Non-admin chỉ xem inventory của tổ chức mình (có kiểm tra)
- **Frontend**: `/inventory` page

### 2. **Xem chi tiết tồn kho** ✅
- **Endpoint**: `GET /api/inventory/:id`
- **Chức năng**: 
  - Lấy thông tin chi tiết một item tồn kho
  - Populate thông tin drug, supplier, createdBy, updatedBy
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ Non-admin chỉ xem inventory của tổ chức mình (có kiểm tra)
- **Frontend**: Chi tiết trong modal/table

### 3. **Xem tồn kho theo địa điểm** ✅
- **Endpoint**: `GET /api/inventory/location/:locationId`
- **Chức năng**: Lấy tất cả tồn kho tại một địa điểm cụ thể
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra quyền xem địa điểm đó
- **Frontend**: Filter theo location

### 4. **Xem tổng tồn kho của một thuốc** ✅
- **Endpoint**: `GET /api/inventory/drug/:drugId/total`
- **Chức năng**: Tính tổng tồn kho của một drug ở tất cả địa điểm
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra quyền xem drug đó
- **Frontend**: Tích hợp trong chi tiết drug

### 5. **Xem thống kê tồn kho** ✅
- **Endpoint**: `GET /api/inventory/stats`
- **Chức năng**: 
  - Tổng số items, tổng số lượng, tổng giá trị
  - Số lượng low stock, expired, near expiry
  - Thống kê theo status
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không filter theo organization nếu non-admin
- **Frontend**: Stats cards trên trang inventory

### 6. **Nhập kho (Stock In)** ✅
- **Endpoint**: `POST /api/inventory/stock-in`
- **Chức năng**: 
  - Nhập thuốc vào kho
  - Tạo hoặc cập nhật inventory item
  - Tạo transaction record
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra role cụ thể (nên chỉ manufacturer, distributor, hospital)
- **Frontend**: Modal "Nhập kho" với form đầy đủ

### 7. **Xuất kho (Stock Out)** ✅
- **Endpoint**: `POST /api/inventory/stock-out`
- **Chức năng**: 
  - Xuất thuốc ra khỏi kho
  - Kiểm tra số lượng tồn kho
  - Tạo transaction record
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra role cụ thể (nên chỉ manufacturer, distributor, hospital)
- **Frontend**: Modal "Xuất kho" với form đầy đủ

### 8. **Điều chỉnh kho (Adjust Stock)** ✅
- **Endpoint**: `POST /api/inventory/adjust`
- **Chức năng**: 
  - Điều chỉnh số lượng tồn kho (sai số, hao hụt, v.v.)
  - Tạo transaction record
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra role cụ thể (nên chỉ admin, warehouse manager)
- **Frontend**: Modal "Điều chỉnh kho"

### 9. **Chuyển kho (Transfer Stock)** ✅
- **Endpoint**: `POST /api/inventory/transfer`
- **Chức năng**: 
  - Chuyển thuốc từ kho này sang kho khác
  - Tạo 2 transactions (out và in)
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra quyền chuyển giữa các kho
- **Frontend**: Modal "Chuyển kho"

### 10. **Kiểm kê kho (Stocktake)** ✅
- **Endpoint**: `POST /api/inventory/stocktake`
- **Chức năng**: 
  - Kiểm kê tồn kho thực tế
  - So sánh với sổ sách
  - Tạo điều chỉnh tự động nếu có sai lệch
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không kiểm tra role cụ thể (nên chỉ admin, warehouse manager)
- **Frontend**: Modal "Kiểm kê kho"

### 11. **Xem lịch sử giao dịch** ✅
- **Endpoint**: `GET /api/inventory/transactions`
- **Chức năng**: 
  - Lấy danh sách tất cả transactions
  - Lọc theo: type, drugId, locationId, startDate, endDate
  - Phân trang
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không filter theo organization nếu non-admin
- **Frontend**: Table transactions với filters

### 12. **Xem thống kê giao dịch** ✅
- **Endpoint**: `GET /api/inventory/transactions/stats`
- **Chức năng**: 
  - Thống kê transactions theo type
  - Thống kê theo khoảng thời gian
- **Phân quyền hiện tại**: 
  - ✅ Authenticated
  - ⚠️ **THIẾU**: Không filter theo organization nếu non-admin
- **Frontend**: Charts/Stats cho transactions

---

## 🔒 PHÂN QUYỀN ĐÃ ĐƯỢC CẢI THIỆN

### **✅ Đã hoàn thành:**

1. **✅ Tất cả routes đã có `authorize` middleware**
   - ✅ Kiểm tra role cụ thể cho từng endpoint
   - ✅ Phân quyền rõ ràng theo từng chức năng

2. **✅ Tất cả controllers đã có kiểm tra phân quyền đầy đủ**
   - ✅ `getInventory`: Filter theo organizationId
   - ✅ `getInventoryById`: Kiểm tra organizationId
   - ✅ `getInventoryByLocation`: Kiểm tra và filter theo organizationId
   - ✅ `getTotalStock`: Filter theo organizationId
   - ✅ `getInventoryStats`: Filter theo organizationId
   - ✅ `getTransactions`: Filter theo locations của organization
   - ✅ `getTransactionStats`: Filter theo locations của organization
   - ✅ Tất cả actions: Kiểm tra location access

3. **✅ Backend đã enforce đúng quyền theo role**
   - Patient: Không có quyền truy cập (403)
   - Non-admin: Chỉ xem/thao tác kho của tổ chức mình
   - Admin: Xem/thao tác được tất cả

### **Đề xuất phân quyền chi tiết:**

#### **1. Xem danh sách tồn kho**
- ✅ **Admin**: Xem tất cả
- ✅ **Manufacturer**: Xem kho của nhà máy mình
- ✅ **Distributor**: Xem kho phân phối của mình
- ✅ **Hospital**: Xem kho bệnh viện mình
- ❌ **Patient**: Không có quyền

#### **2. Nhập kho (Stock In)**
- ✅ **Admin**: Được phép
- ✅ **Manufacturer**: Được phép (nhập vào kho nhà máy)
- ✅ **Distributor**: Được phép (nhập vào kho phân phối)
- ✅ **Hospital**: Được phép (nhập vào kho bệnh viện)
- ❌ **Patient**: Không có quyền

#### **3. Xuất kho (Stock Out)**
- ✅ **Admin**: Được phép
- ✅ **Manufacturer**: Được phép (xuất từ kho nhà máy)
- ✅ **Distributor**: Được phép (xuất từ kho phân phối)
- ✅ **Hospital**: Được phép (xuất từ kho bệnh viện)
- ❌ **Patient**: Không có quyền

#### **4. Điều chỉnh kho (Adjust)** ✅
- ✅ **Admin**: Được phép
- ✅ **Manufacturer**: Được phép (chỉ kho nhà máy)
- ❌ **Distributor**: Không có quyền (đã xác nhận)
- ❌ **Hospital**: Không có quyền (đã xác nhận)
- ❌ **Patient**: Không có quyền

#### **5. Chuyển kho (Transfer)** ✅
- ✅ **Admin**: Được phép (mọi kho)
- ✅ **Manufacturer**: Được phép (giữa các kho nhà máy)
- ✅ **Distributor**: Được phép (giữa các kho phân phối)
- ✅ **Hospital**: Được phép (giữa các kho bệnh viện)
- ❌ **Patient**: Không có quyền
- ✅ **Kiểm tra**: Đảm bảo cả 2 locations thuộc cùng organization

#### **6. Kiểm kê kho (Stocktake)** ✅
- ✅ **Admin**: Được phép
- ✅ **Manufacturer**: Được phép (kho nhà máy)
- ❌ **Distributor**: Không có quyền (đã xác nhận)
- ❌ **Hospital**: Không có quyền (đã xác nhận)
- ❌ **Patient**: Không có quyền

---

## 🛠️ CÁC CẢI THIỆN ĐÃ THỰC HIỆN

### **✅ Bước 1: Đã cập nhật Routes với Authorize Middleware**

Tất cả routes đã được cập nhật với `authorize` middleware:

```javascript
// routes/inventory.js - ĐÃ HOÀN THÀNH

// Xem - tất cả role (trừ patient)
router.get('/', 
  authenticate, 
  authorize('admin', 'manufacturer', 'distributor', 'hospital'), 
  getInventory
);

// Nhập kho
router.post('/stock-in', 
  authenticate, 
  authorize('admin', 'manufacturer', 'distributor', 'hospital'), 
  stockIn
);

// Điều chỉnh - chỉ admin và manufacturer
router.post('/adjust', 
  authenticate, 
  authorize('admin', 'manufacturer'), 
  adjustStock
);

// Kiểm kê - chỉ admin và manufacturer
router.post('/stocktake', 
  authenticate, 
  authorize('admin', 'manufacturer'), 
  stocktake
);
```

### **✅ Bước 2: Đã cải thiện Controller với kiểm tra quyền chi tiết**

1. **✅ Đã thêm helper function kiểm tra quyền truy cập kho:**
```javascript
// controllers/inventoryController.js - ĐÃ HOÀN THÀNH
const checkLocationAccess = async (user, locationId) => {
  if (user.role === 'admin') {
    return { hasAccess: true, organizationId: null, isNewLocation: false };
  }
  
  // Kiểm tra location có thuộc organization của user không
  const inventoryItem = await Inventory.findOne({
    'location.locationId': locationId
  }).select('location.organizationId');
  
  // Xử lý location mới và kiểm tra organizationId
  // ...
};
```

2. **✅ Đã cải thiện filter theo organization trong tất cả queries:**
```javascript
// ĐÃ ÁP DỤNG trong: getInventory, getInventoryByLocation, 
// getTotalStock, getInventoryStats, getTransactions, getTransactionStats
if (req.user.role !== 'admin' && req.user.organizationId) {
  filter['location.organizationId'] = req.user.organizationId;
}
```

3. **✅ Đã kiểm tra quyền trước khi thực hiện actions:**
```javascript
// ĐÃ ÁP DỤNG trong: stockIn, stockOut, transferStock, adjustStock, stocktake
const locationAccess = await checkLocationAccess(req.user, locationId);
if (!locationAccess.hasAccess) {
  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền thao tác với kho này'
  });
}
```

### **⏳ Bước 3: Cải thiện Frontend (Chưa thực hiện)**

1. **Ẩn/hiện buttons dựa trên role:**
```javascript
{hasAnyRole(['admin', 'manufacturer', 'distributor', 'hospital']) && (
  <button onClick={handleStockIn}>Nhập kho</button>
)}

{hasAnyRole(['admin', 'manufacturer']) && (
  <button onClick={handleAdjust}>Điều chỉnh</button>
)}
```

2. **Filter locations theo organization của user:**
```javascript
// Chỉ hiển thị locations thuộc organization của user
const userLocations = locations.filter(loc => 
  user.role === 'admin' || loc.organizationId === user.organizationId
);
```

### **⏳ Bước 4: Thêm Audit Logging (Optional - Chưa thực hiện)**

- Ghi lại tất cả các thao tác nhập/xuất/điều chỉnh/chuyển kho
- Lưu thông tin: user, action, timestamp, old value, new value

---

## 📝 CHECKLIST CẢI THIỆN

### **Backend:**
- [x] ✅ Thêm `authorize` middleware cho tất cả routes
- [x] ✅ Cải thiện kiểm tra phân quyền trong controllers
- [x] ✅ Thêm helper function `checkLocationAccess`
- [x] ✅ Filter theo organizationId trong tất cả queries
- [ ] Thêm audit logging cho các actions
- [x] ✅ Thêm validation cho locationId trong requests
- [ ] Test phân quyền với từng role

### **Frontend:**
- [ ] Ẩn/hiện buttons dựa trên role
- [ ] Filter locations theo organization
- [ ] Thêm error handling cho 403 errors
- [ ] Hiển thị thông báo rõ ràng khi không có quyền
- [ ] Disable forms khi không có quyền

### **Testing:**
- [ ] Test với admin role
- [ ] Test với manufacturer role
- [ ] Test với distributor role
- [ ] Test với hospital role
- [ ] Test với patient role (should fail)
- [ ] Test cross-organization access (should fail)

---

## 🔍 CÁC VẤN ĐỀ CẦN XỬ LÝ NGAY

1. **✅ ĐÃ SỬA: Routes không có authorize middleware**
   - ✅ Đã thêm `authorize` middleware cho tất cả routes
   - ✅ Phân quyền theo role: Admin, Manufacturer, Distributor, Hospital

2. **✅ ĐÃ SỬA: Không kiểm tra organization trong nhiều endpoints**
   - ✅ `getInventoryByLocation`: Đã filter theo organization
   - ✅ `getTotalStock`: Đã filter theo organization
   - ✅ `getInventoryStats`: Đã filter theo organization
   - ✅ `getTransactions`: Đã filter theo organization
   - ✅ `getTransactionStats`: Đã filter theo organization

3. **✅ ĐÃ SỬA: Không kiểm tra quyền location trong actions**
   - ✅ `stockIn`: Đã kiểm tra location access
   - ✅ `stockOut`: Đã kiểm tra location access
   - ✅ `transfer`: Đã kiểm tra cả 2 locations và đảm bảo cùng organization
   - ✅ `adjustStock`: Đã kiểm tra location access
   - ✅ `stocktake`: Đã kiểm tra location access
   - ✅ Đã tạo helper function `checkLocationAccess`

4. **✅ ĐÃ SỬA: Không có role cụ thể cho adjust và stocktake**
   - ✅ `adjust`: Chỉ admin và manufacturer
   - ✅ `stocktake`: Chỉ admin và manufacturer

---

## 📊 TỔNG KẾT

### **Đã hoàn thành:**
- ✅ 12 chức năng quản lý kho đầy đủ
- ✅ Frontend UI/UX hoàn chỉnh
- ✅ Model và schema đầy đủ
- ✅ Service layer xử lý business logic

### **Đã cải thiện:**
- ✅ Phân quyền: Đã thêm authorize middleware cho tất cả routes
- ✅ Security: Đã kiểm tra organization trong tất cả endpoints
- ✅ Validation: Đã kiểm tra location access trong tất cả actions
- ⚠️ Audit: Chưa có logging đầy đủ (optional)

### **Ưu tiên tiếp theo:**
1. **MEDIUM**: Thêm audit logging cho các actions
2. **LOW**: Cải thiện error messages chi tiết hơn
3. **TESTING**: Test phân quyền với từng role

---

*Tài liệu này được tạo tự động dựa trên phân tích code hiện tại. Vui lòng cập nhật khi có thay đổi.*


