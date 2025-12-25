# AI Service (Risk Scoring)

Service này chạy độc lập với backend hiện tại. Mục tiêu:

- **Không sửa backend**.
- Nhận request từ frontend, **proxy** sang backend (kèm `Authorization`), lấy dữ liệu và tính **risk scoring** cho lô thuốc.
- Trả về kết quả rủi ro dạng `score/level/factors`.

## Cấu hình

Tạo file `.env` (hoặc set env vars):

- `PORT` (mặc định `5055`)
- `BACKEND_API_URL` (mặc định `http://localhost:5000/api`)
- `BACKEND_SERVICE_TOKEN` (tuỳ chọn) Bearer token dùng khi request không có `Authorization`
- `CORS_ORIGIN` (mặc định `*`)
- `CACHE_TTL_MS` (mặc định `60000`)
- `CONCURRENCY` (mặc định `6`)

## Chạy local

```bash
cd ai-service
npm install
npm run start
```

Kiểm tra:

- `GET /health`
- `GET /risk/drugs?page=1&limit=10`

> Lưu ý: nếu không set `BACKEND_SERVICE_TOKEN`, bạn phải gửi header `Authorization: Bearer <token>` giống như frontend.

## Frontend sử dụng AI service

Set biến môi trường cho frontend:

- `REACT_APP_AI_SERVICE_URL=http://localhost:5055`

Khi có biến này, trang `Drugs` sẽ gọi AI service để lấy risk. Nếu không có, hệ thống fallback heuristic local.


