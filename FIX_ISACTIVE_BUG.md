# 🐛 FIX: Lỗi "Tài khoản bị vô hiệu hóa" sau khi cập nhật profile

## ❌ VẤN ĐỀ

Sau khi cập nhật thông tin profile, badge hiển thị "Tài khoản bị vô hiệu hóa" mặc dù tài khoản vẫn hoạt động bình thường. Khi refresh lại thì hiển thị đúng.

## 🔍 NGUYÊN NHÂN

### 1. Logic hiển thị trong `ProfileHeader.js`:
```jsx
{user?.isActive ? (
  // Tài khoản hoạt động
) : (
  // Tài khoản bị vô hiệu hóa
)}
```

**Vấn đề:** Nếu `user.isActive` là `undefined` hoặc `null`, thì sẽ hiển thị "Tài khoản bị vô hiệu hóa" vì `undefined` là falsy.

### 2. Backend trả về user object:
Trong `services/profileService.js`, hàm `updateProfile` trả về:
```javascript
return {
  // ... other fields ...
  isActive: updatedUser.isActive,  // Có thể bị undefined
  // ...
};
```

**Vấn đề:** Nếu `updatedUser.isActive` không được trả về đúng cách từ Mongoose, hoặc bị thiếu trong response, thì frontend sẽ nhận `undefined`.

### 3. Mongoose `findByIdAndUpdate`:
```javascript
const updatedUser = await User.findByIdAndUpdate(
  userId,
  updateData,
  { new: true, runValidators: true }
);
```

**Vấn đề:** Nếu `updateData` không chứa `isActive`, và user trong database có `isActive: true`, thì `updatedUser.isActive` vẫn phải có giá trị. Nhưng có thể có vấn đề với cách select fields.

---

## ✅ GIẢI PHÁP

### **Giải pháp 1: Sửa logic hiển thị trong Frontend (KHUYẾN NGHỊ)**

Sửa `ProfileHeader.js` để kiểm tra `isActive` một cách rõ ràng:

```jsx
// Thay vì:
{user?.isActive ? (
  // Tài khoản hoạt động
) : (
  // Tài khoản bị vô hiệu hóa
)}

// Sửa thành:
{user?.isActive === true ? (
  // Tài khoản hoạt động
) : user?.isActive === false ? (
  // Tài khoản bị vô hiệu hóa
) : null}
```

Hoặc đơn giản hơn:
```jsx
{user?.isActive !== false && (
  <span>Tài khoản hoạt động</span>
)}
{user?.isActive === false && (
  <span>Tài khoản bị vô hiệu hóa</span>
)}
```

### **Giải pháp 2: Đảm bảo Backend luôn trả về `isActive`**

Sửa `services/profileService.js` để đảm bảo `isActive` luôn có giá trị:

```javascript
return {
  // ... other fields ...
  isActive: updatedUser.isActive !== undefined ? updatedUser.isActive : true,
  // ...
};
```

Hoặc tốt hơn, đảm bảo query trả về đầy đủ fields:
```javascript
const updatedUser = await User.findByIdAndUpdate(
  userId,
  updateData,
  { new: true, runValidators: true }
).select('+isActive'); // Nếu isActive bị select: false
```

### **Giải pháp 3: Kiểm tra response từ API**

Đảm bảo response từ API luôn có `isActive`:
- Kiểm tra Network tab trong DevTools
- Xem response body có chứa `isActive` không
- Nếu không có, cần sửa backend

---

## 🎯 KHUYẾN NGHỊ

**Sửa cả 2 chỗ:**

1. **Frontend:** Sửa logic hiển thị để xử lý `undefined` đúng cách
2. **Backend:** Đảm bảo luôn trả về `isActive` trong response

---

## 📝 CÁCH KIỂM TRA

1. Mở DevTools (F12) → Network tab
2. Cập nhật profile
3. Xem response của API `PUT /api/auth/update-profile`
4. Kiểm tra `response.data.user.isActive` có giá trị không
5. Nếu `undefined` → Vấn đề ở backend
6. Nếu có giá trị nhưng vẫn hiển thị sai → Vấn đề ở frontend logic

