# 🧪 TEST TẠO TRANSACTION THỰC LÊN BLOCKCHAIN

Server đã chạy thành công! Bây giờ hãy test tạo transaction thực.

## ✅ TRẠNG THÁI HIỆN TẠI

- ✅ **Contract Address:** `0x719E68df6082160416206416F6842915C65aFBa3`
- ✅ **Network:** Sepolia Testnet
- ✅ **Server:** Đang chạy tại `http://localhost:5000`
- ✅ **Balance:** `0.0995 ETH` (Đủ để test!)

---

## 🚀 CÁCH 1: Test Qua Frontend (Dễ nhất)

### Bước 1: Khởi động Frontend

Mở terminal mới và chạy:

```bash
cd frontend
npm start
```

Frontend sẽ mở tại: `http://localhost:3000`

### Bước 2: Đăng nhập

1. Truy cập: `http://localhost:3000/login`
2. Đăng nhập với tài khoản Admin hoặc Manufacturer

### Bước 3: Tạo Drug Mới

1. Vào menu **"Quản lý Thuốc"** → **"Thêm Thuốc Mới"**
2. Điền thông tin:
   - **Tên thuốc:** `Paracetamol 500mg Test`
   - **Hoạt chất:** `Paracetamol`
   - **Nhà sản xuất:** Chọn nhà sản xuất
   - **Số lô:** `LOT-2024-001`
   - **Ngày sản xuất:** `2024-01-15`
   - **Ngày hết hạn:** `2026-01-15`
   - **Kết quả kiểm tra chất lượng:** `PASS`
3. Click **"Lưu"**

### Bước 4: Kiểm tra Transaction

Sau khi lưu:
- ✅ Hệ thống sẽ tự động ghi lên blockchain
- ✅ Xem **Backend logs** để thấy transaction hash
- ✅ Copy transaction hash và xem trên Etherscan

---

## 🚀 CÁCH 2: Test Qua API (Nhanh hơn)

### Bước 1: Đăng nhập để lấy Token

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"password123\"}"
```

**Copy token từ response** (ví dụ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Bước 2: Tạo Drug Mới

**Thay `YOUR_TOKEN` bằng token từ bước 1:**

```bash
curl -X POST http://localhost:5000/api/drugs ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\":\"Paracetamol 500mg Test\",\"activeIngredient\":\"Paracetamol\",\"manufacturerId\":\"MANUFACTURER_ID\",\"batchNumber\":\"LOT-2024-001\",\"productionDate\":\"2024-01-15\",\"expiryDate\":\"2026-01-15\",\"qualityTestResult\":\"PASS\",\"description\":\"Test drug for blockchain\"}"
```

### Bước 3: Kiểm tra Response

Response sẽ có dạng:

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

**Copy `transactionHash`** để xem trên Etherscan!

---

## 🔍 XEM TRANSACTION TRÊN ETHERSCAN

### 1. Xem Transaction

```
https://sepolia.etherscan.io/tx/0xYOUR_TRANSACTION_HASH
```

### 2. Xem Contract (đã có)

```
https://sepolia.etherscan.io/address/0x719E68df6082160416206416F6842915C65aFBa3
```

### 3. Xem Events

- Vào tab **"Events"** trên Etherscan
- Sẽ thấy event `DrugBatchCreated` với thông tin drug

---

## ✅ KIỂM TRA TRÊN FRONTEND

### 1. Xem Blockchain Explorer

1. Truy cập: `http://localhost:3000/blockchain-explorer`
2. Tìm transaction vừa tạo
3. Click **"Mở trên Explorer"** → Sẽ mở Etherscan với transaction hash thực ✅

### 2. Verify Drug

1. Vào **"Quản lý Thuốc"**
2. Tìm drug vừa tạo
3. Click **"Chi tiết"**
4. Kiểm tra:
   - ✅ Blockchain ID
   - ✅ Transaction Hash
   - ✅ Block Number
   - ✅ Link "Xem trên Etherscan"

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi tạo drug thành công:

1. ✅ **Backend logs** hiển thị:
   ```
   ✅ Drug batch recorded on blockchain
   📍 Transaction Hash: 0x1234...
   📊 Block Number: 9747618
   ```

2. ✅ **Etherscan** hiển thị:
   - Transaction với status "Success"
   - Gas used
   - Block number
   - Events: `DrugBatchCreated`

3. ✅ **Frontend Blockchain Explorer**:
   - Transaction hiển thị trong danh sách
   - Click "Mở trên Explorer" → Mở Etherscan thực ✅

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Blockchain service not initialized"

**Giải pháp:**
1. Kiểm tra `.env` có đúng `CONTRACT_ADDRESS_SEPOLIA`
2. Restart server: `npm start`
3. Kiểm tra logs có thấy: `Contract initialized at address: 0x719E68df6082160416206416F6842915C65aFBa3`

### Lỗi: "Insufficient balance"

**Giải pháp:**
- Kiểm tra balance: `npm run test:blockchain`
- Nếu < 0.01 ETH, lấy thêm từ faucet

### Lỗi: "Transaction failed"

**Giải pháp:**
- Kiểm tra network connection
- Thử lại sau vài phút

---

## 🎉 CHÚC MỪNG!

Khi bạn thấy transaction trên Etherscan, bạn đã thành công! 🎊

**Bây giờ bạn có:**
- ✅ Blockchain thực hoạt động
- ✅ Transactions được ghi lên Sepolia
- ✅ Có thể xem trên Etherscan
- ✅ Link "Mở trên Explorer" hoạt động với transaction thực

---

**Bắt đầu test ngay!** 🚀

