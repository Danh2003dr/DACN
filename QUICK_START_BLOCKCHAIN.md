# 🚀 HƯỚNG DẪN NHANH - DEPLOY SMART CONTRACT

## ⚡ Các lệnh nhanh

### 1. Compile Smart Contract
```bash
npm run compile
# hoặc
npx truffle compile
```

### 2. Deploy Contract

#### Development (Ganache Local)
```bash
npm run migrate:development
```

#### Sepolia Testnet (Ethereum)
```bash
npm run migrate:sepolia
```

#### BSC Testnet
```bash
npm run migrate:bsc-testnet
```

#### Polygon Mumbai
```bash
npm run migrate:polygon-mumbai
```

#### Arbitrum Sepolia (Layer 2)
```bash
npm run migrate:arbitrum-sepolia
```

#### Optimism Sepolia (Layer 2)
```bash
npm run migrate:optimism-sepolia
```

## 📋 Checklist trước khi deploy

### ✅ Bước 1: Cài đặt dependencies
```bash
npm install
```

### ✅ Bước 2: Cấu hình environment variables
Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

Cập nhật các biến sau trong `.env`:
```env
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id

# Chọn một trong hai: MNEMONIC hoặc PRIVATE_KEY
# MNEMONIC: 12 hoặc 24 từ mnemonic phrase
MNEMONIC=your twelve word mnemonic phrase here
# HOẶC
# PRIVATE_KEY: Private key của account (không có 0x prefix)
PRIVATE_KEY=your_private_key_without_0x_prefix
```

**Lưu ý**: 
- Bạn chỉ cần set **một trong hai**: `MNEMONIC` hoặc `PRIVATE_KEY`
- Nếu set cả hai, `MNEMONIC` sẽ được ưu tiên
- `PRIVATE_KEY` không nên có prefix `0x`

### ✅ Bước 3: Compile contracts
```bash
npm run compile
```

### ✅ Bước 4: Deploy
```bash
npm run migrate:sepolia
```

## 🔍 Kiểm tra kết quả

Sau khi deploy thành công, bạn sẽ thấy:
- Contract address được hiển thị
- Transaction hash
- Block number

Lưu contract address vào `.env`:
```env
CONTRACT_ADDRESS_SEPOLIA=0x...
```

## ⚠️ Lưu ý quan trọng

1. **Private Key**: Không commit private key vào git
2. **Testnet trước**: Luôn test trên testnet trước khi deploy mainnet
3. **Gas Fees**: Đảm bảo account có đủ ETH/tokens để trả gas fees
4. **Network**: Kiểm tra network trong `.env` trước khi deploy

## 🆘 Troubleshooting

### Lỗi: "truffle is not recognized"
**Giải pháp**: Sử dụng `npx truffle` hoặc `npm run migrate:network`

### Lỗi: "Insufficient funds"
**Giải pháp**: Nạp thêm ETH/tokens vào account

### Lỗi: "Network connection failed"
**Giải pháp**: 
- Kiểm tra RPC URL trong `truffle-config.js`
- Kiểm tra `INFURA_PROJECT_ID` trong `.env` (cho Ethereum networks)

### Lỗi: "Please set MNEMONIC or PRIVATE_KEY in .env file"
**Giải pháp**: 
- Thêm `MNEMONIC` hoặc `PRIVATE_KEY` vào file `.env`
- Đảm bảo không có khoảng trắng thừa
- `PRIVATE_KEY` không nên có prefix `0x`

### Lỗi: "Contract already deployed"
**Giải pháp**: Sử dụng `--reset` flag:
```bash
npx truffle migrate --network sepolia --reset
```

## 📚 Tài liệu tham khảo

Xem `BLOCKCHAIN_INTEGRATION_GUIDE.md` để biết thêm chi tiết.

