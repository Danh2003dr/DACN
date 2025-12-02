# 🔧 SỬA LỖI HIỂN THỊ TRẠNG THÁI BLOCKCHAIN

## ❌ VẤN ĐỀ

Trong trang xác minh lô thuốc (`/verify/DRUG_469F8271`), phần "Thông tin Blockchain" hiển thị:
- ❌ Status: "Đang chờ" (Pending)
- ❌ Cảnh báo: "Chưa ghi lên blockchain"

**Nhưng thực tế:**
- ✅ Transaction đã thành công trên Sepolia Testnet
- ✅ Transaction Hash: `0x9ba33e6f9e84f42d656532a0b3c2b4cc1c0ead7c2886e834b2d802be2030c780`
- ✅ Block Number: `9747613`
- ✅ Đã được confirm trên Etherscan

## 🔍 NGUYÊN NHÂN

**Vấn đề:** Backend đã gửi transaction lên blockchain thành công, nhưng **không cập nhật thông tin vào database** sau khi nhận được kết quả.

Có thể do:
1. Lỗi khi lưu `drug.save()` sau khi nhận blockchain result
2. Transaction thành công nhưng code không nhận được response đúng
3. Có exception xảy ra sau khi ghi blockchain nhưng trước khi lưu database

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Cập nhật thủ công cho lô thuốc hiện tại

Đã cập nhật thông tin blockchain cho `DRUG_469F8271`:
- ✅ `isOnBlockchain: true`
- ✅ `blockchainStatus: 'confirmed'`
- ✅ `transactionHash: '0x9ba33e6f9e84f42d656532a0b3c2b4cc1c0ead7c2886e834b2d802be2030c780'`
- ✅ `blockNumber: 9747613`

### 2. Tạo script đồng bộ tự động

Đã tạo script `scripts/sync-drug-blockchain-status.js` để:
- Tìm tất cả drugs có transaction hash
- Kiểm tra trạng thái transaction trên blockchain
- Tự động cập nhật `isOnBlockchain` và `blockchainStatus`

**Cách sử dụng:**
```bash
npm run sync:blockchain:status
```

## 🔄 KIỂM TRA SAU KHI SỬA

1. **Refresh trang xác minh:**
   - Mở lại: `http://localhost:3000/verify/DRUG_469F8271`
   - Phần "Thông tin Blockchain" bây giờ sẽ hiển thị:
     - ✅ Status: "Đã xác nhận" (Confirmed)
     - ✅ Transaction Hash: `0x9ba33e6f9e84f42d656532a0b3c2b4cc1c0ead7c2886e834b2d802be2030c780`
     - ✅ Block Number: `9747613`
     - ✅ Link đến Etherscan

2. **Kiểm tra database:**
   ```bash
   node -e "const mongoose = require('mongoose'); require('dotenv').config(); const Drug = require('./models/Drug'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const drug = await Drug.findOne({ drugId: 'DRUG_469F8271' }).lean(); console.log('isOnBlockchain:', drug?.blockchain?.isOnBlockchain); console.log('blockchainStatus:', drug?.blockchain?.blockchainStatus); process.exit(0); });"
   ```

## 🛠️ SỬA CODE ĐỂ TRÁNH LỖI TƯƠNG LAI

### Vấn đề trong `controllers/drugController.js`

Code hiện tại:
```javascript
if (blockchainResult && blockchainResult.success) {
  drug.blockchain = { ... };
  await drug.save(); // Có thể fail mà không báo lỗi
}
```

**Cần cải thiện:**
1. Thêm try-catch khi save
2. Log lỗi nếu save fail
3. Retry mechanism nếu cần
4. Verify transaction sau khi save

### Đề xuất sửa:

```javascript
if (blockchainResult && blockchainResult.success) {
  try {
    drug.blockchain = {
      blockchainId: blockchainResult.blockchainId,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      isOnBlockchain: true,
      blockchainStatus: blockchainResult.mock ? 'pending' : 'confirmed',
      // ...
    };
    
    await drug.save();
    console.log(`✅ Drug ${drug.drugId} đã được ghi lên blockchain: ${blockchainResult.transactionHash}`);
  } catch (saveError) {
    console.error(`❌ Lỗi khi lưu blockchain info cho ${drug.drugId}:`, saveError);
    // Có thể retry hoặc log để xử lý sau
  }
}
```

## 📋 CHECKLIST

- [x] ✅ Đã cập nhật blockchain info cho `DRUG_469F8271`
- [x] ✅ Đã tạo script sync tự động
- [ ] ⏳ Cần refresh trang để kiểm tra
- [ ] ⏳ Cần sửa code để tránh lỗi tương lai

---

**Bây giờ: Refresh trang xác minh và kiểm tra lại!** 🔄

