# CƠ CHẾ TỰ ĐỘNG TÍNH ĐIỂM TÍN NHIỆM

## 📋 TỔNG QUAN

**Điểm tín nhiệm KHÔNG cần ai đánh giá thủ công!** Hệ thống tự động tính toán dựa trên dữ liệu có sẵn trong hệ thống.

---

## 🔄 CƠ CHẾ HOẠT ĐỘNG

### 1. **ĐIỂM TÍN NHIỆM ĐƯỢC TÍNH TỪ ĐÂU?**

Điểm tín nhiệm được tính **TỰ ĐỘNG** dựa trên 5 tiêu chí, mỗi tiêu chí lấy dữ liệu từ hệ thống:

#### ✅ **1. Điểm từ Đánh giá (Review Score) - 0-300 điểm**
- **Nguồn dữ liệu:** Bảng `Review`
- **Tính từ:**
  - Số lượng đánh giá
  - Điểm trung bình (1-5 sao)
  - Số đánh giá đã xác minh
  - Số đánh giá tích cực (≥4 sao)
  - Số đánh giá tiêu cực (≤2 sao)

#### ✅ **2. Điểm Tuân thủ (Compliance Score) - 0-250 điểm**
- **Nguồn dữ liệu:** 
  - Bảng `DigitalSignature` (chữ ký số)
  - Bảng `Task` (nhiệm vụ)
  - Bảng `Drug` (thuốc)
- **Tính từ:**
  - Tỷ lệ chữ ký số hợp lệ (0-100 điểm)
  - Tỷ lệ hoàn thành nhiệm vụ đúng hạn (0-100 điểm)
  - Tỷ lệ thuốc hợp lệ (0-50 điểm, chỉ cho manufacturer)

#### ✅ **3. Điểm Chất lượng (Quality Score) - 0-200 điểm**
- **Nguồn dữ liệu:** 
  - Bảng `Drug` (qualityTest)
  - Bảng `Review` (criteriaRatings.drugQuality)
- **Tính từ:**
  - Tỷ lệ test chất lượng đạt
  - Số lượng test đã thực hiện
  - Điểm đánh giá chất lượng từ reviews

#### ✅ **4. Điểm Hiệu quả (Efficiency Score) - 0-150 điểm**
- **Nguồn dữ liệu:** Bảng `Task`
- **Tính từ:**
  - Tỷ lệ hoàn thành nhiệm vụ
  - Đánh giá chất lượng nhiệm vụ

#### ✅ **5. Điểm Thời gian (Timeliness Score) - 0-100 điểm**
- **Nguồn dữ liệu:** Bảng `Task`
- **Tính từ:**
  - Tỷ lệ hoàn thành đúng hạn
  - So sánh `completedAt` với `dueDate`

---

### 2. **KHI NÀO ĐIỂM ĐƯỢC TỰ ĐỘNG CẬP NHẬT?**

#### ✅ **ĐÃ HOẠT ĐỘNG:**

1. **Khi có Review mới/được duyệt:**
   - File: `controllers/reviewController.js`
   - Hàm: `createReview()` và `updateReviewStatus()`
   - Tự động gọi: `TrustScoreService.updateScoreOnReview(reviewId)`

2. **Khi Admin tính lại thủ công:**
   - Endpoint: `POST /api/trust-scores/:supplierId/recalculate`
   - Endpoint: `POST /api/trust-scores/recalculate-all`

3. **Khi lần đầu xem điểm:**
   - Endpoint: `GET /api/trust-scores/:supplierId`
   - Tự động tạo điểm mới nếu chưa có

#### ⚠️ **CHƯA TỰ ĐỘNG (CẦN CẢI THIỆN):**

1. **Khi Task hoàn thành:**
   - Có hàm `updateScoreOnTask()` nhưng chưa được gọi
   - Cần thêm vào `controllers/taskController.js`

2. **Khi có Digital Signature mới:**
   - Có hàm `updateScoreOnSignature()` nhưng chưa được gọi
   - Cần thêm vào `controllers/digitalSignatureController.js`

3. **Khi Quality Test được cập nhật:**
   - Chưa có hook tự động
   - Cần thêm vào `controllers/drugController.js` khi update qualityTest

4. **Khi Drug bị thu hồi (Recalled):**
   - Chưa có hook tự động
   - Cần thêm vào `controllers/drugController.js` khi recall drug

---

## 🛠️ CÁCH ĐẢM BẢO HOẠT ĐỘNG MƯỢT MÀ

### 1. **Thêm Hooks Tự Động (Khuyến nghị)**

Thêm các hooks tự động cập nhật điểm khi có thay đổi dữ liệu:

#### 📝 **A. Trong Task Controller:**

```javascript
// controllers/taskController.js
const TrustScoreService = require('../services/trustScoreService');

// Khi task được hoàn thành
const updateTask = async (req, res) => {
  // ... existing code ...
  
  // Cập nhật điểm tín nhiệm nếu task được hoàn thành
  if (updatedTask.status === 'completed' && task.assignedTo) {
    try {
      await TrustScoreService.updateScoreOnTask(updatedTask._id);
    } catch (error) {
      console.error('Error updating trust score on task completion:', error);
      // Không throw error để không ảnh hưởng đến response
    }
  }
  
  // ... rest of code ...
};
```

#### 📝 **B. Trong Digital Signature Controller:**

```javascript
// controllers/digitalSignatureController.js
const TrustScoreService = require('../services/trustScoreService');

// Khi có chữ ký số mới
const signDocument = async (req, res) => {
  // ... existing code ...
  
  // Cập nhật điểm tín nhiệm
  if (signature && signature.signedBy) {
    try {
      await TrustScoreService.updateScoreOnSignature(signature._id);
    } catch (error) {
      console.error('Error updating trust score on signature:', error);
      // Không throw error để không ảnh hưởng đến response
    }
  }
  
  // ... rest of code ...
};
```

#### 📝 **C. Trong Drug Controller:**

```javascript
// controllers/drugController.js
const TrustScoreService = require('../services/trustScoreService');

// Khi quality test được cập nhật
const updateDrug = async (req, res) => {
  // ... existing code ...
  
  // Cập nhật điểm tín nhiệm nếu quality test thay đổi
  if (qualityTest && drug.manufacturerId) {
    try {
      await TrustScoreService.calculateAndUpdateTrustScore(drug.manufacturerId);
    } catch (error) {
      console.error('Error updating trust score on quality test update:', error);
    }
  }
  
  // ... rest of code ...
};

// Khi drug bị thu hồi
const recallDrug = async (req, res) => {
  // ... existing code ...
  
  // Cập nhật điểm tín nhiệm khi drug bị recall
  if (drug.manufacturerId) {
    try {
      await TrustScoreService.calculateAndUpdateTrustScore(drug.manufacturerId);
    } catch (error) {
      console.error('Error updating trust score on drug recall:', error);
    }
  }
  
  // ... rest of code ...
};
```

### 2. **Sử dụng Background Jobs (Tùy chọn - Cho Production)**

Để tránh làm chậm API response, có thể sử dụng background job queue:

```javascript
// Sử dụng Bull Queue hoặc similar
const Queue = require('bull');
const trustScoreQueue = new Queue('trust-score-update', {
  redis: { host: 'localhost', port: 6379 }
});

// Thêm job vào queue
trustScoreQueue.add('update-score', {
  supplierId: supplierId,
  reason: 'review_created'
});
```

### 3. **Tối ưu Hóa Tính Toán**

- **Cache kết quả:** Lưu điểm tạm thời, chỉ tính lại khi cần
- **Batch updates:** Gộp nhiều cập nhật lại một lần
- **Async processing:** Xử lý bất đồng bộ, không block API

### 4. **Xử lý Lỗi Mượt Mà**

- Không throw error khi cập nhật điểm
- Log lỗi để debug
- Không ảnh hưởng đến response chính

---

## 📊 FLOW HOẠT ĐỘNG ĐẦY ĐỦ

```
1. User tạo Review
   ↓
2. Review được lưu vào database
   ↓
3. Controller tự động gọi TrustScoreService.updateScoreOnReview()
   ↓
4. Service tính lại điểm từ tất cả reviews
   ↓
5. Điểm được cập nhật trong database
   ↓
6. User xem điểm mới ngay lập tức
```

---

## ✅ KẾT LUẬN

**Điểm tín nhiệm:**
- ✅ **Tự động tính** từ dữ liệu có sẵn
- ✅ **Không cần** ai đánh giá thủ công (trừ thưởng/phạt từ Admin)
- ✅ **Cập nhật** khi có review mới
- ⚠️ **Cần cải thiện:** Thêm hooks tự động cho tasks, signatures, quality tests

**Để đảm bảo hoạt động mượt mà:**
1. Thêm hooks tự động vào các controllers
2. Sử dụng async processing
3. Xử lý lỗi không block API
4. Có thể dùng background jobs cho production

---

**Cập nhật:** Hôm nay
**Trạng thái:** ✅ Đã có cơ chế cơ bản, ⚠️ Cần cải thiện hooks tự động

