# Hướng dẫn Restart Backend Server

## Vấn đề
Server đang chạy nhưng chưa load routes mới cho `/api/bids`, dẫn đến lỗi 404.

## Giải pháp

### Cách 1: Restart thủ công (Khuyên dùng)

1. **Tìm terminal đang chạy backend server**
   - Có thể là terminal riêng hoặc tab trong VS Code
   - Terminal đó sẽ hiển thị log như "Server running on port 5000"

2. **Dừng server:**
   - Nhấn `Ctrl + C` trong terminal đó
   - Hoặc đóng terminal và mở lại

3. **Khởi động lại server:**
   ```bash
   npm start
   ```
   hoặc nếu dùng nodemon:
   ```bash
   nodemon server.js
   ```

4. **Kiểm tra console output:**
   - Tìm dòng "Server running on port 5000"
   - Không có lỗi khi load routes

5. **Refresh frontend:**
   - Nhấn `F5` hoặc `Ctrl + R` trong browser
   - Lỗi 404 sẽ hết

### Cách 2: Dùng PowerShell/Terminal

```powershell
# Dừng process trên port 5000
netstat -ano | findstr :5000
# Lấy Process ID từ output (ví dụ: 13984)
taskkill /PID 13984 /F

# Chờ vài giây
timeout /t 2

# Khởi động lại server
npm start
```

### Cách 3: Dùng file batch (Windows)

Chạy file `restart-server.bat` trong thư mục gốc của project.

## Sau khi restart

Các API endpoints sau sẽ hoạt động:
- ✅ `POST /api/bids` - Tạo bid mới
- ✅ `GET /api/bids/my-bids` - Lấy bids của user
- ✅ `GET /api/bids/manufacturer-bids` - Lấy bids cho manufacturer
- ✅ `PUT /api/bids/:id/counter-offer` - Gửi counter offer
- ✅ `PUT /api/bids/:id/accept` - Chấp nhận bid

## Lưu ý

- Nếu dùng `nodemon`, server sẽ tự động restart khi file thay đổi
- Nếu không dùng nodemon, bạn cần restart thủ công mỗi khi sửa backend code
- Luôn kiểm tra console output để đảm bảo không có lỗi khi khởi động

