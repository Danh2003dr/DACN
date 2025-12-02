# Hướng dẫn Sync dữ liệu lên Sepolia Blockchain

## Tổng quan

Script này sẽ lưu tất cả các lô thuốc chưa có trên blockchain lên Sepolia Testnet.

## Yêu cầu

1. ✅ Smart contract đã được deploy lên Sepolia
2. ✅ Contract address đã được cấu hình trong `.env`:
   ```
   CONTRACT_ADDRESS_SEPOLIA=0x719E68df6082160416206416F6842915C65aFBa3
   BLOCKCHAIN_NETWORK=sepolia
   ```
3. ✅ Wallet có đủ ETH trên Sepolia để trả gas fee
4. ✅ Private key đã được cấu hình trong `.env`

## Các bước thực hiện

### 1. Kiểm tra trạng thái blockchain hiện tại

Chạy lệnh để xem có bao nhiêu lô thuốc chưa được sync:

```bash
npm run check:blockchain
```

Hoặc:

```bash
node scripts/check-drugs-blockchain-status.js
```

### 2. Kiểm tra kết nối blockchain

Đảm bảo kết nối đến Sepolia hoạt động:

```bash
npm run test:blockchain
```

### 3. Sync tất cả drugs lên Sepolia

Chạy script sync:

```bash
npm run sync:blockchain
```

Hoặc:

```bash
node scripts/sync-drugs-to-blockchain.js
```

## Cách script hoạt động

1. **Kết nối MongoDB** - Lấy tất cả drugs từ database
2. **Khởi tạo blockchain service** - Kết nối đến Sepolia network
3. **Lọc drugs chưa sync** - Tìm các drugs có `isOnBlockchain: false` hoặc chưa có blockchain data
4. **Ghi từng drug lên blockchain**:
   - Gọi `blockchainService.recordDrugBatchOnBlockchain()`
   - Xử lý BigInt tự động
   - Lưu transaction hash, block number vào database
5. **Cập nhật database** - Đánh dấu `isOnBlockchain: true`

## Lưu ý quan trọng

⚠️ **Gas Fee**: Mỗi transaction tốn gas fee trên Sepolia. Đảm bảo wallet có đủ ETH.

⏱️ **Thời gian**: Script sẽ delay 2 giây giữa mỗi transaction để tránh rate limiting.

📊 **Logging**: Script sẽ hiển thị:
- Số lượng drugs cần sync
- Tiến độ từng drug
- Transaction hash và block number
- Tổng kết thành công/thất bại

## Xử lý lỗi

Nếu có lỗi:
1. Kiểm tra contract address trong `.env`
2. Kiểm tra wallet có đủ ETH
3. Kiểm tra kết nối đến Sepolia RPC
4. Xem log chi tiết trong console

## Ví dụ output

```
🚀 Bắt đầu sync dữ liệu thuốc lên blockchain Sepolia...

✅ Đã kết nối MongoDB

🔗 Đang khởi tạo blockchain service với network: sepolia...
✅ Blockchain service đã được khởi tạo
📍 Network: sepolia
📝 Contract Address: 0x719E68df6082160416206416F6842915C65aFBa3

📦 Tìm thấy 9 lô thuốc cần sync lên blockchain

[1/9] Đang sync: Lisinopril 10mg (BATCH010)
  📤 Đang ghi lên blockchain Sepolia...
  ✅ Đã sync thành công!
     Blockchain ID: BC_1764693647527_DRUG_B4A
     Transaction: 0x9ba33e6f9e84f42d656...
     Block: #9747613
  ⏳ Chờ 2 giây trước khi tiếp tục...

===========================================
📊 TỔNG KẾT:
  ✅ Thành công: 9
  ❌ Thất bại: 0
  📦 Tổng cộng: 9
===========================================

✅ Đã sync thành công một số dữ liệu lên blockchain!
```

## Sau khi sync

Sau khi sync xong, bạn có thể:
1. Kiểm tra trên Etherscan: https://sepolia.etherscan.io
2. Verify QR code tại: `localhost:3000/verify/DRUG_XXXXX`
3. Xem thông tin blockchain trong modal khi click vào "Blockchain" button

## Troubleshooting

### Lỗi: Contract address chưa được cấu hình
- Kiểm tra `CONTRACT_ADDRESS_SEPOLIA` trong `.env`
- Đảm bảo address đúng format: `0x...`

### Lỗi: Insufficient funds
- Kiểm tra balance wallet trên Sepolia
- Nạp thêm ETH từ Sepolia faucet

### Lỗi: Connection timeout
- Kiểm tra `INFURA_PROJECT_ID` hoặc RPC URL
- Kiểm tra internet connection

