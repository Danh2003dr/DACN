# 📍 TÌM NETWORK HIỆN TẠI TRONG METAMASK

Hướng dẫn tìm và chọn network trong MetaMask Extension (cần cho deploy contract).

## 🔍 PHÂN BIỆT 2 THỨ KHÁC NHAU

### 1️⃣ MetaMask Portfolio (portfolio.metamask.io) - Web App
- **Mục đích:** Xem portfolio, quản lý tài sản
- **Không dùng để:** Deploy contract, gửi transactions
- **Network selector:** Ở dropdown "9 Networks" (góc trên)

### 2️⃣ MetaMask Extension (Browser Extension) - CẦN CHO DEPLOY
- **Mục đích:** Deploy contract, gửi transactions
- **Network selector:** Ở góc trên cùng của extension popup
- **Đây là cái bạn cần!**

---

## 🎯 CÁCH TÌM NETWORK TRONG METAMASK EXTENSION

### Bước 1: Mở MetaMask Extension

1. **Tìm icon MetaMask trên browser:**
   - Ở góc trên bên phải của browser
   - Icon hình con cáo màu cam
   - Hoặc click icon puzzle (Extensions) → MetaMask

2. **Click vào icon MetaMask:**
   - Một popup window sẽ mở ra
   - Đây là MetaMask Extension (không phải Portfolio)

### Bước 2: Tìm Network Selector

**Network selector nằm ở đâu:**

1. **Ở góc trên cùng của popup MetaMask:**
   - Bạn sẽ thấy tên network hiện tại
   - Mặc định: "Ethereum Mainnet"
   - Có thể có icon mạng lưới bên cạnh

2. **Vị trí cụ thể:**
   - Ở hàng đầu tiên, bên trái hoặc giữa
   - Có thể có icon mũi tên xuống (▼) hoặc icon mạng lưới
   - Click vào đó để mở dropdown

3. **Ví dụ hiển thị:**
   ```
   [Icon] Ethereum Mainnet ▼
   ```
   hoặc
   ```
   [Icon] Sepolia ▼
   ```

### Bước 3: Xem Network Hiện Tại

**Cách 1: Xem trực tiếp**
- Network hiện tại hiển thị ngay ở góc trên
- Ví dụ: "Ethereum Mainnet", "Sepolia", "Polygon", etc.

**Cách 2: Click vào network dropdown**
- Click vào tên network
- Dropdown sẽ hiển thị danh sách networks
- Network đang chọn sẽ có dấu tick (✓) hoặc highlight

### Bước 4: Chuyển Sang Sepolia

1. **Click vào network dropdown** (góc trên cùng)

2. **Scroll xuống** tìm "Sepolia test network"
   - Có thể có icon testnet (ống nghiệm)
   - Tên: "Sepolia test network" hoặc chỉ "Sepolia"

3. **Click vào "Sepolia"**
   - MetaMask sẽ tự động chuyển
   - Có thể có popup xác nhận → Click "Switch network"

4. **Xác nhận:**
   - Ở góc trên sẽ hiển thị "Sepolia" thay vì "Ethereum Mainnet"
   - Balance sẽ hiển thị "0 ETH" (chưa có test ETH)

---

## 📸 MÔ TẢ GIAO DIỆN METAMASK EXTENSION

**Cấu trúc popup MetaMask Extension:**

```
┌─────────────────────────────────────┐
│ [Icon] Sepolia ▼    [Account Icon] │ ← Network selector ở đây
├─────────────────────────────────────┤
│                                     │
│  Account 1                          │
│  0x1234...5678                      │
│                                     │
│  Balance: 0 ETH                     │
│                                     │
│  [Send] [Swap] [Buy]                │
│                                     │
└─────────────────────────────────────┘
```

**Network selector:**
- Vị trí: Hàng đầu tiên, bên trái
- Hiển thị: Tên network + icon dropdown
- Click để: Mở danh sách networks

---

## 🔄 SO SÁNH METAMASK PORTFOLIO vs EXTENSION

| Tính năng | MetaMask Portfolio | MetaMask Extension |
|-----------|-------------------|-------------------|
| **Network selector** | Dropdown "9 Networks" (góc trên) | Dropdown ở góc trên popup |
| **Dùng để deploy** | ❌ Không | ✅ Có |
| **Dùng để gửi TX** | ❌ Không | ✅ Có |
| **Dùng để xem portfolio** | ✅ Có | ❌ Không |
| **Cần cho project** | ❌ Không | ✅ Có |

**Kết luận:**
- ✅ **Dùng MetaMask Extension** để deploy contract
- ❌ **Không dùng MetaMask Portfolio** cho deploy

---

## 🎯 CÁCH KIỂM TRA NETWORK ĐÚNG

### Kiểm tra trong MetaMask Extension:

1. **Mở MetaMask Extension** (click icon trên browser)
2. **Xem góc trên cùng:**
   - Phải thấy "Sepolia" (không phải "Ethereum Mainnet")
3. **Kiểm tra balance:**
   - Hiển thị "0 ETH" (chưa có test ETH)
4. **Kiểm tra địa chỉ wallet:**
   - Vẫn giữ nguyên (ví dụ: `0x1234...5678`)

### Kiểm tra trên Etherscan:

1. **Copy địa chỉ wallet** từ MetaMask Extension
2. **Truy cập:** https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS
3. **Thay `YOUR_WALLET_ADDRESS`** bằng địa chỉ của bạn
4. **Nếu thấy trang wallet trên Sepolia Etherscan** → ✅ Đúng network!

---

## 🆘 TROUBLESHOOTING

### Không thấy network selector?

**Nguyên nhân:**
- Đang xem MetaMask Portfolio thay vì Extension
- MetaMask Extension chưa được mở

**Giải pháp:**
1. Đóng MetaMask Portfolio tab
2. Click icon MetaMask trên browser toolbar (góc trên bên phải)
3. Mở MetaMask Extension popup
4. Tìm network selector ở góc trên cùng

### Không thấy "Sepolia" trong danh sách?

**Giải pháp:**
1. Scroll xuống trong dropdown
2. Hoặc thêm network thủ công:
   - Click "Add network" hoặc "Thêm mạng"
   - Chọn "Add a network manually"
   - Nhập thông tin Sepolia (xem hướng dẫn trước)

### Vẫn thấy "Ethereum Mainnet"?

**Giải pháp:**
1. Click vào network dropdown
2. Tìm và click "Sepolia test network"
3. Xác nhận chuyển network
4. Kiểm tra lại góc trên phải thấy "Sepolia"

---

## 📋 CHECKLIST

Sau khi tìm được network selector:

- [ ] ✅ Đã mở MetaMask Extension (không phải Portfolio)
- [ ] ✅ Đã thấy network selector ở góc trên cùng
- [ ] ✅ Đã chuyển sang "Sepolia test network"
- [ ] ✅ Ở góc trên hiển thị "Sepolia" (không phải "Ethereum Mainnet")
- [ ] ✅ Balance hiển thị "0 ETH"

---

## 🎯 TÓM TẮT

**Network hiện tại nằm ở đâu:**
- ✅ **MetaMask Extension:** Góc trên cùng của popup (cần cho deploy)
- ❌ **MetaMask Portfolio:** Dropdown "9 Networks" (không dùng cho deploy)

**Cách xem:**
1. Click icon MetaMask trên browser toolbar
2. Mở MetaMask Extension popup
3. Xem góc trên cùng → Tên network hiện tại
4. Click vào để chuyển network

**Tiếp theo:** Chuyển sang Sepolia và export Private Key! 🚀

