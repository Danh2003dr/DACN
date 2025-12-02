# Hướng dẫn Deploy lại Smart Contract với Digital Signature

## ✅ Đã hoàn thành

Smart contract đã được cập nhật với các tính năng mới cho Digital Signature:

### 1. Struct mới
- `DigitalSignature` - Lưu trữ thông tin chữ ký số:
  - `signatureId` - ID duy nhất của chữ ký
  - `targetType` - Loại đối tượng được ký (drug, supplyChain, etc.)
  - `targetId` - ID của đối tượng được ký
  - `dataHash` - Hash của dữ liệu (SHA-256)
  - `signature` - Chữ ký số
  - `certificateSerialNumber` - Số seri chứng chỉ số
  - `signedBy` - Địa chỉ người ký
  - `timestamp` - Thời gian ký

### 2. Mappings mới
- `digitalSignatures` - Mapping lưu trữ chữ ký số theo signatureId
- `targetSignatures` - Mapping lưu danh sách signature IDs theo targetId

### 3. Methods mới
- `recordDigitalSignature()` - Ghi chữ ký số lên blockchain
- `getDigitalSignature()` - Lấy thông tin chữ ký số
- `getTargetSignatures()` - Lấy danh sách chữ ký của một target
- `digitalSignatureExists()` - Kiểm tra chữ ký có tồn tại không

### 4. Event mới
- `DigitalSignatureRecorded` - Event khi chữ ký số được ghi lên blockchain

## 🚀 Cách Deploy lại Contract

### Bước 1: Compile Contract

Contract đã được compile thành công:
```bash
npx truffle compile
```

### Bước 2: Deploy lên Sepolia

**Quan trọng:** Contract đã được deploy trước đó. Bạn có 2 lựa chọn:

#### Option A: Deploy Contract mới (Khuyến nghị nếu chưa có dữ liệu quan trọng)

```bash
# Deploy contract mới
npm run deploy:sepolia

# Hoặc
npx truffle migrate --network sepolia
```

**Lưu ý:** Nếu deploy contract mới:
- Sẽ tạo contract address mới
- Cần cập nhật `CONTRACT_ADDRESS_SEPOLIA` trong `.env`
- Dữ liệu cũ sẽ không có trong contract mới

#### Option B: Upgrade Contract (Nếu cần giữ dữ liệu cũ)

Nếu contract đã có dữ liệu quan trọng, bạn cần:
1. Implement proxy pattern (OpenZeppelin Upgrades)
2. Hoặc tạo contract mới và migrate dữ liệu

### Bước 3: Cập nhật Contract Address

Sau khi deploy, cập nhật `.env`:
```env
CONTRACT_ADDRESS_SEPOLIA=0x... # Địa chỉ contract mới
```

### Bước 4: Kiểm tra

Sau khi deploy, kiểm tra contract hoạt động:
```bash
node scripts/test-blockchain-connection.js
```

## 📝 Backend đã được cập nhật

Backend đã được cập nhật để:
- ✅ Gọi method `recordDigitalSignature()` thật từ smart contract
- ✅ Xử lý BigInt trong transaction results
- ✅ Lưu thông tin blockchain vào DigitalSignature model
- ✅ Tự động ghi chữ ký số lên blockchain khi ký số

## ⚠️ Lưu ý

1. **Gas fees:** Mỗi lần ghi chữ ký số sẽ tốn gas fee
2. **Contract address:** Sau khi deploy, nhớ cập nhật address trong `.env`
3. **Data migration:** Nếu deploy contract mới, cần sync lại dữ liệu:
   ```bash
   npm run sync:blockchain:resync
   ```

## 🔍 Kiểm tra sau khi deploy

1. **Test ghi chữ ký số:**
   - Ký số một lô thuốc qua giao diện
   - Kiểm tra transaction trên Sepolia Explorer
   - Verify thông tin trong DigitalSignature model

2. **Verify trên blockchain:**
   - Gọi `getDigitalSignature(signatureId)` để lấy thông tin
   - Gọi `digitalSignatureExists(signatureId)` để kiểm tra

## 📚 Code đã được cập nhật

- ✅ `contracts/DrugTraceability.sol` - Thêm struct, mapping, methods, events
- ✅ `services/blockchainService.js` - Cập nhật `recordDigitalSignatureOnBlockchain()` để gọi contract thật
- ✅ `controllers/digitalSignatureController.js` - Tự động ghi lên blockchain khi ký số

Sau khi deploy contract mới, chữ ký số sẽ được lưu thực sự lên blockchain Sepolia! 🎉

