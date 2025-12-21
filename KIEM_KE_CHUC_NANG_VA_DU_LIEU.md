# 📊 KIỂM KÊ TOÀN BỘ CHỨC NĂNG VÀ DỮ LIỆU ĐANG HIỂN THỊ

**Ngày kiểm kê:** 2025-01-XX  
**Mục đích:** Liệt kê đầy đủ chức năng nghiệp vụ và dữ liệu hiển thị trên từng màn hình

---

## 📋 QUY ƯỚC PHÂN LOẠI

- ✅ **Có UI thao tác:** Chức năng đã có button/form/modal để người dùng thao tác
- ⚠️ **Có nghiệp vụ, thiếu entry point:** Backend đã có API/logic, nhưng chưa có UI để truy cập

---

## 1. DASHBOARD (`/dashboard`)

### Chức năng nghiệp vụ
- ✅ **Xem tổng quan hệ thống:** Thống kê tổng hợp
- ✅ **Xem hoạt động gần đây:** Timeline các hoạt động
- ✅ **Quick Actions:** Links nhanh đến các chức năng chính

### Dữ liệu đang hiển thị

#### Statistics Cards (6 cards)
1. **Tổng lô thuốc** (totalDrugs)
2. **Người dùng hoạt động** (activeUsers)
3. **Nhiệm vụ hoàn thành** (completedTasks)
4. **Nhiệm vụ chờ xử lý** (pendingTasks)
5. **Cảnh báo** (alerts)
6. **Quét QR hôm nay** (todayScans)

#### Recent Activities Feed
- Danh sách hoạt động gần đây với:
  - Type (drug_created, qr_scan, task_completed, task_updated, alert, user_registered, supply_chain)
  - Title/Message
  - Actor (người thực hiện)
  - Timestamp (format relative time)

#### Quick Actions (4 actions)
1. Quét QR Code → `/qr-scanner`
2. Quản lý Thuốc → `/drugs`
3. Quản lý Users → `/users` (admin only)
4. Xem Báo cáo → `/reports`

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 2. QUẢN LÝ THUỐC (`/drugs`)

### Chức năng nghiệp vụ
- ✅ **Tạo lô thuốc mới:** Form tạo drug với các thông tin cơ bản
- ✅ **Xem danh sách thuốc:** Table với pagination
- ✅ **Tìm kiếm:** Search by name/activeIngredient
- ✅ **Lọc theo status:** Filter dropdown
- ✅ **Sửa thuốc:** Edit modal
- ✅ **Xóa thuốc:** Delete action
- ✅ **Tạo QR Code:** Generate QR code cho drug
- ✅ **Cập nhật trạng thái phân phối:** Update distribution status
- ✅ **Thu hồi thuốc:** Recall drug
- ✅ **Xem thống kê:** Stats về drugs

### Dữ liệu đang hiển thị

#### Drug List Table
- Tên thuốc (name)
- Hoạt chất (activeIngredient)
- Dạng bào chế (form)
- Liều lượng (dosage)
- Số lô (batchNumber)
- Ngày sản xuất (productionDate)
- Hạn sử dụng (expiryDate)
- Trạng thái (status: active, recalled, expired, suspended)
- Distribution status
- Actions (Edit, Delete, Generate QR, View)

#### Statistics
- Tổng số drugs
- Drugs theo status
- Drugs theo distribution status

#### Drug Form Fields (Create/Edit)
- name (required)
- activeIngredient (required)
- dosage
- form
- batchNumber
- productionDate
- expiryDate

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 3. QUẢN LÝ KHO (`/inventory`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách tồn kho:** Table với filters và pagination
- ✅ **Nhập kho (Stock In):** Modal form nhập kho
- ✅ **Xuất kho (Stock Out):** Modal form xuất kho
- ✅ **Điều chuyển kho (Transfer):** Modal form chuyển kho
- ✅ **Điều chỉnh tồn kho (Adjust):** Modal form điều chỉnh
- ✅ **Kiểm kê kho (Stocktake):** Modal form kiểm kê
- ✅ **Xem thống kê:** Stats về inventory
- ✅ **Tìm kiếm:** Search by drug/location
- ✅ **Lọc:** Filter by location, drug, status, low stock, near expiry, expired

### Dữ liệu đang hiển thị

#### Inventory List Table
- Tên thuốc (drug name)
- Số lô (batch number)
- Vị trí kho (location)
- Số lượng tồn (quantity)
- Đơn vị (unit)
- Giá nhập (unit price)
- Ngày hết hạn (expiry date)
- Trạng thái (status)
- Actions (Stock In, Stock Out, Transfer, Adjust, Stocktake)

#### Statistics
- Tổng giá trị tồn kho
- Số lượng items
- Items sắp hết hạn
- Items hết hạn
- Items sắp hết (low stock)

#### Stock In Form
- drugId
- batchNumber
- locationId, locationName, locationType
- quantity, unit
- unitPrice
- expiryDate, productionDate
- supplierId, supplierName
- notes

#### Stock Out Form
- drugId
- locationId
- quantity
- reason (sale, damaged, expired, other)
- recipientName
- notes

#### Transfer Form
- drugId
- fromLocationId
- toLocationId, toLocationName, toLocationType
- quantity
- notes

#### Adjust Form
- drugId
- locationId
- newQuantity
- reason (adjustment, correction, other)
- notes

#### Stocktake Form
- locationId
- items array: [{ drugId, actualQuantity, notes }]
- stocktakeDate
- notes

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 4. QUẢN LÝ ĐƠN HÀNG (`/orders`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách đơn hàng:** Table với filters
- ✅ **Tạo đơn hàng mới:** Create order modal
- ✅ **Xem chi tiết đơn hàng:** Detail modal
- ✅ **Sửa đơn hàng:** Edit order (limited)
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by orderType, status, date range
- ✅ **Xem thống kê:** Stats về orders

### Dữ liệu đang hiển thị

#### Order List Table
- Mã đơn hàng (order number)
- Loại đơn (orderType: purchase, sale)
- Người mua/Người bán (buyer/seller)
- Tổng tiền (total amount)
- Trạng thái (status)
- Ngày tạo (createdAt)
- Actions (View, Edit)

#### Statistics
- Tổng số đơn hàng
- Đơn hàng theo status
- Tổng giá trị đơn hàng
- Đơn hàng theo orderType

#### Order Form (Create/Edit)
- orderType (purchase, sale)
- buyerId, buyerName, buyerOrganization
- sellerId, sellerName, sellerOrganization
- items: [{ drugId, quantity, unitPrice, unit, discount, notes }]
- shippingAddress: { name, address, city, province, phone, email }
- paymentMethod
- shippingMethod
- requiredDate
- notes

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 5. B2B MARKETPLACE (`/marketplace`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách sản phẩm:** Grid layout với pagination
- ✅ **Tìm kiếm sản phẩm:** Search bar
- ✅ **Lọc theo nhà sản xuất:** Manufacturer filter
- ✅ **Chế độ hiển thị:** Auto/Accepted/All
- ✅ **Xem chi tiết sản phẩm:** Product detail modal
- ✅ **Thêm vào giỏ hàng:** Add to cart (min order quantity)
- ✅ **Xem giỏ hàng:** Cart drawer
- ✅ **Checkout:** Navigate to checkout page

### Dữ liệu đang hiển thị

#### Product Grid Cards
- Tên thuốc (name)
- Nhà sản xuất (manufacturer name)
- Giá bán buôn (wholesale price)
- Giá đã chốt (accepted bid price - nếu có)
- Số lượng tối thiểu (min order quantity)
- Tồn kho (stock availability)
- Status badge (accepted bid indicator)
- Actions (View detail, Add to cart)

#### Product Detail Modal
- Chi tiết đầy đủ về thuốc
- Form thêm vào giỏ với quantity selector

#### Cart Drawer (Component)
- Danh sách items trong cart
- Quantity adjustment
- Remove item
- Total price
- Checkout button

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 6. CHECKOUT (`/checkout`)

### Chức năng nghiệp vụ
- ✅ **Xem lại đơn hàng:** Order review với cart items
- ✅ **Nhập địa chỉ giao hàng:** Shipping address form
- ✅ **Nhập địa chỉ thanh toán:** Billing address form (có thể dùng giống shipping)
- ✅ **Chọn phương thức thanh toán:** Payment method selector
- ✅ **Ghi chú:** Notes field
- ✅ **Xác nhận và đặt hàng:** Submit order

### Dữ liệu đang hiển thị

#### Order Review Section
- Danh sách items trong cart
- Thông tin từng item (name, quantity, price)
- Tổng tiền

#### Shipping Address Form
- name
- address
- city
- province
- postalCode
- phone
- email

#### Billing Address Form
- sameAsShipping checkbox
- (các field tương tự shipping nếu khác)

#### Payment Method
- bank_transfer
- credit_card
- cash_on_delivery
- credit_limit (nếu có)

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 7. QUẢN LÝ ĐẤU THẦU (`/bids`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách đấu thầu:** Table với filters
- ✅ **Chế độ xem:** My bids / Received bids (manufacturer)
- ✅ **Chấp nhận bid:** Accept bid
- ✅ **Từ chối bid:** Reject bid
- ✅ **Đưa ra giá phản hồi:** Counter offer modal
- ✅ **Lọc theo status:** Status filter

### Dữ liệu đang hiển thị

#### Bid List Table
- Thuốc (drug name)
- Người đấu thầu (bidder name)
- Giá đề xuất (bid price)
- Giá phản hồi (counter price - nếu có)
- Trạng thái (status: pending, accepted, rejected, expired)
- Ngày tạo (createdAt)
- Actions (Accept, Reject, Counter offer)

#### Counter Offer Modal
- counterPrice input
- counterNotes textarea

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 8. CHUỖI CUNG ỨNG (`/supply-chain`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách hành trình:** Table/list view
- ✅ **Tạo hành trình mới:** Create supply chain modal
- ✅ **Thêm bước vào hành trình:** Add step modal
- ✅ **Xem chi tiết hành trình:** Detail modal với timeline
- ✅ **Xem bản đồ:** Map view với SupplyChainMap component
- ✅ **Tạo QR Code:** Generate QR code cho supply chain
- ✅ **Thu hồi hành trình:** Recall supply chain
- ✅ **Xóa hàng loạt:** Bulk delete với select mode
- ✅ **Xuất dữ liệu:** Export supply chains
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by status, role
- ✅ **Real-time updates:** SSE (Server-Sent Events) connection

### Dữ liệu đang hiển thị

#### Supply Chain List Table
- Batch number
- Drug name
- Manufacturer
- Trạng thái (status)
- Số bước (steps count)
- Ngày tạo (createdAt)
- Actions (View, Add step, Delete, Export, Bulk delete)

#### Supply Chain Detail Modal
- Thông tin cơ bản về hành trình
- DrugTimeline component: Hiển thị timeline các bước
  - Stage name
  - Location
  - Timestamp
  - Signer name
  - Verification status
  - Temperature (nếu có)
  - Warning messages
- Actions (Add step, View map, Generate QR)

#### Supply Chain Map
- Map visualization với các địa điểm
- Focus on specific address

#### Create Supply Chain Form
- drugId
- batchNumber
- initialLocation
- notes

#### Add Step Form
- stepType (created, shipped, received, stored, dispensed, quality_check, recalled, handover, reported, consumed)
- location
- locationDetails
- signerName
- temperature (optional)
- humidity (optional)
- notes
- documents (optional)

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 9. HÓA ĐƠN & THANH TOÁN (`/invoices`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách hóa đơn:** Table với filters
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by invoiceType, status, paymentStatus, date range
- ✅ **Xem chi tiết:** View invoice details
- ✅ **Ghi nhận thanh toán:** Record payment modal
- ✅ **Xem danh sách thanh toán:** Payments list
- ✅ **Xem thống kê:** Stats về invoices và payments

### Dữ liệu đang hiển thị

#### Invoice List Table
- Mã hóa đơn (invoice number)
- Loại hóa đơn (invoiceType)
- Người mua/Người bán
- Tổng tiền (total amount)
- Trạng thái (status)
- Trạng thái thanh toán (payment status)
- Ngày tạo (createdAt)
- Actions (View, Record payment)

#### Payment List
- Invoice number
- Payment amount
- Payment method
- Payment date
- Status

#### Statistics
- Tổng số hóa đơn
- Tổng giá trị
- Hóa đơn theo status
- Thanh toán theo status

#### Record Payment Modal
- amount
- method (bank_transfer, cash, credit_card)
- paymentDate
- notes

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 10. QUẢN LÝ NHIỆM VỤ (`/tasks`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách nhiệm vụ:** Table với filters
- ✅ **Tạo nhiệm vụ mới:** Create task modal
- ✅ **Xem chi tiết nhiệm vụ:** Task detail modal
- ✅ **Sửa nhiệm vụ:** Update task modal
- ✅ **Thêm cập nhật:** Add update to task
- ✅ **Đánh giá nhiệm vụ:** Rate task modal
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by status, priority, type, assignedTo
- ✅ **Xem thống kê:** Stats về tasks

### Dữ liệu đang hiển thị

#### Task List Table
- Tiêu đề (title)
- Loại (type)
- Mức độ ưu tiên (priority)
- Người được giao (assignedTo)
- Trạng thái (status: pending, in_progress, completed, cancelled)
- Ngày tạo (createdAt)
- Deadline
- Actions (View, Edit, Add update, Rate)

#### Task Detail Modal
- Thông tin cơ bản (title, type, priority, status)
- Người tạo/người được giao
- Mô tả
- Deadline
- Danh sách updates (timeline)
- Actions (Add update, Rate)

#### Create/Update Task Form
- title (required)
- description
- type
- priority (low, medium, high, urgent)
- assignedTo
- deadline
- status

#### Add Update Form
- update text
- attachments (optional)

#### Rate Task Form
- rating (1-5 stars)
- feedback

#### Statistics
- Tổng số tasks
- Tasks theo status
- Tasks theo priority
- Completed tasks count

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 11. QUÉT QR (`/qr-scanner`)

### Chức năng nghiệp vụ
- ✅ **Quét QR bằng camera:** Camera scanner
- ✅ **Upload ảnh QR:** Upload image file
- ✅ **Nhập thủ công:** Manual QR code input
- ✅ **Xem thông tin thuốc:** Drug information display
- ✅ **Xem blockchain data:** Blockchain verification
- ✅ **Xem thông tin rủi ro:** Risk information (nếu có)
- ✅ **Xem lịch sử quét:** Scan history (localStorage)

### Dữ liệu đang hiển thị

#### Scan Result Section
- Drug information:
  - Name, activeIngredient, dosage, form
  - Batch number
  - Production date, expiry date
  - Manufacturer
  - Distribution status
- Blockchain verification:
  - Verification status
  - Blockchain ID
  - Transaction hash
  - Timestamp
- Risk information:
  - Recall status
  - Expiry warnings
  - Quality alerts

#### Scan History
- Last 10 scans (stored in localStorage)
- QR code value
- Scan timestamp

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 12. THÔNG BÁO (`/notifications`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách thông báo:** List với filters
- ✅ **Tabs:** Received / Sent notifications
- ✅ **Tạo thông báo mới:** Create notification modal
- ✅ **Tạo thông báo hệ thống:** Create system notification modal
- ✅ **Xem chi tiết:** Notification detail modal
- ✅ **Đánh dấu đã đọc:** Mark as read
- ✅ **Đánh dấu chưa đọc:** Mark as unread
- ✅ **Đánh dấu tất cả đã đọc:** Mark all as read
- ✅ **Xóa thông báo:** Delete notification
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by type, priority, unreadOnly
- ✅ **Xem thống kê:** Stats về notifications

### Dữ liệu đang hiển thị

#### Notification List
- Tiêu đề (title)
- Nội dung (content preview)
- Loại (type: info, warning, error, success, system)
- Mức độ ưu tiên (priority: low, medium, high, critical)
- Trạng thái đọc (read/unread)
- Người gửi (sender)
- Ngày tạo (createdAt)
- Actions (View, Mark read/unread, Delete)

#### Notification Detail Modal
- Full content
- All metadata
- Related links/actions

#### Create Notification Form
- title (required)
- content (required)
- type
- priority
- recipientIds (multiple users)
- scope (all, roles, users)
- scopeDetails
- relatedModule
- relatedId
- requiresAction
- actionUrl

#### Statistics
- Tổng số notifications
- Unread count
- Notifications theo type
- Notifications theo priority

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 13. BÁO CÁO (`/reports`)

### Chức năng nghiệp vụ
- ✅ **Xem tổng quan hệ thống:** System overview tab
- ✅ **Xem báo cáo module:** Module reports tab (drugs, inventory, orders, tasks, users, supply-chain)
- ✅ **Xem KPI:** KPIs tab
- ✅ **Xem cảnh báo:** Alerts tab
- ✅ **Xem thuốc rủi ro cao:** Risky drugs tab (AI-based)
- ✅ **Xem thống kê quét QR:** QR scan statistics
- ✅ **Xem điểm tín nhiệm:** Trust score statistics
- ✅ **Lọc theo khoảng thời gian:** Date range filter
- ✅ **Xuất báo cáo:** Export reports (PDF/Excel)

### Dữ liệu đang hiển thị

#### Overview Tab
- System statistics summary
- Charts and graphs
- Key metrics

#### Module Reports Tab
- Module selector (drugs, inventory, orders, tasks, users, supply-chain)
- Module-specific statistics
- Charts
- Tables

#### KPIs Tab
- KPI metrics
- Trend charts
- Comparison data

#### Alerts Tab
- Alert list
- Alert summary (total, critical, high, medium, low)
- Alert details

#### Risky Drugs Tab
- List of high-risk drugs
- Risk factors
- Recommendations

#### QR Scan Statistics
- Scan count
- Scan trends
- Scan by drug/location

#### Trust Score Statistics
- Trust scores by organization
- Score trends
- Score breakdowns

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 14. BLOCKCHAIN (`/blockchain`)

### Chức năng nghiệp vụ
- ✅ **Xem thống kê blockchain:** Stats về blockchain
- ✅ **Xem danh sách thuốc trên blockchain:** Drugs list
- ✅ **Tìm kiếm thuốc:** Search drugs
- ✅ **Xác minh thuốc:** Verify drug
- ✅ **Xem chi tiết thuốc:** View drug details modal

### Dữ liệu đang hiển thị

#### Blockchain Stats
- Total drugs on blockchain
- Total transactions
- Blockchain status

#### Drugs List Table
- Drug name
- Blockchain ID
- Verification status
- Transaction hash
- Timestamp
- Actions (Verify, View details)

#### Drug Details Modal
- Full drug information
- Blockchain transaction details
- Verification history

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 15. BLOCKCHAIN EXPLORER (`/blockchain/explorer`)

### Chức năng nghiệp vụ
- ✅ **Duyệt blockchain:** Browse transactions
- ✅ **Tìm kiếm:** Search by transaction hash/drug ID
- ✅ **Xem chi tiết transaction:** Transaction details
- ✅ **Xác minh transaction:** Verify transaction

### Dữ liệu đang hiển thị

#### Transaction List
- Transaction hash
- Block number
- Timestamp
- Drug ID
- Transaction type
- Status
- Actions (View details, Verify)

#### Transaction Details
- Full transaction data
- Block information
- Verification status

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 16. BLOCKCHAIN VERIFY (`/blockchain/verify`)

### Chức năng nghiệp vụ
- ✅ **Xác minh thuốc từ blockchain ID:** Verify form
- ⚠️ **Chưa có trong menu navigation:** Có route nhưng không có entry point trong sidebar

### Dữ liệu đang hiển thị
- Verification form
- Verification results
- Drug information

### Phân loại
- ⚠️ **Có nghiệp vụ, thiếu entry point:** Route có sẵn nhưng không có link trong menu

---

## 17. NHÀ CUNG ỨNG (`/suppliers`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách nhà cung ứng:** Table/list
- ✅ **Tạo nhà cung ứng mới:** Create supplier
- ✅ **Sửa nhà cung ứng:** Edit supplier
- ✅ **Xóa nhà cung ứng:** Delete supplier
- ✅ **Tìm kiếm:** Search
- ✅ **Xem chi tiết:** View supplier details

### Dữ liệu đang hiển thị

#### Supplier List Table
- Tên nhà cung ứng (name)
- Liên hệ (contact info)
- Địa chỉ (address)
- Số điện thoại (phone)
- Email
- Trạng thái (status)
- Actions (View, Edit, Delete)

#### Supplier Form
- name
- contactPerson
- address
- phone
- email
- notes

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 18. ĐÁNH GIÁ (`/reviews`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách đánh giá:** List với filters
- ✅ **Tạo đánh giá mới:** Create review
- ✅ **Xem chi tiết đánh giá:** Review detail
- ✅ **Vote hữu ích:** Vote helpful/not helpful
- ✅ **Phản hồi đánh giá:** Respond to review
- ✅ **Báo cáo đánh giá:** Report review
- ✅ **Xem đánh giá của mình:** My reviews
- ✅ **Xem đánh giá theo target:** Reviews by drug/organization
- ✅ **Xem đánh giá hàng đầu:** Top-rated reviews
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by rating, target type

### Dữ liệu đang hiển thị

#### Review List
- Target (drug/organization name)
- Rating (stars 1-5)
- Review content
- Reviewer name
- Vote count (helpful/not helpful)
- Ngày tạo (createdAt)
- Actions (View, Vote, Respond, Report)

#### Review Detail
- Full review content
- Rating breakdown
- Votes
- Responses
- Report status

#### Create Review Form
- targetType (drug, organization)
- targetId
- rating (required)
- content (required)
- attachments (optional)

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 19. QUẢN LÝ USERS (`/users`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách users:** Table với pagination
- ✅ **Tạo user mới:** Create user modal
- ✅ **Sửa user:** Edit user modal
- ✅ **Xóa user:** Delete user modal
- ✅ **Khóa/Mở khóa user:** Toggle lock
- ✅ **Reset mật khẩu:** Reset password
- ✅ **Xem chi tiết user:** User details modal
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc theo role:** Role filter
- ✅ **Xem thống kê:** User stats

### Dữ liệu đang hiển thị

#### User List Table
- Full name, username, email
- Role (badge)
- Organization/Patient ID
- Trạng thái (status: active, locked)
- Ngày tạo (createdAt)
- Actions (View, Edit, Delete, Lock/Unlock, Reset password)

#### User Form (Create/Edit)
- username
- email
- password (create only)
- fullName
- phone
- address
- role
- organizationInfo (if applicable)

#### User Details Modal
- All user information
- Activity history
- Related records

#### Statistics
- Tổng số users
- Users theo role
- Active users
- Locked users

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 20. QUẢN LÝ YÊU CẦU NÂNG CẤP (`/role-upgrade/management`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách yêu cầu:** Table với filters
- ✅ **Xem chi tiết yêu cầu:** Detail modal với documents
- ✅ **Duyệt yêu cầu:** Approve request modal
- ✅ **Từ chối yêu cầu:** Reject request modal
- ✅ **Xem/download documents:** View/download uploaded files
- ✅ **Lọc theo status:** Status filter

### Dữ liệu đang hiển thị

#### Request List Table
- User name (requestedBy)
- Current role
- Requested role
- Status (pending, approved, rejected, cancelled)
- Ngày tạo (createdAt)
- Reviewed by (nếu đã review)
- Actions (View, Approve, Reject)

#### Request Detail Modal
- User information
- Current role / Requested role
- Reason
- Additional info (organizationName, address, phone, email, businessLicense, taxCode)
- Documents list (view/download)
- Admin notes (nếu có)
- Review history

#### Approve/Reject Modal
- adminNotes textarea

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 21. YÊU CẦU NÂNG CẤP ROLE (`/role-upgrade/request`)

### Chức năng nghiệp vụ
- ✅ **Tạo yêu cầu nâng cấp:** Form submit request
- ✅ **Upload documents:** Upload files (PDF, JPG, PNG, max 5 files, 10MB each)
- ✅ **Xem lịch sử yêu cầu:** Request history list
- ✅ **Xem/download documents:** View/download uploaded files

### Dữ liệu đang hiển thị

#### Request Form
- requestedRole (manufacturer, distributor, hospital)
- reason (textarea)
- additionalInfo:
  - organizationName
  - organizationAddress
  - organizationPhone
  - organizationEmail
  - businessLicense
  - taxCode
- documents (file upload, max 5)

#### Request History List
- Requested role
- Status (pending, approved, rejected, cancelled)
- Ngày tạo (createdAt)
- Reviewed by / Reviewed at (nếu có)
- Admin notes (nếu có)
- Actions (View documents)

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 22. AUDIT LOG (`/audit-logs`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách audit logs:** Table với filters
- ✅ **Tìm kiếm:** Search
- ✅ **Lọc:** Filter by action, user, module, date range
- ✅ **Xem chi tiết:** View log details
- ✅ **Xuất logs:** Export logs

### Dữ liệu đang hiển thị

#### Audit Log List Table
- Timestamp
- User (who performed action)
- Action (create, update, delete, etc.)
- Module (drugs, users, orders, etc.)
- Entity ID
- IP Address
- User Agent
- Actions (View details)

#### Log Details
- Full log information
- Before/After changes
- Request details

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 23. BACKUP & RESTORE (`/backups`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách backups:** Backup list
- ✅ **Tạo backup:** Create backup
- ✅ **Restore backup:** Restore from backup
- ✅ **Xóa backup:** Delete backup
- ✅ **Download backup:** Download backup file

### Dữ liệu đang hiển thị

#### Backup List Table
- Backup name
- Backup type
- Size
- Created date
- Status
- Actions (Restore, Download, Delete)

#### Create Backup Form
- Backup name
- Backup type (full, partial)
- Modules to include

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 24. IMPORT/EXPORT (`/import-export`)

### Chức năng nghiệp vụ
- ✅ **Export dữ liệu:** Export data to Excel/CSV
- ✅ **Import dữ liệu:** Import from Excel/CSV
- ✅ **Template download:** Download import templates
- ✅ **Xem lịch sử import/export:** History list

### Dữ liệu đang hiển thị

#### Export Section
- Module selector
- Date range
- Format selector (Excel, CSV)
- Export button

#### Import Section
- File upload
- Template download link
- Import progress
- Import results

#### History List
- Export/Import records
- Date/time
- Status
- File info

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 25. CÀI ĐẶT (`/settings`)

### Chức năng nghiệp vụ
- ✅ **Xem cài đặt hệ thống:** Settings form
- ✅ **Cập nhật cài đặt:** Update settings
- ✅ **Xem thông tin hệ thống:** System info
- ✅ **Xem trạng thái blockchain:** Blockchain status
- ✅ **Test blockchain:** Test blockchain connection
- ✅ **Reset hệ thống:** Reset system (cẩn thận)

### Dữ liệu đang hiển thị

#### Settings Form
- System name
- System description
- Timezone
- Date format
- Language
- Email settings
- Blockchain settings
- Other system configurations

#### System Info
- Version
- Database info
- Server info
- Uptime

#### Blockchain Status
- Connection status
- Network info
- Account info

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 26. PROFILE (`/profile`)

### Chức năng nghiệp vụ
- ✅ **Xem thông tin cá nhân:** Profile header với avatar
- ✅ **Cập nhật thông tin chung:** General tab
- ✅ **Cập nhật thông tin tổ chức:** Organization tab (nếu có)
- ✅ **Quản lý bảo mật:** Security tab (change password)
- ✅ **Quản lý thông báo:** Notification preferences tab
- ✅ **Upload avatar:** Avatar upload

### Dữ liệu đang hiển thị

#### Profile Header
- Avatar (upload/edit)
- Full name
- Email
- Role
- Organization/Patient ID

#### General Tab
- Full name
- Email
- Phone
- Address
- Date of birth (nếu có)

#### Organization Tab (nếu có organization)
- Organization name
- Organization address
- Organization phone
- Organization email
- Business license
- Tax code

#### Security Tab
- Current password
- New password
- Confirm password
- Password strength indicator

#### Notification Preferences Tab
- Email notifications (on/off)
- SMS notifications (on/off)
- Notification types preferences

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 27. CHỮ KÝ SỐ (`/digital-signatures`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách chữ ký:** Signature list
- ✅ **Tạo chữ ký:** Sign document
- ✅ **Xác minh chữ ký:** Verify signature
- ✅ **Thu hồi chữ ký:** Revoke signature
- ✅ **Xem thống kê:** Signature stats

### Dữ liệu đang hiển thị

#### Signature List
- Target (document name/ID)
- Signer
- Signature hash
- Created date
- Status (active, revoked)
- Actions (View, Verify, Revoke)

#### Sign Form
- targetType
- targetId
- Signature data

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 28. ĐIỂM TÍN NHIỆM (`/trust-scores`)

### Chức năng nghiệp vụ
- ✅ **Xem danh sách điểm tín nhiệm:** Trust scores list
- ✅ **Xem chi tiết điểm:** Score details
- ✅ **Xem lịch sử điểm:** Score history
- ✅ **Xem thống kê:** Trust score statistics

### Dữ liệu đang hiển thị

#### Trust Scores List
- Organization name
- Current score
- Score breakdown
- Last updated
- Actions (View details)

#### Score Details
- Full score breakdown
- Score factors
- History chart
- Recommendations

### Phân loại
- ✅ Tất cả chức năng đã có UI thao tác đầy đủ

---

## 29. DRUG TIMELINE DEMO (`/drug-timeline`)

### Chức năng nghiệp vụ
- ✅ **Xem demo timeline:** Demo page với mock data
- ⚠️ **Chưa có trong menu navigation:** Có route nhưng không có entry point trong sidebar

### Dữ liệu đang hiển thị
- Mock timeline events với DrugTimeline component
- Temperature warnings
- Location information

### Phân loại
- ⚠️ **Có nghiệp vụ, thiếu entry point:** Route có sẵn nhưng không có link trong menu

---

## 30. VERIFY (Public) (`/verify/:blockchainId`)

### Chức năng nghiệp vụ
- ✅ **Xác minh công khai:** Public verification page
- ✅ **Xem thông tin thuốc:** Drug information từ blockchain ID

### Dữ liệu đang hiển thị
- Drug information
- Blockchain verification status
- Supply chain timeline
- QR code information

### Phân loại
- ✅ **Public route:** Không cần trong menu, được gọi từ link bên ngoài

---

## 31. LOGIN (`/login`)

### Chức năng nghiệp vụ
- ✅ **Đăng nhập:** Login form
- ✅ **Đăng nhập với Google:** Google OAuth
- ✅ **Demo accounts:** Quick select demo accounts
- ⚠️ **Thiếu link đến Register:** Không có link "Đăng ký"

### Dữ liệu đang hiển thị
- Login form (username/email, password)
- Google login button
- Demo accounts list (right panel trên desktop)
- Default password hint

### Phân loại
- ⚠️ **Thiếu entry point:** Không có link đến trang Register

---

## 32. REGISTER (`/register`)

### Chức năng nghiệp vụ
- ✅ **Đăng ký công khai:** Public registration form
- ✅ **Tự động đăng nhập:** Auto login sau khi đăng ký thành công
- ✅ **Link quay lại Login:** Link back to login

### Dữ liệu đang hiển thị
- Registration form:
  - username (required)
  - email (required)
  - password (required)
  - confirmPassword (required)
  - fullName (required)
  - phone (optional)
  - address (optional)

### Phân loại
- ✅ Chức năng đầy đủ, chỉ thiếu link từ Login page

---

## 📊 TỔNG KẾT PHÂN LOẠI

### ✅ Chức năng đã có UI thao tác đầy đủ: **29/32 pages (90.6%)**

### ⚠️ Chức năng có nghiệp vụ nhưng thiếu entry point UI: **3 items**

1. **Blockchain Verify** (`/blockchain/verify`)
   - Có route, có page component
   - Không có link trong menu navigation
   - **Đề xuất:** Thêm vào menu hoặc gộp vào Blockchain Dashboard

2. **Drug Timeline Demo** (`/drug-timeline`)
   - Có route, có page component
   - Không có link trong menu navigation
   - **Đề xuất:** Thêm vào menu hoặc gộp vào Supply Chain

3. **Link Register từ Login page**
   - Có route `/register`, có page component
   - Thiếu link "Đăng ký" trên Login page
   - **Đề xuất:** Thêm link "Chưa có tài khoản? Đăng ký ngay" vào Login page

---

## 📝 GHI CHÚ

1. **Marketplace và Checkout** sử dụng layout riêng, không dùng Layout wrapper (đúng với thiết kế)

2. **Verify page** là public route, không cần trong menu (đúng với thiết kế)

3. Hầu hết các pages đều có đầy đủ CRUD operations với UI

4. Một số chức năng nâng cao như Export, Import đã có UI đầy đủ

5. Real-time features như SSE đã được implement trong Supply Chain

