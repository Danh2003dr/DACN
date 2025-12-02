# 🚀 HƯỚNG DẪN GHI TRANSACTIONS LÊN BLOCKCHAIN THỰC

Hướng dẫn này sẽ giúp bạn setup để ghi transactions lên blockchain thực (Sepolia Testnet) thay vì chỉ lưu mock data trong database.

## 📋 Mục lục
1. [Chuẩn bị](#chuẩn-bị)
2. [Bước 1: Tạo Infura Account](#bước-1-tạo-infura-account)
3. [Bước 2: Tạo Wallet và lấy Private Key](#bước-2-tạo-wallet-và-lấy-private-key)
4. [Bước 3: Lấy Sepolia ETH (Testnet Faucet)](#bước-3-lấy-sepolia-eth-testnet-faucet)
5. [Bước 4: Compile Smart Contract](#bước-4-compile-smart-contract)
6. [Bước 5: Deploy Smart Contract lên Sepolia](#bước-5-deploy-smart-contract-lên-sepolia)
7. [Bước 6: Cấu hình .env](#bước-6-cấu-hình-env)
8. [Bước 7: Test ghi transaction](#bước-7-test-ghi-transaction)
9. [Bước 8: Sync dữ liệu hiện có lên blockchain](#bước-8-sync-dữ-liệu-hiện-có-lên-blockchain)

---

## 🎯 Chuẩn bị

### Yêu cầu:
- ✅ Node.js đã cài đặt
- ✅ Truffle đã cài đặt: `npm install -g truffle`
- ✅ MetaMask extension (hoặc wallet khác)
- ✅ Tài khoản Infura (miễn phí)

### Packages cần thiết:
```bash
npm install @truffle/hdwallet-provider web3
```

---

## 📝 Bước 1: Tạo Infura Account

Infura cung cấp RPC endpoint để kết nối với blockchain networks.

1. **Truy cập:** https://infura.io
2. **Đăng ký tài khoản** (miễn phí)
3. **Tạo project mới:**
   - Vào Dashboard → Create New Key
   - Chọn "Web3 API"
   - Đặt tên project: `Drug Traceability`
   - Chọn network: **Sepolia**
4. **Copy Project ID:**
   - Vào Project Settings
   - Copy **Project ID** (ví dụ: `abc123def456...`)
   - Lưu lại để dùng ở bước 6

---

## 🔐 Bước 2: Tạo Wallet và lấy Private Key

### Option A: Sử dụng MetaMask (Khuyên dùng)

1. **Cài MetaMask extension:**
   - Chrome: https://chrome.google.com/webstore/detail/metamask
   - Firefox: https://addons.mozilla.org/firefox/addon/ether-metamask

2. **Tạo wallet mới:**
   - Mở MetaMask
   - Click "Create a new wallet"
   - Lưu **Secret Recovery Phrase** (12 hoặc 24 từ) - **QUAN TRỌNG: Lưu an toàn!**
   - Đặt password

3. **Chuyển sang Sepolia Testnet:**
   - Click network dropdown (mặc định là "Ethereum Mainnet")
   - Chọn "Sepolia test network"
   - Nếu không thấy, vào Settings → Networks → Add network:
     - Network Name: `Sepolia`
     - RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
     - Chain ID: `11155111`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://sepolia.etherscan.io`

4. **Lấy Private Key:**
   - Click icon account (góc trên bên phải)
   - Chọn "Account details"
   - Click "Export Private Key"
   - Nhập password
   - Copy **Private Key** (bắt đầu với `0x...`)
   - **LƯU Ý:** Không chia sẻ private key này với ai!

### Option B: Tạo wallet bằng code (Chỉ dùng cho testnet)

```javascript
// Tạo file: scripts/create-wallet.js
const { Web3 } = require('web3');
const web3 = new Web3();

const account = web3.eth.accounts.create();
console.log('Address:', account.address);
console.log('Private Key:', account.privateKey);
console.log('\n⚠️ LƯU Ý: Lưu private key này an toàn!');
```

Chạy: `node scripts/create-wallet.js`

---

## 💧 Bước 3: Lấy Sepolia ETH (Testnet Faucet)

Bạn cần Sepolia ETH để trả phí gas khi deploy và ghi transactions.

### Các faucet Sepolia:

1. **Alchemy Sepolia Faucet** (Khuyên dùng):
   - URL: https://sepoliafaucet.com
   - Yêu cầu: Đăng nhập với Alchemy account (miễn phí)
   - Số lượng: 0.5 ETH/ngày

2. **Infura Sepolia Faucet:**
   - URL: https://www.infura.io/faucet/sepolia
   - Yêu cầu: Infura account
   - Số lượng: 0.5 ETH/ngày

3. **PoW Faucet:**
   - URL: https://sepolia-faucet.pk910.de
   - Yêu cầu: Mining (Proof of Work)
   - Số lượng: Không giới hạn

4. **QuickNode Faucet:**
   - URL: https://faucet.quicknode.com/ethereum/sepolia
   - Yêu cầu: QuickNode account (miễn phí)
   - Số lượng: 0.1 ETH/ngày

### Cách lấy:

1. Mở một trong các faucet trên
2. Paste **wallet address** của bạn (từ MetaMask)
3. Hoàn thành captcha/đăng nhập
4. Chờ vài phút để nhận ETH
5. Kiểm tra balance trên MetaMask hoặc https://sepolia.etherscan.io

**Lưu ý:** Bạn cần ít nhất **0.01 ETH** để deploy contract và test transactions.

---

## 🔨 Bước 4: Compile Smart Contract

Trước khi deploy, cần compile smart contract:

```bash
# Compile contract
npx truffle compile

# Kiểm tra file build
ls build/contracts/DrugTraceability.json
```

Nếu thành công, bạn sẽ thấy file `build/contracts/DrugTraceability.json` chứa ABI và bytecode.

---

## 🚀 Bước 5: Deploy Smart Contract lên Sepolia

### Cách 1: Sử dụng Truffle (Khuyên dùng)

1. **Kiểm tra `truffle-config.js` đã có cấu hình Sepolia:**
   ```javascript
   sepolia: {
     provider: () => createProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
     network_id: 11155111,
     gas: 5500000,
     gasPrice: 20000000000,
     confirmations: 2,
     timeoutBlocks: 200,
     skipDryRun: true
   }
   ```

2. **Deploy:**
   ```bash
   # Đảm bảo .env có INFURA_PROJECT_ID và PRIVATE_KEY
   npx truffle migrate --network sepolia
   ```

3. **Kết quả:**
   ```
   Deploying 'DrugTraceability'
   ----------------------------
   > transaction hash:    0xabc123...
   > Blocks: 2            Seconds: 15
   > contract address:    0xDEF456...
   > block number:        12345678
   > block timestamp:     1234567890
   > account:             0xYourAddress...
   > balance:             0.5 ETH
   > gas used:            2345678
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.04691356 ETH
   ```

4. **Lưu Contract Address:**
   - Copy **contract address** (ví dụ: `0xDEF456...`)
   - Lưu lại để dùng ở bước 6

### Cách 2: Sử dụng script deploy (Nếu Truffle không hoạt động)

Tạo file `scripts/deploy-sepolia.js`:

```javascript
const { Web3 } = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
  // Đọc contract
  const contractPath = path.join(__dirname, '../build/contracts/DrugTraceability.json');
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

  // Tạo provider
  const privateKey = process.env.PRIVATE_KEY.replace('0x', '');
  const provider = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  });

  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];

  console.log('Deploying from:', deployer);
  console.log('Balance:', web3.utils.fromWei(await web3.eth.getBalance(deployer), 'ether'), 'ETH');

  // Deploy
  const contract = new web3.eth.Contract(contractData.abi);
  const deployTx = contract.deploy({ data: contractData.bytecode });
  
  const gasEstimate = await deployTx.estimateGas();
  console.log('Gas estimate:', gasEstimate);

  const deployed = await deployTx.send({
    from: deployer,
    gas: gasEstimate,
    gasPrice: '20000000000' // 20 gwei
  });

  console.log('✅ Contract deployed!');
  console.log('Address:', deployed.options.address);
  console.log('TX Hash:', deployed.transactionHash);

  // Lưu vào .env
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('CONTRACT_ADDRESS_SEPOLIA=')) {
    envContent = envContent.replace(/CONTRACT_ADDRESS_SEPOLIA=.*/, `CONTRACT_ADDRESS_SEPOLIA=${deployed.options.address}`);
  } else {
    envContent += `\nCONTRACT_ADDRESS_SEPOLIA=${deployed.options.address}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file');

  provider.engine.stop();
}

deploy().catch(console.error);
```

Chạy: `node scripts/deploy-sepolia.js`

---

## ⚙️ Bước 6: Cấu hình .env

Mở file `.env` và cập nhật các giá trị sau:

```env
# Blockchain Configuration
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id_here
PRIVATE_KEY=your_private_key_without_0x_prefix

# Smart Contract Address (sau khi deploy)
CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress

# Hoặc dùng CONTRACT_ADDRESS chung (nếu chỉ dùng 1 network)
# CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### Ví dụ:

```env
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
CONTRACT_ADDRESS_SEPOLIA=0xDEF4567890123456789012345678901234567890
```

**LƯU Ý:**
- `PRIVATE_KEY`: Bỏ prefix `0x` nếu có (hoặc giữ nguyên, code sẽ tự xử lý)
- Không commit file `.env` lên Git!
- Lưu private key an toàn!

---

## 🧪 Bước 7: Test ghi transaction

### 7.1. Khởi động server

```bash
npm start
```

### 7.2. Kiểm tra blockchain service đã kết nối

Xem logs trong terminal:

```
Blockchain connection status: Sepolia Testnet
Current block: 12345678
Using account: 0xYourAddress...
Contract initialized at address: 0xDEF456... on Sepolia Testnet
Blockchain service initialized successfully
```

Nếu thấy "Falling back to mock mode...", kiểm tra lại:
- `INFURA_PROJECT_ID` đúng chưa
- `PRIVATE_KEY` đúng chưa
- `CONTRACT_ADDRESS_SEPOLIA` đúng chưa
- Wallet có đủ ETH chưa

### 7.3. Test qua API

Tạo một drug mới và ghi lên blockchain:

```bash
# Tạo drug mới (cần đăng nhập trước để lấy token)
curl -X POST http://localhost:5000/api/drugs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Drug Real Blockchain",
    "drugId": "TEST_REAL_001",
    "batchNumber": "BATCH_REAL_001",
    "productionDate": "2024-01-01",
    "expiryDate": "2025-01-01",
    "activeIngredient": "Test Ingredient",
    "dosage": "500mg",
    "form": "Tablet"
  }'
```

Kiểm tra response có `blockchain.transactionHash` thực:

```json
{
  "blockchain": {
    "transactionHash": "0xabc123...",
    "blockNumber": 12345678,
    "isOnBlockchain": true,
    "blockchainStatus": "confirmed"
  }
}
```

### 7.4. Xem transaction trên Etherscan

1. Copy `transactionHash` từ response
2. Mở: https://sepolia.etherscan.io/tx/0xYourTransactionHash
3. Bạn sẽ thấy transaction thực trên blockchain!

---

## 📦 Bước 8: Sync dữ liệu hiện có lên blockchain

Nếu bạn đã có dữ liệu drugs trong database nhưng chưa ghi lên blockchain:

```bash
# Sync tất cả drugs chưa có blockchain data
node scripts/sync-drugs-to-blockchain.js
```

Script này sẽ:
- Tìm tất cả drugs có `isOnBlockchain: false` hoặc chưa có blockchain data
- Ghi từng drug lên blockchain
- Cập nhật `blockchain` field trong database
- Hiển thị progress và kết quả

**Lưu ý:**
- Mỗi transaction tốn gas (khoảng 0.0001 - 0.001 ETH)
- Nếu có nhiều drugs, cần đủ ETH
- Có thể mất vài phút đến vài giờ tùy số lượng

---

## ✅ Kiểm tra kết quả

### 1. Kiểm tra trên Blockchain Explorer

- **Sepolia Etherscan:** https://sepolia.etherscan.io
- Tìm theo:
  - Contract address: `0xYourContractAddress`
  - Transaction hash: `0xYourTransactionHash`
  - Wallet address: `0xYourWalletAddress`

### 2. Kiểm tra trong Database

```javascript
// MongoDB query
db.drugs.find({ "blockchain.isOnBlockchain": true })
```

### 3. Kiểm tra trong Frontend

- Vào trang **Blockchain Explorer**
- Transactions sẽ hiển thị với:
  - ✅ Transaction hash thực (click được)
  - ✅ Link đến Etherscan
  - ✅ Block number thực
  - ✅ Network: `sepolia`

---

## 🔧 Troubleshooting

### Lỗi: "Insufficient funds"

**Nguyên nhân:** Không đủ ETH để trả gas

**Giải pháp:**
- Lấy thêm Sepolia ETH từ faucet
- Kiểm tra balance: https://sepolia.etherscan.io/address/0xYourAddress

### Lỗi: "Contract address chưa được cấu hình"

**Nguyên nhân:** `CONTRACT_ADDRESS_SEPOLIA` chưa được set trong `.env`

**Giải pháp:**
- Kiểm tra `.env` có `CONTRACT_ADDRESS_SEPOLIA=0x...`
- Restart server sau khi cập nhật `.env`

### Lỗi: "Network connection failed"

**Nguyên nhân:** Infura RPC endpoint không kết nối được

**Giải pháp:**
- Kiểm tra `INFURA_PROJECT_ID` đúng chưa
- Kiểm tra internet connection
- Thử dùng RPC endpoint khác (Alchemy, QuickNode)

### Lỗi: "Invalid private key"

**Nguyên nhân:** Private key format sai

**Giải pháp:**
- Private key phải là 64 hex characters (32 bytes)
- Có thể có hoặc không có prefix `0x`
- Không có spaces hoặc newlines

### Lỗi: "Gas estimation failed"

**Nguyên nhân:** Contract function call sai hoặc contract chưa deploy

**Giải pháp:**
- Kiểm tra contract đã deploy chưa
- Kiểm tra contract address đúng chưa
- Kiểm tra function parameters đúng chưa

---

## 📚 Tài liệu tham khảo

- **Sepolia Testnet:** https://sepolia.dev
- **Etherscan Sepolia:** https://sepolia.etherscan.io
- **Infura Docs:** https://docs.infura.io
- **Web3.js Docs:** https://web3js.readthedocs.io
- **Truffle Docs:** https://trufflesuite.com/docs

---

## 🎉 Hoàn thành!

Bây giờ bạn đã có thể:
- ✅ Ghi transactions lên blockchain thực (Sepolia)
- ✅ Xem transactions trên Etherscan
- ✅ Verify tính minh bạch và không thể thay đổi của dữ liệu
- ✅ Sử dụng link "Mở trên Explorer" để xem transaction thực

**Next steps:**
- Deploy lên Mainnet (cần ETH thật, tốn phí)
- Tích hợp với các networks khác (Polygon, BSC, Arbitrum)
- Tối ưu gas costs
- Implement batch transactions để tiết kiệm gas

---

**Lưu ý bảo mật:**
- ⚠️ **KHÔNG BAO GIỜ** commit private key lên Git
- ⚠️ **KHÔNG BAO GIỜ** chia sẻ private key với ai
- ⚠️ Chỉ dùng testnet private key cho testnet
- ⚠️ Tạo wallet riêng cho mainnet và bảo vệ cẩn thận

