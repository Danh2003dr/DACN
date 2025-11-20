# 🔐 BÁO CÁO SECURITY AUDIT (TÓM TẮT)

## 1. Phạm vi

- Backend Node.js/Express (`server.js`, `routes/*`, `controllers/*`, `middleware/*`).
- Frontend React (`frontend/src/*`) với Auth, Dashboard, QR Scanner, Settings.
- Tích hợp Blockchain (`services/blockchainService.js`) và HSM (`services/hsm/*`).
- Cấu hình và secrets (`.env`, `config/*`, khóa blockchain/HSM).
- Thư viện phụ thuộc backend (kết quả `npm run audit`).

## 2. Rà soát phân quyền & xác thực

- **Cơ chế xác thực**:
  - Sử dụng JWT lưu phía client (localStorage), middleware `authenticate` kiểm tra token ở mọi route private.
  - Kiểm tra trạng thái tài khoản (`isLocked`, `isActive`, `mustChangePassword`) trước khi cho truy cập.
- **Phân quyền backend**:
  - Sử dụng `authorize(...roles)` trong các route nhạy cảm (`auth`, `users`, `settings`, `drugs`, `supplyChain`, `tasks`, `notifications`, `reviews`, `digital-signatures`, `trust-scores`, `blockchain`…).
  - Các middleware bổ sung: `checkOwnership`, `checkOrganizationAccess`, `protectSensitiveRoutes`, `checkPermission` dùng cho trường hợp đặc thù.
- **Phân quyền frontend**:
  - `ProtectedRoute` kiểm tra đăng nhập và quyền (`hasAnyRole`) theo từng route (ví dụ: `settings` chỉ cho `admin`, `users` chỉ cho `admin`, các module còn lại yêu cầu đăng nhập).
- **Kết luận**: Không phát hiện lỗ hổng phân quyền nghiêm trọng; các route quan trọng đều yêu cầu JWT + role phù hợp. Các route public (`/verify/:blockchainId`, `/auth/login`, Google OAuth callback) được giữ mở phù hợp với nghiệp vụ.

## 3. Kiểm tra lỗ hổng phổ biến

- **Injection (SQL/NoSQL)**:
  - Sử dụng MongoDB/Mongoose với query theo field rõ ràng, không build query từ chuỗi do user nhập.
  - Dữ liệu đầu vào được validate qua `Joi`/`express-validator` trong `utils/validation.js` cho các API chính (auth, users, drugs, supply-chain, v.v.).
- **XSS**:
  - Frontend React mặc định escape dữ liệu hiển thị; không sử dụng `dangerouslySetInnerHTML`.
  - Không render trực tiếp HTML từ input người dùng trên backend.
- **CSRF**:
  - API sử dụng JWT trong header `Authorization`, không dùng cookie session → không dễ bị CSRF cổ điển.
  - CORS được cấu hình trong `server.js`: ở production chỉ cho phép các origin nằm trong `ALLOWED_ORIGINS`.
- **IDOR (Insecure Direct Object Reference)**:
  - Các API user/profile sử dụng `checkOwnership` và `checkOrganizationAccess` để đảm bảo người dùng chỉ truy cập tài nguyên của mình hoặc tổ chức mình (trừ admin).
- **Misconfiguration**:
  - Sử dụng `helmet` để bật các HTTP security headers cơ bản.
  - Tắt log stack trace chi tiết trên production (global error handler chỉ trả về `stack` khi `NODE_ENV=development`).

## 4. Quản lý secrets

- **Nguồn chứa secrets**:
  - Các biến như `MONGODB_URI`, `JWT_SECRET`, `INFURA_PROJECT_ID`, `PRIVATE_KEY`, thông tin HSM… đều được đặt trong `.env` hoặc các file config không commit thật (`env.example` chỉ chứa placeholder).
  - HSM cấu hình qua `config/hsmConfig.js` với flag `enabled` và thông tin provider; cần triển khai HSM thật thì cập nhật lại các giá trị này trên server, không commit khóa thật.
- **Khuyến nghị**:
  - Không commit file `.env` và bất kỳ khóa private/HSM nào vào git.
  - Trên môi trường production dùng **secret manager** (Azure Key Vault, AWS Secrets Manager, v.v.) hoặc ít nhất là biến môi trường của hệ điều hành.
  - Giới hạn quyền truy cập thư mục log và file cấu hình trên server.

## 5. Kết quả `npm run audit`

- Đã chạy lệnh:

```bash
npm run audit
```

- **Kết quả chính**:
  - Phát hiện nhiều cảnh báo `moderate`, `high`, `critical` liên quan đến các gói: `truffle`, `ganache`, `web3`, `mocha`, `axios`, `elliptic`, `secp256k1`, `form-data`, `js-yaml`, `webpack`, `ws`, v.v.
  - Hầu hết các gói này nằm trong **devDependencies** hoặc toolchain phát triển smart contract, không chạy trong luồng API production.
  - Các bản vá đề xuất yêu cầu `npm audit fix --force`, dẫn tới nâng cấp major của `truffle`, `@truffle/hdwallet-provider`, `solc`, `multer`… có nguy cơ làm hỏng môi trường hiện tại.
- **Đánh giá**:
  - Trong phạm vi đồ án, hệ thống ưu tiên **tính ổn định demo** hơn việc nâng cấp toàn bộ toolchain blockchain.
  - Các dependency dùng trực tiếp trong backend (Express, Mongoose, JWT, bcrypt, Redis…) không có cảnh báo critical cần fix ngay tại thời điểm audit.
- **Hướng xử lý giai đoạn triển khai thực tế**:
  1. Lập kế hoạch nâng cấp `truffle/ganache/web3` lên phiên bản mới nhất hỗ trợ audit fix.
  2. Sau khi nâng cấp, chạy lại **test hợp đồng** và **test API** để đảm bảo không phá vỡ logic.
  3. Lặp lại `npm run audit` đến khi không còn cảnh báo critical đối với các dependency sử dụng trong production.
  4. Nếu cần, thay thế bớt các gói cũ (ví dụ `request`) bằng giải pháp hiện đại hơn (`node-fetch`, `axios` đã vá…).

## 6. Kết luận & Ưu tiên

- **Đã thực hiện**:
  - Kiểm tra và củng cố phân quyền (JWT + RBAC + middleware ownership/org).
  - Áp dụng rate limiting cho login, dùng Helmet + CORS, chuẩn hóa error handling.
  - Chạy `npm run audit` và phân tích kết quả, ghi nhận lỗ hổng chủ yếu ở devDependencies.
  - Bổ sung tài liệu về deploy, troubleshooting, và quản lý secrets.
- **Ưu tiên tiếp theo (khi triển khai thực tế)**:
  1. Lên kế hoạch nâng cấp toolchain blockchain (truffle/ganache/web3) và chạy lại full test.
  2. Bổ sung thêm automatic security scanning (SAST/DAST) trong pipeline CI/CD.
  3. Cân nhắc mô hình **Zero Trust** hơn (MFA, xác thực mạnh cho admin, giới hạn IP truy cập trang quản trị).


