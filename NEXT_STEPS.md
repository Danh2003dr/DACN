# ✅ ĐÃ CẬP NHẬT API KEY - CÁC BƯỚC TIẾP THEO

## ✅ Đã hoàn thành

- ✅ API Key đã được cập nhật vào `.env`
- ✅ Network đã được set thành `sepolia`
- ✅ INFURA_PROJECT_ID: `c7b0ee9f14774684a619e43305849f6f`

## 📋 Các bước tiếp theo

### 1️⃣ Lấy Private Key từ MetaMask Wallet

Bạn cần wallet để deploy contract và gửi transactions:

#### Bước 1.1: Cài đặt MetaMask Extension (Nếu chưa có)

1. **Truy cập trang cài đặt MetaMask:**
   - Chrome/Edge: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn
   - Firefox: https://addons.mozilla.org/firefox/addon/ether-metamask
   - Brave: Tự động có sẵn, chỉ cần enable

2. **Cài đặt:**
   - Click "Add to Chrome" (hoặc "Add to Firefox")
   - Click "Add Extension" trong popup xác nhận
   - Chờ extension được cài đặt

3. **Mở MetaMask:**
   - Click icon MetaMask trên thanh toolbar (góc trên bên phải browser)
   - Hoặc click icon puzzle (Extensions) → MetaMask

#### Bước 1.2: Tạo Wallet mới (Nếu chưa có)

1. **Mở MetaMask:**
   - Click icon MetaMask trên browser toolbar

2. **Tạo wallet:**
   - Nếu lần đầu mở, sẽ thấy màn hình "Get Started"
   - Click "Create a new wallet"
   - Hoặc "Import wallet" nếu đã có Secret Recovery Phrase

3. **Lưu Secret Recovery Phrase (QUAN TRỌNG):**
   - MetaMask sẽ hiển thị 12 từ (hoặc 24 từ)
   - **Ghi chép lại 12 từ này vào nơi an toàn** (giấy, password manager)
   - **KHÔNG BAO GIỜ** chia sẻ với ai
   - **KHÔNG** chụp ảnh màn hình và lưu trên cloud
   - Click "Next" sau khi đã ghi chép

4. **Xác nhận Secret Recovery Phrase:**
   - MetaMask sẽ yêu cầu chọn các từ theo thứ tự
   - Chọn đúng thứ tự để xác nhận bạn đã lưu
   - Click "Confirm"

5. **Tạo password:**
   - Nhập password mạnh (ít nhất 8 ký tự)
   - Xác nhận password
   - Click "Create" hoặc "I agree"
   - Đọc và đồng ý với Terms of Service

6. **Hoàn tất:**
   - Wallet đã được tạo thành công
   - Bạn sẽ thấy màn hình chính của MetaMask với địa chỉ wallet (bắt đầu với `0x...`)

#### Bước 1.3: Chuyển sang Sepolia Testnet

**Cách 1: Chọn từ danh sách có sẵn (Nhanh nhất)**

1. **Mở MetaMask:**
   - Click icon MetaMask trên browser toolbar

2. **Click vào network dropdown:**
   - Ở góc trên cùng, bạn sẽ thấy tên network hiện tại (mặc định là "Ethereum Mainnet")
   - Click vào đó để mở dropdown

3. **Chọn Sepolia:**
   - Scroll xuống trong danh sách networks
   - Tìm và click "Sepolia test network"
   - Network sẽ tự động chuyển sang Sepolia

4. **Xác nhận:**
   - Bạn sẽ thấy "Sepolia" ở góc trên
   - Balance sẽ hiển thị "0 ETH" (chưa có ETH)

**Cách 2: Thêm network thủ công (Nếu không thấy Sepolia trong danh sách)**

1. **Mở MetaMask Settings:**
   - Click icon MetaMask
   - Click icon 3 dấu gạch ngang (☰) ở góc trên bên trái
   - Chọn "Settings"

2. **Vào phần Networks:**
   - Trong Settings, click "Networks" ở sidebar bên trái
   - Hoặc scroll xuống tìm "Networks"

3. **Thêm network:**
   - Click "Add a network" hoặc "Add network"
   - Chọn "Add a network manually" (nếu có)

4. **Nhập thông tin Sepolia:**
   - **Network Name:** `Sepolia`
   - **New RPC URL:** `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
   - **Chain ID:** `11155111`
   - **Currency Symbol:** `ETH`
   - **Block Explorer URL (Optional):** `https://sepolia.etherscan.io`

5. **Lưu:**
   - Click "Save" hoặc "Add"
   - MetaMask sẽ tự động chuyển sang Sepolia network

6. **Xác nhận:**
   - Bạn sẽ thấy "Sepolia" ở góc trên
   - Địa chỉ wallet vẫn giữ nguyên (ví dụ: `0x1234...`)

**Cách 3: Sử dụng chainlist.org (Dễ nhất)**

1. **Truy cập:** https://chainlist.org
2. **Kết nối MetaMask:**
   - Click "Connect Wallet"
   - Chọn "MetaMask"
   - Xác nhận trong MetaMask popup

3. **Tìm Sepolia:**
   - Gõ "Sepolia" vào ô tìm kiếm
   - Tìm "Sepolia" trong kết quả

4. **Thêm network:**
   - Click "Add to MetaMask" bên cạnh Sepolia
   - Xác nhận trong MetaMask popup
   - Click "Approve" và "Switch network"

5. **Xác nhận:**
   - MetaMask sẽ tự động chuyển sang Sepolia
   - Bạn sẽ thấy "Sepolia" ở góc trên

#### Bước 1.4: Export Private Key

**⚠️ CẢNH BÁO BẢO MẬT:**
- Private Key cho phép ai đó truy cập hoàn toàn vào wallet của bạn
- Chỉ export khi thực sự cần thiết
- Không chia sẻ với ai
- Không lưu trên cloud hoặc gửi qua email

1. **Mở MetaMask:**
   - Click icon MetaMask trên browser toolbar
   - Đảm bảo đang ở Sepolia network

2. **Vào Account Details:**
   - Ở góc trên bên phải, click icon account (hình tròn với 3 dấu chấm hoặc avatar)
   - Hoặc click vào tên account (ví dụ: "Account 1")
   - Chọn "Account details" từ menu dropdown

3. **Export Private Key:**
   - Trong cửa sổ "Account details", tìm phần "Export Private Key"
   - Click "Show private key" hoặc "Export Private Key"
   - MetaMask sẽ yêu cầu nhập password để xác nhận

4. **Nhập password:**
   - Nhập password của MetaMask
   - Click "Confirm" hoặc "Unlock"

5. **Copy Private Key:**
   - MetaMask sẽ hiển thị private key (bắt đầu với `0x...`)
   - Click icon copy (📋) để copy
   - Hoặc chọn toàn bộ và copy (Ctrl+C / Cmd+C)
   - **Lưu private key này vào nơi an toàn**

6. **Đóng cửa sổ:**
   - Click "Done" hoặc đóng cửa sổ
   - **KHÔNG** chụp ảnh màn hình chứa private key

#### Bước 1.5: Cập nhật Private Key vào .env

1. **Mở file .env:**
   - Mở file `.env` trong project (D:\DACN\.env)
   - Tìm dòng `PRIVATE_KEY=`

2. **Cập nhật:**
   - Paste private key vào sau dấu `=`
   - **Bỏ prefix `0x`** nếu có (hoặc giữ nguyên, code sẽ tự xử lý)
   
   **Ví dụ:**
   ```env
   PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```
   
   Hoặc (có `0x`):
   ```env
   PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

3. **Lưu file:**
   - Save file `.env`
   - **Đảm bảo file `.env` đã được gitignore** (không commit lên Git)

4. **Kiểm tra format:**
   - Private key phải là 64 hex characters (32 bytes)
   - Nếu có `0x`, thì tổng cộng 66 characters
   - Chỉ chứa: `0-9`, `a-f`, `A-F`

#### Bước 1.6: Kiểm tra Wallet Address

1. **Xem địa chỉ wallet:**
   - Mở MetaMask
   - Ở góc trên, bạn sẽ thấy địa chỉ wallet (ví dụ: `0x1234...5678`)
   - Click vào để copy địa chỉ đầy đủ

2. **Lưu lại địa chỉ:**
   - Địa chỉ này dùng để nhận Sepolia ETH từ faucet
   - Format: `0x` + 40 hex characters (ví dụ: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)

3. **Kiểm tra trên Etherscan:**
   - Mở: https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS
   - Thay `YOUR_WALLET_ADDRESS` bằng địa chỉ wallet của bạn
   - Bạn sẽ thấy balance và transaction history (hiện tại sẽ là 0)

### 2️⃣ Lấy Sepolia ETH (Testnet Faucet)

Bạn cần Sepolia ETH để trả phí gas:

**💰 LƯU Ý QUAN TRỌNG:**
- ✅ **HOÀN TOÀN MIỄN PHÍ** - Test ETH không có giá trị thực
- ✅ Lấy bao nhiêu cũng được, không tốn tiền
- ✅ Chỉ dùng cho testnet, không thể đổi thành tiền thật

**Các faucet (Tất cả đều MIỄN PHÍ):**
- MetaMask Developer: Click "Vòi nước" (Faucet) ở sidebar
- Alchemy: https://sepoliafaucet.com
- Infura: https://www.infura.io/faucet/sepolia
- QuickNode: https://faucet.quicknode.com/ethereum/sepolia

**Cách lấy:**
1. Copy wallet address từ MetaMask
2. Paste vào faucet
3. Hoàn thành captcha/đăng nhập
4. Chờ vài phút để nhận ETH

**Cần ít nhất:** 0.01 ETH để deploy và test

**📚 Xem thêm về phí:** [BLOCKCHAIN_FEES_EXPLAINED.md](./BLOCKCHAIN_FEES_EXPLAINED.md)

### 3️⃣ Test kết nối Blockchain

Sau khi có Private Key và ETH:

```bash
npm run test:blockchain
```

**Kết quả mong đợi:**
```
✅ Kết nối thành công!
📊 Block number hiện tại: 12345678
✅ Wallet hợp lệ!
💰 Balance: 0.5 ETH
```

### 4️⃣ Compile Smart Contract

```bash
npm run compile
```

Kiểm tra file build:
```
build/contracts/DrugTraceability.json
```

### 5️⃣ Deploy Smart Contract lên Sepolia

```bash
npm run migrate:sepolia
```

**Kết quả:**
```
✅ Contract deployed!
📍 Contract Address: 0xDEF456...
🔗 TX Hash: 0xabc123...
```

### 6️⃣ Cập nhật Contract Address

Copy contract address từ output và thêm vào `.env`:

```env
CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress
```

### 7️⃣ Khởi động server và test

```bash
npm start
```

**Kiểm tra logs:**
- Phải thấy: `Blockchain connection status: Sepolia Testnet`
- Phải thấy: `Contract initialized at address: 0x...`

### 8️⃣ Test tạo transaction

Tạo drug mới qua API hoặc frontend, kiểm tra:
- Response có `blockchain.transactionHash` thực
- Xem trên Etherscan: https://sepolia.etherscan.io/tx/0xYourTransactionHash

## 🔐 Lưu ý bảo mật

- ⚠️ **API Key Secret** (`ufwG/qRbIJqbyfZRUlvfyeI2nJLj2VHBP45d5Idx6mWmJ8SrTL1tzw`) - Lưu an toàn, có thể cần cho một số tính năng nâng cao
- ⚠️ **Private Key** - Không bao giờ commit lên Git
- ⚠️ **File .env** - Đã được gitignore, nhưng vẫn cẩn thận

## 🎯 Checklist

- [ ] Đã có Private Key từ MetaMask
- [ ] Đã cập nhật PRIVATE_KEY vào .env
- [ ] Đã lấy Sepolia ETH (ít nhất 0.01 ETH)
- [ ] Test kết nối thành công (`npm run test:blockchain`)
- [ ] Đã compile contract (`npm run compile`)
- [ ] Đã deploy contract (`npm run migrate:sepolia`)
- [ ] Đã cập nhật CONTRACT_ADDRESS_SEPOLIA vào .env
- [ ] Server khởi động và kết nối blockchain thành công
- [ ] Test tạo transaction và xem trên Etherscan

## 📚 Tài liệu tham khảo

- **Hướng dẫn chi tiết:** [BLOCKCHAIN_REAL_SETUP.md](./BLOCKCHAIN_REAL_SETUP.md)
- **MetaMask Developer:** [METAMASK_DEVELOPER_SETUP.md](./METAMASK_DEVELOPER_SETUP.md)
- **Quick Start:** [BLOCKCHAIN_QUICK_START.md](./BLOCKCHAIN_QUICK_START.md)

## 🆘 Troubleshooting

### Lỗi: "Insufficient funds"
→ Lấy thêm Sepolia ETH từ faucet

### Lỗi: "Network connection failed"
→ Kiểm tra API key đúng chưa, thử test lại: `npm run test:blockchain`

### Lỗi: "Invalid private key"
→ Private key phải 64 hex characters (bỏ `0x` nếu có)

---

**Bắt đầu từ bước 1: Lấy Private Key từ MetaMask!** 🚀

