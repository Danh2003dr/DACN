# 📋 DANH SÁCH CHỨC NĂNG ĐÃ TỒN TẠI NHƯNG CHƯA CÓ ĐIỂM THAO TÁC RÕ RÀNG TRÊN GIAO DIỆN

**Ngày liệt kê:** 2025-01-XX  
**Mục đích:** Liệt kê các chức năng đã có backend API/logic nhưng chưa có entry point UI rõ ràng

---

## ⚠️ QUY ƯỚC PHÂN LOẠI

- **Chức năng có backend:** Đã có API endpoint trong routes
- **Chức năng có logic:** Đã có controller/service xử lý nghiệp vụ
- **Thiếu entry point UI:** Không có button/link/form/menu item để người dùng truy cập dễ dàng

---

## 1. ĐĂNG KÝ TÀI KHOẢN (REGISTER)

### Trạng thái hiện tại
- ✅ **Backend:** Route `/api/auth/register/public` đã có
- ✅ **Frontend:** Page `Register.js` đã có và hoạt động tốt
- ✅ **Route:** `/register` đã được định nghĩa trong App.js
- ❌ **Thiếu:** Link "Đăng ký" trên trang Login

### Mô tả
Người dùng không thể tìm thấy cách đăng ký tài khoản mới vì trang Login không có link đến trang Register.

### Endpoint liên quan
- `POST /api/auth/register/public`

---

## 2. BLOCKCHAIN VERIFY PAGE

### Trạng thái hiện tại
- ✅ **Backend:** Route `/api/blockchain/verify-transaction` đã có
- ✅ **Frontend:** Page `BlockchainVerify.js` đã có
- ✅ **Route:** `/blockchain/verify` đã được định nghĩa trong App.js
- ❌ **Thiếu:** Không có entry point trong menu navigation sidebar

### Mô tả
Chức năng xác minh transaction blockchain đã có page riêng nhưng không có link trong menu. Người dùng không biết cách truy cập.

### Endpoints liên quan
- `POST /api/blockchain/verify-transaction`
- `GET /api/blockchain/verify/:blockchainId`

---

## 3. DRUG TIMELINE DEMO

### Trạng thái hiện tại
- ✅ **Backend:** Logic xử lý timeline đã có trong Supply Chain
- ✅ **Frontend:** Page `DrugTimelineDemo.js` đã có với mock data
- ✅ **Route:** `/drug-timeline` đã được định nghĩa trong App.js
- ❌ **Thiếu:** Không có entry point trong menu navigation sidebar

### Mô tả
Page demo timeline thuốc đã có nhưng không có link trong menu. Người dùng không biết cách truy cập để xem demo.

### Component liên quan
- `DrugTimeline` component đã được sử dụng trong Supply Chain page

---

## 4. SYSTEM METRICS (HỆ THỐNG ĐO LƯỜNG)

### Trạng thái hiện tại
- ✅ **Backend:** Route `/api/metrics` đã có
- ✅ **Backend:** Route `/api/metrics/summary` đã có
- ✅ **Backend:** Route `/api/metrics/alerts` đã có
- ❌ **Frontend:** Chưa có page để hiển thị system metrics

### Mô tả
Backend đã có đầy đủ API để lấy system metrics (CPU, memory, performance, alerts) nhưng frontend chưa có page để hiển thị. Chỉ admin mới có quyền truy cập.

### Endpoints liên quan
- `GET /api/metrics` - Full metrics
- `GET /api/metrics/summary` - Summary metrics
- `GET /api/metrics/alerts` - Recent alerts

### Dữ liệu có sẵn
- System performance metrics
- Resource usage (CPU, memory, disk)
- Request/response metrics
- Error rates
- Recent alerts

---

## 5. AUDIT LOG ENTITY HISTORY

### Trạng thái hiện tại
- ✅ **Backend:** Route `/api/audit-logs/entity/:entityType/:entityId` đã có
- ✅ **Frontend:** API function `getEntityHistory` đã có trong `api.js`
- ❌ **Frontend:** Chưa có UI để xem lịch sử audit của một entity cụ thể từ các pages khác

### Mô tả
Có thể xem audit logs tổng quát trong Audit Logs page, nhưng chưa có cách dễ dàng để xem lịch sử audit của một entity cụ thể (ví dụ: xem lịch sử thay đổi của một drug/user từ detail page của drug/user đó).

### Endpoint liên quan
- `GET /api/audit-logs/entity/:entityType/:entityId`

### Use cases
- Xem lịch sử thay đổi của một drug từ drug detail page
- Xem lịch sử thay đổi của một user từ user detail page
- Xem lịch sử thay đổi của một order từ order detail page

---

## 6. BLOCKCHAIN DISTRIBUTION HISTORY

### Trạng thái hiện tại
- ✅ **Backend:** Route `/api/blockchain/drug/:drugId/history` đã có
- ✅ **Backend:** Route `/api/blockchain/drug/:drugId` có trả về distribution history
- ⚠️ **Frontend:** Có hiển thị trong Blockchain Dashboard nhưng chưa có page riêng hoặc tab riêng để xem chi tiết

### Mô tả
API đã có để lấy lịch sử phân phối của thuốc trên blockchain với pagination, nhưng chưa có UI riêng để xem chi tiết lịch sử này một cách đầy đủ.

### Endpoint liên quan
- `GET /api/blockchain/drug/:drugId/history?offset=0&limit=10`

---

## 7. BLOCKCHAIN DISTRIBUTE/RECALL DIRECTLY

### Trạng thái hiện tại
- ✅ **Backend:** Route `POST /api/blockchain/drug/:drugId/distribute` đã có
- ✅ **Backend:** Route `POST /api/blockchain/drug/:drugId/recall` đã có
- ⚠️ **Frontend:** Có thể đã được tích hợp vào Supply Chain workflow, nhưng chưa có entry point trực tiếp từ Blockchain page

### Mô tả
Có thể ghi nhận phân phối hoặc thu hồi thuốc trực tiếp lên blockchain, nhưng chưa có button/action rõ ràng trên Blockchain Dashboard để thực hiện các thao tác này.

### Endpoints liên quan
- `POST /api/blockchain/drug/:drugId/distribute`
- `POST /api/blockchain/drug/:drugId/recall`

---

## 8. TẠO HÓA ĐƠN TỪ ĐỐI HÀNG (CREATE INVOICE FROM ORDER)

### Trạng thái hiện tại
- ✅ **Backend:** Route `POST /api/invoices/from-order/:orderId` đã có
- ✅ **Frontend:** API function `createInvoiceFromOrder` đã có trong `api.js`
- ❌ **Frontend:** Chưa có button/action rõ ràng trên Order detail page để tạo invoice

### Mô tả
Có thể tạo hóa đơn trực tiếp từ một order đã có, nhưng chưa có button trong Order detail page để thực hiện thao tác này.

### Endpoint liên quan
- `POST /api/invoices/from-order/:orderId`

---

## 9. ĐẶT LẠI ĐỐI HÀNG (REORDER)

### Trạng thái hiện tại
- ✅ **Backend:** Route `POST /api/orders/:id/reorder` đã có
- ✅ **Frontend:** API function `reorder` đã có trong `api.js`
- ⚠️ **Frontend:** Có thể đã được sử dụng nhưng chưa có button rõ ràng trên Order detail hoặc Order list

### Mô tả
Có thể đặt lại đơn hàng dựa trên một đơn hàng cũ (copy items từ order cũ), nhưng chưa có button "Đặt lại" rõ ràng trong UI.

### Endpoint liên quan
- `POST /api/orders/:id/reorder`

---

## 10. TÌM KIẾM THUỐC (DRUG SEARCH) - MOBILE API

### Trạng thái hiện tại
- ✅ **Backend:** Route `GET /api/drugs/search` đã có (dành cho mobile app)
- ⚠️ **Frontend:** Có thể chưa được sử dụng đúng cách hoặc chưa được expose trong UI search

### Mô tả
Có endpoint search riêng cho mobile app, nhưng có thể chưa được tích hợp đầy đủ vào search bar của các pages trong web UI.

### Endpoint liên quan
- `GET /api/drugs/search?q=...&limit=100`

---

## 11. XEM THỐNG KÊ THANH TOÁN (PAYMENT STATS)

### Trạng thái hiện tại
- ✅ **Backend:** Route `GET /api/payments/stats` đã có
- ✅ **Frontend:** API function `getPaymentStats` đã có trong `api.js`
- ⚠️ **Frontend:** Có thể chưa được hiển thị đầy đủ trong Invoices page

### Mô tả
Có API để lấy thống kê về payments, nhưng có thể chưa có section riêng để hiển thị stats này trong Invoices page.

### Endpoint liên quan
- `GET /api/payments/stats`

---

## 12. XEM CHI TIẾT THANH TOÁN (PAYMENT DETAIL)

### Trạng thái hiện tại
- ✅ **Backend:** Route `GET /api/payments/:id` đã có
- ✅ **Frontend:** API function `getPaymentById` đã có trong `api.js`
- ⚠️ **Frontend:** Chưa có modal/page riêng để xem chi tiết payment

### Mô tả
Có thể xem danh sách payments trong Invoices page, nhưng chưa có cách xem chi tiết từng payment (click vào payment để xem đầy đủ thông tin).

### Endpoint liên quan
- `GET /api/payments/:id`

---

## 13. XUẤT AUDIT LOGS (EXPORT AUDIT LOGS)

### Trạng thái hiện tại
- ✅ **Backend:** Route `GET /api/audit-logs/export` đã có
- ✅ **Frontend:** Page `AuditLogs.js` đã có
- ⚠️ **Frontend:** Có thể chưa có button "Export" rõ ràng trong Audit Logs page

### Mô tả
Có endpoint để export audit logs nhưng có thể chưa có button/link để trigger export action.

### Endpoint liên quan
- `GET /api/audit-logs/export`

---

## 📊 TỔNG KẾT

### Chức năng thiếu entry point UI hoàn toàn: **7 items**

1. **Đăng ký tài khoản** - Thiếu link từ Login page
2. **Blockchain Verify** - Có page, thiếu menu entry
3. **Drug Timeline Demo** - Có page, thiếu menu entry
4. **System Metrics** - Thiếu page hoàn toàn
5. **Audit Log Entity History** - Thiếu UI để xem từ entity detail pages
6. **Blockchain Distribution History** - Thiếu page/tab riêng để xem chi tiết
7. **Payment Detail** - Thiếu modal/page để xem chi tiết payment

### Chức năng có thể thiếu button/action rõ ràng: **6 items**

8. **Blockchain Distribute/Recall** - Có thể thiếu button trực tiếp từ Blockchain page
9. **Tạo Invoice từ Order** - Thiếu button trong Order detail
10. **Reorder Order** - Thiếu button "Đặt lại" rõ ràng
11. **Drug Search (Mobile API)** - Có thể chưa tích hợp đầy đủ
12. **Payment Stats** - Có thể chưa hiển thị đầy đủ
13. **Export Audit Logs** - Có thể thiếu button Export

---

## 📝 GHI CHÚ

1. Một số chức năng có thể đã được tích hợp vào workflow khác (ví dụ: Blockchain distribute/recall có thể được thực hiện qua Supply Chain)

2. Một số API có thể được thiết kế cho mobile app hoặc API consumers, không nhất thiết cần UI entry point

3. Một số chức năng có thể đã có nhưng chưa được phát hiện trong quá trình kiểm tra do code đã được refactor hoặc ẩn trong các component con

---

## ✅ KẾT LUẬN

Tổng cộng có **13 chức năng** đã có backend nhưng cần bổ sung entry point UI hoặc cải thiện khả năng truy cập. Trong đó:

- **7 chức năng** thiếu entry point UI hoàn toàn
- **6 chức năng** có thể cần cải thiện button/action rõ ràng hơn

