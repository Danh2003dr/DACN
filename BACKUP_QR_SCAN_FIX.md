# Backup & Restore: Fix Lỗi QR Code Scanning

## 📋 Tổng quan vấn đề

**Lỗi ban đầu:** "Không tìm thấy thông tin thuốc" khi quét QR code, sau đó chuyển thành lỗi 500 Internal Server Error.

**Nguyên nhân chính:** 
- QR data từ frontend có ký tự thừa `"}` ở cuối (ví dụ: `BC_1764951024481_606A37A3"}`)
- Lỗi khi populate `distribution.history.updatedBy` (array populate)
- Thiếu error handling và logging chi tiết

---

## 🔍 Quá trình Debug

### 1. Phân tích lỗi ban đầu
- Frontend console: `POST http://localhost:5000/api/drugs/scan-qr 500 (Internal Server Error)`
- Backend logs: QR data có ký tự thừa `"}` ở cuối
- Error message: "Lỗi server khi quét QR code."

### 2. Các bước debug đã thực hiện
1. ✅ Kiểm tra backend route `/api/drugs/scan-qr`
2. ✅ Thêm logging chi tiết trong `drugController.js`
3. ✅ Tạo utility scripts để test `findByQRCode` method
4. ✅ Fix lỗi `MissingSchemaError` cho User model
5. ✅ Phát hiện ký tự thừa trong QR data
6. ✅ Implement code làm sạch QR data
7. ✅ Loại bỏ populate `distribution.history.updatedBy` để tránh lỗi
8. ✅ Cải thiện error handling và serialize drug object

---

## 📝 Các thay đổi chi tiết

### 1. Backend: `controllers/drugController.js`

#### 1.1. Thêm code làm sạch QR data (dòng ~571-603)
```javascript
// Clean QR data - loại bỏ các ký tự thừa
if (typeof qrData === 'string') {
  const originalQR = qrData;
  let cleanedQR = qrData.trim();
  
  // Thử extract blockchainId từ JSON nếu có
  const jsonMatch = cleanedQR.match(/"blockchainId"\s*:\s*"([^"]+)"/);
  if (jsonMatch && jsonMatch[1]) {
    cleanedQR = jsonMatch[1];
    console.log('📦 Đã extract blockchainId từ JSON:', cleanedQR);
  } else {
    // Loại bỏ các ký tự thừa ở cuối: ", ', }, ], và các ký tự đặc biệt
    cleanedQR = cleanedQR.replace(/["'}\]\]]+$/, '');
    
    // Loại bỏ các ký tự thừa ở đầu
    cleanedQR = cleanedQR.replace(/^["'{}\[\]]+/, '');
    
    // Trim lại
    cleanedQR = cleanedQR.trim();
  }
  
  // Cập nhật qrData nếu đã thay đổi
  if (cleanedQR !== originalQR) {
    console.log('🧹 Đã làm sạch QR data:', {
      original: originalQR,
      cleaned: cleanedQR,
      removed: originalQR.length - cleanedQR.length,
      originalLength: originalQR.length,
      cleanedLength: cleanedQR.length
    });
    qrData = cleanedQR;
  }
}
```

#### 1.2. Thêm logging chi tiết (dòng ~605-620)
```javascript
// Log QR data đã làm sạch (với try-catch để tránh lỗi)
try {
  console.log('📋 QR Data received (cleaned):', {
    type: typeof qrData,
    length: typeof qrData === 'string' ? qrData.length : 'N/A',
    preview: typeof qrData === 'string' ? qrData.substring(0, 100) : JSON.stringify(qrData).substring(0, 100)
  });
} catch (logError) {
  console.warn('⚠️ Lỗi khi log QR data cleaned:', logError.message);
  console.log('📋 QR Data (cleaned, simplified):', typeof qrData === 'string' ? qrData.substring(0, 50) : 'object');
}

console.log('🔍 Bắt đầu tìm kiếm thuốc với QR data đã làm sạch...');
console.log('🔎 Gọi Drug.findByQRCode với:', qrData);
```

#### 1.3. Loại bỏ populate `distribution.history.updatedBy` (dòng ~663-799)
**Trước:**
```javascript
let blockchainResult = await Drug.findOne({ 'blockchain.blockchainId': searchText })
  .populate('manufacturerId', 'fullName organizationInfo')
  .populate('distribution.history.updatedBy', 'fullName role');
```

**Sau:**
```javascript
let blockchainResult = await Drug.findOne({ 'blockchain.blockchainId': searchText })
  .populate('manufacturerId', 'fullName organizationInfo');
```

**Lý do:** Populate trên array có thể gây lỗi nếu User model chưa được load hoặc có dữ liệu không hợp lệ.

#### 1.4. Cải thiện error handling cho serialize (dòng ~948-990)
```javascript
// Đảm bảo drug object có thể serialize được
try {
  // Convert drug to plain object để tránh lỗi serialize
  const drugObject = drug.toObject ? drug.toObject() : drug;
  
  res.status(200).json({
    success: true,
    message: 'Thuốc hợp lệ và an toàn.',
    data: { 
      drug: drugObject,
      blockchain: blockchainData,
      blockchainInfo: drug.blockchain,
      risk
    }
  });
} catch (serializeError) {
  console.error('❌ Lỗi khi serialize drug object:', {
    message: serializeError.message,
    stack: serializeError.stack,
    drugId: drug?.drugId,
    drugType: typeof drug
  });
  
  // Thử serialize với toJSON nếu có
  try {
    const drugJSON = drug.toJSON ? drug.toJSON() : JSON.parse(JSON.stringify(drug));
    res.status(200).json({
      success: true,
      message: 'Thuốc hợp lệ và an toàn.',
      data: { 
        drug: drugJSON,
        blockchain: blockchainData,
        blockchainInfo: drug.blockchain,
        risk
      }
    });
  } catch (jsonError) {
    // Nếu vẫn lỗi, trả về dữ liệu tối thiểu
    console.error('❌ Lỗi khi serialize với toJSON:', jsonError.message);
    throw new Error(`Lỗi khi serialize drug object: ${serializeError.message}`);
  }
}
```

#### 1.5. Cải thiện error handling trong catch block (dòng ~966-980)
```javascript
} catch (error) {
  // Log chi tiết lỗi để debug
  console.error('❌ Lỗi trong scanQRCode:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    qrData: req.body?.qrData,
    user: req.user?._id
  });
  
  await logQRScan({
    qrData: req.body?.qrData || '',
    drug: null,
    user: req.user,
    success: false,
    errorMessage: error.message
  });
  
  res.status(500).json({
    success: false,
    message: 'Lỗi server khi quét QR code.',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi khi xử lý yêu cầu.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}
```

#### 1.6. Thêm populate lại manufacturerId nếu cần (dòng ~844-853)
```javascript
// Đảm bảo drug object có thể serialize được (nếu chưa populate đầy đủ)
try {
  // Thử populate lại nếu cần (tránh lỗi khi serialize)
  if (drug && !drug.manufacturerId || typeof drug.manufacturerId === 'string') {
    await drug.populate('manufacturerId', 'fullName organizationInfo');
  }
} catch (populateError) {
  console.warn('⚠️ Lỗi populate manufacturerId, bỏ qua:', populateError.message);
  // Không throw, tiếp tục xử lý
}
```

---

### 2. Frontend: `frontend/src/pages/QRScanner.js`

#### 2.1. Thêm code làm sạch QR data (dòng ~198-250)
```javascript
// Process QR data
const processQRData = async (qrData) => {
  try {
    setLoading(true);
    setError(null);
    setAlertModal(null);
    setBlockchainData(null);
    setBlockchainInfo(null);
    setRiskInfo(null);
    
    // Làm sạch QR data - loại bỏ ký tự thừa
    if (typeof qrData === 'string') {
      let cleanedQR = qrData.trim();
      
      // Thử extract blockchainId từ JSON nếu có
      const jsonMatch = cleanedQR.match(/"blockchainId"\s*:\s*"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) {
        cleanedQR = jsonMatch[1];
        console.log('📦 [Frontend] Đã extract blockchainId từ JSON:', cleanedQR);
      } else {
        // Loại bỏ các ký tự thừa ở cuối: ", ', }, ], và các ký tự đặc biệt
        cleanedQR = cleanedQR.replace(/["'}\]\]]+$/, '');
        
        // Loại bỏ các ký tự thừa ở đầu
        cleanedQR = cleanedQR.replace(/^["'{}\[\]]+/, '');
        
        // Trim lại
        cleanedQR = cleanedQR.trim();
      }
      
      // Cập nhật qrData nếu đã thay đổi
      if (cleanedQR !== qrData) {
        console.log('🧹 [Frontend] Đã làm sạch QR data:', {
          original: qrData,
          cleaned: cleanedQR,
          removed: qrData.length - cleanedQR.length
        });
        qrData = cleanedQR;
      }
      
      // ... tiếp tục xử lý
    }
  } catch (error) {
    // ... error handling
  }
};
```

---

## 🛠️ Utility Scripts đã tạo

### 1. `scripts/check-drugs-for-qr-scan.js`
- Mục đích: Test `findByQRCode` với tất cả drugs có blockchainId
- Sử dụng: `node scripts/check-drugs-for-qr-scan.js`
- Fix: Thêm `require('../models/User');` để resolve `MissingSchemaError`

### 2. `scripts/check-specific-drug.js`
- Mục đích: Test `findByQRCode` với một blockchainId cụ thể
- Sử dụng: `node scripts/check-specific-drug.js <blockchainId>`
- Fix: Thêm `require('../models/User');` để resolve `MissingSchemaError`

---

## 🔧 Các vấn đề đã fix

### 1. MissingSchemaError: Schema hasn't been registered for model "User"
**Nguyên nhân:** User model chưa được load khi populate
**Giải pháp:** Thêm `require('../models/User');` vào utility scripts

### 2. QR data có ký tự thừa `"}`
**Nguyên nhân:** QR code bị cắt khi quét hoặc decode không đầy đủ
**Giải pháp:** 
- Thêm code làm sạch ở frontend (trước khi gửi)
- Thêm code làm sạch ở backend (trước khi tìm kiếm)

### 3. Lỗi 500 khi populate `distribution.history.updatedBy`
**Nguyên nhân:** Populate trên array có thể gây lỗi
**Giải pháp:** Loại bỏ populate `distribution.history.updatedBy` trong hàm `scanQRCode`

### 4. Lỗi serialize drug object
**Nguyên nhân:** Drug object có thể không serialize được trực tiếp
**Giải pháp:** Sử dụng `toObject()` hoặc `toJSON()` với try-catch

---

## 📊 Kết quả

### Trước khi fix:
- ❌ Lỗi 500 Internal Server Error
- ❌ QR data có ký tự thừa `"}`
- ❌ Không có debug info
- ❌ Lỗi populate array

### Sau khi fix:
- ✅ QR data được làm sạch ở cả frontend và backend
- ✅ Loại bỏ populate array gây lỗi
- ✅ Error handling và logging chi tiết
- ✅ Serialize drug object an toàn
- ✅ Debug info trong development mode

---

## 🚀 Cách restore

### 1. Restore từ git (nếu có)
```bash
git checkout controllers/drugController.js
git checkout frontend/src/pages/QRScanner.js
```

### 2. Restore thủ công
- Copy các đoạn code từ file `BACKUP_QR_SCAN_FIX.md` này
- Paste vào đúng vị trí trong các file tương ứng

### 3. Kiểm tra sau khi restore
1. Restart backend server: `npm start`
2. Restart frontend (nếu cần): `cd frontend && npm start`
3. Test quét QR code
4. Kiểm tra backend logs để xem có log `✅ Tìm thấy thuốc` không

---

## 📌 Lưu ý quan trọng

1. **QR data cleaning:** Code làm sạch hoạt động ở cả frontend và backend để đảm bảo xử lý được mọi trường hợp
2. **Populate array:** Không populate `distribution.history.updatedBy` trong `scanQRCode` để tránh lỗi
3. **Error handling:** Luôn có try-catch cho các thao tác có thể gây lỗi (populate, serialize, etc.)
4. **Logging:** Thêm logging chi tiết để dễ debug trong tương lai
5. **Development mode:** Debug info chỉ hiển thị trong development mode

---

## 🔄 Các file đã thay đổi

1. ✅ `controllers/drugController.js` - Thêm code làm sạch QR data, cải thiện error handling
2. ✅ `frontend/src/pages/QRScanner.js` - Thêm code làm sạch QR data ở frontend
3. ✅ `scripts/check-drugs-for-qr-scan.js` - Fix MissingSchemaError
4. ✅ `scripts/check-specific-drug.js` - Fix MissingSchemaError

---

## 📅 Ngày tạo backup: 2025-12-07

## 👤 Tác giả: AI Assistant (Auto)

---

## 📝 Ghi chú thêm

- Nếu gặp lỗi tương tự trong tương lai, kiểm tra:
  1. QR data có ký tự thừa không
  2. User model đã được load chưa
  3. Populate có gây lỗi không
  4. Drug object có serialize được không

- Để test lại:
  1. Tạo một drug mới với blockchainId
  2. Generate QR code cho drug đó
  3. Quét QR code và kiểm tra logs
  4. Xác nhận drug được tìm thấy thành công

