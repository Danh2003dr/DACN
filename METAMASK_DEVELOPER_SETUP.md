# 🔷 HƯỚNG DẪN SỬ DỤNG METAMASK DEVELOPER API

Hướng dẫn này dành cho bạn đã tạo tài khoản MetaMask Developer và có API key.

## 📋 Bạn đang ở đâu?

Bạn đã:
- ✅ Tạo tài khoản MetaMask Developer
- ✅ Có API key đầu tiên
- ✅ Đang ở trang dashboard

## 🎯 Các bước tiếp theo

### Bước 1: Copy API Key

1. **Trong bảng "Khóa API":**
   - Tìm dòng "Chìa khóa đầu tiên..."
   - Click nút **"Sao chép khóa"** (Copy key)
   - Hoặc click **"Cấu hình"** (Configure) để xem chi tiết và copy

2. **Lưu API key này lại** - bạn sẽ cần nó để cấu hình `.env`

### Bước 2: Chọn Network

1. **Trong phần "Bạn muốn sử dụng mạng nào trước?"**
   - Click dropdown **"Chọn mạng"** (Choose network)
   - Chọn **"Sepolia"** (Sepolia Testnet)
   - Click nút **"Kế tiếp"** (Next)

2. **Lưu ý:** Nếu không thấy Sepolia, bạn có thể thêm sau trong phần cấu hình API key.

### Bước 3: Lấy RPC Endpoint

MetaMask Developer cung cấp RPC endpoint tương tự Infura. Có 2 cách:

#### Cách 1: Sử dụng RPC URL từ MetaMask Developer

1. Vào phần **"Cấu hình"** (Configure) của API key
2. Tìm **RPC URL** cho Sepolia
3. Format thường là: `https://sepolia.infura.io/v3/YOUR_API_KEY`
   hoặc
   `https://rpc.metamask.io/v1/YOUR_API_KEY`

#### Cách 2: Sử dụng như Infura (Khuyên dùng)

MetaMask Developer API tương thích với Infura, bạn có thể dùng format Infura:

```
https://sepolia.infura.io/v3/YOUR_METAMASK_API_KEY
```

### Bước 4: Cập nhật .env

Mở file `.env` và thêm/cập nhật:

```env
# Blockchain Configuration
BLOCKCHAIN_NETWORK=sepolia

# Sử dụng API key từ MetaMask Developer (tương thích Infura)
INFURA_PROJECT_ID=your_metamask_api_key_here

# Private Key từ MetaMask wallet (xem bước tiếp theo)
PRIVATE_KEY=your_private_key_here

# Contract Address (sẽ có sau khi deploy)
CONTRACT_ADDRESS_SEPOLIA=0x...
```

**Ví dụ:**
```env
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=abc123def456ghi789jkl012mno345pqr678
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Bước 5: Lấy Private Key từ MetaMask Wallet

Bạn cần wallet để deploy contract và gửi transactions:

1. **Mở MetaMask extension:**
   - Click icon MetaMask trên browser
   - Nếu chưa có wallet, tạo mới:
     - Click "Create a new wallet"
     - Lưu Secret Recovery Phrase (12-24 từ)
     - Đặt password

2. **Chuyển sang Sepolia Testnet:**
   - Click network dropdown (góc trên)
   - Chọn "Sepolia test network"
   - Nếu không thấy:
     - Settings → Networks → Add network
     - Network Name: `Sepolia`
     - RPC URL: `https://sepolia.infura.io/v3/YOUR_API_KEY`
     - Chain ID: `11155111`
     - Currency: `ETH`
     - Explorer: `https://sepolia.etherscan.io`

3. **Export Private Key:**
   - Click icon account (góc trên bên phải)
   - Chọn "Account details"
   - Click "Export Private Key"
   - Nhập password
   - Copy **Private Key** (bắt đầu với `0x...`)
   - **⚠️ LƯU Ý:** Không chia sẻ private key này!

4. **Cập nhật vào .env:**
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ```
   (Bỏ `0x` ở đầu nếu có)

### Bước 6: Lấy Sepolia ETH (Testnet Faucet)

Bạn cần Sepolia ETH để trả phí gas:

1. **Từ MetaMask Developer Portal:**
   - Click **"Vòi nước"** (Faucet) ở sidebar bên trái
   - Hoặc truy cập: https://developer.metamask.io/faucet

2. **Hoặc dùng faucet khác:**
   - Alchemy: https://sepoliafaucet.com
   - Infura: https://www.infura.io/faucet/sepolia
   - QuickNode: https://faucet.quicknode.com/ethereum/sepolia

3. **Paste wallet address** (từ MetaMask) và nhận ETH

### Bước 7: Test kết nối

```bash
# Test kết nối blockchain
npm run test:blockchain
```

Kết quả mong đợi:
```
✅ Kết nối thành công!
📊 Block number hiện tại: 12345678
✅ Wallet hợp lệ!
💰 Balance: 0.5 ETH
```

### Bước 8: Compile & Deploy Smart Contract

```bash
# Compile contract
npm run compile

# Deploy lên Sepolia
npm run migrate:sepolia
```

Sau khi deploy thành công, bạn sẽ thấy:
```
✅ Contract deployed!
📍 Contract Address: 0xDEF456...
🔗 TX Hash: 0xabc123...
```

### Bước 9: Cập nhật Contract Address

Copy contract address từ output và thêm vào `.env`:

```env
CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress
```

### Bước 10: Khởi động server và test

```bash
# Khởi động server
npm start

# Kiểm tra logs - phải thấy:
# "Blockchain connection status: Sepolia Testnet"
# "Contract initialized at address: 0x..."
```

## ✅ Kiểm tra kết quả

1. **Test tạo drug mới** qua API hoặc frontend
2. **Kiểm tra transaction hash** trong response
3. **Xem trên Etherscan:**
   - https://sepolia.etherscan.io/tx/0xYourTransactionHash

## 🔧 Troubleshooting

### Lỗi: "Network connection failed"

**Nguyên nhân:** API key hoặc RPC URL sai

**Giải pháp:**
- Kiểm tra `INFURA_PROJECT_ID` trong `.env` đúng chưa
- Thử dùng format: `https://sepolia.infura.io/v3/YOUR_API_KEY`
- Kiểm tra API key có quyền truy cập Sepolia network chưa

### Lỗi: "Insufficient funds"

**Nguyên nhân:** Không đủ Sepolia ETH

**Giải pháp:**
- Lấy thêm ETH từ faucet
- Kiểm tra balance: https://sepolia.etherscan.io/address/0xYourAddress

### Lỗi: "Contract address chưa được cấu hình"

**Nguyên nhân:** Chưa deploy contract hoặc chưa cập nhật `.env`

**Giải pháp:**
- Deploy contract: `npm run migrate:sepolia`
- Thêm `CONTRACT_ADDRESS_SEPOLIA` vào `.env`
- Restart server

## 📚 Tài liệu tham khảo

- **MetaMask Developer Docs:** https://developer.metamask.io
- **Sepolia Testnet:** https://sepolia.dev
- **Etherscan Sepolia:** https://sepolia.etherscan.io
- **Hướng dẫn chi tiết:** [BLOCKCHAIN_REAL_SETUP.md](./BLOCKCHAIN_REAL_SETUP.md)

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
- ✅ Ghi transactions lên Sepolia Testnet
- ✅ Xem transactions trên Etherscan
- ✅ Sử dụng link "Mở trên Explorer" để xem transaction thực

---

**Lưu ý bảo mật:**
- ⚠️ Không commit private key lên Git
- ⚠️ Chỉ dùng testnet private key cho testnet
- ⚠️ Lưu private key an toàn

