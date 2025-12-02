# 🔧 SỬA LỖI KHỞI ĐỘNG SERVER

Server chưa khởi động được. Hãy làm theo các bước sau:

## 🚀 BƯỚC 1: Chạy Server Trực Tiếp

Trong terminal hiện tại, chạy:

```bash
node dev-server.js
```

**Giữ terminal này mở** để xem logs đầy đủ.

## ✅ LOGS MONG ĐỢI

Bạn sẽ thấy logs như sau:

```
⚠️  Google OAuth chưa được cấu hình. Bỏ qua khởi tạo Google OAuth.
✅ [DEV] MongoDB connected: 127.0.0.1
Blockchain connection status: Sepolia Testnet
Current block: 9747618
Using account: 0x9b690C02f3841605D6aFd44B3f81128aeB618f6F
Contract initialized at address: 0x719E68df6082160416206416F6842915C65aFBa3 on Sepolia Testnet
Blockchain service initialized successfully
===========================================
🚀 DEV Express server started
Port: 5000
Health: http://localhost:5000/api/health
===========================================
```

## 🐛 NẾU CÓ LỖI

### Lỗi: "MongoDB connection error"

**Giải pháp:**
1. Kiểm tra MongoDB service:
   ```bash
   Get-Service -Name MongoDB*
   ```

2. Nếu không chạy, khởi động:
   ```bash
   Start-Service MongoDB
   ```

### Lỗi: "Blockchain initialization error"

**Giải pháp:**
1. Kiểm tra `.env`:
   ```bash
   Get-Content .env | Select-String -Pattern "^BLOCKCHAIN_NETWORK=|^INFURA_PROJECT_ID=|^PRIVATE_KEY=|^CONTRACT_ADDRESS_SEPOLIA="
   ```

2. Nếu thiếu, thêm vào `.env`:
   ```env
   BLOCKCHAIN_NETWORK=sepolia
   INFURA_PROJECT_ID=c7b0ee9f14774684a619e43305849f6f
   PRIVATE_KEY=ba3c022f9d4d9564e8aa8aadc211ce6dbf0f033ecfc376c746e8f08f38e707db
   CONTRACT_ADDRESS_SEPOLIA=0x719E68df6082160416206416F6842915C65aFBa3
   ```

3. Test kết nối blockchain:
   ```bash
   npm run test:blockchain
   ```

### Lỗi: "Cannot find module"

**Giải pháp:**
```bash
npm install
```

## ✅ KIỂM TRA SERVER ĐÃ CHẠY

Mở terminal mới và chạy:

```bash
curl http://localhost:5000/api/health
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Dev server is running"
}
```

## 📋 CHECKLIST

- [ ] ✅ Chạy `node dev-server.js` trong terminal
- [ ] ✅ Xem logs đầy đủ
- [ ] ✅ MongoDB connected
- [ ] ✅ Blockchain service initialized
- [ ] ✅ Server started on port 5000
- [ ] ✅ Health check trả về success

---

**Bây giờ: Chạy `node dev-server.js` và xem logs!** 🚀

