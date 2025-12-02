# 🚀 CÁC BƯỚC TIẾP THEO SAU KHI DEPLOY CONTRACT

Contract đã được deploy thành công! Bây giờ hãy test tạo transaction thực lên blockchain.

## ✅ BƯỚC 1: Khởi động Server

### 1.1. Kiểm tra MongoDB đang chạy

```bash
# Kiểm tra MongoDB service
# Nếu chưa chạy, khởi động MongoDB
```

### 1.2. Khởi động Backend Server

```bash
npm start
```

**Kiểm tra logs phải thấy:**
```
✅ MongoDB connected
✅ Blockchain connection status: Sepolia Testnet
✅ Contract initialized at address: 0x719E68df6082160416206416F6842915C65aFBa3
✅ Blockchain service initialized successfully
✅ Server running on port 5000
```

### 1.3. Khởi động Frontend (Terminal mới)

Mở terminal mới và chạy:

```bash
cd frontend
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## ✅ BƯỚC 2: Test Tạo Transaction Thực

### Cách 1: Tạo Drug Mới Qua Frontend

1. **Đăng nhập vào hệ thống:**
   - Truy cập: `http://localhost:3000/login`
   - Đăng nhập với tài khoản Admin hoặc Manufacturer

2. **Tạo Drug Mới:**
   - Vào menu "Quản lý Thuốc" → "Thêm Thuốc Mới"
   - Điền thông tin:
     - Tên thuốc: `Paracetamol 500mg`
     - Hoạt chất: `Paracetamol`
     - Nhà sản xuất: Chọn nhà sản xuất
     - Số lô: `LOT-2024-001`
     - Ngày sản xuất: `2024-01-15`
     - Ngày hết hạn: `2026-01-15`
     - Kết quả kiểm tra chất lượng: `PASS`
   - Click "Lưu"

3. **Kiểm tra Transaction:**
   - Sau khi lưu, hệ thống sẽ tự động ghi lên blockchain
   - Xem logs backend để thấy transaction hash
   - Copy transaction hash và xem trên Etherscan

### Cách 2: Test Qua API (Postman/curl)

```bash
# 1. Đăng nhập để lấy token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# 2. Tạo drug mới (thay YOUR_TOKEN bằng token từ bước 1)
curl -X POST http://localhost:5000/api/drugs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Paracetamol 500mg",
    "activeIngredient": "Paracetamol",
    "manufacturerId": "MANUFACTURER_ID",
    "batchNumber": "LOT-2024-001",
    "productionDate": "2024-01-15",
    "expiryDate": "2026-01-15",
    "qualityTestResult": "PASS",
    "description": "Test drug for blockchain"
  }'
```

---

## ✅ BƯỚC 3: Xem Transaction Trên Etherscan

### 3.1. Lấy Transaction Hash

Sau khi tạo drug, kiểm tra response hoặc logs backend:

**Trong Response API:**
```json
{
  "success": true,
  "data": {
    "drug": { ... },
    "blockchain": {
      "transactionHash": "0x1234...",
      "blockNumber": 9747618,
      "blockchainId": "BC_..."
    }
  }
}
```

**Trong Backend Logs:**
```
✅ Drug batch recorded on blockchain
📍 Transaction Hash: 0x1234...
📊 Block Number: 9747618
```

### 3.2. Xem Trên Etherscan

1. **Xem Transaction:**
   ```
   https://sepolia.etherscan.io/tx/0xYOUR_TRANSACTION_HASH
   ```

2. **Xem Contract (đã có):**
   ```
   https://sepolia.etherscan.io/address/0x719E68df6082160416206416F6842915C65aFBa3
   ```

3. **Xem Events:**
   - Vào tab "Events" trên Etherscan
   - Sẽ thấy event `DrugBatchCreated` với thông tin drug

---

## ✅ BƯỚC 4: Kiểm Tra Trên Frontend

### 4.1. Xem Blockchain Explorer

1. Truy cập: `http://localhost:3000/blockchain-explorer`
2. Tìm transaction vừa tạo
3. Click "Mở trên Explorer" → Sẽ mở Etherscan với transaction hash thực

### 4.2. Verify Drug

1. Vào "Quản lý Thuốc"
2. Tìm drug vừa tạo
3. Click "Chi tiết"
4. Kiểm tra:
   - ✅ Blockchain ID
   - ✅ Transaction Hash
   - ✅ Block Number
   - ✅ Link "Xem trên Etherscan"

---

## ✅ BƯỚC 5: Sync Dữ Liệu Hiện Có (Tùy chọn)

Nếu bạn đã có drugs trong database nhưng chưa có blockchain data:

```bash
npm run sync:blockchain
```

**Lưu ý:**
- Script sẽ tìm tất cả drugs chưa có `blockchain.transactionHash`
- Mỗi drug sẽ được ghi lên blockchain (tốn gas)
- Với `0.0995 ETH`, bạn có thể sync khoảng 100-1000 drugs
- Script sẽ hiển thị progress và transaction hash cho mỗi drug

---

## 🎯 CHECKLIST HOÀN THÀNH

- [x] ✅ Contract đã được deploy
- [x] ✅ Contract Address đã được cập nhật vào `.env`
- [x] ✅ Test kết nối blockchain thành công
- [ ] ⏳ Khởi động server backend
- [ ] ⏳ Khởi động frontend
- [ ] ⏳ Tạo drug mới và kiểm tra transaction
- [ ] ⏳ Xem transaction trên Etherscan
- [ ] ⏳ Verify trên Blockchain Explorer (frontend)

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Blockchain service not initialized"

**Nguyên nhân:** Server chưa kết nối được với blockchain

**Giải pháp:**
1. Kiểm tra `.env` có đúng:
   - `BLOCKCHAIN_NETWORK=sepolia`
   - `INFURA_PROJECT_ID=...`
   - `PRIVATE_KEY=...`
   - `CONTRACT_ADDRESS_SEPOLIA=0x719E68df6082160416206416F6842915C65aFBa3`
2. Chạy test: `npm run test:blockchain`
3. Restart server

### Lỗi: "Insufficient balance"

**Nguyên nhân:** Không đủ ETH để trả gas

**Giải pháp:**
1. Kiểm tra balance: Xem trong test output
2. Nếu < 0.01 ETH, lấy thêm từ faucet:
   - Alchemy Faucet: https://sepoliafaucet.com/
   - PoW Faucet: https://sepolia-faucet.pk910.de/

### Lỗi: "Transaction failed"

**Nguyên nhân:** Gas limit quá thấp hoặc network issue

**Giải pháp:**
1. Kiểm tra network connection
2. Tăng gas limit trong `blockchainService.js` (nếu cần)
3. Thử lại sau vài phút

---

## 🎉 CHÚC MỪNG!

Bạn đã hoàn thành setup blockchain thực!

**Bây giờ bạn có thể:**
- ✅ Ghi transactions lên blockchain thực (Sepolia)
- ✅ Xem transactions trên Etherscan
- ✅ Verify tính minh bạch và không thể thay đổi của dữ liệu
- ✅ Click "Mở trên Explorer" để xem transaction thực

---

**Bắt đầu: Khởi động server và test!** 🚀

```bash
npm start
```

