# 🔍 Debug Firebase Google Login

## Tình trạng hiện tại

Backend đang chạy ✅ (`http://localhost:5000/api/health` trả về success)

Nhưng vẫn có lỗi "Backend chưa sẵn sàng" khi click "Đăng nhập với Google"

## Các bước debug

### 1. Mở Browser Console

1. Vào `http://localhost:3000/login`
2. Nhấn **F12** để mở Developer Tools
3. Chọn tab **Console**

### 2. Click "Đăng nhập với Google"

1. Click nút "Đăng nhập với Google"
2. Xem Console có lỗi gì không (màu đỏ)

### 3. Kiểm tra các lỗi phổ biến

#### Lỗi: "auth/popup-blocked"
- **Nguyên nhân:** Browser chặn popup
- **Giải pháp:** 
  - Click icon popup bị chặn trên address bar
  - Chọn "Always allow popups from this site"
  - Refresh trang và thử lại

#### Lỗi: "auth/network-request-failed"
- **Nguyên nhân:** Không kết nối được Firebase
- **Giải pháp:**
  - Kiểm tra internet
  - Kiểm tra Firebase config trong `frontend/src/config/firebase.js`

#### Lỗi: "404" hoặc "Route not found"
- **Nguyên nhân:** Backend route chưa được register
- **Giải pháp:**
  - Kiểm tra backend đang chạy: `http://localhost:5000/api/health`
  - Restart backend: `npm run dev`

#### Lỗi: "503" hoặc "Firebase Admin SDK chưa được cấu hình"
- **Nguyên nhân:** Chưa thêm Service Account Key
- **Giải pháp:**
  - Chạy: `node check-firebase-backend.js`
  - Nếu fail, thêm Service Account Key vào `.env`

### 4. Kiểm tra Network Tab

1. Mở Developer Tools (F12)
2. Chọn tab **Network**
3. Click "Đăng nhập với Google"
4. Tìm request đến `/api/auth/firebase`
5. Xem:
   - Status code (200 = OK, 404 = not found, 500 = server error)
   - Response body (có message gì không)

## Test thủ công

### Test 1: Kiểm tra Firebase config

Mở Console và chạy:
```javascript
// Kiểm tra Firebase đã được import chưa
import { auth } from './config/firebase';
console.log('Firebase auth:', auth);
```

### Test 2: Test Firebase popup

Mở Console và chạy:
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './config/firebase';

const provider = new GoogleAuthProvider();
signInWithPopup(auth, provider)
  .then((result) => {
    console.log('Success:', result);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```

## Expected Console Logs

Khi click "Đăng nhập với Google", bạn sẽ thấy:

1. **Firebase popup mở ra** (nếu không bị chặn)
2. **Console log:** `Google login error:` (nếu có lỗi)
3. **Network request:** `POST /api/auth/firebase` với status 200 (nếu thành công)

## Quick Fix

Nếu vẫn không hoạt động, thử:

1. **Clear browser cache:**
   - Ctrl + Shift + Delete
   - Chọn "Cached images and files"
   - Clear data

2. **Restart cả frontend và backend:**
   ```bash
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

3. **Kiểm tra lại Firebase config:**
   - Mở `frontend/src/config/firebase.js`
   - Đảm bảo config đúng với Firebase Console

## Copy lỗi từ Console

Nếu vẫn lỗi, copy toàn bộ lỗi từ Console (F12 → Console) và gửi lại để tôi debug chi tiết hơn.

