# ⚡ QUICK START: Ghi Transactions Lên Blockchain Thực

Hướng dẫn nhanh để setup và ghi transactions lên Sepolia Testnet.

## 🎯 5 Bước Nhanh

### 1️⃣ Lấy Infura Project ID
- Đăng ký: https://infura.io (miễn phí)
- Tạo project → Copy **Project ID**

### 2️⃣ Tạo Wallet & Lấy Private Key
- Cài MetaMask: https://metamask.io
- Tạo wallet mới → Chuyển sang **Sepolia Testnet**
- Export Private Key (Account details → Export Private Key)

### 3️⃣ Lấy Sepolia ETH
- Faucet: https://sepoliafaucet.com
- Paste wallet address → Nhận 0.5 ETH

### 4️⃣ Deploy Smart Contract
```bash
# Cập nhật .env
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your_project_id
PRIVATE_KEY=your_private_key_without_0x

# Compile & Deploy
npx truffle compile
npx truffle migrate --network sepolia

# Copy contract address từ output
```

### 5️⃣ Cấu hình & Test
```bash
# Thêm vào .env
CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress

# Test kết nối
npm run test:blockchain

# Khởi động server
npm start
```

## ✅ Kiểm tra

1. **Test connection:**
   ```bash
   npm run test:blockchain
   ```

2. **Xem trên Etherscan:**
   - Contract: https://sepolia.etherscan.io/address/0xYourContractAddress
   - Transactions: https://sepolia.etherscan.io/tx/0xYourTransactionHash

3. **Sync dữ liệu hiện có:**
   ```bash
   npm run sync:blockchain
   ```

## 📚 Hướng dẫn chi tiết

Xem file **[BLOCKCHAIN_REAL_SETUP.md](./BLOCKCHAIN_REAL_SETUP.md)** để có hướng dẫn đầy đủ.

## 🔧 Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| "Insufficient funds" | Lấy thêm ETH từ faucet |
| "Contract address chưa được cấu hình" | Thêm `CONTRACT_ADDRESS_SEPOLIA` vào `.env` |
| "Network connection failed" | Kiểm tra `INFURA_PROJECT_ID` |
| "Invalid private key" | Private key phải 64 hex characters |

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
- ✅ Ghi transactions lên blockchain thực
- ✅ Xem trên Etherscan
- ✅ Click "Mở trên Explorer" để xem transaction thực

---

**Lưu ý:** Chỉ dùng testnet private key cho testnet. Không commit private key lên Git!

