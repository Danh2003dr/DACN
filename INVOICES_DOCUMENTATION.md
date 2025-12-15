# TÀI LIỆU MODULE INVOICES (HÓA ĐƠN)

## 📋 Tổng quan

Module Invoices (Hóa đơn) là hệ thống quản lý hóa đơn điện tử và thanh toán trong hệ thống quản lý nguồn gốc xuất xứ thuốc. Module này cho phép tạo, quản lý, theo dõi thanh toán và thống kê hóa đơn.

---

## 🗂️ Cấu trúc Files

### Backend
- **`models/Invoice.js`** - Schema và model cho Invoice
- **`controllers/invoiceController.js`** - Xử lý HTTP requests
- **`services/invoiceService.js`** - Business logic cho invoices
- **`routes/invoices.js`** - Định nghĩa API routes

### Frontend
- **`frontend/src/pages/Invoices.js`** - React component cho giao diện quản lý hóa đơn

---

## 📊 Database Schema (Invoice Model)

### Các trường chính:

#### 1. **Thông tin cơ bản**
- `invoiceNumber` (String, required, unique) - Số hóa đơn
- `invoiceType` (Enum) - Loại hóa đơn:
  - `sales` - Bán hàng
  - `purchase` - Mua hàng
  - `return` - Trả hàng
  - `credit_note` - Giấy báo có
  - `debit_note` - Giấy báo nợ
- `status` (Enum, default: 'draft') - Trạng thái:
  - `draft` - Nháp
  - `issued` - Đã phát hành
  - `sent` - Đã gửi
  - `paid` - Đã thanh toán
  - `cancelled` - Đã hủy
  - `void` - Vô hiệu

#### 2. **Thông tin đơn hàng**
- `order` (ObjectId, ref: 'Order') - Tham chiếu đến Order
- `orderNumber` (String) - Số đơn hàng

#### 3. **Thông tin người bán (Seller)**
- `seller` (ObjectId, ref: 'User', required) - Người bán
- `sellerInfo` (Object) - Thông tin chi tiết:
  - `name` - Tên
  - `organization` - Tổ chức
  - `taxCode` - Mã số thuế
  - `address` - Địa chỉ
  - `phone` - Số điện thoại
  - `email` - Email

#### 4. **Thông tin người mua (Buyer)**
- `buyer` (ObjectId, ref: 'User', required) - Người mua
- `buyerInfo` (Object) - Thông tin chi tiết (tương tự sellerInfo)

#### 5. **Chi tiết hóa đơn (Items)**
- `items` (Array) - Danh sách sản phẩm:
  - `drugId` - ID thuốc
  - `drugName` - Tên thuốc
  - `batchNumber` - Số lô
  - `quantity` - Số lượng
  - `unit` - Đơn vị
  - `unitPrice` - Đơn giá
  - `discount` - Giảm giá (%)
  - `taxRate` - Thuế suất (%)
  - `subtotal` - Tổng phụ
  - `tax` - Thuế
  - `total` - Tổng cộng

#### 6. **Giá trị tài chính**
- `subtotal` (Number, default: 0) - Tổng phụ
- `tax` (Number, default: 0) - Thuế VAT
- `discount` (Number, default: 0) - Giảm giá
- `shippingFee` (Number, default: 0) - Phí vận chuyển
- `totalAmount` (Number, required) - Tổng giá trị
- `paidAmount` (Number, default: 0) - Số tiền đã thanh toán
- `dueAmount` (Number, auto-calculated) - Số tiền còn nợ

#### 7. **Ngày tháng**
- `issueDate` (Date, default: now) - Ngày phát hành
- `dueDate` (Date, required) - Ngày đến hạn thanh toán
- `paidDate` (Date) - Ngày thanh toán

#### 8. **Thanh toán**
- `paymentMethod` (Enum, default: 'bank_transfer') - Phương thức:
  - `cash` - Tiền mặt
  - `bank_transfer` - Chuyển khoản
  - `credit_card` - Thẻ tín dụng
  - `check` - Séc
  - `other` - Khác
- `paymentStatus` (Enum, default: 'pending') - Trạng thái thanh toán:
  - `pending` - Chờ thanh toán
  - `partial` - Thanh toán một phần
  - `paid` - Đã thanh toán
  - `overdue` - Quá hạn
  - `cancelled` - Đã hủy

#### 9. **Khác**
- `notes` (String) - Ghi chú công khai
- `internalNotes` (String) - Ghi chú nội bộ
- `pdfFile` (String) - File PDF hóa đơn
- `qrCode` (String) - QR Code hóa đơn
- `metadata` (Mixed) - Metadata tùy chỉnh
- `createdBy` (ObjectId, ref: 'User', required) - Người tạo
- `createdAt` (Date, auto) - Ngày tạo
- `updatedAt` (Date, auto) - Ngày cập nhật

### Virtual Fields
- `daysOverdue` - Số ngày quá hạn
- `daysUntilDue` - Số ngày đến hạn

### Indexes
- `invoiceNumber` (unique)
- `issueDate` (descending)
- `dueDate`
- `paymentStatus` + `dueDate`
- `seller` + `issueDate` (descending)
- `buyer` + `issueDate` (descending)

### Static Methods
- `generateInvoiceNumber(invoiceType)` - Tạo số hóa đơn tự động
- `getInvoices(filters, options)` - Lấy danh sách với pagination
- `getInvoiceStats(dateRange, filters)` - Lấy thống kê

### Pre-save Middleware
- Tự động tính `dueAmount` = `totalAmount` - `paidAmount`
- Tự động cập nhật `paymentStatus` dựa trên `paidAmount` và `dueDate`
- Tự động set `paidDate` khi thanh toán đủ

---

## 🔌 API Endpoints

### 1. **GET /api/invoices**
**Mô tả:** Lấy danh sách hóa đơn

**Query Parameters:**
- `page` (Number, default: 1) - Trang
- `limit` (Number, default: 50) - Số lượng mỗi trang
- `invoiceType` (String) - Lọc theo loại
- `status` (String) - Lọc theo trạng thái
- `paymentStatus` (String) - Lọc theo trạng thái thanh toán
- `startDate` (Date) - Từ ngày
- `endDate` (Date) - Đến ngày
- `search` (String) - Tìm kiếm (số HĐ, tên người mua/bán)

**Phân quyền:**
- Tất cả user đã đăng nhập
- Non-admin chỉ xem invoices của tổ chức mình

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

### 2. **GET /api/invoices/:id**
**Mô tả:** Lấy chi tiết hóa đơn theo ID

**Phân quyền:**
- Tất cả user đã đăng nhập
- Non-admin chỉ xem invoices của tổ chức mình

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice": {...}
  }
}
```

### 3. **POST /api/invoices**
**Mô tả:** Tạo hóa đơn trực tiếp (không từ order)

**Body:**
```json
{
  "invoiceType": "sales",
  "sellerId": "userId",
  "sellerInfo": {...},
  "buyerId": "userId",
  "buyerInfo": {...},
  "items": [...],
  "issueDate": "2024-01-01",
  "dueDate": "2024-01-31",
  "paymentMethod": "bank_transfer",
  "notes": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công.",
  "data": {
    "success": true,
    "invoice": {...}
  }
}
```

### 4. **POST /api/invoices/from-order/:orderId**
**Mô tả:** Tạo hóa đơn từ đơn hàng

**Phân quyền:**
- Tất cả user đã đăng nhập

**Response:**
```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công.",
  "data": {
    "success": true,
    "invoice": {...}
  }
}
```

### 5. **POST /api/invoices/:id/payment**
**Mô tả:** Ghi nhận thanh toán cho hóa đơn

**Body:**
```json
{
  "amount": 1000000,
  "method": "bank_transfer",
  "paymentDate": "2024-01-15",
  "bankTransaction": "...",
  "cardTransaction": "...",
  "gatewayTransaction": "...",
  "notes": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ghi nhận thanh toán thành công.",
  "data": {
    "success": true,
    "payment": {...},
    "invoice": {...}
  }
}
```

### 6. **GET /api/invoices/stats**
**Mô tả:** Lấy thống kê hóa đơn

**Query Parameters:**
- `startDate` (Date) - Từ ngày
- `endDate` (Date) - Đến ngày
- `invoiceType` (String) - Lọc theo loại
- `status` (String) - Lọc theo trạng thái

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalInvoices": 100,
      "totalAmount": 1000000000,
      "paidAmount": 800000000,
      "dueAmount": 200000000,
      "statusCounts": {...},
      "paymentStatusCounts": {...}
    }
  }
}
```

---

## 🔧 Services (Business Logic)

### `invoiceService.js`

#### 1. **createInvoiceFromOrder(orderId, user, req)**
Tạo hóa đơn từ đơn hàng:
- Load order với items, buyer, seller
- Kiểm tra order đã có invoice chưa
- Tính toán giá trị từ order items
- Tạo invoice number tự động
- Tính VAT 10%
- Set due date = issue date + 30 ngày
- Tạo invoice record
- Ghi audit log

#### 2. **createInvoice(invoiceData, user, req)**
Tạo hóa đơn trực tiếp:
- Validate input
- Tính toán giá trị từ items
- Tính VAT
- Tạo invoice number tự động
- Tạo invoice record
- Ghi audit log

#### 3. **recordPayment(invoiceId, paymentData, user, req)**
Ghi nhận thanh toán:
- Load invoice
- Tạo Payment record
- Cập nhật `paidAmount` và `dueAmount` của invoice
- Tự động cập nhật `paymentStatus`:
  - `paid` nếu `paidAmount >= totalAmount`
  - `partial` nếu `paidAmount > 0` và `< totalAmount`
- Set `paidDate` nếu thanh toán đủ
- Ghi audit log

---

## 🎨 Frontend Component

### `Invoices.js`

#### Tính năng:
1. **Hiển thị danh sách hóa đơn**
   - Table với pagination
   - Hiển thị: Số HĐ, Loại, Người mua, Ngày phát hành, Tổng tiền, Đã trả, Còn nợ, Trạng thái

2. **Thống kê (Stats Cards)**
   - Tổng hóa đơn
   - Tổng giá trị
   - Đã thanh toán
   - Còn nợ

3. **Bộ lọc (Filters)**
   - Tìm kiếm (số HĐ, tên)
   - Loại hóa đơn
   - Trạng thái
   - Trạng thái thanh toán
   - Từ ngày / Đến ngày
   - Nút Reset

4. **Ghi nhận thanh toán**
   - Modal form
   - Nhập số tiền
   - Chọn phương thức thanh toán
   - Chọn ngày thanh toán
   - Ghi chú

5. **Format hiển thị**
   - Currency (VND)
   - Date (vi-VN)
   - Status badges với màu sắc

#### State Management:
- `invoices` - Danh sách hóa đơn
- `payments` - Danh sách thanh toán
- `stats` - Thống kê
- `filters` - Bộ lọc
- `pagination` - Phân trang
- `showPaymentModal` - Hiển thị modal thanh toán
- `selectedInvoice` - Hóa đơn được chọn
- `paymentData` - Dữ liệu thanh toán

#### API Integration:
- `invoiceAPI.getInvoices(params)` - Lấy danh sách
- `invoiceAPI.getInvoiceById(id)` - Lấy chi tiết
- `invoiceAPI.getInvoiceStats(params)` - Lấy thống kê
- `invoiceAPI.recordPayment(id, data)` - Ghi nhận thanh toán
- `paymentAPI.getPayments(params)` - Lấy danh sách thanh toán

---

## 🔐 Phân quyền & Bảo mật

### Authentication
- Tất cả routes yêu cầu `authenticate` middleware
- User phải đăng nhập mới truy cập được

### Authorization
- **Admin:** Xem tất cả invoices
- **Non-admin:** Chỉ xem invoices của tổ chức mình:
  - Invoices mà user là seller
  - Invoices mà user là buyer
  - Invoices có `sellerInfo.organization` hoặc `buyerInfo.organization` trùng với tổ chức của user

### Audit Logging
- Tất cả thao tác tạo, cập nhật invoice đều được ghi audit log
- Ghi log khi:
  - Tạo invoice (`invoice_create`)
  - Ghi nhận thanh toán (`payment_record`)

---

## 📈 Tính năng nâng cao

### 1. **Tự động tính toán**
- Tự động tính `subtotal`, `tax`, `totalAmount` từ items
- Tự động tính `dueAmount` = `totalAmount` - `paidAmount`
- Tự động cập nhật `paymentStatus` dựa trên `paidAmount` và `dueDate`

### 2. **Số hóa đơn tự động**
- Format: `{PREFIX}-{YYYYMM}-{TIMESTAMP}`
- Prefix: `HD` (sales), `HDM` (purchase), `HD` (other)
- Ví dụ: `HD-202412-123456`

### 3. **Virtual Fields**
- `daysOverdue` - Số ngày quá hạn
- `daysUntilDue` - Số ngày đến hạn

### 4. **Thống kê nâng cao**
- Tổng số hóa đơn
- Tổng giá trị
- Tổng đã thanh toán
- Tổng còn nợ
- Thống kê theo trạng thái
- Thống kê theo trạng thái thanh toán

### 5. **Tích hợp với Orders**
- Tạo invoice từ order tự động
- Liên kết invoice với order
- Đồng bộ thông tin buyer/seller từ order

### 6. **Tích hợp với Payments**
- Tạo Payment record khi ghi nhận thanh toán
- Liên kết Payment với Invoice
- Cập nhật invoice khi có payment mới

---

## 🐛 Xử lý lỗi

### Backend
- Validation errors trả về 400
- Not found errors trả về 404
- Permission errors trả về 403
- Server errors trả về 500
- Tất cả errors đều có message rõ ràng

### Frontend
- Hiển thị toast notifications cho errors
- Loading states
- Error states trong UI

---

## 📝 Ghi chú kỹ thuật

### 1. **Model Pre-save Hook**
- Tự động tính `dueAmount` trước khi save
- Tự động cập nhật `paymentStatus`:
  - `paid` nếu `paidAmount >= totalAmount`
  - `partial` nếu `paidAmount > 0` và `< totalAmount`
  - `overdue` nếu `dueDate < now` và chưa thanh toán đủ

### 2. **Pagination**
- Sử dụng `skip` và `limit` cho pagination
- Tính tổng số records riêng để hiệu quả

### 3. **Populate**
- Populate `seller`, `buyer`, `order`, `createdBy` khi cần
- Chỉ populate các fields cần thiết để tối ưu performance

### 4. **Indexes**
- Index trên các fields thường query: `invoiceNumber`, `issueDate`, `dueDate`, `paymentStatus`
- Composite indexes cho queries phức tạp

---

## 🚀 Tính năng tương lai (Có thể mở rộng)

1. **Xuất PDF hóa đơn**
   - Tích hợp thư viện PDF generation
   - Template hóa đơn chuẩn Việt Nam
   - Lưu PDF vào `pdfFile`

2. **QR Code cho hóa đơn**
   - Tạo QR code chứa thông tin hóa đơn
   - Quét QR để xem hóa đơn

3. **Email notifications**
   - Gửi email khi tạo invoice
   - Gửi email khi thanh toán
   - Gửi email khi quá hạn

4. **Tích hợp payment gateway**
   - Tích hợp với các cổng thanh toán
   - Xử lý thanh toán online

5. **Báo cáo nâng cao**
   - Báo cáo doanh thu
   - Báo cáo công nợ
   - Báo cáo theo thời gian
   - Export Excel/PDF

6. **Hóa đơn điện tử (E-Invoice)**
   - Tích hợp với hệ thống hóa đơn điện tử của cơ quan thuế
   - Ký số hóa đơn
   - Gửi lên cơ quan thuế

---

## 📚 Tài liệu tham khảo

- Invoice Model: `models/Invoice.js`
- Invoice Controller: `controllers/invoiceController.js`
- Invoice Service: `services/invoiceService.js`
- Invoice Routes: `routes/invoices.js`
- Frontend Component: `frontend/src/pages/Invoices.js`

---

**Tài liệu được tạo tự động từ codebase - Cập nhật: 2024-12-07**

