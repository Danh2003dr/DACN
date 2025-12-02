# 🧪 TEST TẠO DRUG MỚI VỚI BLOCKCHAIN

Đã sửa các lỗi trong code. Bây giờ hãy test lại!

## ✅ CÁC THAY ĐỔI ĐÃ THỰC HIỆN

1. ✅ **Sửa `drugController.js`:**
   - Thêm error handling cho blockchain recording
   - Lấy contract address đúng từ blockchain service
   - Thêm logging để debug

2. ✅ **Sửa `blockchainService.js`:**
   - Sửa `getContractAddress` để lấy đúng `CONTRACT_ADDRESS_SEPOLIA`
   - Hỗ trợ cả `qualityTest.result` và `qualityTest.testResult`
   - Xử lý tốt hơn các trường hợp thiếu data

---

## 🚀 TEST LẠI

### Bước 1: Restart Server

Dừng server hiện tại (Ctrl+C) và khởi động lại:

```bash
npm start
```

**Kiểm tra logs phải thấy:**
```
✅ Blockchain connection status: Sepolia Testnet
✅ Contract initialized at address: 0x719E68df6082160416206416F6842915C65aFBa3
✅ Blockchain service initialized successfully
```

### Bước 2: Tạo Drug Mới

1. Vào frontend: `http://localhost:3000`
2. Đăng nhập
3. Vào **"Quản lý Thuốc"** → **"Thêm Thuốc Mới"**
4. Điền thông tin:
   - **Tên thuốc:** `Paracetamol 500mg Test 2`
   - **Hoạt chất:** `Paracetamol`
   - **Số lô:** `LOT-2024-002`
   - **Ngày sản xuất:** `2024-01-15`
   - **Ngày hết hạn:** `2026-01-15`
   - **Kết quả kiểm tra chất lượng:** `PASS`
5. Click **"Lưu"**

### Bước 3: Kiểm tra Backend Logs

Sau khi lưu, kiểm tra backend logs phải thấy:

```
Blockchain result: {
  "success": true,
  "blockchainId": "BC_...",
  "transactionHash": "0x...",
  "blockNumber": 9747618,
  ...
}
✅ Drug DRUG_... đã được ghi lên blockchain: 0x...
```

### Bước 4: Kiểm tra Database

Chạy lệnh để kiểm tra drug vừa tạo:

```bash
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability').then(async () => { const Drug = require('./models/Drug'); const drug = await Drug.findOne({ batchNumber: 'LOT-2024-002' }).select('drugId name batchNumber blockchain').lean(); console.log(JSON.stringify(drug, null, 2)); process.exit(0); });"
```

**Phải thấy:**
```json
{
  "blockchain": {
    "isOnBlockchain": true,
    "blockchainStatus": "confirmed",
    "transactionHash": "0x...",
    "blockNumber": 9747618,
    ...
  }
}
```

### Bước 5: Xem Transaction trên Etherscan

Copy `transactionHash` từ logs hoặc database và xem:

```
https://sepolia.etherscan.io/tx/0xYOUR_TRANSACTION_HASH
```

---

## 🐛 NẾU VẪN LỖI

### Lỗi: "Blockchain service chưa được khởi tạo"

**Giải pháp:**
1. Kiểm tra `.env` có đúng:
   - `BLOCKCHAIN_NETWORK=sepolia`
   - `INFURA_PROJECT_ID=...`
   - `PRIVATE_KEY=...`
   - `CONTRACT_ADDRESS_SEPOLIA=0x719E68df6082160416206416F6842915C65aFBa3`
2. Restart server
3. Kiểm tra logs có thấy: `Contract initialized at address: 0x719E68df6082160416206416F6842915C65aFBa3`

### Lỗi: "Insufficient balance"

**Giải pháp:**
- Kiểm tra balance: `npm run test:blockchain`
- Nếu < 0.01 ETH, lấy thêm từ faucet

### Lỗi: "Transaction failed" hoặc "revert"

**Giải pháp:**
- Kiểm tra contract address có đúng không
- Kiểm tra data có đầy đủ không (drugId, name, activeIngredient, etc.)
- Xem error message chi tiết trong logs

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi tạo drug thành công:

1. ✅ **Backend logs** hiển thị transaction hash thực
2. ✅ **Database** có `isOnBlockchain: true` và `transactionHash` thực
3. ✅ **Etherscan** hiển thị transaction với status "Success"
4. ✅ **Frontend Blockchain Explorer** hiển thị transaction và link "Mở trên Explorer" hoạt động

---

**Bắt đầu test ngay!** 🚀

