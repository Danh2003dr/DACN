# 🔧 SỬA LỖI DEPLOY - HƯỚNG DẪN

Lỗi khi deploy với Truffle. Đã tạo script deploy trực tiếp thay thế.

## ❌ LỖI GẶP PHẢI

```
Error: PollingBlockTracker - encountered an error while attempting to update latest block
```

**Nguyên nhân:**
- Truffle/HDWalletProvider gặp vấn đề kết nối RPC
- Có thể do version không tương thích

## ✅ GIẢI PHÁP: Dùng script deploy trực tiếp

Đã tạo script deploy trực tiếp bằng Web3.js (không dùng Truffle).

### Cách 1: Dùng script mới (Khuyên dùng)

```bash
npm run deploy:sepolia
```

**Hoặc:**

```bash
node scripts/deploy-sepolia-direct.js
```

**Script này sẽ:**
- ✅ Kết nối trực tiếp với Sepolia RPC
- ✅ Deploy contract bằng Web3.js
- ✅ Tự động cập nhật `.env` với contract address
- ✅ Test contract sau khi deploy

### Cách 2: Fix Truffle (Nếu muốn dùng Truffle)

**Bước 1: Rebuild dependencies**

```bash
npm install --force
```

**Bước 2: Thử lại**

```bash
npm run migrate:sepolia
```

**Nếu vẫn lỗi:**
- Dùng Cách 1 (script deploy trực tiếp)

---

## 🎯 CHẠY SCRIPT DEPLOY MỚI

### Bước 1: Chạy script deploy

```bash
npm run deploy:sepolia
```

**Hoặc:**

```bash
node scripts/deploy-sepolia-direct.js
```

### Bước 2: Xem kết quả

Script sẽ hiển thị:
- ✅ Kết nối RPC thành công
- ✅ Balance đủ
- ✅ Contract đã được compile
- ✅ Đang deploy...
- ✅ Contract Address: `0x...`
- ✅ Transaction Hash: `0x...`
- ✅ .env đã được cập nhật

### Bước 3: Kiểm tra .env

```bash
Get-Content .env | Select-String "CONTRACT_ADDRESS_SEPOLIA"
```

Phải thấy:
```
CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress
```

### Bước 4: Test lại

```bash
npm run test:blockchain
```

Phải thấy:
```
✅ Contract hợp lệ!
📍 Contract Address: 0x...
```

---

## 📋 TÓM TẮT

**Thay vì:**
```bash
npm run migrate:sepolia  # ❌ Lỗi
```

**Dùng:**
```bash
npm run deploy:sepolia  # ✅ Hoạt động
```

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Contract chưa được compile"

**Giải pháp:**
```bash
npm run compile
```

### Lỗi: "Balance không đủ"

**Giải pháp:**
- Kiểm tra balance trong MetaMask
- Cần ít nhất 0.01 ETH
- Lấy thêm từ faucet nếu cần

### Lỗi: "Cannot find module"

**Giải pháp:**
```bash
npm install
```

---

**Bây giờ: Chạy `npm run deploy:sepolia` để deploy contract!** 🚀

