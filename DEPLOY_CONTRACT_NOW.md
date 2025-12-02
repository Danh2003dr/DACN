# 🚀 DEPLOY SMART CONTRACT LÊN SEPOLIA - HƯỚNG DẪN

Test kết nối blockchain đã thành công! Bây giờ deploy contract.

## ✅ KẾT QUẢ TEST

- ✅ **Kết nối RPC:** Thành công!
- ✅ **Block number:** 9747544
- ✅ **Wallet hợp lệ:** `0x9b690C02f3841605D6aFd44B3f81128aeB618f6F`
- ✅ **Balance:** `0.09952186 ETH` (Đủ để deploy!)
- ⚠️ **Contract address:** Chưa được set (Cần deploy)

## 🎯 CÁC BƯỚC DEPLOY CONTRACT

### Bước 1: Compile Contract (Nếu chưa compile)

Contract đã được compile, nhưng nếu cần compile lại:

```bash
npm run compile
```

**Kiểm tra:**
- File `build/contracts/DrugTraceability.json` đã được tạo
- Không có lỗi compile

### Bước 2: Deploy Contract lên Sepolia

```bash
npm run migrate:sepolia
```

**Quá trình deploy sẽ:**
1. Kết nối đến Sepolia network
2. Deploy Migrations contract (nếu cần)
3. Deploy DrugTraceability contract
4. Hiển thị contract address và transaction hash

**Thời gian:** Khoảng 30 giây - 2 phút

**Chi phí:** Khoảng 0.01-0.05 ETH (bạn có 0.0995 ETH → Đủ!)

### Bước 3: Xem kết quả deploy

Sau khi deploy thành công, bạn sẽ thấy:

```
✅ Contract deployed!
📍 Contract Address: 0xDEF4567890123456789012345678901234567890
🔗 TX Hash: 0xabc123...
⛽ Gas Used: 2345678
```

**Lưu ý quan trọng:**
- Copy **Contract Address** (bắt đầu với `0x...`)
- Đây là địa chỉ contract trên Sepolia
- Cần thêm vào `.env`

### Bước 4: Cập nhật Contract Address vào .env

1. **Mở file `.env`**

2. **Tìm hoặc thêm dòng:**
   ```env
   CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress
   ```

3. **Paste contract address từ output:**
   ```env
   CONTRACT_ADDRESS_SEPOLIA=0xDEF4567890123456789012345678901234567890
   ```

4. **Lưu file**

5. **Kiểm tra lại:**
   ```bash
   npm run test:blockchain
   ```
   
   Phải thấy:
   ```
   ✅ Contract hợp lệ!
   📍 Contract Address: 0x...
   ```

### Bước 5: Khởi động server và test

```bash
npm start
```

**Kiểm tra logs:**
- Phải thấy: `Blockchain connection status: Sepolia Testnet`
- Phải thấy: `Contract initialized at address: 0x...`
- Phải thấy: `Blockchain service initialized successfully`

**Nếu thấy "Falling back to mock mode...":**
- Kiểm tra lại `CONTRACT_ADDRESS_SEPOLIA` trong `.env`
- Đảm bảo contract address đúng (bắt đầu với `0x`, có 42 ký tự)
- Restart server

---

## 📋 TÓM TẮT CÁC LỆNH

```bash
# 1. Compile contract (nếu chưa)
npm run compile

# 2. Deploy lên Sepolia
npm run migrate:sepolia

# 3. Copy contract address từ output
# 4. Thêm vào .env: CONTRACT_ADDRESS_SEPOLIA=0x...

# 5. Test lại
npm run test:blockchain

# 6. Khởi động server
npm start
```

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Insufficient funds"

**Nguyên nhân:** Không đủ ETH để trả phí gas

**Giải pháp:**
- Balance hiện tại: `0.09952186 ETH` → Đủ để deploy
- Nếu vẫn lỗi, kiểm tra gas price có quá cao không
- Thử deploy lại sau vài phút

### Lỗi: "Network connection failed"

**Nguyên nhân:** RPC endpoint không kết nối được

**Giải pháp:**
- Kiểm tra `INFURA_PROJECT_ID` trong `.env`
- Kiểm tra `BLOCKCHAIN_NETWORK=sepolia`
- Thử test lại: `npm run test:blockchain`

### Lỗi: "Contract compilation failed"

**Giải pháp:**
- Kiểm tra Solidity compiler version
- Kiểm tra dependencies: `npm install`
- Xem lỗi compile chi tiết

### Lỗi: "Migration failed"

**Giải pháp:**
- Kiểm tra balance có đủ không
- Kiểm tra gas limit có đủ không
- Thử deploy lại

---

## 📋 CHECKLIST

Sau khi deploy:

- [ ] ✅ Đã compile contract (`npm run compile`)
- [ ] ✅ Đã deploy contract (`npm run migrate:sepolia`)
- [ ] ✅ Đã copy contract address từ output
- [ ] ✅ Đã thêm CONTRACT_ADDRESS_SEPOLIA vào `.env`
- [ ] ✅ Đã test lại (`npm run test:blockchain`)
- [ ] ✅ Contract address hiển thị trong test
- [ ] ✅ Đã khởi động server (`npm start`)
- [ ] ✅ Server kết nối blockchain thành công

---

## 🎯 BƯỚC TIẾP THEO SAU KHI DEPLOY

Sau khi deploy thành công:

1. **Test tạo transaction:**
   - Tạo drug mới qua API hoặc frontend
   - Kiểm tra transaction hash thực trên Etherscan

2. **Xem contract trên Etherscan:**
   - https://sepolia.etherscan.io/address/0xYourContractAddress
   - Xem contract code, transactions, events

3. **Test các functions:**
   - Tạo drug batch
   - Update drug batch
   - Record distribution
   - Verify drug batch

---

## 🎉 CHÚC MỪNG!

Bạn đã sẵn sàng deploy contract lên Sepolia!

**Bây giờ: Chạy `npm run migrate:sepolia` để deploy contract!** 🚀

---

**Lưu ý:** Deploy sẽ tốn khoảng 0.01-0.05 ETH. Bạn có 0.0995 ETH → Đủ để deploy! 💰

