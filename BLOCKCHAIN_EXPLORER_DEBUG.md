# 🔍 Blockchain Explorer - Debug Guide

Hướng dẫn debug khi Blockchain Explorer không hiển thị dữ liệu.

## ✅ Đã Thực Hiện

### 1. Seed Dữ Liệu ✅
- Đã chạy script seed: `node scripts/seed-blockchain-transactions.js`
- Kết quả: **154 transactions** đã được tạo trong database
- Status: Success (56), Failed (54), Pending (44)
- Networks: Sepolia (35), Development (43), BSC Testnet (44), Polygon Mumbai (32)

### 2. Thêm Logging ✅

#### Frontend (`frontend/src/pages/BlockchainExplorer.js`)
- ✅ Thêm console.log để debug response từ API
- ✅ Log response type, keys, transactions count, pagination
- ✅ Xử lý cả `response.data.transactions` và `response.transactions`

#### Backend (`controllers/blockchainController.js`)
- ✅ Thêm console.log để debug request params
- ✅ Log service result (success, transactions count, pagination)
- ✅ Log response trước khi gửi về frontend
- ✅ Log errors với stack trace

---

## 🔍 Cách Debug

### 1. Kiểm Tra Browser Console

1. Mở trang Blockchain Explorer: `http://localhost:3000/blockchain/explorer`
2. Mở Browser Console (F12 → Console tab)
3. Refresh trang (F5)
4. Xem các log messages:
   - `Blockchain Explorer - API Response:` - Response từ API
   - `Response type:` - Type của response
   - `Response keys:` - Các keys trong response
   - `Transactions found:` - Số lượng transactions
   - `Pagination:` - Thông tin pagination

### 2. Kiểm Tra Backend Console

1. Xem terminal chạy backend (`npm run dev`)
2. Khi frontend gọi API, sẽ thấy logs:
   - `Blockchain Explorer - Request params:` - Params từ request
   - `Blockchain Explorer - Service result:` - Kết quả từ service
   - `Blockchain Explorer - Sending response:` - Response sẽ gửi về

### 3. Kiểm Tra Network Tab

1. Mở Browser DevTools (F12)
2. Vào tab **Network**
3. Refresh trang
4. Tìm request: `GET /api/blockchain/transactions`
5. Click vào request để xem:
   - **Headers**: Request headers, response headers
   - **Payload**: Query params
   - **Response**: Response body từ server

### 4. Kiểm Tra Database

```bash
# MongoDB
mongosh
use drug-traceability
db.blockchaintransactions.countDocuments()
db.blockchaintransactions.find().limit(5)
```

---

## 🐛 Các Vấn Đề Thường Gặp

### 1. Response Format Không Đúng

**Triệu chứng:**
- Console log: `Response keys: ['data']` nhưng `response.success` = undefined

**Nguyên nhân:**
- API trả về `{ data: { ... } }` nhưng frontend expect `{ success: true, data: { ... } }`

**Giải pháp:**
- Đã sửa frontend để xử lý cả 2 format
- Kiểm tra backend response format trong Network tab

### 2. Authentication Token Thiếu

**Triệu chứng:**
- Console log: `401 Unauthorized`
- Network tab: Response `{"success":false,"message":"Không có token xác thực..."}`

**Giải pháp:**
- Đảm bảo đã đăng nhập
- Kiểm tra token trong localStorage: `localStorage.getItem('token')`
- Kiểm tra API interceptor có thêm token vào headers không

### 3. Database Không Có Dữ Liệu

**Triệu chứng:**
- Backend log: `transactionsCount: 0`
- Database query: `countDocuments() = 0`

**Giải pháp:**
```bash
# Chạy lại script seed
node scripts/seed-blockchain-transactions.js
```

### 4. API Endpoint Sai

**Triệu chứng:**
- Network tab: `404 Not Found`
- Console log: `Error loading transactions: Request failed with status code 404`

**Giải pháp:**
- Kiểm tra route trong `routes/blockchain.js`
- Kiểm tra baseURL trong `frontend/src/utils/api.js`
- Đảm bảo backend đang chạy tại `http://localhost:5000`

### 5. CORS Error

**Triệu chứng:**
- Console log: `CORS policy: No 'Access-Control-Allow-Origin' header`
- Network tab: Request failed với CORS error

**Giải pháp:**
- Kiểm tra CORS config trong `server.js`
- Đảm bảo `http://localhost:3000` được allow trong CORS

---

## 📋 Checklist Debug

- [ ] Backend đang chạy tại `http://localhost:5000`
- [ ] Frontend đang chạy tại `http://localhost:3000`
- [ ] Đã đăng nhập (có token trong localStorage)
- [ ] Database có dữ liệu (chạy `db.blockchaintransactions.countDocuments()`)
- [ ] Browser Console không có errors
- [ ] Network tab: Request `/api/blockchain/transactions` thành công (200)
- [ ] Response có format: `{ success: true, data: { transactions: [...], pagination: {...} } }`
- [ ] Frontend log: `Transactions found: > 0`

---

## 🎯 Next Steps

1. **Mở Browser Console** và xem logs khi load trang
2. **Kiểm tra Network tab** để xem API response
3. **Kiểm tra Backend Console** để xem server logs
4. **Chia sẻ logs** nếu vẫn không hiển thị dữ liệu

---

**Last Updated:** 2024-11-30

