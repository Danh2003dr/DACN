# 🔍 KIỂM TRA BLOCKCHAIN STATUS

Server đã chạy! Bây giờ hãy kiểm tra blockchain service.

## ✅ CÁCH 1: Xem Backend Logs

Trong terminal đang chạy `npm start`, bạn sẽ thấy logs như sau:

**Nếu thành công:**
```
✅ MongoDB Connected
Blockchain connection status: Sepolia Testnet
Current block: 9747618
Using account: 0x9b690C02f3841605D6aFd44B3f81128aeB618f6F
Contract initialized at address: 0x719E68df6082160416206416F6842915C65aFBa3 on Sepolia Testnet
Blockchain service initialized successfully
🚀 DEV Express server started
Port: 5000
```

**Nếu lỗi (mock mode):**
```
Blockchain initialization error: ...
Falling back to mock mode...
Blockchain service initialized in mock mode
```

## ✅ CÁCH 2: Test Tạo Drug Mới

Cách tốt nhất để kiểm tra blockchain là test tạo drug mới:

1. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm start
   ```

2. **Tạo Drug Mới:**
   - Truy cập: `http://localhost:3000`
   - Đăng nhập
   - Vào **"Quản lý Thuốc"** → **"Thêm Thuốc Mới"**
   - Điền thông tin và lưu

3. **Kiểm tra Backend Logs:**
   - Nếu thành công, sẽ thấy:
     ```
     Blockchain result: { ... }
     ✅ Drug DRUG_... đã được ghi lên blockchain: 0x...
     ```
   - Nếu lỗi, sẽ thấy:
     ```
     ⚠️ Drug DRUG_... chưa được ghi lên blockchain: ...
     ```

## ✅ CÁCH 3: Test Kết Nối Blockchain

Chạy script test:

```bash
npm run test:blockchain
```

**Kết quả mong đợi:**
```
✅ Kết nối thành công!
✅ Wallet hợp lệ!
✅ Contract hợp lệ!
```

---

## 🐛 NẾU BLOCKCHAIN SERVICE CHƯA KHỞI TẠO

### Kiểm tra `.env`:

```bash
Get-Content .env | Select-String -Pattern "^BLOCKCHAIN_NETWORK=|^INFURA_PROJECT_ID=|^PRIVATE_KEY=|^CONTRACT_ADDRESS_SEPOLIA="
```

**Phải thấy:**
```
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=c7b0ee9f14774684a619e43305849f6f
PRIVATE_KEY=ba3c022f9d4d9564e8aa8aadc211ce6dbf0f033ecfc376c746e8f08f38e707db
CONTRACT_ADDRESS_SEPOLIA=0x719E68df6082160416206416F6842915C65aFBa3
```

### Restart Server:

1. Dừng server (Ctrl+C)
2. Chạy lại: `npm start`
3. Kiểm tra logs

---

## 🎯 BƯỚC TIẾP THEO

Sau khi xác nhận blockchain service đã khởi tạo:

1. ✅ Khởi động frontend
2. ✅ Tạo drug mới
3. ✅ Kiểm tra transaction hash trên Etherscan
4. ✅ Xem transaction trên Blockchain Explorer (frontend)

---

**Bây giờ: Kiểm tra logs server và test tạo drug mới!** 🚀

