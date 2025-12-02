# Cấu hình Backend Environment Variables

## Bước 1: Generate Service Account Key

1. Trong Firebase Console, click **"Generate key"** trong modal
2. File JSON sẽ được download tự động
3. Mở file JSON vừa download

## Bước 2: Thêm vào .env

Thêm vào file `.env` ở **thư mục gốc** (cùng cấp với `package.json`):

### Option 1: Service Account Key (Recommended)

Copy toàn bộ nội dung file JSON và thêm vào `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"drug-traceability-system-d89c1","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Lưu ý quan trọng:**
- Phải copy toàn bộ JSON, bao gồm cả `private_key` với các ký tự `\n`
- Đảm bảo JSON là một dòng (hoặc escape đúng cách)
- Không có khoảng trắng thừa

### Option 2: Project ID only (Simpler)

Nếu không muốn dùng Service Account Key, chỉ cần thêm:

```env
FIREBASE_PROJECT_ID=drug-traceability-system-d89c1
```

**Lưu ý:** Option này yêu cầu default credentials từ GCP, thường chỉ hoạt động khi deploy lên Google Cloud.

## Bước 3: Kiểm tra cấu hình

Sau khi thêm vào `.env`, chạy:

```bash
node check-firebase-backend.js
```

Nếu thấy "✅ Firebase Admin SDK đã được khởi tạo thành công!" thì đã cấu hình đúng.

## Bước 4: Test

```bash
# Start backend
npm run dev

# Trong terminal khác, start frontend
cd frontend
npm start
```

Sau đó vào `http://localhost:3000/login` và test đăng nhập Google.

## Troubleshooting

### Lỗi: "Firebase Admin SDK chưa được cấu hình"
- Kiểm tra file `.env` có `FIREBASE_SERVICE_ACCOUNT_KEY` hoặc `FIREBASE_PROJECT_ID`
- Đảm bảo JSON format đúng (một dòng, escape đúng)
- Restart backend server sau khi thêm vào `.env`

### Lỗi: "JSON không hợp lệ"
- Kiểm tra lại format JSON
- Đảm bảo `private_key` có `\n` đúng cách
- Thử copy lại toàn bộ JSON từ file download

### Lỗi: "Token không hợp lệ"
- Kiểm tra Firebase config trong frontend
- Đảm bảo Project ID khớp giữa frontend và backend

