# HƯỚNG DẪN TÍCH HỢP BLOCKCHAIN - MULTI-CHAIN & LAYER 2

## 📋 TỔNG QUAN

Hệ thống đã được nâng cấp với hỗ trợ đa blockchain và Layer 2 solutions để tối ưu hóa gas fees và mở rộng khả năng.

## 🚀 TÍNH NĂNG MỚI

### 1. Smart Contract Optimization
- ✅ **Packed Structs**: Giảm storage slots, tiết kiệm gas
- ✅ **Custom Errors**: Thay thế require strings để giảm gas
- ✅ **Batch Operations**: Tạo và ghi nhận nhiều lô thuốc trong một transaction
- ✅ **Unchecked Loops**: Tối ưu hóa loops khi đã đảm bảo an toàn
- ✅ **Dynamic Gas Estimation**: Tự động ước tính gas thay vì dùng giá trị cố định

### 2. Gas Fee Optimization
- ✅ **Dynamic Gas Estimation**: Tự động tính toán gas cần thiết
- ✅ **Gas Price Optimization**: Lấy gas price từ network
- ✅ **Layer 2 Support**: Giảm gas fees đáng kể với Arbitrum và Optimism

### 3. Multi-Chain Support
Hệ thống hỗ trợ các blockchain sau:

#### Ethereum Networks
- **Sepolia Testnet**: Mạng test của Ethereum
- **Mainnet**: Ethereum chính thức

#### Binance Smart Chain (BSC)
- **BSC Testnet**: Mạng test của BSC
- **BSC Mainnet**: BSC chính thức (gas rẻ hơn Ethereum)

#### Polygon
- **Mumbai Testnet**: Mạng test của Polygon
- **Polygon Mainnet**: Polygon chính thức (gas rất rẻ)

### 4. Layer 2 Solutions
- **Arbitrum Sepolia**: Testnet của Arbitrum
- **Arbitrum One**: Mainnet của Arbitrum (giảm gas ~90%)
- **Optimism Sepolia**: Testnet của Optimism
- **Optimism Mainnet**: Mainnet của Optimism (giảm gas ~90%)

## ⚙️ CẤU HÌNH

### 1. Environment Variables

Cập nhật file `.env` với các biến sau:

```env
# Chọn network (development, sepolia, mainnet, bsc_testnet, bsc_mainnet, 
#               polygon_mumbai, polygon_mainnet, arbitrum_sepolia, arbitrum_one,
#               optimism_sepolia, optimism_mainnet)
BLOCKCHAIN_NETWORK=development

# Infura Project ID (cho Ethereum networks)
INFURA_PROJECT_ID=your_infura_project_id

# Private Key hoặc Mnemonic
PRIVATE_KEY=your_private_key_for_blockchain_transactions
MNEMONIC=your_mnemonic_phrase_for_hdwallet_provider

# Contract Address (có thể cấu hình riêng cho từng network)
CONTRACT_ADDRESS=0x...

# Hoặc cấu hình riêng:
CONTRACT_ADDRESS_SEPOLIA=0x...
CONTRACT_ADDRESS_BSC_MAINNET=0x...
CONTRACT_ADDRESS_POLYGON_MAINNET=0x...
CONTRACT_ADDRESS_ARBITRUM_ONE=0x...
CONTRACT_ADDRESS_OPTIMISM_MAINNET=0x...
```

### 2. Deploy Contract lên các Networks

**Lưu ý**: Truffle được cài đặt như một devDependency, nên bạn cần sử dụng `npx truffle` hoặc npm scripts.

#### Cách 1: Sử dụng npm scripts (Khuyến nghị)
```bash
# Deploy lên Development (Ganache local)
npm run migrate:development

# Deploy lên Sepolia (Ethereum Testnet)
npm run migrate:sepolia

# Deploy lên Ethereum Mainnet
npm run migrate:mainnet

# Deploy lên BSC Testnet
npm run migrate:bsc-testnet

# Deploy lên BSC Mainnet
npm run migrate:bsc-mainnet

# Deploy lên Polygon Mumbai
npm run migrate:polygon-mumbai

# Deploy lên Polygon Mainnet
npm run migrate:polygon-mainnet

# Deploy lên Arbitrum Sepolia
npm run migrate:arbitrum-sepolia

# Deploy lên Arbitrum One
npm run migrate:arbitrum-one

# Deploy lên Optimism Sepolia
npm run migrate:optimism-sepolia

# Deploy lên Optimism Mainnet
npm run migrate:optimism-mainnet
```

#### Cách 2: Sử dụng npx truffle trực tiếp
```bash
# Deploy lên Sepolia (Ethereum Testnet)
npx truffle migrate --network sepolia

# Deploy lên BSC Testnet
npx truffle migrate --network bsc_testnet

# Deploy lên Polygon Mumbai
npx truffle migrate --network polygon_mumbai

# Deploy lên Arbitrum Sepolia
npx truffle migrate --network arbitrum_sepolia

# Deploy lên Optimism Sepolia
npx truffle migrate --network optimism_sepolia
```

#### Compile contracts
```bash
# Sử dụng npm script
npm run compile

# Hoặc sử dụng npx
npx truffle compile
```

### 3. Sử dụng trong Code

#### Khởi tạo với network cụ thể
```javascript
const blockchainService = require('./services/blockchainService');

// Khởi tạo với network mặc định (từ env)
await blockchainService.initialize();

// Hoặc khởi tạo với network cụ thể
await blockchainService.initialize('polygon_mainnet');
```

#### Chuyển đổi network
```javascript
// Chuyển sang BSC Mainnet
await blockchainService.switchNetwork('bsc_mainnet');

// Chuyển sang Arbitrum One (Layer 2)
await blockchainService.switchNetwork('arbitrum_one');
```

#### Lấy thông tin network hiện tại
```javascript
const networkInfo = blockchainService.getCurrentNetwork();
console.log('Current network:', networkInfo.name);
console.log('Is Layer 2:', networkInfo.isLayer2);
```

#### Lấy danh sách networks được hỗ trợ
```javascript
const networks = blockchainService.getSupportedNetworks();
console.log('Supported networks:', networks);
```

## 💰 SO SÁNH GAS FEES

### Ethereum Mainnet
- **Create Drug Batch**: ~500,000 gas × 30 gwei = ~$15-30
- **Record Distribution**: ~300,000 gas × 30 gwei = ~$9-18

### BSC Mainnet
- **Create Drug Batch**: ~500,000 gas × 5 gwei = ~$1-2
- **Record Distribution**: ~300,000 gas × 5 gwei = ~$0.6-1.2

### Polygon Mainnet
- **Create Drug Batch**: ~500,000 gas × 30 gwei = ~$0.01-0.05
- **Record Distribution**: ~300,000 gas × 30 gwei = ~$0.006-0.03

### Arbitrum One (Layer 2)
- **Create Drug Batch**: ~500,000 gas × 0.1 gwei = ~$0.10-0.50
- **Record Distribution**: ~300,000 gas × 0.1 gwei = ~$0.06-0.30

### Optimism Mainnet (Layer 2)
- **Create Drug Batch**: ~500,000 gas × 0.1 gwei = ~$0.10-0.50
- **Record Distribution**: ~300,000 gas × 0.1 gwei = ~$0.06-0.30

**Lưu ý**: Gas prices thay đổi theo thời gian thực, các giá trị trên chỉ mang tính tham khảo.

## 🔧 TỐI ƯU HÓA SMART CONTRACT

### Các cải tiến đã thực hiện:

1. **Packed Structs**: Giảm storage từ 10+ slots xuống 2 slots cho DrugBatch
2. **Custom Errors**: Thay thế require strings để tiết kiệm ~50% gas cho revert
3. **Batch Operations**: Tạo nhiều lô thuốc trong 1 transaction, tiết kiệm gas
4. **Unchecked Loops**: Tối ưu hóa loops khi đã đảm bảo an toàn
5. **Dynamic Gas Estimation**: Tự động tính toán gas thay vì dùng giá trị cố định

### Ví dụ sử dụng Batch Operations:

```javascript
// Tạo nhiều lô thuốc trong một transaction
const drugIds = ['DRUG_001', 'DRUG_002', 'DRUG_003'];
const names = ['Paracetamol', 'Aspirin', 'Ibuprofen'];
// ... các arrays khác

await contract.methods.createDrugBatchBatch(
  drugIds,
  names,
  activeIngredients,
  manufacturerIds,
  batchNumbers,
  productionDates,
  expiryDates,
  qualityTestResults,
  qrCodeData
).send({
  from: account,
  gas: estimatedGas
});
```

## 📊 MONITORING & ANALYTICS

### Kiểm tra trạng thái kết nối
```javascript
const isConnected = blockchainService.isConnected();
const currentAccount = blockchainService.getCurrentAccount();
const networkInfo = blockchainService.getCurrentNetwork();
```

### Lấy thống kê contract
```javascript
const stats = await blockchainService.getContractStats();
console.log('Total batches:', stats.stats.totalBatches);
console.log('Active batches:', stats.stats.activeBatches);
```

## 🛡️ BẢO MẬT

1. **Private Key**: Không commit private key vào git
2. **Environment Variables**: Sử dụng `.env` và thêm vào `.gitignore`
3. **Network Selection**: Chọn network phù hợp (testnet cho development, mainnet cho production)
4. **Gas Limits**: Sử dụng dynamic gas estimation để tránh gas limit errors

## 🐛 TROUBLESHOOTING

### Lỗi: "Network không được hỗ trợ"
- Kiểm tra tên network trong `BLOCKCHAIN_NETWORK`
- Đảm bảo network có trong danh sách `NETWORKS` trong `blockchainService.js`

### Lỗi: "Contract address chưa được cấu hình"
- Deploy contract lên network đó trước
- Cập nhật `CONTRACT_ADDRESS` hoặc `CONTRACT_ADDRESS_{NETWORK}` trong `.env`

### Lỗi: "Gas estimation failed"
- Kiểm tra account có đủ balance
- Kiểm tra contract address có đúng không
- Kiểm tra network connection

### Lỗi: "Transaction failed"
- Kiểm tra gas limit có đủ không
- Kiểm tra gas price có hợp lý không
- Kiểm tra contract logic có đúng không

## 📚 TÀI LIỆU THAM KHẢO

- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)
- [BSC Documentation](https://docs.binance.org/smart-chain/developer/rpc.html)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Arbitrum Documentation](https://docs.arbitrum.io/)
- [Optimism Documentation](https://docs.optimism.io/)

## 🔄 MIGRATION GUIDE

### Từ version cũ sang version mới:

1. **Cập nhật environment variables**:
   - Thêm `BLOCKCHAIN_NETWORK`
   - Cập nhật contract addresses cho các networks

2. **Recompile contracts**:
   ```bash
   truffle compile
   ```

3. **Redeploy contracts** (nếu cần):
   ```bash
   truffle migrate --network your_network
   ```

4. **Update code**:
   - Không cần thay đổi code hiện tại, chỉ cần cập nhật config

## ✅ CHECKLIST

- [x] Smart Contract optimization
- [x] Gas fee optimization với dynamic estimation
- [x] Multi-chain support (Ethereum, BSC, Polygon)
- [x] Layer 2 solutions (Arbitrum, Optimism)
- [x] Batch operations
- [x] Network switching
- [x] Documentation

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Status**: Production Ready

