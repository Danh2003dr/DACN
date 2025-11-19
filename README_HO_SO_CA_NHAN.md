# 📋 MODULE QUẢN LÝ HỒ SƠ CÁ NHÂN

## 🎯 TỔNG QUAN

Module này cho phép user xem và cập nhật thông tin cá nhân, tổ chức, đổi mật khẩu, và quản lý cài đặt thông báo.

**Phạm vi**: Chỉ xử lý thông tin cá nhân, không bao gồm thống kê, blockchain, hoặc các module khác.

---

## 📁 CẤU TRÚC FILE

### Backend (`/`)
```
models/User.js                    # Schema User (chỉ field liên quan hồ sơ)
validators/profileValidator.js    # Joi validation
services/profileService.js        # Business logic
controllers/profileController.js  # API handlers
middlewares/
  ├── authMiddleware.js          # JWT authentication
  ├── roleMiddleware.js          # RBAC protection
  ├── uploadAvatar.js            # Multer upload
  └── errorHandler.js            # Global error handler
routes/profileRoutes.js          # API routes
```

### Frontend (`frontend/src/`)
```
api/
  ├── axiosClient.js             # Axios instance với interceptors
  └── profileApi.js              # API functions

pages/
  └── ProfilePage.js             # Trang profile chính

components/profile/
  ├── ProfileHeader.js           # Header (avatar, name, role, badges)
  ├── ProfileTabs.js            # Navigation tabs
  └── tabs/
      ├── ProfileGeneralTab.js   # Tab thông tin chung
      ├── ProfileOrganizationTab.js  # Tab thông tin tổ chức
      ├── ProfileSecurityTab.js      # Tab đổi mật khẩu
      └── ProfileNotificationTab.js  # Tab cài đặt thông báo
```

---

## 🔌 API ENDPOINTS

Tất cả API đều yêu cầu JWT token trong header: `Authorization: Bearer <token>`

### 1. GET `/api/auth/me`
**Mô tả**: Lấy thông tin profile của user hiện tại

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "...",
      "email": "...",
      "phone": "...",
      "address": "...",
      "location": { "type": "Point", "coordinates": [lng, lat], "address": "..." },
      "avatar": "/uploads/avatars/...",
      "role": "admin|manufacturer|distributor|hospital|patient",
      "organizationInfo": { "name": "...", "address": "...", "phone": "...", "email": "..." },
      "isActive": true,
      "isEmailVerified": true,
      "notificationPreferences": { "emailEnabled": true }
    }
  }
}
```

### 2. PUT `/api/auth/update-profile`
**Mô tả**: Cập nhật thông tin profile

**Body** (tất cả optional):
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0123456789",
  "address": "123 Đường ABC",
  "location": {
    "coordinates": [106.6297, 10.8231],
    "address": "123 Đường ABC, TP.HCM"
  },
  "organizationInfo": {
    "name": "Công ty ABC",
    "address": "456 Đường XYZ",
    "phone": "0987654321",
    "email": "info@abc.com"
  }
}
```

**Lưu ý**: 
- Không được sửa: `role`, `isActive`, `mustChangePassword`
- Email phải unique (nếu đổi)

### 3. POST `/api/auth/upload-avatar`
**Mô tả**: Upload avatar

**Body**: `multipart/form-data` với field `avatar` (file)
- Chỉ chấp nhận: PNG, JPG, JPEG
- Tối đa: 5MB

**Response**:
```json
{
  "success": true,
  "message": "Upload avatar thành công.",
  "data": { "user": {...} }
}
```

### 4. PUT `/api/auth/change-password`
**Mô tả**: Đổi mật khẩu

**Body**:
```json
{
  "currentPassword": "old123",
  "newPassword": "new123",
  "confirmPassword": "new123"
}
```

**Validation**:
- `newPassword` phải khác `currentPassword`
- `newPassword` tối thiểu 6 ký tự
- `confirmPassword` phải khớp với `newPassword`

### 5. PATCH `/api/auth/notification-preferences`
**Mô tả**: Cập nhật cài đặt thông báo

**Body**:
```json
{
  "emailEnabled": true
}
```

---

## 💻 CÁCH SỬ DỤNG FRONTEND

### 1. Import API functions
```javascript
import { getProfile, updateProfile, uploadAvatar, changePassword, updateNotificationPreferences } from '../api/profileApi';
```

### 2. Sử dụng trong component
```javascript
// Lấy profile
const response = await getProfile();
const user = response.data.user;

// Cập nhật profile
await updateProfile({ fullName: 'Nguyễn Văn A', phone: '0123456789' });

// Upload avatar
const formData = new FormData();
formData.append('avatar', file);
await uploadAvatar(formData);

// Đổi mật khẩu
await changePassword({ currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' });

// Cập nhật notification
await updateNotificationPreferences({ emailEnabled: true });
```

### 3. Route trong App.js
Route `/profile` đã được tích hợp vào `frontend/src/App.js`:
```javascript
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Layout>
        <ProfilePage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

---

## 🔒 BẢO MẬT & PHÂN QUYỀN

### Authentication
- Tất cả API yêu cầu JWT token
- Token được lấy từ `localStorage.getItem('token')`
- Tự động attach vào header: `Authorization: Bearer <token>`

### Authorization
- User chỉ có thể xem/sửa hồ sơ của chính mình
- Admin có thể xem/sửa bất kỳ hồ sơ nào
- Không được phép sửa: `role`, `isActive`, `mustChangePassword`

### Field Protection
Middleware `roleMiddleware.js` tự động loại bỏ các field bị cấm khỏi request body.

---

## 📝 USER SCHEMA (Tối giản)

### Fields liên quan hồ sơ cá nhân:
```javascript
{
  // Thông tin cá nhân
  fullName: String (required),
  email: String (required, unique),
  phone: String,
  address: String,
  location: { type: 'Point', coordinates: [lng, lat], address: String },
  avatar: String (URL path),
  
  // Thông tin tổ chức
  organizationInfo: {
    name: String,
    address: String,
    phone: String,
    email: String
  },
  
  // Trạng thái
  role: String (enum: admin, manufacturer, distributor, hospital, patient),
  isActive: Boolean,
  isEmailVerified: Boolean,
  mustChangePassword: Boolean,
  lastLogin: Date,
  
  // Cài đặt thông báo
  notificationPreferences: {
    emailEnabled: Boolean
  }
}
```

### Fields KHÔNG thuộc module này (không được thêm):
- `stats`
- `blockchainInfo`
- `supplyChainSettings`
- `patientInfo`
- `auditHistory`

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Phạm vi module
- ✅ Chỉ xử lý: thông tin cá nhân, tổ chức, mật khẩu, notification preferences
- ❌ Không xử lý: thống kê, blockchain, supply chain settings, audit history

### 2. API endpoints
- Chỉ có 5 endpoints như đã liệt kê
- Không tạo API mới ngoài phạm vi

### 3. Validation
- Backend: Joi validation trong `validators/profileValidator.js`
- Frontend: Validation cơ bản trong components
- Email phải unique
- Phone: 10-11 chữ số
- Password: tối thiểu 6 ký tự

### 4. File upload
- Chỉ chấp nhận: PNG, JPG, JPEG
- Tối đa: 5MB
- Lưu vào: `uploads/avatars/`
- Serve static: `/uploads/avatars/`

### 5. Error handling
- Global error handler: `middlewares/errorHandler.js`
- Format: `{ success: false, message: "...", errors: [...] }`
- 401: Token không hợp lệ → tự động redirect về `/login`

---

## 🚀 CÁCH CHẠY

### Backend
```bash
npm start
# hoặc
npm run dev
```

### Frontend
```bash
cd frontend
npm start
```

### Truy cập
- Frontend: `http://localhost:3000/profile`
- Backend API: `http://localhost:5000/api/auth/me`

---

## 📚 TÀI LIỆU THAM KHẢO

- **Code thực tế**: Xem các file trong `models/`, `controllers/`, `services/`, `routes/`, `middlewares/`
- **Frontend code**: Xem các file trong `frontend/src/pages/`, `frontend/src/components/profile/`

---

## 🔗 TÍCH HỢP VỚI HỆ THỐNG

Module này được tích hợp vào `frontend/src/App.js` với:
- ✅ `AuthProvider` - Authentication context
- ✅ `QueryClientProvider` - Data caching
- ✅ `ProtectedRoute` - Route protection
- ✅ `Layout` - Sidebar navigation
- ✅ `Toaster` - Toast notifications

Route `/profile` yêu cầu đăng nhập và hiển thị trong sidebar navigation.

---

**Tài liệu này cung cấp đủ thông tin để làm việc với module Quản lý Hồ sơ Cá nhân.**

