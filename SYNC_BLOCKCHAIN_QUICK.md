# ⚡ Quick Start - Sync Dữ Liệu Thuốc Lên Blockchain

## 🚀 Chạy Ngay

### Bước 1: Kiểm tra trạng thái

```bash
npm run check:blockchain
```

Sẽ hiển thị:
- Tổng số lô thuốc
- Số lô đã sync
- Số lô chưa sync
- Danh sách lô chưa sync

### Bước 2: Sync dữ liệu

```bash
npm run sync:blockchain
```

Script sẽ tự động:
- ✅ Tìm tất cả thuốc chưa sync
- ✅ Ghi lên blockchain
- ✅ Cập nhật database
- ✅ Báo cáo kết quả

---

## 📋 Ví Dụ Output

### Kiểm tra:
```
📦 Tổng số lô thuốc: 25
✅ Đã sync lên blockchain: 15
❌ Chưa sync lên blockchain: 10
```

### Sync:
```
🚀 Bắt đầu sync dữ liệu thuốc lên blockchain...
📦 Tìm thấy 10 lô thuốc cần sync

[1/10] Đang sync: Paracetamol (BATCH001)
  ✅ Đã sync thành công: DRUG_ABC123

✅ Thành công: 10
❌ Thất bại: 0
```

---

## ⚙️ Cấu Hình

Đảm bảo `.env` có:

```env
# Development (Mock - không cần kết nối thật)
BLOCKCHAIN_NETWORK=development

# Hoặc Testnet (cần config đầy đủ)
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your_id
PRIVATE_KEY=your_key
CONTRACT_ADDRESS=0x...
```

---

## ❓ FAQ

**Q: Có thể chạy nhiều lần không?**  
A: ✅ Có, script sẽ tự động bỏ qua thuốc đã sync.

**Q: Có ảnh hưởng đến dữ liệu hiện tại không?**  
A: ✅ Không, chỉ cập nhật các thuốc chưa có blockchain data.

**Q: Mất bao lâu?**  
A: ⏱️ Tùy số lượng, mỗi thuốc ~0.5-1 giây (development) hoặc ~5-10 giây (testnet).

---

**Chạy ngay:** `npm run sync:blockchain` 🎉

