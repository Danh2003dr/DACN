# 🧪 Test Firebase Google Login

## Checklist trước khi test

- [ ] Backend đang chạy: `npm run dev` (Terminal 1)
- [ ] Frontend đang chạy: `cd frontend && npm start` (Terminal 2)
- [ ] Firebase config đã được thêm vào `frontend/src/config/firebase.js`
- [ ] Firebase Service Account Key đã được thêm vào `.env` (thư mục gốc)
- [ ] Đã chạy `node check-firebase-backend.js` và thấy success

## Các bước test

### 1. Kiểm tra Backend

Mở browser và vào: `http://localhost:5000/api/health`

Nếu thấy `{"success":true}` thì backend đang chạy.

### 2. Kiểm tra Frontend

Mở browser và vào: `http://localhost:3000/login`

Bạn sẽ thấy:
- Form đăng nhập bên trái
- Danh sách demo accounts bên phải
- Nút "Đăng nhập với Google" (có logo Google)

### 3. Test đăng nhập Google

1. **Click nút "Đăng nhập với Google"** (KHÔNG truy cập trực tiếp URL `/api/auth/google`)

2. **Cho phép popup:**
   - Nếu browser chặn popup, click vào icon popup bị chặn
   - Chọn "Always allow popups from this site"

3. **Chọn Google account:**
   - Popup Google sẽ hiện ra
   - Chọn account và authorize

4. **Kiểm tra kết quả:**
   - Nếu thành công: Sẽ redirect đến `/dashboard`
   - Nếu lỗi: Sẽ hiển thị thông báo lỗi màu đỏ trên form

## Troubleshooting

### Lỗi: "Route not found"
- **Nguyên nhân:** Backend chưa start hoặc route chưa được register
- **Giải pháp:** 
  - Kiểm tra backend đang chạy: `http://localhost:5000/api/health`
  - Restart backend: `npm run dev`

### Lỗi: "Backend chưa sẵn sàng"
- **Nguyên nhân:** Backend không chạy hoặc không kết nối được
- **Giải pháp:**
  - Kiểm tra backend đang chạy
  - Kiểm tra URL trong `frontend/src/utils/api.js` đúng chưa

### Lỗi: "Firebase Admin SDK chưa được cấu hình"
- **Nguyên nhân:** Chưa thêm Service Account Key vào `.env`
- **Giải pháp:**
  - Chạy: `node convert-firebase-key.js <path-to-json>`
  - Hoặc thêm thủ công vào `.env`
  - Restart backend

### Lỗi: "Popup bị chặn"
- **Nguyên nhân:** Browser chặn popup
- **Giải pháp:**
  - Click vào icon popup bị chặn trên address bar
  - Chọn "Always allow popups from this site"
  - Refresh trang và thử lại

### Lỗi: "Token không hợp lệ"
- **Nguyên nhân:** Firebase config không đúng hoặc Project ID không khớp
- **Giải pháp:**
  - Kiểm tra Firebase config trong `frontend/src/config/firebase.js`
  - Đảm bảo Project ID: `drug-traceability-system-d89c1`

## Debug

Mở **Browser Console** (F12) để xem lỗi chi tiết:

1. Click nút "Đăng nhập với Google"
2. Mở Console (F12 → Console tab)
3. Xem các lỗi (màu đỏ)
4. Copy lỗi và báo lại

## Expected Flow

1. User click "Đăng nhập với Google"
2. Firebase popup hiện ra
3. User chọn Google account
4. Firebase trả về ID token
5. Frontend gửi ID token lên `/api/auth/firebase`
6. Backend verify token và tạo JWT
7. Frontend lưu JWT và redirect đến `/dashboard`

