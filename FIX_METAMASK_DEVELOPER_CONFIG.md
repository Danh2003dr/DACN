# 🔧 SỬA LỖI CẤU HÌNH METAMASK DEVELOPER

Nếu bạn đã cấu hình sai bên MetaMask Developer Portal, đây là cách sửa lại.

## 🔍 PHÂN BIỆT 2 THỨ KHÁC NHAU

### 1️⃣ MetaMask Developer Portal (developer.metamask.io)
- **Mục đích:** Lấy API key để kết nối RPC endpoint
- **Dùng cho:** Backend code (Node.js, truffle-config.js)
- **Không cần:** Wallet, Private Key
- **Chỉ cần:** API Key để thêm vào `.env`

### 2️⃣ MetaMask Extension (Browser extension)
- **Mục đích:** Tạo wallet, quản lý tài khoản
- **Dùng cho:** Frontend, gửi transactions
- **Cần:** Wallet, Private Key
- **Không liên quan:** MetaMask Developer Portal

---

## 🎯 CÁC LỖI THƯỜNG GẶP VÀ CÁCH SỬA

### Lỗi 1: Nhầm lẫn giữa MetaMask Developer và MetaMask Extension

**Triệu chứng:**
- Đã tạo API key trong MetaMask Developer Portal
- Nhưng không biết dùng ở đâu
- Hoặc cố gắng dùng API key trong MetaMask Extension

**Giải pháp:**
- ✅ **API key từ MetaMask Developer Portal** → Dùng trong file `.env` (đã làm đúng)
- ✅ **MetaMask Extension** → Tạo wallet riêng, không cần API key

**Tóm lại:**
- MetaMask Developer Portal = Lấy API key cho backend
- MetaMask Extension = Tạo wallet cho frontend
- **Hai thứ này độc lập với nhau!**

---

### Lỗi 2: Cấu hình network sai trong MetaMask Developer Portal

**Triệu chứng:**
- Đã chọn network khác (không phải Sepolia)
- Hoặc chưa chọn network nào

**Cách sửa:**

1. **Truy cập MetaMask Developer Portal:**
   - https://developer.metamask.io
   - Đăng nhập với tài khoản của bạn

2. **Vào phần API Keys:**
   - Click "Khóa API" (API Keys) ở sidebar
   - Hoặc vào Dashboard

3. **Tìm API key của bạn:**
   - Tìm dòng "Chìa khóa đầu tiên..." hoặc tên API key bạn đã tạo
   - Click "Cấu hình" (Configure) hoặc icon settings

4. **Chọn network Sepolia:**
   - Trong phần cấu hình, tìm "Networks" hoặc "Mạng"
   - Chọn "Sepolia" từ danh sách
   - Hoặc thêm Sepolia nếu chưa có

5. **Lưu cấu hình:**
   - Click "Save" hoặc "Lưu"
   - API key sẽ được cập nhật

**Lưu ý:**
- API key có thể dùng cho nhiều networks
- Không cần tạo API key mới, chỉ cần cấu hình lại

---

### Lỗi 3: Dùng sai API key hoặc copy nhầm

**Triệu chứng:**
- API key trong `.env` không đúng
- Hoặc dùng API Key Secret thay vì API Key

**Cách sửa:**

1. **Lấy lại API key đúng:**
   - Truy cập: https://developer.metamask.io
   - Vào "Khóa API" (API Keys)
   - Click "Sao chép khóa" (Copy key) bên cạnh API key của bạn
   - Hoặc click "Cấu hình" để xem chi tiết và copy

2. **Kiểm tra format:**
   - API Key thường là: `c7b0ee9f14774684a619e43305849f6f` (32 ký tự hex)
   - API Key Secret thường là: `ufwG/qRbIJqbyfZRUlvfyeI2nJLj2VHBP45d5Idx6mWmJ8SrTL1tzw` (dài hơn)
   - **Chỉ cần API Key, không cần API Key Secret** cho RPC endpoint

3. **Cập nhật file `.env`:**
   ```env
   INFURA_PROJECT_ID=c7b0ee9f14774684a619e43305849f6f
   ```
   (Thay bằng API key đúng của bạn)

4. **Kiểm tra lại:**
   ```bash
   npm run test:blockchain
   ```

---

### Lỗi 4: Tạo nhiều API keys và không biết dùng cái nào

**Triệu chứng:**
- Đã tạo nhiều API keys trong MetaMask Developer Portal
- Không biết dùng key nào

**Cách sửa:**

1. **Xem danh sách API keys:**
   - Vào MetaMask Developer Portal
   - Click "Khóa API" (API Keys)
   - Xem tất cả keys đã tạo

2. **Chọn key phù hợp:**
   - Key nào có network "Sepolia" → Dùng key đó
   - Hoặc key nào mới tạo nhất → Dùng key đó
   - Hoặc tạo key mới với tên rõ ràng: "Drug Traceability - Sepolia"

3. **Xóa keys không dùng (Tùy chọn):**
   - Click "Cấu hình" (Configure) → "Xóa" (Delete)
   - Hoặc để lại cũng không sao

4. **Cập nhật `.env` với key đúng:**
   ```env
   INFURA_PROJECT_ID=your_correct_api_key_here
   ```

---

### Lỗi 5: Nhầm lẫn giữa Infura và MetaMask Developer

**Triệu chứng:**
- Đã tạo API key trong MetaMask Developer Portal
- Nhưng code đang dùng Infura format
- Hoặc ngược lại

**Giải pháp:**

**MetaMask Developer API key có thể dùng như Infura:**
- Format RPC URL: `https://sepolia.infura.io/v3/YOUR_METAMASK_API_KEY`
- Hoặc: `https://rpc.metamask.io/v1/YOUR_METAMASK_API_KEY`
- **Cả hai đều hoạt động!**

**Trong file `.env`:**
```env
# Dùng API key từ MetaMask Developer (hoạt động như Infura)
INFURA_PROJECT_ID=c7b0ee9f14774684a619e43305849f6f
```

**Trong code (services/blockchainService.js):**
```javascript
// Code đã đúng, không cần sửa
rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID || ''}`
```

**Kết luận:**
- ✅ API key từ MetaMask Developer = Dùng được như Infura
- ✅ Không cần tạo tài khoản Infura riêng
- ✅ Code hiện tại đã đúng, không cần sửa

---

## ✅ KIỂM TRA CẤU HÌNH ĐÚNG

Sau khi sửa, kiểm tra lại:

### 1. Kiểm tra file `.env`:

```bash
# Xem INFURA_PROJECT_ID
Get-Content .env | Select-String "INFURA_PROJECT_ID"
```

**Kết quả mong đợi:**
```
INFURA_PROJECT_ID=c7b0ee9f14774684a619e43305849f6f
```

### 2. Kiểm tra network trong `.env`:

```bash
# Xem BLOCKCHAIN_NETWORK
Get-Content .env | Select-String "BLOCKCHAIN_NETWORK"
```

**Kết quả mong đợi:**
```
BLOCKCHAIN_NETWORK=sepolia
```

### 3. Test kết nối blockchain:

```bash
npm run test:blockchain
```

**Kết quả mong đợi:**
```
✅ Kết nối thành công!
📊 Block number hiện tại: 12345678
```

---

## 🔄 CÁCH SỬA NHANH (Nếu đã cấu hình sai)

### Bước 1: Lấy lại API key đúng

1. Truy cập: https://developer.metamask.io
2. Vào "Khóa API" (API Keys)
3. Click "Sao chép khóa" (Copy key)
4. Hoặc tạo API key mới nếu cần

### Bước 2: Cập nhật `.env`

```bash
# Cập nhật INFURA_PROJECT_ID
$content = Get-Content .env -Raw
$content = $content -replace 'INFURA_PROJECT_ID=.*', 'INFURA_PROJECT_ID=your_correct_api_key_here'
Set-Content .env -Value $content -NoNewline
```

### Bước 3: Đảm bảo network là Sepolia

```bash
# Cập nhật BLOCKCHAIN_NETWORK
$content = Get-Content .env -Raw
$content = $content -replace 'BLOCKCHAIN_NETWORK=.*', 'BLOCKCHAIN_NETWORK=sepolia'
Set-Content .env -Value $content -NoNewline
```

### Bước 4: Test lại

```bash
npm run test:blockchain
```

---

## 📋 CHECKLIST SỬA LỖI

- [ ] ✅ Đã phân biệt được MetaMask Developer Portal vs MetaMask Extension
- [ ] ✅ Đã lấy lại API key đúng từ MetaMask Developer Portal
- [ ] ✅ Đã cập nhật `INFURA_PROJECT_ID` trong `.env`
- [ ] ✅ Đã đảm bảo `BLOCKCHAIN_NETWORK=sepolia` trong `.env`
- [ ] ✅ Đã test kết nối thành công (`npm run test:blockchain`)
- [ ] ✅ Không còn nhầm lẫn giữa API key và wallet

---

## 🎯 TÓM TẮT

**MetaMask Developer Portal:**
- ✅ Lấy API key → Thêm vào `.env` → Dùng cho backend
- ✅ Không cần wallet, không cần Private Key
- ✅ Chỉ cần API key để kết nối RPC

**MetaMask Extension:**
- ✅ Tạo wallet → Export Private Key → Thêm vào `.env`
- ✅ Không cần API key từ MetaMask Developer
- ✅ Chỉ cần wallet để gửi transactions

**Hai thứ này độc lập:**
- MetaMask Developer Portal ≠ MetaMask Extension
- API key ≠ Private Key
- RPC endpoint ≠ Wallet

---

**Nếu vẫn còn lỗi, mô tả cụ thể bạn đã cấu hình gì sai để tôi hướng dẫn sửa chính xác hơn!** 🔧

