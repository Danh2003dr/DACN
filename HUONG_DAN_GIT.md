# 📤 HƯỚNG DẪN PUSH CODE LÊN GIT

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Branch hiện tại đang behind origin/main 5 commits** - Cần pull trước
2. **File `.env` đã bị modified** - KHÔNG nên commit file này (chứa thông tin nhạy cảm)
3. **Có nhiều file uploads/avatars và qr-codes** - Có thể không cần commit

---

## 📋 CÁC BƯỚC THỰC HIỆN

### **Bước 1: Cập nhật .gitignore (Nếu cần)**

Đảm bảo `.gitignore` có các dòng sau:
```
node_modules
.env
.env.local
uploads/
qr-codes/
*.log
.DS_Store
```

### **Bước 2: Pull code mới nhất từ remote**

```bash
git pull origin main
```

**Nếu có conflict:**
- Giải quyết conflict
- Sau đó: `git add .` và `git commit`

### **Bước 3: Add các file cần commit**

**Các file QUAN TRỌNG cần commit:**
```bash
# Module Profile mới
git add controllers/profileController.js
git add services/profileService.js
git add routes/profileRoutes.js
git add validators/
git add middlewares/
git add frontend/src/api/
git add frontend/src/components/profile/
git add frontend/src/pages/ProfilePage.js

# File đã sửa
git add frontend/src/App.js
git add frontend/src/components/Layout.js
git add server.js
git add models/User.js

# Tài liệu
git add README_HO_SO_CA_NHAN.md
git add KIEM_TRA_PROFILE.md
git add FIX_ISACTIVE_BUG.md
```

**Các file KHÔNG nên commit:**
```bash
# File nhạy cảm
.env

# File upload (nếu không cần)
uploads/avatars/
qr-codes/

# File reports (nếu không cần)
reports/
```

### **Bước 4: Commit**

```bash
git commit -m "feat: Thêm module Quản lý Hồ sơ Cá nhân

- Thêm backend: controllers, services, routes, validators, middlewares
- Thêm frontend: ProfilePage, ProfileHeader, ProfileTabs và các tab components
- Sửa Layout component để hỗ trợ children prop
- Sửa lỗi hiển thị isActive badge
- Thêm tài liệu hướng dẫn"
```

### **Bước 5: Push lên remote**

```bash
git push origin main
```

---

## 🚀 LỆNH NHANH (Nếu chắc chắn)

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Add tất cả file (trừ .env, uploads, qr-codes nếu đã ignore)
git add .

# 3. Commit
git commit -m "feat: Thêm module Quản lý Hồ sơ Cá nhân"

# 4. Push
git push origin main
```

---

## ⚠️ NẾU GẶP LỖI

### Lỗi: "Your branch is behind"
```bash
git pull origin main
# Giải quyết conflict nếu có
git push origin main
```

### Lỗi: "Permission denied"
- Kiểm tra SSH key hoặc token
- Kiểm tra quyền truy cập repository

### Lỗi: "Merge conflict"
```bash
# Xem conflict
git status

# Sửa conflict trong file
# Sau đó:
git add .
git commit -m "fix: Resolve merge conflict"
git push origin main
```

---

## ✅ CHECKLIST TRƯỚC KHI PUSH

- [ ] Đã pull code mới nhất từ remote
- [ ] Đã kiểm tra .gitignore (không commit .env, uploads)
- [ ] Đã test code hoạt động đúng
- [ ] Đã viết commit message rõ ràng
- [ ] Đã kiểm tra không có file nhạy cảm

