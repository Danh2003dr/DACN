# 🔄 TỪ ALCHEMY DASHBOARD ĐẾN FAUCET - HƯỚNG DẪN

Bạn đang ở **Alchemy Dashboard** (trang setup app). Để lấy Sepolia ETH, bạn cần truy cập **Alchemy Sepolia Faucet**.

## 🎯 BẠN ĐANG Ở ĐÂU?

- ✅ Alchemy Dashboard: `dashboard.alchemy.com`
- ✅ Trang "Node RPC Setup"
- ✅ Đây là nơi setup API, không phải faucet

## 📍 CÁCH 1: Truy cập Alchemy Sepolia Faucet trực tiếp (Nhanh nhất)

### Bước 1: Mở tab mới

1. **Click chuột phải** vào tab hiện tại
2. **Chọn "New tab"** hoặc "Tab mới"
3. **Hoặc:** Nhấn `Ctrl+T` (Windows) / `Cmd+T` (Mac)

### Bước 2: Truy cập Alchemy Sepolia Faucet

1. **Trong tab mới, gõ vào address bar:**
   ```
   https://sepoliafaucet.com
   ```
   Hoặc:
   ```
   https://sepoliafaucet.io
   ```
   Hoặc:
   ```
   https://www.alchemy.com/faucets/ethereum-sepolia
   ```

2. **Nhấn Enter**

3. **Bạn sẽ thấy trang Alchemy Sepolia Faucet:**
   - Có ô input lớn để paste wallet address
   - Có nút "Send Me ETH"
   - Có thể yêu cầu đăng nhập

### Bước 3: Đăng nhập (Nếu chưa đăng nhập)

1. **Click "Sign in"** hoặc "Đăng nhập"
2. **Chọn "Sign in with Google"** (nhanh nhất)
   - Sử dụng cùng tài khoản Google đã dùng cho Alchemy Dashboard
3. **Hoàn tất đăng nhập**

### Bước 4: Paste wallet address và lấy ETH

1. **Paste wallet address vào ô input:**
   - Click vào ô input lớn ở giữa trang
   - Paste address (Ctrl+V / Cmd+V)
   - Address: `0x9b690...18f6f` (đã copy từ MetaMask)

2. **Hoàn thành captcha** (nếu có)

3. **Click "Send Me ETH"**

4. **Chờ 1-5 phút** để nhận ETH

---

## 📍 CÁCH 2: Tìm Faucet trong Alchemy Dashboard (Nếu có)

### Bước 1: Tìm menu "Tools" hoặc "Faucet"

1. **Trong sidebar bên trái, scroll xuống**
2. **Tìm "Tools"** (đã thấy trong hình - có caret ▼)
3. **Click vào "Tools"** để mở menu con

### Bước 2: Tìm "Faucet" trong Tools

1. **Trong menu Tools, tìm "Faucet"**
   - Có thể có trong menu con
   - Hoặc có thể không có (tùy phiên bản)

2. **Nếu không thấy "Faucet":**
   - Dùng Cách 1 (truy cập trực tiếp)

### Bước 3: Chọn network Sepolia

1. **Nếu tìm thấy Faucet:**
   - Click vào "Faucet"
   - Chọn network "Sepolia" từ dropdown
   - Paste wallet address
   - Click "Send Me ETH"

---

## 🎯 CÁCH 3: Dùng URL trực tiếp từ Dashboard

### Bước 1: Copy API Key (Nếu cần)

1. **Trong Dashboard, bạn thấy "API Key":**
   - `MPNGprhjuEJXEJ_IXNGAY`
   - Click "Copy" để copy (nếu cần)

2. **Lưu ý:** API Key này dùng cho RPC endpoint, không dùng cho faucet

### Bước 2: Truy cập Faucet

1. **Mở tab mới**
2. **Truy cập:** https://sepoliafaucet.com
3. **Đăng nhập** với cùng tài khoản Alchemy
4. **Paste wallet address** và lấy ETH

---

## 📋 TÓM TẮT CÁC BƯỚC

**Cách nhanh nhất:**

1. ✅ **Mở tab mới:** `Ctrl+T` / `Cmd+T`
2. ✅ **Truy cập:** https://sepoliafaucet.com
3. ✅ **Đăng nhập:** Sign in with Google (nếu chưa)
4. ✅ **Paste address:** Paste `0x9b690...18f6f` vào ô input
5. ✅ **Click "Send Me ETH"**
6. ✅ **Chờ 1-5 phút**
7. ✅ **Kiểm tra balance trong MetaMask**

---

## 🆘 TROUBLESHOOTING

### Q: Tôi không tìm thấy "Faucet" trong menu Tools?

**A:** 
- Faucet có thể không có trong menu này
- Dùng Cách 1: Truy cập trực tiếp https://sepoliafaucet.com

### Q: Tôi đã đăng nhập Alchemy Dashboard, có cần đăng nhập lại không?

**A:**
- Có thể cần đăng nhập lại trên faucet
- Nhưng có thể dùng "Sign in with Google" với cùng tài khoản

### Q: Tôi thấy "Ethereum Mainnet" trong dropdown, làm sao chuyển sang Sepolia?

**A:**
- Trong Dashboard, dropdown "Network" đang ở "Ethereum Mainnet"
- Đây là cho RPC endpoint, không phải faucet
- Faucet sẽ tự động dùng Sepolia khi bạn truy cập https://sepoliafaucet.com

---

## 🎯 BƯỚC TIẾP THEO SAU KHI LẤY ETH

Sau khi nhận được Sepolia ETH:

1. **Kiểm tra balance trong MetaMask:**
   - Mở MetaMask Extension
   - Đảm bảo đang ở network "Sepolia"
   - Balance phải > 0.01 ETH

2. **Test kết nối blockchain:**
   ```bash
   npm run test:blockchain
   ```

3. **Deploy contract:**
   ```bash
   npm run compile
   npm run migrate:sepolia
   ```

---

## 📚 TÀI LIỆU THAM KHẢO

- **Hướng dẫn chi tiết lấy ETH:** [ALCHEMY_FAUCET_GUIDE.md](./ALCHEMY_FAUCET_GUIDE.md)
- **Các bước tiếp theo:** [PRIVATE_KEY_ADDED.md](./PRIVATE_KEY_ADDED.md)

---

**Bây giờ: Mở tab mới → Truy cập https://sepoliafaucet.com → Paste address → Lấy ETH!** 🚀

