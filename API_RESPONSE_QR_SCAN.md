# TÀI LIỆU API RESPONSE - QUÉT MÃ QR

## Endpoint
```
POST /api/drugs/scan-qr
```

## Authentication
- **Required**: Yes (Bearer Token)
- **Access**: Private (tất cả user đã đăng nhập)

## Request Body
```json
{
  "qrData": "string" // Có thể là: blockchainId, drugId, batchNumber, hoặc JSON string
}
```

## Response Structure

### 1. ✅ Thuốc hợp lệ và an toàn (Status: 200)

```json
{
  "success": true,
  "message": "Thuốc hợp lệ và an toàn.",
  "data": {
    "drug": {
      "_id": "ObjectId",
      "drugId": "DRUG_001",
      "name": "Paracetamol 500mg",
      "batchNumber": "BATCH001",
      "activeIngredient": "Paracetamol",
      "dosage": "500mg",
      "form": "Viên nén",
      "productionDate": "2024-01-01T00:00:00.000Z",
      "expiryDate": "2026-01-01T00:00:00.000Z",
      "qualityTest": {
        "testDate": "2024-01-02T00:00:00.000Z",
        "testResult": "đạt",
        "testBy": "Cục Quản lý Dược",
        "testReport": "...",
        "certificateNumber": "..."
      },
      "manufacturerId": {
        "_id": "ObjectId",
        "fullName": "Công ty Dược phẩm ABC",
        "organizationInfo": { ... }
      },
      "distribution": {
        "status": "active",
        "currentLocation": "Kho Hà Nội",
        "history": [ ... ]
      },
      "blockchain": {
        "blockchainId": "0x123...",
        "isOnBlockchain": true,
        "transactionHash": "0xabc...",
        "blockNumber": 12345,
        "blockHash": "0xdef...",
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      },
      "status": "active",
      "isRecalled": false,
      "isExpired": false,
      "isNearExpiry": false,
      "daysUntilExpiry": 730
    },
    "blockchain": {
      // Dữ liệu thực tế từ blockchain network (nếu có)
      "blockchainId": "0x123...",
      "transactionHash": "0xabc...",
      "blockNumber": 12345,
      // ... các thông tin khác từ smart contract
    },
    "blockchainInfo": {
      // Thông tin blockchain từ database
      "blockchainId": "0x123...",
      "isOnBlockchain": true,
      "transactionHash": "0xabc...",
      "blockNumber": 12345,
      "blockHash": "0xdef...",
      "contractAddress": "0x...",
      "gasUsed": 123456,
      "lastUpdated": "2024-01-01T00:00:00.000Z",
      "digitalSignature": "...",
      "dataHash": "..."
    }
  }
}
```

### 2. ⚠️ Thuốc gần hết hạn (Status: 200)

```json
{
  "success": true,
  "message": "Thuốc hợp lệ nhưng gần hết hạn.",
  "warning": "Thuốc sẽ hết hạn trong 15 ngày.",
  "data": {
    "drug": {
      // ... thông tin thuốc đầy đủ
      "isNearExpiry": true,
      "daysUntilExpiry": 15
    },
    "blockchain": { ... },
    "blockchainInfo": { ... }
  }
}
```

**Lưu ý**: 
- `isNearExpiry = true` khi còn ≤ 30 ngày
- `daysUntilExpiry` là số ngày còn lại (số dương)

### 3. ❌ Thuốc đã hết hạn (Status: 400)

```json
{
  "success": false,
  "message": "CẢNH BÁO: Thuốc đã hết hạn sử dụng!",
  "alertType": "expired",
  "data": {
    "drug": {
      // ... thông tin thuốc đầy đủ
      "isExpired": true,
      "daysUntilExpiry": -45 // Số âm nghĩa là đã hết hạn
    },
    "expiryDate": "2024-01-01T00:00:00.000Z",
    "daysExpired": 45, // Số ngày đã hết hạn
    "blockchain": { ... },
    "blockchainInfo": { ... }
  }
}
```

**Frontend xử lý**:
- Hiển thị modal cảnh báo lớn màu cam/đỏ
- Vẫn hiển thị đầy đủ thông tin thuốc
- Có thể có nút "Báo cáo"

### 4. 🚨 Thuốc bị thu hồi (Status: 400)

```json
{
  "success": false,
  "message": "CẢNH BÁO: Lô thuốc này đã bị thu hồi!",
  "alertType": "recalled",
  "data": {
    "drug": {
      // ... thông tin thuốc đầy đủ
      "isRecalled": true
    },
    "recallReason": "Phát hiện lỗi trong quá trình sản xuất",
    "recallDate": "2024-01-15T00:00:00.000Z",
    "blockchain": { ... },
    "blockchainInfo": { ... }
  }
}
```

**Frontend xử lý**:
- Hiển thị modal cảnh báo lớn màu đỏ
- Hiển thị lý do thu hồi và ngày thu hồi
- Có nút "Báo cáo Bộ Y tế"
- Vẫn hiển thị đầy đủ thông tin thuốc

### 5. ❌ Không tìm thấy thuốc (Status: 404)

```json
{
  "success": false,
  "message": "Không tìm thấy thông tin thuốc. Có thể đây là thuốc giả hoặc không có trong hệ thống."
}
```

### 6. ❌ Lỗi Server (Status: 500)

```json
{
  "success": false,
  "message": "Lỗi server khi quét QR code.",
  "error": "Error message details"
}
```

## Các trường hợp tìm kiếm

API sẽ tự động tìm thuốc theo thứ tự ưu tiên:

1. **Blockchain ID** (`blockchain.blockchainId`)
2. **Drug ID** (nếu bắt đầu bằng "DRUG_")
3. **Batch Number**
4. **Drug ID** (các trường hợp khác)
5. **Supply Chain** (tìm trong bảng SupplyChain nếu không tìm thấy trực tiếp)

## Blockchain Data

- **`blockchainInfo`**: Thông tin blockchain từ database (luôn có nếu thuốc có blockchainId)
- **`blockchain`**: Dữ liệu thực tế từ blockchain network (chỉ có khi `isOnBlockchain = true` và fetch thành công)
- Nếu fetch blockchain data thất bại, vẫn trả về `blockchainInfo` nhưng `blockchain = null`

## Frontend Integration

### Xử lý Response thành công:
```javascript
if (response.success) {
  const { drug, blockchain, blockchainInfo } = response.data;
  // Hiển thị thông tin thuốc
  // Hiển thị blockchain data nếu có
  // Hiển thị warning nếu có
}
```

### Xử lý Response với alertType:
```javascript
catch (error) {
  const errorResponse = error.response?.data;
  if (errorResponse?.alertType) {
    // Hiển thị modal cảnh báo
    // alertType: 'recalled' hoặc 'expired'
    setAlertModal({
      type: errorResponse.alertType,
      data: errorResponse.data,
      message: errorResponse.message
    });
  }
}
```

## Ví dụ sử dụng

### Request:
```bash
POST /api/drugs/scan-qr
Authorization: Bearer <token>
Content-Type: application/json

{
  "qrData": "DRUG_001"
}
```

### Response (thành công):
```json
{
  "success": true,
  "message": "Thuốc hợp lệ và an toàn.",
  "data": {
    "drug": { ... },
    "blockchain": { ... },
    "blockchainInfo": { ... }
  }
}
```

---

**Ngày tạo**: 2025-01-XX  
**Phiên bản**: 1.0  
**Cập nhật lần cuối**: Sau khi thêm blockchain data và alert modal

