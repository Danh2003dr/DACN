# 🔑 CHỌN PRIVATE KEY NÀO ĐỂ THÊM VÀO .ENV?

Bạn đang thấy danh sách các networks với private keys. Đây là cách chọn đúng.

## 🎯 CÂU TRẢ LỜI NGẮN GỌN

**Dùng Private Key của Ethereum** vì:
- ✅ Sepolia là Ethereum testnet
- ✅ Cùng một private key cho Ethereum và Sepolia
- ✅ Address giống nhau trên cả hai networks

## 📋 GIẢI THÍCH CHI TIẾT

### Tại sao không thấy Sepolia trong danh sách?

**Lý do:**
- MetaMask có thể không hiển thị testnet trong danh sách này
- Hoặc Sepolia chưa được kích hoạt cho account này
- **Nhưng không sao!** Private key của Ethereum = Private key của Sepolia

### Tại sao dùng Private Key của Ethereum?

**Vì:**
1. **Sepolia là Ethereum testnet:**
   - Sepolia = Ethereum Testnet
   - Cùng một blockchain, chỉ khác network

2. **Cùng một account:**
   - Address trên Ethereum: `0x9b690...18f6f`
   - Address trên Sepolia: `0x9b690...18f6f` (giống nhau!)
   - Cùng một private key

3. **Private key là duy nhất:**
   - Một private key = Một account trên tất cả Ethereum networks
   - Bao gồm: Mainnet, Sepolia, Goerli, etc.

## 🎯 CÁCH LẤY PRIVATE KEY

### Cách 1: Lấy từ danh sách hiện tại (Nếu thấy Sepolia)

1. **Tìm "Sepolia"** trong danh sách
2. **Click icon copy (📋)** bên cạnh Sepolia
3. **Copy private key**

### Cách 2: Lấy từ Ethereum (Khuyên dùng)

1. **Tìm "Ethereum"** trong danh sách
   - Logo: Purple diamond
   - Address: `0x9b690...18f6f`

2. **Click icon copy (📋)** bên cạnh Ethereum
   - Private key sẽ được copy vào clipboard

3. **Lưu ý:**
   - Private key này dùng cho cả Ethereum Mainnet VÀ Sepolia
   - Cùng một key cho cả hai networks

### Cách 3: Lấy từ Account Details (Nếu không thấy trong danh sách)

1. **Quay lại trang chính MetaMask:**
   - Click mũi tên quay lại (←) ở góc trên bên trái

2. **Vào Account Details:**
   - Click icon account (góc trên bên phải)
   - Chọn "Account details"

3. **Export Private Key:**
   - Click "Export Private Key"
   - Nhập password
   - Copy private key

## 📝 CẬP NHẬT VÀO .ENV

Sau khi có private key:

1. **Mở file `.env`** trong project

2. **Tìm dòng `PRIVATE_KEY=`**

3. **Paste private key vào:**
   ```env
   PRIVATE_KEY=your_private_key_here
   ```

4. **Lưu ý về format:**
   - Private key có thể có hoặc không có prefix `0x`
   - Ví dụ có `0x`: `0x1234567890abcdef...`
   - Ví dụ không có `0x`: `1234567890abcdef...`
   - **Cả hai đều được**, code sẽ tự xử lý

5. **Ví dụ:**
   ```env
   PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```
   hoặc
   ```env
   PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

## ✅ KIỂM TRA

Sau khi cập nhật `.env`:

1. **Kiểm tra format:**
   - Private key phải là 64 hex characters (32 bytes)
   - Nếu có `0x`, thì tổng cộng 66 characters
   - Chỉ chứa: `0-9`, `a-f`, `A-F`

2. **Test kết nối:**
   ```bash
   npm run test:blockchain
   ```

3. **Kết quả mong đợi:**
   ```
   ✅ Wallet hợp lệ!
   📍 Address: 0x9b690...18f6f
   💰 Balance: 0 ETH (hoặc số ETH bạn đã nhận từ faucet)
   ```

## 🔍 TẠI SAO TẤT CẢ NETWORKS CÓ CÙNG ADDRESS?

**Đây là bình thường!**

- **Ethereum:** `0x9b690...18f6f`
- **Linea:** `0x9b690...18f6f`
- **Base:** `0x9b690...18f6f`
- **Arbitrum:** `0x9b690...18f6f`
- **BNB Chain:** `0x9b690...18f6f`
- **OP:** `0x9b690...18f6f`
- **Polygon:** `0x9b690...18f6f`

**Lý do:**
- Tất cả đều dùng cùng một private key
- Cùng một account, chỉ khác network
- Address giống nhau vì cùng derivation path

**Điều này có nghĩa:**
- ✅ Private key của bất kỳ network nào đều dùng được
- ✅ Nhưng khuyên dùng **Ethereum** vì Sepolia là Ethereum testnet

## 🎯 TÓM TẮT

**Câu trả lời:**
- ✅ **Dùng Private Key của Ethereum**
- ✅ Click icon copy (📋) bên cạnh Ethereum
- ✅ Paste vào `.env`: `PRIVATE_KEY=your_private_key`
- ✅ Test: `npm run test:blockchain`

**Lý do:**
- Sepolia = Ethereum Testnet
- Cùng một private key cho cả hai
- Address giống nhau: `0x9b690...18f6f`

---

## 🆘 TROUBLESHOOTING

### Q: Tôi không thấy icon copy?

**A:**
- Hover chuột vào dòng Ethereum
- Icon copy sẽ xuất hiện
- Hoặc click vào dòng Ethereum để xem chi tiết

### Q: Tôi click copy nhưng không biết đã copy chưa?

**A:**
- Thử paste vào Notepad để kiểm tra
- Hoặc dùng cách 3 (Account Details) để xem rõ hơn

### Q: Private key có prefix `0x` hay không?

**A:**
- Cả hai đều được
- Code sẽ tự xử lý
- Nhưng nếu muốn chắc chắn, bỏ `0x` đi

---

**Bây giờ: Click icon copy (📋) bên cạnh Ethereum và paste vào `.env`!** 🚀

