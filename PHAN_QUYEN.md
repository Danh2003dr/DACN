# Tài liệu Phân quyền Hệ thống

## Tổng quan

Hệ thống sử dụng role-based access control (RBAC) với các vai trò:
- **admin**: Quản trị viên - có quyền truy cập tất cả
- **manufacturer**: Nhà sản xuất
- **distributor**: Nhà phân phối
- **hospital**: Bệnh viện
- **patient**: Bệnh nhân

## Phân quyền theo Module

### 1. Dashboard
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Tất cả người dùng đã đăng nhập đều có thể xem dashboard

### 2. Quản lý Người dùng (Users)
- **Frontend**: `requiredRoles: ['admin']`
- **Backend**: `authenticate` + `authorize('admin')`
- **Mô tả**: Chỉ admin mới có thể quản lý users

### 3. Quản lý Thuốc (Drugs)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể quản lý drugs

### 4. Quét QR Code
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Tất cả người dùng có thể quét QR code

### 5. Xác thực (Verify)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']`
- **Backend**: Public (không cần authenticate)
- **Mô tả**: Công khai cho tất cả người dùng

### 6. Chuỗi Cung ứng (Supply Chain)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể xem supply chain

### 7. Nhiệm vụ (Tasks)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể quản lý tasks

### 8. Thông báo (Notifications)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Tất cả người dùng có thể xem notifications

### 9. Đánh giá (Reviews)
- **Frontend**: `requiredRoles: ['admin', 'hospital', 'patient']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, hospital, patient có thể đánh giá

### 10. Chữ ký số (Digital Signatures)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể quản lý chữ ký số

### 11. Điểm tín nhiệm (Trust Scores)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể xem trust scores

### 12. Audit Log
- **Frontend**: `requiredRoles: ['admin']`
- **Backend**: `authenticate` + `authorize('admin')`
- **Mô tả**: Chỉ admin mới có thể xem audit logs

### 13. Quản lý Kho (Inventory)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể quản lý inventory
- **Lưu ý**: Các thao tác nhạy cảm (nhập/xuất kho, chuyển kho, kiểm kê) nên được kiểm tra thêm trong service layer

### 14. Quản lý Đơn hàng (Orders)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể quản lý orders
- **Lưu ý**: Các thao tác xác nhận, xử lý, giao hàng nên được kiểm tra thêm trong service layer

### 15. Backup & Restore
- **Frontend**: `requiredRoles: ['admin']`
- **Backend**: `authenticate` + `authorize('admin')`
- **Mô tả**: Chỉ admin mới có thể quản lý backups

### 16. Hóa đơn & Thanh toán (Invoices & Payments)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor, hospital có thể quản lý invoices và payments
- **Lưu ý**: Các thao tác tạo hóa đơn, ghi nhận thanh toán nên được kiểm tra thêm trong service layer

### 17. Import/Export
- **Frontend**: `requiredRoles: ['admin']`
- **Backend**: `authenticate` + `authorize('admin')` ✅
- **Mô tả**: Chỉ admin mới có thể import/export dữ liệu

### 18. Quản lý Nhà cung ứng (Suppliers)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'distributor']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, distributor có thể quản lý suppliers
- **Lưu ý**: Các thao tác tạo supplier, tạo contract nên được kiểm tra thêm trong service layer

### 19. Báo cáo (Reports)
- **Frontend**: `requiredRoles: ['admin', 'manufacturer', 'hospital']`
- **Backend**: Chỉ cần `authenticate`
- **Mô tả**: Admin, manufacturer, hospital có thể xem reports

### 20. Cài đặt (Settings)
- **Frontend**: `requiredRoles: ['admin']`
- **Backend**: `authenticate` + `authorize('admin')`
- **Mô tả**: Chỉ admin mới có thể cấu hình hệ thống

## Quy tắc Phân quyền

### 1. Nguyên tắc Least Privilege
- Mỗi role chỉ được cấp quyền tối thiểu cần thiết để thực hiện công việc
- Admin có quyền truy cập tất cả

### 2. Defense in Depth
- Kiểm tra phân quyền ở cả frontend và backend
- Frontend chỉ để UX (ẩn/hiện menu), backend mới là bảo mật thực sự

### 3. Organization-based Access Control
- Một số tài nguyên chỉ có thể truy cập trong cùng tổ chức
- Admin có thể truy cập tất cả tổ chức

### 4. Audit Trail
- Tất cả các thao tác quan trọng đều được ghi vào audit log
- Chỉ admin có thể xem audit logs

## Kiểm tra Phân quyền

### Backend
1. Tất cả routes đều phải có `authenticate` middleware
2. Các routes nhạy cảm phải có `authorize` middleware
3. Service layer nên kiểm tra thêm phân quyền cho các thao tác phức tạp

### Frontend
1. Tất cả routes đều phải có `ProtectedRoute` với `requiredRoles`
2. Menu navigation được lọc theo role
3. Các nút hành động nên được ẩn/hiện theo role

## Kiểm tra Phân quyền Organization

Các module sau đây có kiểm tra phân quyền theo tổ chức (non-admin chỉ xem dữ liệu của tổ chức mình):

1. **Invoices**: 
   - `getInvoices`: Filter theo seller/buyer organization ✅
   - `getInvoiceById`: Kiểm tra user là seller hoặc buyer ✅

2. **Orders**:
   - `getOrders`: Filter theo buyer/seller organization ✅
   - `getOrderById`: Kiểm tra user là buyer, seller hoặc creator ✅

3. **Inventory**:
   - `getInventory`: Filter theo location.organizationId ✅
   - `getInventoryById`: Kiểm tra location.organizationId ✅

4. **Payments**:
   - `getPayments`: Filter theo payer/payee organization ✅
   - `getPaymentById`: Kiểm tra user là payer hoặc payee ✅

5. **Suppliers**: 
   - Shared resource - tất cả authenticated users có thể xem ✅

## Tóm tắt Phân quyền Backend

### Routes chỉ Admin:
- ✅ `/api/audit-logs/*` - `authenticate` + `authorize('admin')`
- ✅ `/api/backups/*` - `authenticate` + `authorize('admin')`
- ✅ `/api/import-export/*` - `authenticate` + `authorize('admin')`
- ✅ `/api/settings/*` - `authenticate` + `authorize('admin')`
- ✅ `/api/users/*` - `authenticate` + `authorize('admin')`

### Routes với Organization Filtering:
- ✅ `/api/invoices/*` - `authenticate` + organization check
- ✅ `/api/payments/*` - `authenticate` + organization check
- ✅ `/api/orders/*` - `authenticate` + organization check
- ✅ `/api/inventory/*` - `authenticate` + organization check

### Routes cho nhiều roles:
- ✅ `/api/drugs/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/suppliers/*` - `authenticate` (admin, manufacturer, distributor)
- ✅ `/api/supply-chain/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/tasks/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/notifications/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/reviews/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/digital-signatures/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/trust-scores/*` - `authenticate` (tất cả authenticated users)
- ✅ `/api/reports/*` - `authenticate` (tất cả authenticated users)

## Cập nhật

- **Ngày tạo**: 2025-01-XX
- **Cập nhật lần cuối**: 2025-01-XX
- **Người cập nhật**: System
- **Phiên bản**: 1.0

