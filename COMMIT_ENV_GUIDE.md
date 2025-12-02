# Hướng dẫn Commit File .env

## ⚠️ Lưu ý quan trọng

GitHub đã phát hiện **Google Cloud Service Account Credentials** trong file `.env` và chặn push để bảo vệ secrets.

## ✅ Giải pháp được khuyến nghị

### Option 1: Không commit .env (AN TOÀN NHẤT)
- File `.env` chứa thông tin nhạy cảm (private keys, credentials)
- Chỉ commit `env.example` với các giá trị mẫu
- Mỗi người tự tạo `.env` từ `env.example`

### Option 2: Commit với giá trị TEST (Nếu đồ án chỉ dùng test data)
Nếu bạn muốn commit để dễ setup, có thể:

1. **Tạo file `.env.test`** với các giá trị test:
   ```bash
   cp .env .env.backup  # Backup file thật
   # Sửa .env, thay thế các giá trị thật bằng test values
   # Ví dụ:
   # PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
   # FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"test-project",...}
   ```

2. **Commit file đã thay đổi**

### Option 3: Bypass GitHub Protection (CHỈ KHI THỰC SỰ CẦN)
Nếu đây là đồ án nội bộ và repo là private:

1. Truy cập link được GitHub cung cấp:
   ```
   https://github.com/Danh2003dr/DACN/security/secret-scanning/unblock-secret/36IkYgOiXQ8ArKyOe7Q3Bg9x6lr
   ```

2. Chọn "Allow this secret" (chỉ làm khi thực sự cần thiết)

3. Push lại:
   ```bash
   git push origin main
   ```

## 📝 Khuyến nghị

**Tốt nhất là KHÔNG commit file .env thật**, vì:
- Bảo mật tốt hơn
- Tránh rủi ro leak secrets
- Mỗi người có thể dùng giá trị riêng

Chỉ cần commit `env.example` là đủ, các thành viên khác có thể:
```bash
cp env.example .env
# Sau đó điền thông tin thật vào .env
```

