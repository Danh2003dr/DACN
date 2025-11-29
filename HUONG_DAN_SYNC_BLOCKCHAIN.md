# 🔗 Hướng Dẫn Đồng Bộ Dữ Liệu Thuốc Lên Blockchain

## 📋 Tổng Quan

Script này sẽ tự động tìm và sync tất cả các lô thuốc chưa có dữ liệu blockchain lên blockchain network.

## ✅ Kiểm Tra Trước Khi Sync

### 1. Kiểm tra Blockchain đã được cấu hình chưa

```bash
# Xem file .env
cat .env | grep BLOCKCHAIN
```

Đảm bảo có các biến sau:
```env
BLOCKCHAIN_NETWORK=development
# hoặc
BLOCKCHAIN_NETWORK=sepolia
# hoặc
BLOCKCHAIN_NETWORK=bsc_testnet
```

### 2. Kiểm tra MongoDB đang chạy

```bash
# Kiểm tra MongoDB service
# Hoặc chạy backend để test connection
npm start
```

### 3. Kiểm tra có bao nhiêu thuốc chưa sync

Chạy script kiểm tra:
```bash
node scripts/check-drugs-blockchain-status.js
```

**Hoặc kiểm tra trực tiếp trong MongoDB:**
```javascript
// Kết nối MongoDB và chạy:
db.drugs.countDocuments({
  $or: [
    { 'blockchain.isOnBlockchain': { $ne: true } },
    { 'blockchain.isOnBlockchain': false },
    { 'blockchain.isOnBlockchain': { $exists: false } }
  ]
})
```

---

## 🚀 Cách Chạy Sync

### Cách 1: Dùng npm script (Khuyến nghị)

```bash
npm run sync:blockchain
```

### Cách 2: Chạy trực tiếp script

```bash
node scripts/sync-drugs-to-blockchain.js
```

### Cách 3: Chạy từ thư mục gốc

```bash
cd D:\DACN
node scripts/sync-drugs-to-blockchain.js
```

---

## 📝 Chi Tiết Script

Script sẽ:

1. ✅ **Kết nối MongoDB** - Tự động kết nối từ `.env`
2. ✅ **Khởi tạo Blockchain Service** - Load contract và config
3. ✅ **Tìm thuốc chưa sync** - Tìm các thuốc có:
   - `blockchain.isOnBlockchain` = false
   - `blockchain.isOnBlockchain` không tồn tại
4. ✅ **Sync từng thuốc** - Ghi lên blockchain và cập nhật DB
5. ✅ **Báo cáo kết quả** - Hiển thị số thành công/thất bại

---

## 🔍 Kết Quả Mong Đợi

### Thành công:
```
🚀 Bắt đầu sync dữ liệu thuốc lên blockchain...

✅ Đã kết nối MongoDB

🔗 Đang khởi tạo blockchain service...
✅ Blockchain service đã được khởi tạo

📦 Tìm thấy 10 lô thuốc cần sync lên blockchain

[1/10] Đang sync: Paracetamol (BATCH001)
  ✅ Đã sync thành công: DRUG_ABC123

[2/10] Đang sync: Aspirin (BATCH002)
  ✅ Đã sync thành công: DRUG_XYZ789

...

===========================================
📊 TỔNG KẾT:
  ✅ Thành công: 10
  ❌ Thất bại: 0
  📦 Tổng cộng: 10
===========================================

✅ Đã sync thành công một số dữ liệu lên blockchain!
```

### Không có thuốc cần sync:
```
✅ Tất cả dữ liệu thuốc đã được sync lên blockchain!
```

---

## ⚙️ Cấu Hình Blockchain

### Development (Mock Mode - Không cần kết nối thật)

```env
BLOCKCHAIN_NETWORK=development
```

Sẽ tạo mock transaction hash và blockchain ID.

### Testnet/Mainnet (Cần cấu hình đầy đủ)

```env
BLOCKCHAIN_NETWORK=sepolia
# hoặc
BLOCKCHAIN_NETWORK=bsc_testnet
# hoặc
BLOCKCHAIN_NETWORK=polygon_mumbai

# Cần có:
INFURA_PROJECT_ID=your_infura_id
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=0x...
```

Xem thêm: `BLOCKCHAIN_INTEGRATION_GUIDE.md`

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to MongoDB"

**Giải pháp:**
1. Kiểm tra MongoDB đang chạy:
   ```bash
   # Windows
   net start MongoDB
   
   # Hoặc khởi động lại service
   ```

2. Kiểm tra `MONGODB_URI` trong `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/drug-traceability
   ```

### Lỗi: "Blockchain service chưa được khởi tạo"

**Giải pháp:**
1. Kiểm tra blockchain config trong `.env`
2. Kiểm tra contract đã được deploy chưa (nếu dùng testnet/mainnet)

### Lỗi: "Transaction failed" hoặc "Gas estimation failed"

**Giải pháp:**
1. **Development mode**: Không cần lo, vì là mock
2. **Testnet/Mainnet**:
   - Kiểm tra account có đủ balance
   - Kiểm tra gas price
   - Kiểm tra contract address đúng chưa

### Một số thuốc sync thất bại

Script sẽ tiếp tục với các thuốc khác và báo cáo lỗi ở cuối:
```
❌ Các lỗi gặp phải:
  1. Paracetamol (BATCH001): Transaction failed
  2. Aspirin (BATCH002): Gas estimation failed
```

---

## 🔄 Sau Khi Sync

### 1. Kiểm tra lại dữ liệu

```javascript
// Trong MongoDB
db.drugs.find({ 'blockchain.isOnBlockchain': true }).count()
```

### 2. Xem blockchain data

```javascript
db.drugs.findOne({ 'blockchain.isOnBlockchain': true }, {
  name: 1,
  batchNumber: 1,
  'blockchain.blockchainId': 1,
  'blockchain.transactionHash': 1
})
```

### 3. Test verify trên frontend

Truy cập:
```
http://localhost:3000/verify/{blockchainId}
```

---

## 📌 Lưu Ý Quan Trọng

1. ⚠️ **Backup database** trước khi sync (nếu có dữ liệu quan trọng)
2. ⚠️ **Test trên development** trước khi sync production
3. ⚠️ **Kiểm tra gas fees** nếu dùng testnet/mainnet (có thể tốn tiền)
4. ✅ **Script an toàn** - Chỉ cập nhật các thuốc chưa có blockchain data
5. ✅ **Có thể chạy nhiều lần** - Script sẽ tự động bỏ qua thuốc đã sync

---

## 🚀 Quick Start

```bash
# 1. Đảm bảo backend đang chạy hoặc MongoDB đang chạy
# 2. Kiểm tra .env có cấu hình blockchain
# 3. Chạy sync:
npm run sync:blockchain
```

---

**Chúc bạn sync thành công!** 🎉

