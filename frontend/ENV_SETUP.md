# Cấu hình Environment Variables

## Tạo file .env trong thư mục frontend

Tạo file `.env` trong thư mục `frontend/` với nội dung sau:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyACqT54Gs7kFLR9L0mxBywlGn3tlb2Nko0
REACT_APP_FIREBASE_AUTH_DOMAIN=drug-traceability-system-d89c1.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=drug-traceability-system-d89c1
REACT_APP_FIREBASE_STORAGE_BUCKET=drug-traceability-system-d89c1.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=874430072046
REACT_APP_FIREBASE_APP_ID=1:874430072046:web:9f7e282ff5b05895eb1fff
REACT_APP_FIREBASE_MEASUREMENT_ID=G-4BLHL8MNOY
```

## Lưu ý

- File `.env` đã được cấu hình trong `.gitignore` nên sẽ không bị commit lên Git
- Nếu không tạo file `.env`, app vẫn hoạt động vì đã có fallback config trong `firebase.js`
- Tuy nhiên, nên dùng `.env` để dễ quản lý và thay đổi config

## Kiểm tra

Sau khi tạo file `.env`, chạy:
```bash
cd frontend
node check-firebase-config.js
```

