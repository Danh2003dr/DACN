# 🚀 HƯỚNG DẪN KHỞI ĐỘNG SERVER

## ✅ KIỂM TRA TRƯỚC KHI KHỞI ĐỘNG

1. **MongoDB đang chạy:** ✅
2. **`.env` file đã được cấu hình:** Kiểm tra:
   ```bash
   Get-Content .env | Select-String -Pattern "^BLOCKCHAIN_NETWORK=|^INFURA_PROJECT_ID=|^PRIVATE_KEY=|^CONTRACT_ADDRESS_SEPOLIA="
   ```

## 🚀 KHỞI ĐỘNG SERVER

### Cách 1: Chạy trong Terminal (Khuyến nghị)

```bash
npm start
```

**Logs mong đợi:**
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

### Cách 2: Chạy trực tiếp với Node

```bash
node dev-server.js
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
  "message": "Dev server is running",
  "timestamp": "...",
  "environment": "development"
}
```

## 🐛 TROUBLESHOOTING

### Server dừng ngay sau khi khởi động

**Nguyên nhân có thể:**
1. MongoDB không kết nối được
2. Blockchain service lỗi khi khởi tạo
3. Thiếu environment variables

**Giải pháp:**
1. Kiểm tra MongoDB:
   ```bash
   Get-Service -Name MongoDB*
   ```

2. Kiểm tra `.env`:
   ```bash
   Get-Content .env | Select-String -Pattern "^MONGODB_URI=|^BLOCKCHAIN_NETWORK="
   ```

3. Chạy test blockchain:
   ```bash
   npm run test:blockchain
   ```

### Blockchain service không khởi tạo

**Kiểm tra `.env`:**
```env
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=c7b0ee9f14774684a619e43305849f6f
PRIVATE_KEY=ba3c022f9d4d9564e8aa8aadc211ce6dbf0f033ecfc376c746e8f08f38e707db
CONTRACT_ADDRESS_SEPOLIA=0x719E68df6082160416206416F6842915C65aFBa3
```

**Nếu thiếu, thêm vào `.env` và restart server.**

---

## 📋 CHECKLIST

- [ ] ✅ MongoDB đang chạy
- [ ] ✅ `.env` đã được cấu hình đúng
- [ ] ✅ Server đã khởi động
- [ ] ✅ Health check trả về success
- [ ] ✅ Blockchain service đã khởi tạo
- [ ] ✅ Frontend đã khởi động

---

**Bây giờ: Khởi động server và kiểm tra logs!** 🚀

