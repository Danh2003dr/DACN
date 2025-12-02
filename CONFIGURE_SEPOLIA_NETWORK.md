# ⚙️ CẤU HÌNH SEPOLIA NETWORK - HƯỚNG DẪN CHI TIẾT

Bạn đang ở cửa sổ cấu hình Sepolia network. Đây là cách điền đúng thông tin.

## 🎯 CÁC TRƯỜNG CẦN ĐIỀN

### 1️⃣ Tên mạng (Network name)
- ✅ **Đã điền sẵn:** `Sepolia`
- ✅ **Giữ nguyên** - Không cần sửa

### 2️⃣ URL RPC mặc định (Default RPC URL) - ⚠️ CẦN SỬA

**Hiện tại:** `sepolia.infura.io` (chưa có API key)

**Cần sửa thành:**
```
https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f
```

**Cách sửa:**
1. **Click vào ô "URL RPC mặc định"**
2. **Xóa nội dung cũ** (nếu có)
3. **Nhập:** `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
4. **Đảm bảo:**
   - Có `https://` ở đầu
   - Có `/v3/` sau `infura.io`
   - Có API key của bạn: `c7b0ee9f14774684a619e43305849f6f`
   - Không có khoảng trắng thừa

**Lưu ý:**
- Nếu có dropdown "Infura" → Có thể chọn "Custom" hoặc nhập trực tiếp
- API key này là từ MetaMask Developer Portal của bạn

### 3️⃣ ID chuỗi (Chain ID)
- ✅ **Đã điền sẵn:** `11155111`
- ✅ **Giữ nguyên** - Đây là Chain ID đúng của Sepolia

### 4️⃣ Ký hiệu tiền tệ (Currency symbol)
- **Hiện tại:** `SepoliaETH`
- **Có thể sửa thành:** `ETH` (đơn giản hơn)
- **Hoặc giữ nguyên:** `SepoliaETH` (cũng được)

**Cách sửa (Tùy chọn):**
1. Click vào ô "Ký hiệu tiền tệ"
2. Xóa "SepoliaETH"
3. Nhập: `ETH`
4. Hoặc giữ nguyên nếu muốn

### 5️⃣ URL trình khám phá khối (Block explorer URL)
- ✅ **Đã điền sẵn:** `sepolia.etherscan.io`
- ✅ **Giữ nguyên** - Hoặc có thể thêm `https://` ở đầu

**Có thể sửa thành (Tùy chọn):**
```
https://sepolia.etherscan.io
```

---

## 📋 TÓM TẮT CÁC TRƯỜNG

| Trường | Giá trị hiện tại | Giá trị nên dùng | Cần sửa? |
|--------|------------------|------------------|----------|
| **Tên mạng** | `Sepolia` | `Sepolia` | ❌ Không |
| **URL RPC** | `sepolia.infura.io` | `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f` | ✅ **CÓ** |
| **ID chuỗi** | `11155111` | `11155111` | ❌ Không |
| **Ký hiệu tiền tệ** | `SepoliaETH` | `ETH` hoặc `SepoliaETH` | ⚠️ Tùy chọn |
| **URL trình khám phá** | `sepolia.etherscan.io` | `https://sepolia.etherscan.io` | ⚠️ Tùy chọn |

---

## 🎯 CÁC BƯỚC THỰC HIỆN

### Bước 1: Sửa RPC URL (QUAN TRỌNG)

1. **Click vào ô "URL RPC mặc định"**
2. **Xóa nội dung cũ** (nếu có)
3. **Nhập RPC URL đầy đủ:**
   ```
   https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f
   ```
4. **Kiểm tra lại:**
   - Có `https://` ở đầu
   - Có `/v3/` sau `infura.io`
   - Có API key của bạn
   - Không có khoảng trắng

### Bước 2: Sửa Currency Symbol (Tùy chọn)

1. **Click vào ô "Ký hiệu tiền tệ"**
2. **Xóa "SepoliaETH"**
3. **Nhập:** `ETH`
4. **Hoặc giữ nguyên** nếu muốn

### Bước 3: Sửa Block Explorer URL (Tùy chọn)

1. **Click vào ô "URL trình khám phá khối"**
2. **Thêm `https://` ở đầu** (nếu chưa có)
3. **Hoặc giữ nguyên** nếu muốn

### Bước 4: Lưu cấu hình

1. **Kiểm tra lại tất cả các trường:**
   - ✅ RPC URL đã có API key
   - ✅ Chain ID: `11155111`
   - ✅ Các trường khác đã đúng

2. **Click nút "Lưu"** (màu đen, ở dưới cùng)

3. **Xác nhận:**
   - MetaMask sẽ validate RPC URL
   - Nếu đúng, sẽ lưu và chuyển sang Sepolia
   - Nếu sai, sẽ hiển thị lỗi (ví dụ: "Invalid RPC URL")

---

## ✅ KIỂM TRA SAU KHI LƯU

### Kiểm tra 1: Network đã được thêm

1. **Cửa sổ cấu hình sẽ đóng lại**
2. **MetaMask sẽ tự động chuyển sang Sepolia:**
   - Ở góc trên cùng, bạn sẽ thấy "Sepolia"
   - Balance hiển thị "0 ETH"

### Kiểm tra 2: RPC connection

1. **MetaMask sẽ tự động test kết nối RPC**
2. **Nếu thành công:**
   - Balance sẽ load được (dù là 0 ETH)
   - Không có thông báo lỗi

3. **Nếu thất bại:**
   - Sẽ có thông báo lỗi
   - Kiểm tra lại RPC URL

### Kiểm tra 3: Trong danh sách networks

1. **Click vào network dropdown** (góc trên)
2. **Tìm "Sepolia"** trong danh sách
3. **Sepolia sẽ có dấu tick (✓)** nếu đang chọn

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Invalid RPC URL"

**Nguyên nhân:**
- RPC URL sai format
- Thiếu `https://`
- API key không hợp lệ
- Có khoảng trắng thừa

**Giải pháp:**
1. Kiểm tra RPC URL: `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
2. Đảm bảo không có khoảng trắng
3. Đảm bảo có `https://` ở đầu
4. Thử lại

### Lỗi: "Failed to connect to network"

**Nguyên nhân:**
- RPC endpoint không kết nối được
- API key không có quyền truy cập Sepolia
- Internet không ổn định

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Kiểm tra API key có quyền truy cập Sepolia chưa
3. Thử RPC URL khác:
   - `https://rpc.sepolia.org`
   - `https://sepolia.gateway.tenderly.co`

### Lỗi: "Chain ID mismatch"

**Nguyên nhân:**
- Chain ID sai (phải là `11155111`)

**Giải pháp:**
1. Kiểm tra Chain ID: `11155111`
2. Không được có khoảng trắng
3. Phải chính xác

---

## 📋 CHECKLIST

Trước khi click "Lưu":

- [ ] ✅ RPC URL: `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
- [ ] ✅ Chain ID: `11155111`
- [ ] ✅ Currency Symbol: `ETH` hoặc `SepoliaETH`
- [ ] ✅ Block Explorer: `https://sepolia.etherscan.io` hoặc `sepolia.etherscan.io`
- [ ] ✅ Không có khoảng trắng thừa
- [ ] ✅ Đã kiểm tra lại tất cả các trường

Sau khi click "Lưu":

- [ ] ✅ Cửa sổ cấu hình đã đóng
- [ ] ✅ MetaMask đã chuyển sang Sepolia
- [ ] ✅ Ở góc trên hiển thị "Sepolia"
- [ ] ✅ Balance hiển thị "0 ETH"
- [ ] ✅ Không có thông báo lỗi

---

## 🎯 TÓM TẮT

**Điều quan trọng nhất:**
- ✅ **Sửa RPC URL** thành: `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
- ✅ **Giữ nguyên Chain ID:** `11155111`
- ✅ **Click "Lưu"** để lưu cấu hình

**Các trường khác:**
- Tên mạng: Giữ nguyên
- Currency Symbol: Có thể sửa thành `ETH` (tùy chọn)
- Block Explorer: Có thể thêm `https://` (tùy chọn)

---

**Bây giờ: Sửa RPC URL và click "Lưu"!** 🚀

