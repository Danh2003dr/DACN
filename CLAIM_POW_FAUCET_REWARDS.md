# 🎉 HƯỚNG DẪN CLAIM REWARDS TỪ POW FAUCET

Bạn đã đạt đủ reward để claim! Đây là cách claim ETH.

## ✅ TÌNH TRẠNG HIỆN TẠI

- ✅ **Your Mining Reward:** `0.07 SepETH` (Đã vượt minimum!)
- ✅ **Minimum Claim Reward:** `0.05 SepETH` (Đã đạt!)
- ✅ **Nút "Stop Mining & Claim Rewards"** đã xuất hiện (màu đỏ)
- ✅ **Target Address:** `0x9b690c02f3841605d6afd44b3f81128aeb618f6f` (Đúng!)

## 🎯 CÁCH CLAIM REWARDS

### Bước 1: Click nút "Stop Mining & Claim Rewards"

1. **Tìm nút màu đỏ** ở dưới cùng của card trắng
2. **Text:** "Stop Mining & Claim Rewards"
3. **Click vào nút này**

**Lưu ý:**
- Click nút này sẽ:
  - Dừng mining
  - Claim tất cả reward hiện tại (`0.07 SepETH`)
  - Gửi ETH vào wallet của bạn

### Bước 2: Xác nhận (Nếu có popup)

1. **Nếu có popup xác nhận:**
   - Đọc thông báo
   - Click "Confirm" hoặc "Xác nhận"
   - Hoặc "Yes" nếu được hỏi

2. **Nếu không có popup:**
   - Faucet sẽ tự động xử lý
   - Chuyển sang Bước 3

### Bước 3: Chờ nhận ETH

1. **Thời gian:**
   - Thường mất **1-5 phút**
   - Có thể lâu hơn nếu network đông

2. **Trang sẽ hiển thị:**
   - Thông báo "Claiming..." hoặc "Processing..."
   - Hoặc "ETH sent!" khi thành công
   - Hoặc transaction hash

3. **Không đóng trang:**
   - Để trang mở cho đến khi thấy thông báo thành công
   - Hoặc đợi 5 phút rồi kiểm tra MetaMask

### Bước 4: Kiểm tra balance trong MetaMask

1. **Mở MetaMask Extension:**
   - Click icon MetaMask trên browser toolbar
   - Đảm bảo đang ở network "Sepolia"

2. **Kiểm tra balance:**
   - Balance sẽ tự động cập nhật
   - Phải thấy số ETH > 0 (ví dụ: `0.07 ETH`)
   - Refresh nếu cần: Click icon refresh (🔄)

3. **Xác nhận:**
   - Balance hiển thị `0.07 ETH` (hoặc số lượng bạn đã claim)
   - Đủ để deploy contract và test (cần ít nhất 0.01 ETH)

### Bước 5: Kiểm tra trên Etherscan

1. **Truy cập Etherscan:**
   - URL: https://sepolia.etherscan.io/address/0x9b690c02f3841605d6afd44b3f81128aeb618f6f
   - Hoặc copy address và paste vào Etherscan

2. **Xem transaction:**
   - Vào tab "Transactions"
   - Sẽ thấy transaction "IN" (nhận ETH) từ faucet
   - Click vào transaction để xem chi tiết

3. **Xác nhận:**
   - Transaction status: "Success"
   - Amount: `0.07 ETH` (hoặc số lượng bạn claim)
   - From: Faucet address
   - To: `0x9b690c02f3841605d6afd44b3f81128aeb618f6f`

---

## 📋 TÓM TẮT CÁC BƯỚC

1. ✅ **Click nút "Stop Mining & Claim Rewards"** (màu đỏ)
2. ✅ **Xác nhận** (nếu có popup)
3. ✅ **Chờ 1-5 phút** để nhận ETH
4. ✅ **Kiểm tra balance** trong MetaMask
5. ✅ **Kiểm tra trên Etherscan** (tùy chọn)

---

## 🆘 TROUBLESHOOTING

### Q: Click nút nhưng không có gì xảy ra?

**A:**
- Chờ vài giây, có thể đang xử lý
- Refresh trang (F5) và thử lại
- Kiểm tra kết nối internet

### Q: Đã click claim nhưng chưa nhận ETH sau 10 phút?

**A:**
1. Kiểm tra trên Etherscan xem có transaction chưa
2. Đảm bảo đang ở network Sepolia (không phải Mainnet)
3. Refresh MetaMask
4. Nếu vẫn không có → Thử claim lại hoặc liên hệ support

### Q: Tôi muốn tiếp tục mining để có nhiều ETH hơn?

**A:**
- Bạn có thể tiếp tục mining
- Không click "Stop Mining & Claim Rewards"
- Chờ thêm để có nhiều reward hơn
- Maximum claim: `2.5 SepETH`

### Q: Tôi đã claim nhưng balance vẫn là 0?

**A:**
1. Kiểm tra trên Etherscan xem transaction đã thành công chưa
2. Đảm bảo đang ở network Sepolia trong MetaMask
3. Refresh MetaMask (đóng/mở lại)
4. Kiểm tra address có đúng không

---

## 📋 CHECKLIST

Sau khi claim:

- [ ] ✅ Đã click "Stop Mining & Claim Rewards"
- [ ] ✅ Đã xác nhận (nếu có popup)
- [ ] ✅ Đã chờ 1-5 phút
- [ ] ✅ Balance trong MetaMask > 0.01 ETH
- [ ] ✅ Đã kiểm tra trên Etherscan (tùy chọn)
- [ ] ✅ Đã có đủ ETH để deploy contract

---

## 🎯 BƯỚC TIẾP THEO SAU KHI NHẬN ETH

Sau khi nhận được Sepolia ETH:

1. **Test kết nối blockchain:**
   ```bash
   npm run test:blockchain
   ```

2. **Compile smart contract:**
   ```bash
   npm run compile
   ```

3. **Deploy contract lên Sepolia:**
   ```bash
   npm run migrate:sepolia
   ```

4. **Cập nhật contract address vào `.env`:**
   ```env
   CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedContractAddress
   ```

5. **Khởi động server:**
   ```bash
   npm start
   ```

---

## 🎉 CHÚC MỪNG!

Bạn đã claim thành công `0.07 SepETH`! 

**Số lượng này:**
- ✅ Đủ để deploy contract nhiều lần
- ✅ Đủ để test transactions
- ✅ Đủ để develop và test thoải mái

**Tiếp theo:** Test kết nối blockchain và deploy contract! 🚀

---

**Bây giờ: Click nút "Stop Mining & Claim Rewards" để nhận ETH!** 🎉

