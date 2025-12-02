# 💧 HƯỚNG DẪN LẤY SEPOLIA ETH TỪ ALCHEMY FAUCET

Bạn đã copy wallet address, bây giờ paste vào Alchemy Sepolia Faucet để nhận test ETH.

## 🎯 CÁCH 1: Dùng Alchemy Sepolia Faucet (Khuyên dùng)

### Bước 1: Truy cập Alchemy Sepolia Faucet

1. **Mở tab mới** trong browser
2. **Truy cập:** https://sepoliafaucet.com
   - Hoặc: https://sepoliafaucet.io
   - Hoặc: https://www.alchemy.com/faucets/ethereum-sepolia

### Bước 2: Đăng nhập (Nếu chưa có tài khoản)

1. **Click "Sign in"** hoặc "Đăng nhập"
2. **Chọn phương thức đăng nhập:**
   - "Sign in with Google" (Khuyên dùng - nhanh nhất)
   - Hoặc "Sign in with Email" (tạo tài khoản mới)
3. **Hoàn tất đăng nhập:**
   - Nếu dùng Google: Chọn tài khoản Google
   - Nếu dùng Email: Nhập email và tạo password

**Lưu ý:**
- Tài khoản Alchemy **MIỄN PHÍ**
- Không cần credit card
- Đăng ký chỉ mất 1 phút

### Bước 3: Paste Wallet Address

1. **Tìm ô input lớn** ở giữa trang
   - Có thể có label "Enter your wallet address" hoặc "Nhập địa chỉ ví"
   - Hoặc có placeholder "0x..."

2. **Paste address vào:**
   - Click vào ô input
   - Paste address (Ctrl+V / Cmd+V)
   - Đảm bảo address bắt đầu với `0x`
   - Ví dụ: `0x9b690...18f6f`

3. **Kiểm tra lại:**
   - Address phải có 42 ký tự (bao gồm `0x`)
   - Format: `0x` + 40 hex characters

### Bước 4: Hoàn thành Captcha

1. **Hoàn thành reCAPTCHA** (nếu có)
   - Click checkbox "I'm not a robot"
   - Hoặc chọn hình ảnh theo yêu cầu

2. **Xác nhận:**
   - Captcha sẽ được verify tự động

### Bước 5: Gửi yêu cầu

1. **Click nút "Send Me ETH"** hoặc "Gửi ETH cho tôi"
   - Nút thường có màu xanh hoặc tím
   - Ở dưới ô input address

2. **Xác nhận:**
   - Trang sẽ hiển thị thông báo "ETH sent!" hoặc "Đã gửi ETH!"
   - Số lượng: **0.5 ETH** (đủ để deploy và test nhiều lần)
   - Thời gian: 1-5 phút để nhận

### Bước 6: Chờ nhận ETH

1. **Thời gian:**
   - Thường mất **1-5 phút**
   - Có thể lâu hơn nếu network đông

2. **Kiểm tra trong MetaMask:**
   - Mở MetaMask Extension
   - Đảm bảo đang ở network "Sepolia"
   - Balance sẽ tự động cập nhật
   - Refresh nếu cần: Click icon refresh (🔄)

3. **Kiểm tra trên Etherscan:**
   - Truy cập: https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS
   - Thay `YOUR_WALLET_ADDRESS` bằng address của bạn
   - Xem phần "Balance" → Phải thấy số ETH > 0

---

## 🎯 CÁCH 2: Dùng Alchemy Dashboard (Nếu có sẵn)

Nếu bạn đã đăng nhập Alchemy Dashboard (như trong hình):

1. **Tìm "Faucet" trong menu:**
   - Scroll xuống trong sidebar
   - Hoặc tìm "Tools" → "Faucet"

2. **Chọn network "Sepolia":**
   - Tìm dropdown "Network"
   - Chọn "Sepolia" thay vì "Ethereum Mainnet"

3. **Paste address:**
   - Paste wallet address vào ô input
   - Click "Send Me ETH"

---

## 📋 TÓM TẮT CÁC BƯỚC

1. ✅ **Truy cập:** https://sepoliafaucet.com
2. ✅ **Đăng nhập:** Sign in with Google (nhanh nhất)
3. ✅ **Paste address:** Paste wallet address vào ô input
4. ✅ **Hoàn thành captcha:** (nếu có)
5. ✅ **Click "Send Me ETH"**
6. ✅ **Chờ 1-5 phút**
7. ✅ **Kiểm tra balance trong MetaMask**

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Invalid address"

**Nguyên nhân:** Address sai format

**Giải pháp:**
- Đảm bảo address bắt đầu với `0x`
- Đảm bảo có đủ 42 ký tự
- Copy lại từ MetaMask

### Lỗi: "You've already received ETH today"

**Nguyên nhân:** Đã lấy ETH từ Alchemy faucet trong 24 giờ qua

**Giải pháp:**
- Thử faucet khác (Infura, QuickNode, etc.)
- Chờ 24 giờ để lấy lại từ Alchemy

### Lỗi: "Network error" hoặc "Failed to send"

**Nguyên nhân:** Faucet tạm thời không hoạt động

**Giải pháp:**
- Thử lại sau vài phút
- Thử faucet khác
- Kiểm tra kết nối internet

### Chưa nhận được ETH sau 10 phút

**Giải pháp:**
1. Kiểm tra trên Etherscan xem có transaction chưa
2. Đảm bảo đang ở network Sepolia (không phải Mainnet)
3. Thử faucet khác
4. Kiểm tra spam folder (nếu có email xác nhận)

---

## 📋 CHECKLIST

Sau khi paste address vào faucet:

- [ ] ✅ Đã truy cập https://sepoliafaucet.com
- [ ] ✅ Đã đăng nhập (nếu cần)
- [ ] ✅ Đã paste wallet address vào ô input
- [ ] ✅ Đã hoàn thành captcha (nếu có)
- [ ] ✅ Đã click "Send Me ETH"
- [ ] ✅ Đã chờ 1-5 phút
- [ ] ✅ Balance trong MetaMask > 0.01 ETH
- [ ] ✅ Đã kiểm tra trên Etherscan

---

## 🎯 CÁC FAUCET KHÁC (Nếu Alchemy không hoạt động)

1. **Infura Faucet:**
   - URL: https://www.infura.io/faucet/sepolia
   - Số lượng: 0.5 ETH/ngày

2. **QuickNode Faucet:**
   - URL: https://faucet.quicknode.com/ethereum/sepolia
   - Số lượng: 0.1 ETH/ngày

3. **MetaMask Developer Faucet:**
   - URL: https://developer.metamask.io → Faucet
   - Số lượng: Tùy faucet

4. **PoW Faucet (Không cần đăng nhập):**
   - URL: https://sepolia-faucet.pk910.de
   - Số lượng: Không giới hạn (cần mine)

---

**Bây giờ: Truy cập https://sepoliafaucet.com và paste address vào!** 🚀

