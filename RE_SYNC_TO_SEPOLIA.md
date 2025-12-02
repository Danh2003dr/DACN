# Hướng dẫn Sync lại dữ liệu thuốc lên Sepolia Testnet

## ❓ Vấn đề

Nếu bạn thấy các lô thuốc hiển thị **"Không tồn tại"** trên Blockchain Dashboard, điều này có nghĩa là:

- Các drugs có `blockchainId` trong MongoDB database
- Nhưng khi verify trên smart contract Sepolia, contract trả về **"Not Found"**
- **Nguyên nhân**: Các drugs chưa thực sự được ghi lên smart contract Sepolia (có thể là mock data hoặc sync chưa thành công trước đó)

## 🔧 Giải pháp

Script `scripts/re-sync-drugs-to-blockchain.js` sẽ:

1. ✅ Tìm tất cả drugs có blockchain ID trong database
2. ✅ Kiểm tra từng drug xem có tồn tại trên smart contract Sepolia không
3. ✅ Nếu drug **không tồn tại**, script sẽ tự động sync lại lên blockchain
4. ✅ Cập nhật lại thông tin blockchain trong database

## ⚠️ Yêu cầu trước khi chạy

1. **Cấu hình `.env`**: Đảm bảo bạn đã cấu hình các biến môi trường sau:
   - `BLOCKCHAIN_NETWORK=sepolia`
   - `INFURA_PROJECT_ID=your_infura_project_id` (hoặc Alchemy, QuickNode ID)
   - `PRIVATE_KEY=your_ethereum_private_key` (private key của tài khoản có ETH trên Sepolia để trả phí gas)
   - `CONTRACT_ADDRESS_SEPOLIA=your_deployed_sepolia_contract_address` (địa chỉ smart contract đã deploy trên Sepolia)

2. **ETH trên Sepolia**: Đảm bảo tài khoản Ethereum của bạn (liên kết với `PRIVATE_KEY`) có đủ ETH trên Sepolia Testnet để trả phí gas cho các giao dịch.

3. **MongoDB đang chạy**: Đảm bảo MongoDB server của bạn đang chạy và có dữ liệu thuốc.

## 🚀 Cách chạy Script

Bạn có thể chạy script này thông qua lệnh `npm` đã được định nghĩa trong `package.json`:

```bash
npm run sync:blockchain:resync
```

Hoặc chạy trực tiếp bằng Node.js:

```bash
node scripts/re-sync-drugs-to-blockchain.js
```

## 📋 Quá trình chạy

Script sẽ thực hiện các bước sau:

1. ✅ Kết nối đến MongoDB
2. ✅ Khởi tạo `blockchainService` với network Sepolia
3. ✅ Kiểm tra và hiển thị `CONTRACT_ADDRESS_SEPOLIA`
4. ✅ Tìm tất cả các lô thuốc có blockchain ID trong database
5. ✅ **Kiểm tra từng lô thuốc**:
   - Gọi `drugBatchExists()` để kiểm tra xem drug có tồn tại trên smart contract không
   - Nếu không tồn tại, thêm vào danh sách cần sync lại
   - Nếu tồn tại, hiển thị status hiện tại
6. ✅ **Sync lại các drugs không tồn tại**:
   - Chuẩn bị dữ liệu thuốc
   - Gọi `blockchainService.recordDrugBatchOnBlockchain()` để ghi dữ liệu lên Sepolia
   - Cập nhật trạng thái blockchain của lô thuốc trong MongoDB
   - Log kết quả (thành công/thất bại)
   - **Chờ 2 giây** giữa mỗi giao dịch để tránh bị rate limit trên Sepolia Testnet
7. ✅ Tổng kết số lượng lô thuốc đã sync thành công và thất bại
8. ✅ Ngắt kết nối MongoDB

## 💡 Ghi chú

- Nếu có lỗi xảy ra trong quá trình ghi lên blockchain, script sẽ log lỗi và tiếp tục với lô thuốc tiếp theo. Thông tin lỗi sẽ được lưu vào trường `blockchain.syncError` của lô thuốc trong MongoDB.
- Script sẽ tự động tiếp tục sau 3 giây (bạn có thể nhấn `Ctrl+C` để hủy nếu không muốn sync).
- Mỗi transaction sẽ tốn gas fee trên Sepolia Testnet.

## 🔍 Sau khi chạy

Sau khi chạy script thành công:

1. ✅ Các drugs sẽ có thông tin blockchain được cập nhật đúng
2. ✅ Khi verify trên smart contract, sẽ trả về status đúng (không còn "Không tồn tại")
3. ✅ Blockchain Dashboard sẽ hiển thị trạng thái đúng cho các drugs

Bạn có thể kiểm tra lại trên Blockchain Dashboard để xem các drugs đã hiển thị trạng thái đúng chưa.

## 🔄 So sánh với script sync thông thường

| Tính năng | `sync:blockchain` | `sync:blockchain:resync` |
|-----------|-------------------|--------------------------|
| **Mục đích** | Sync các drugs chưa có blockchain data | Sync lại các drugs có blockchain ID nhưng không tồn tại trên smart contract |
| **Điều kiện** | `isOnBlockchain: false` hoặc không có blockchain data | Có blockchain ID nhưng không tồn tại trên smart contract |
| **Kiểm tra trước** | Không | Có - verify từng drug trên smart contract |
| **Sử dụng khi** | Lần đầu sync drugs lên blockchain | Các drugs đã có blockchain ID nhưng hiển thị "Không tồn tại" |
