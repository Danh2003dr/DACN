# TỔNG KẾT HỆ THỐNG ĐIỂM TÍN NHIỆM (TRUST SCORES)

## 📋 TỔNG QUAN

Hệ thống điểm tín nhiệm được thiết kế để đánh giá và xếp hạng độ tin cậy của các nhà cung ứng trong chuỗi cung ứng thuốc, bao gồm: Nhà sản xuất (Manufacturer), Nhà phân phối (Distributor), Bệnh viện (Hospital), Nhà thuốc (Pharmacy), và Đại lý (Dealer).

---

## ✅ CÁC PHẦN ĐÃ HOÀN THÀNH

### 1. **BACKEND - DATA MODEL**

#### 1.1 Model `SupplierTrustScore` (`models/SupplierTrustScore.js`)

**Cấu trúc dữ liệu:**
- ✅ **Thông tin nhà cung ứng:**
  - `supplier`: Reference đến User (ObjectId)
  - `supplierName`: Tên nhà cung ứng
  - `supplierRole`: Vai trò (manufacturer, distributor, hospital, pharmacy, dealer)
  - `organizationId`: Mã tổ chức

- ✅ **Điểm tín nhiệm:**
  - `trustScore`: Điểm tổng (0-1000)
  - `trustLevel`: Cấp độ (A, B, C, D)
    - A: ≥800 điểm (Xuất sắc)
    - B: 600-799 điểm (Tốt)
    - C: 400-599 điểm (Trung bình)
    - D: <400 điểm (Yếu)

- ✅ **Điểm chi tiết theo tiêu chí (`scoreBreakdown`):**
  - `reviewScore`: Điểm từ đánh giá (0-300)
  - `complianceScore`: Điểm tuân thủ (0-250)
  - `qualityScore`: Điểm chất lượng (0-200)
  - `efficiencyScore`: Điểm hiệu quả (0-150)
  - `timelinessScore`: Điểm thời gian (0-100)

- ✅ **Thống kê đánh giá (`reviewStats`):**
  - Tổng số đánh giá
  - Điểm trung bình
  - Số đánh giá đã xác minh
  - Số đánh giá tích cực (≥4 sao)
  - Số đánh giá tiêu cực (≤2 sao)

- ✅ **Thống kê tuân thủ (`complianceStats`):**
  - Tỷ lệ chữ ký số hợp lệ
  - Tỷ lệ hoàn thành nhiệm vụ đúng hạn
  - Tỷ lệ thuốc hợp lệ
  - Thống kê chi tiết về chữ ký, nhiệm vụ, và thuốc

- ✅ **Thống kê chất lượng (`qualityStats`):**
  - Điểm đánh giá chất lượng trung bình
  - Số test đạt/không đạt
  - Tổng số test chất lượng

- ✅ **Lịch sử thay đổi điểm (`scoreHistory`):**
  - Lưu lại mọi thay đổi điểm
  - Ghi nhận lý do thay đổi (review_added, task_completed, quality_test_passed, v.v.)
  - Thông tin người thay đổi và thời gian

- ✅ **Hệ thống thưởng/phạt (`rewardsAndPenalties`):**
  - Lưu lịch sử thưởng/phạt thủ công từ Admin
  - Ghi nhận lý do và mô tả

- ✅ **Badges và thành tích (`badges`):**
  - Hệ thống huy hiệu cho các thành tích
  - Phân loại: quality, compliance, efficiency, reliability, excellence

- ✅ **Xếp hạng (`ranking`):**
  - Xếp hạng tổng thể
  - Xếp hạng theo vai trò
  - Thời gian cập nhật cuối

**Methods:**
- ✅ `addScoreChange()`: Thêm thay đổi điểm vào lịch sử
- ✅ `addRewardOrPenalty()`: Thêm thưởng/phạt
- ✅ `addBadge()`: Thêm huy hiệu

**Static Methods:**
- ✅ `findBySupplier()`: Tìm điểm theo supplier ID
- ✅ `getTopSuppliers()`: Lấy top nhà cung ứng
- ✅ `getRanking()`: Tính và cập nhật xếp hạng

**Middleware:**
- ✅ Pre-save: Tự động tính `trustLevel` dựa trên `trustScore`
- ✅ Tự động cập nhật `updatedAt`

**Indexes:**
- ✅ Index trên `trustScore`, `trustLevel`, `supplierRole`
- ✅ Index trên `ranking.overall`

---

### 2. **BACKEND - SERVICE LAYER**

#### 2.1 Service `TrustScoreService` (`services/trustScoreService.js`)

**Các hàm tính điểm:**

✅ **1. `calculateReviewScore(supplierId, targetType)` (0-300 điểm)**
- Dựa trên số lượng đánh giá
- Điểm trung bình từ reviews
- Bonus cho đánh giá đã xác minh
- Penalty cho đánh giá tiêu cực
- Trả về điểm và thống kê đánh giá

✅ **2. `calculateComplianceScore(supplierId)` (0-250 điểm)**
- **Chữ ký số (0-100 điểm):**
  - Tỷ lệ chữ ký số hợp lệ
- **Nhiệm vụ (0-100 điểm):**
  - Tỷ lệ hoàn thành nhiệm vụ đúng hạn
- **Thuốc hợp lệ (0-50 điểm):**
  - Tỷ lệ thuốc hợp lệ (chỉ cho manufacturer)
  - Penalty cho thuốc bị thu hồi

✅ **3. `calculateQualityScore(supplierId)` (0-200 điểm)**
- Dựa trên kết quả test chất lượng
- Tỷ lệ test đạt
- Bonus cho số lượng test
- Điểm đánh giá chất lượng từ reviews

✅ **4. `calculateEfficiencyScore(supplierId)` (0-150 điểm)**
- Tỷ lệ hoàn thành nhiệm vụ
- Bonus cho đánh giá chất lượng nhiệm vụ

✅ **5. `calculateTimelinessScore(supplierId)` (0-100 điểm)**
- Tỷ lệ hoàn thành đúng hạn
- Dựa trên so sánh `completedAt` và `dueDate`

✅ **6. `calculateAndUpdateTrustScore(supplierId)`**
- Tính tổng điểm từ 5 tiêu chí
- Tạo mới hoặc cập nhật trust score record
- Lưu lịch sử thay đổi
- Cập nhật tất cả thống kê
- Tự động tính lại xếp hạng

---

### 3. **BACKEND - CONTROLLER**

#### 3.1 Controller `trustScoreController.js`

✅ **1. `getTrustScore(supplierId)`**
- Route: `GET /api/trust-scores/:supplierId`
- Lấy điểm tín nhiệm của một nhà cung ứng
- Tự động tạo điểm mới nếu chưa có
- Populate thông tin supplier

✅ **2. `getRanking()`**
- Route: `GET /api/trust-scores/ranking`
- Lấy bảng xếp hạng nhà cung ứng
- Hỗ trợ filter theo role
- Hỗ trợ tìm kiếm theo tên hoặc organizationId
- Phân trang
- Tự động cập nhật xếp hạng (async)

✅ **3. `recalculateTrustScore(supplierId)`** (Admin only)
- Route: `POST /api/trust-scores/:supplierId/recalculate`
- Tính toán lại điểm cho một nhà cung ứng

✅ **4. `addRewardOrPenalty(supplierId)`** (Admin only)
- Route: `POST /api/trust-scores/:supplierId/reward-penalty`
- Thêm thưởng/phạt thủ công
- Body: `{ type, amount, reason, description, relatedId, relatedType }`

✅ **5. `getScoreHistory(supplierId)`**
- Route: `GET /api/trust-scores/:supplierId/history`
- Lấy lịch sử thay đổi điểm
- Hỗ trợ phân trang

✅ **6. `getStats()`**
- Route: `GET /api/trust-scores/stats`
- Lấy thống kê tổng quan:
  - Tổng số nhà cung ứng
  - Điểm trung bình
  - Số lượng theo từng cấp độ (A, B, C, D)
  - Thống kê theo vai trò

✅ **7. `recalculateAllTrustScores()`** (Admin only)
- Route: `POST /api/trust-scores/recalculate-all`
- Tính toán lại điểm cho tất cả nhà cung ứng
- Xử lý lỗi từng nhà cung ứng riêng biệt
- Trả về kết quả thành công/thất bại

---

### 4. **BACKEND - ROUTES**

#### 4.1 Routes `routes/trustScores.js`

✅ **Public Routes:**
- `GET /ranking` - Bảng xếp hạng
- `GET /stats` - Thống kê
- `GET /:supplierId/history` - Lịch sử điểm
- `GET /:supplierId` - Điểm tín nhiệm

✅ **Admin Only Routes:**
- `POST /:supplierId/recalculate` - Tính lại điểm
- `POST /:supplierId/reward-penalty` - Thưởng/phạt
- `POST /recalculate-all` - Tính lại tất cả

✅ **Middleware:**
- Authentication và Authorization cho admin routes

---

### 5. **FRONTEND - API INTEGRATION**

#### 5.1 API Client (`frontend/src/utils/api.js`)

✅ **`trustScoreAPI` object:**
- `getTrustScore(supplierId)` - Lấy điểm tín nhiệm
- `getRanking(params)` - Lấy bảng xếp hạng
- `getScoreHistory(supplierId, params)` - Lấy lịch sử
- `getStats()` - Lấy thống kê
- `recalculateTrustScore(supplierId)` - Tính lại điểm
- `recalculateAll()` - Tính lại tất cả
- `addRewardOrPenalty(supplierId, data)` - Thưởng/phạt

---

### 6. **FRONTEND - UI COMPONENTS**

#### 6.1 Trang Trust Scores (`frontend/src/pages/TrustScores.js`)

✅ **Dashboard Stats:**
- Tổng số nhà cung ứng
- Điểm trung bình
- Số lượng theo từng cấp độ (A, B, C, D)
- Hiển thị bằng cards có màu sắc phân biệt

✅ **Bảng xếp hạng:**
- Hiển thị top nhà cung ứng
- Cột: Xếp hạng, Tên, Vai trò, Điểm, Cấp độ, Thao tác
- Badge màu sắc theo cấp độ
- Icon thứ hạng (vàng, bạc, đồng)
- Hỗ trợ phân trang
- Hỗ trợ filter theo role
- Hỗ trợ tìm kiếm

✅ **Filter & Search:**
- Filter theo vai trò (manufacturer, distributor, hospital)
- Tìm kiếm theo tên hoặc organizationId

✅ **Modal chi tiết (`SupplierDetailModal`):**
- Hiển thị thông tin đầy đủ:
  - Tên và thông tin nhà cung ứng
  - Điểm tổng và cấp độ
  - Điểm chi tiết theo từng tiêu chí:
    - Đánh giá (reviewScore)
    - Tuân thủ (complianceScore)
    - Chất lượng (qualityScore)
    - Hiệu quả (efficiencyScore)
    - Thời gian (timelinessScore)
  - Thống kê:
    - Thống kê đánh giá
    - Thống kê tuân thủ
    - Thống kê chất lượng
  - Lịch sử thay đổi điểm (10 mục gần nhất)
  - Badges và thành tích

✅ **Admin Features:**
- Nút "Tính toán lại tất cả" (Admin only)
- Loading states
- Error handling
- Toast notifications

✅ **Helper Functions:**
- `normalizeId()` - Chuẩn hóa ID từ nhiều định dạng
- `getUniqueKey()` - Tạo key unique cho React lists
- `getScoreColor()` - Màu sắc theo điểm
- `getTrustLevelColor()` - Màu sắc theo cấp độ

✅ **UI/UX:**
- Responsive design
- Loading spinners
- Empty states
- Error handling
- Icons từ lucide-react
- Tailwind CSS styling

---

### 7. **TÍNH NĂNG NỔI BẬT**

✅ **Hệ thống tính điểm tự động:**
- Tự động tính điểm dựa trên 5 tiêu chí
- Tự động cập nhật khi có thay đổi
- Tự động phân cấp (A, B, C, D)

✅ **Gamification:**
- Hệ thống huy hiệu (badges)
- Xếp hạng (ranking)
- Thưởng/phạt
- Lịch sử thay đổi điểm

✅ **Tính minh bạch:**
- Lịch sử đầy đủ mọi thay đổi
- Ghi nhận lý do thay đổi
- Thống kê chi tiết

✅ **Linh hoạt:**
- Hỗ trợ nhiều vai trò
- Filter và search
- Phân trang
- Admin có thể điều chỉnh thủ công

---

## 📊 CÔNG THỨC TÍNH ĐIỂM

### Điểm tổng (0-1000):
```
trustScore = reviewScore (0-300) 
           + complianceScore (0-250)
           + qualityScore (0-200)
           + efficiencyScore (0-150)
           + timelinessScore (0-100)
```

### Phân cấp:
- **A (Xuất sắc)**: ≥800 điểm
- **B (Tốt)**: 600-799 điểm
- **C (Trung bình)**: 400-599 điểm
- **D (Yếu)**: <400 điểm

---

## 🔄 LUỒNG HOẠT ĐỘNG

1. **Khi có review mới:**
   - Service tự động tính lại `reviewScore`
   - Cập nhật `trustScore` tổng
   - Lưu vào `scoreHistory`

2. **Khi có task hoàn thành:**
   - Service tính lại `complianceScore` và `efficiencyScore`
   - Cập nhật điểm tổng
   - Lưu vào lịch sử

3. **Khi có quality test:**
   - Service tính lại `qualityScore`
   - Cập nhật điểm tổng

4. **Khi Admin thêm thưởng/phạt:**
   - Điểm được cập nhật ngay lập tức
   - Lưu vào `rewardsAndPenalties`
   - Lưu vào `scoreHistory`

5. **Tính toán định kỳ:**
   - Admin có thể tính lại tất cả điểm
   - Service tự động tính lại từ đầu

---

## 📝 API ENDPOINTS TÓM TẮT

### Public:
- `GET /api/trust-scores/ranking` - Bảng xếp hạng
- `GET /api/trust-scores/stats` - Thống kê
- `GET /api/trust-scores/:supplierId` - Điểm tín nhiệm
- `GET /api/trust-scores/:supplierId/history` - Lịch sử

### Admin Only:
- `POST /api/trust-scores/:supplierId/recalculate` - Tính lại
- `POST /api/trust-scores/:supplierId/reward-penalty` - Thưởng/phạt
- `POST /api/trust-scores/recalculate-all` - Tính lại tất cả

---

## ✅ HOÀN THÀNH

Tất cả các phần trên đã được implement và test đầy đủ. Hệ thống điểm tín nhiệm đã sẵn sàng để sử dụng trong production.

---

**Cập nhật lần cuối:** Hôm nay
**Trạng thái:** ✅ Hoàn thành

