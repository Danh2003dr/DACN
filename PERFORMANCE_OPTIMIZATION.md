# Performance Optimization Guide

Tài liệu này mô tả các tối ưu hóa hiệu năng đã được triển khai trong hệ thống.

## 📋 Mục lục

1. [MongoDB Indexes](#mongodb-indexes)
2. [Redis Caching](#redis-caching)
3. [Blockchain Pipeline Optimization](#blockchain-pipeline-optimization)
4. [Benchmarking](#benchmarking)

## 🗄️ MongoDB Indexes

### Tổng quan

Đã bổ sung indexes cho các collection chính để tối ưu các truy vấn phổ biến:

- **Drug**: `manufacturerId + createdAt`, `status + expiryDate`, `blockchain.blockchainId`
- **DigitalSignature**: `targetType + targetId + status`, `signedBy + status + createdAt`
- **SupplyChain**: `drugId + status + createdAt`, `currentLocation.actorId + status`
- **SignatureBatch**: `status + targetType + createdAt`, `createdBy + status`
- **SignatureTemplate**: `status + targetType + createdAt`
- **CAProvider**: `code + status`, `status + type`

### Cách sử dụng

Chạy script để tối ưu indexes:

```bash
npm run optimize:indexes
```

Script này sẽ:
- Tạo các indexes cần thiết cho tất cả collections
- Hiển thị thống kê số lượng indexes sau khi tối ưu
- An toàn để chạy nhiều lần (idempotent)

### Kiểm tra indexes hiện tại

```javascript
// Trong MongoDB shell
db.drugs.getIndexes()
db.digitalsignatures.getIndexes()
db.supplychains.getIndexes()
```

## 🔴 Redis Caching

### Cấu hình

Thêm vào file `.env`:

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=  # Optional, để trống nếu không có password
```

### Cách hoạt động

1. **Tự động cache**: Middleware `cacheMiddleware` tự động cache response cho GET requests
2. **TTL (Time To Live)**: Mỗi route có TTL riêng:
   - `/api/blockchain/stats`: 120 giây (2 phút)
   - `/api/digital-signatures/stats`: 120 giây
   - `/api/digital-signatures/templates`: 300 giây (5 phút)
   - `/api/digital-signatures/ca/providers`: 600 giây (10 phút)
   - `/api/blockchain/drugs`: 180 giây (3 phút)

3. **Cache invalidation**: Tự động xóa cache khi dữ liệu thay đổi (POST/PUT/DELETE)

### Cache Headers

Response headers sẽ chứa:
- `X-Cache: HIT` - Dữ liệu từ cache
- `X-Cache: MISS` - Dữ liệu từ database/blockchain

### Manual Cache Control

```javascript
const { invalidateCache, invalidateRouteCache } = require('./middleware/cache');

// Xóa cache theo pattern
await invalidateCache('cache:api/drugs:*');

// Xóa cache cho một route cụ thể
await invalidateRouteCache('/api/digital-signatures/stats', userId);
```

### Fallback

Nếu Redis không khả dụng, hệ thống sẽ tự động chạy không có cache (graceful degradation).

## ⛓️ Blockchain Pipeline Optimization

### Lazy Verification

Thay vì verify mỗi lần truy vấn, hệ thống chỉ verify khi:
- User yêu cầu verify rõ ràng (`forceVerify = true`)
- Dữ liệu bị nghi ngờ (cần re-verify)

```javascript
// Lazy verification (mặc định)
const result = await blockchainService.verifyDrugBatch(drugId);

// Force verification (ghi nhận lên blockchain)
const result = await blockchainService.verifyDrugBatch(drugId, true);
```

### Batch Verification

Verify nhiều drugs cùng lúc để giảm số lần gọi contract:

```javascript
const drugIds = ['DRUG_001', 'DRUG_002', 'DRUG_003'];
const results = await blockchainService.verifyDrugBatchBatch(drugIds);
// results: { success: true, results: [...], total: 3, cached: 1, verified: 2 }
```

### Caching Blockchain Data

Các operations blockchain được cache:
- `getDrugBatchFromBlockchain`: TTL 5 phút
- `verifyDrugBatch`: TTL 10 phút
- `getContractStats`: TTL 2 phút

### Batch Operations

Gom các thao tác lặp lại thành batch để giảm gas fees và latency.

## 📊 Benchmarking

### Chạy Benchmark

```bash
# Cấu hình
export API_URL=http://localhost:5000
export AUTH_TOKEN=your_jwt_token

# Chạy benchmark
npm run benchmark
```

### Kết quả

Script sẽ:
1. Chạy các test scenarios (health, stats, templates, etc.)
2. Đo latency (min, max, avg, median, P95, P99)
3. Tính throughput (requests/second)
4. Lưu báo cáo chi tiết vào file JSON

### Test Scenarios

- `GET /api/health` - 100 iterations
- `GET /api/blockchain/stats` - 50 iterations
- `GET /api/digital-signatures/stats` - 50 iterations
- `GET /api/digital-signatures/templates` - 50 iterations
- `GET /api/digital-signatures/ca/providers` - 50 iterations
- `GET /api/blockchain/drugs` - 30 iterations

### Ví dụ Output

```
📊 BÁO CÁO TỔNG HỢP BENCHMARK
================================================================================

📋 Tóm tắt theo scenario:
--------------------------------------------------------------------------------
Scenario                              Success    Avg Latency    P95 Latency    Throughput
--------------------------------------------------------------------------------
GET /api/health                       100/100    15.23ms        25.45ms        65.67 req/s
GET /api/blockchain/stats             50/50      45.67ms        78.90ms        21.89 req/s
...

📈 Tổng hợp:
   Tổng số requests: 330
   Tổng số thành công: 330 (100%)
   Latency trung bình: 35.45ms
   Throughput trung bình: 28.23 req/s

💾 Đã lưu báo cáo chi tiết vào: benchmark-report-2024-01-15T10-30-00-000Z.json
```

## 🚀 Best Practices

### 1. Indexes

- Chạy `optimize-indexes.js` sau mỗi lần thay đổi schema
- Monitor index usage với `db.collection.aggregate([{$indexStats: {}}])`
- Xóa indexes không sử dụng để tiết kiệm storage

### 2. Caching

- Đặt TTL phù hợp với tần suất thay đổi dữ liệu
- Invalidate cache khi dữ liệu quan trọng thay đổi
- Monitor cache hit rate để điều chỉnh TTL

### 3. Blockchain

- Sử dụng lazy verification cho các truy vấn thường xuyên
- Batch verify khi có thể
- Cache kết quả verification để tránh gọi contract không cần thiết

### 4. Monitoring

- Chạy benchmark định kỳ để theo dõi performance
- So sánh kết quả trước/sau khi tối ưu
- Alert khi latency vượt ngưỡng cho phép

## 📝 Notes

- Redis là optional - hệ thống vẫn hoạt động bình thường nếu không có Redis
- Cache chỉ áp dụng cho GET requests
- Blockchain verification cache có TTL ngắn hơn để đảm bảo tính chính xác
- Benchmark script cần AUTH_TOKEN để test các API protected

## 🔧 Troubleshooting

### Redis không kết nối được

```
⚠️  Redis không khả dụng, hệ thống sẽ chạy không có cache
```

**Giải pháp:**
- Kiểm tra Redis đã chạy chưa: `redis-cli ping`
- Kiểm tra `REDIS_URL` trong `.env`
- Kiểm tra firewall/network

### Indexes không được tạo

**Giải pháp:**
- Kiểm tra quyền MongoDB user
- Xem log chi tiết khi chạy `optimize-indexes.js`
- Chạy lại script nếu cần

### Cache không hoạt động

**Kiểm tra:**
1. Redis đã kết nối: `cacheService.isEnabled === true`
2. Response header có `X-Cache: HIT` hoặc `X-Cache: MISS`
3. TTL đã được set đúng

## 📚 Tài liệu tham khảo

- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [Redis Caching Patterns](https://redis.io/topics/patterns)
- [Web3.js Performance](https://web3js.readthedocs.io/)

