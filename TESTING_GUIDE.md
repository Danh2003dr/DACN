# 🧪 HƯỚNG DẪN TESTING

## ✅ Đã hoàn thành

Hệ thống Testing & Quality Assurance đã được thiết lập đầy đủ với:

### 1. Backend Unit Tests ✅
- ✅ **Controllers**: `drugController`, `supplyChainController`, `digitalSignatureController`, `authController`
- ✅ **Services**: `blockchainService`, `drugRiskService`
- ✅ **Models**: `Drug` (validation, methods)
- ✅ **Middleware**: `auth` (authentication, authorization)

### 2. Frontend Unit Tests ✅
- ✅ **Components**: `Login`, `Dashboard`
- ✅ Sử dụng React Testing Library

### 3. Integration Tests ✅
- ✅ **Drug Flow**: Đăng nhập → Tạo lô thuốc → Ký số → Ghi blockchain → Quét QR
- ✅ **Supply Chain Flow**: Tạo → Cập nhật → Hoàn thành
- ✅ **Role-based Access Control**: Test phân quyền cho các roles khác nhau

### 4. E2E Tests ✅
- ✅ **Cypress Setup**: Configuration và test specs
- ✅ **Drug Lifecycle**: User journey hoàn chỉnh

### 5. Performance Tests ✅
- ✅ **Load Testing Script**: Test với concurrent requests
- ✅ **Metrics**: Response time, throughput, success rate

---

## 🚀 Cách chạy Tests

### Backend Tests

```bash
# Chạy tất cả tests
npm test

# Chạy unit tests
npm run test:unit

# Chạy integration tests
npm run test:integration

# Chạy với coverage report
npm run test:coverage

# Watch mode (tự động chạy lại khi code thay đổi)
npm run test:watch
```

### Frontend Tests

```bash
cd frontend
npm test
```

### E2E Tests

**Lưu ý**: Cần cài đặt Cypress trước:
```bash
npm install --save-dev cypress
```

```bash
# Chạy E2E tests (headless mode)
npm run test:e2e

# Mở Cypress UI để chạy tests interactively
npm run test:e2e:open
```

**Yêu cầu**: 
- Backend server phải đang chạy tại `http://localhost:5000`
- Frontend phải đang chạy tại `http://localhost:3000`

### Performance Tests

```bash
# Chạy load test
npm run test:performance

# Với custom configuration
API_URL=http://localhost:5000/api node tests/performance/load-test.js
```

---

## 📊 Coverage Goals

- **Backend**: > 80% coverage
- **Frontend**: > 70% coverage
- **Critical Paths**: 100% coverage

Để xem coverage report:
```bash
npm run test:coverage
```

Report sẽ được tạo trong thư mục `coverage/`:
- HTML report: `coverage/lcov-report/index.html`
- LCOV report: `coverage/lcov.info`

---

## 📁 Cấu trúc Test Files

```
tests/
├── unit/                          # Unit tests
│   ├── controllers/
│   │   ├── authController.test.js
│   │   ├── drugController.test.js
│   │   ├── supplyChainController.test.js
│   │   └── digitalSignatureController.test.js
│   ├── services/
│   │   ├── blockchainService.test.js
│   │   └── drugRiskService.test.js
│   ├── models/
│   │   └── Drug.test.js
│   └── middleware/
│       └── auth.test.js
├── integration/                   # Integration tests
│   ├── auth.test.js
│   ├── drugFlow.test.js
│   └── supplyChainFlow.test.js
├── e2e/                           # E2E tests
│   ├── cypress.config.js
│   └── specs/
│       └── drug-lifecycle.cy.js
├── performance/                   # Performance tests
│   └── load-test.js
├── helpers/                       # Test helpers
├── mocks/                         # Mock files
└── setup.js                       # Jest setup

frontend/src/components/__tests__/  # Frontend tests
├── Login.test.js
└── Dashboard.test.js
```

---

## 🛠️ Test Utilities

### MongoDB Memory Server
Tất cả tests sử dụng MongoDB Memory Server để tạo database in-memory, không ảnh hưởng đến database thật.

### Mock Services
Các services phức tạp được mock:
- `blockchainService`: Mock blockchain operations
- `digitalSignatureService`: Mock digital signature operations
- `auditService`: Mock audit logging

### Test Data
Test data được tạo tự động trong `beforeEach` và `beforeAll` hooks, và được cleanup sau mỗi test.

---

## 📝 Best Practices

1. **Isolation**: Mỗi test phải độc lập, không phụ thuộc vào test khác
2. **Cleanup**: Luôn cleanup data sau mỗi test
3. **Descriptive Names**: Tên test phải mô tả rõ ràng điều đang test
4. **AAA Pattern**: Arrange, Act, Assert
5. **Mock External Dependencies**: Mock các external services và APIs

---

## 🔧 Troubleshooting

### Tests fail với MongoDB connection
- Đảm bảo MongoDB Memory Server được setup đúng trong `tests/setup.js`
- Kiểm tra `mongodb-memory-server` đã được cài đặt

### Tests timeout
- Tăng timeout trong `jest.config.js` (hiện tại: 30000ms)
- Kiểm tra async operations đã được await đúng cách

### Coverage không đạt mục tiêu
- Chạy `npm run test:coverage` để xem coverage report
- Tập trung vào các file có coverage thấp
- Thêm tests cho các branches chưa được cover

### E2E tests fail
- Đảm bảo backend và frontend đang chạy
- Kiểm tra `baseUrl` trong `cypress.config.js`
- Kiểm tra test user credentials trong `cypress.config.js` env

### Performance tests fail
- Kiểm tra API URL trong script
- Đảm bảo backend server đang chạy và có thể handle load
- Điều chỉnh `CONCURRENT_USERS` và `REQUESTS_PER_USER` nếu cần

---

## 📈 Kết quả mong đợi

Sau khi chạy tests, bạn sẽ thấy:

```
PASS  tests/unit/controllers/drugController.test.js
PASS  tests/unit/services/blockchainService.test.js
PASS  tests/integration/drugFlow.test.js
...

Test Suites: 10 passed, 10 total
Tests:       50 passed, 50 total
Snapshots:   0 total
Time:        15.234 s
```

Coverage report sẽ hiển thị:
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
All files |   85.23 |    78.45 |   82.10 |   84.56
```

---

## 🎯 Next Steps

Để tiếp tục cải thiện testing:

1. **Tăng Coverage**: Thêm tests cho các edge cases
2. **E2E Tests**: Thêm more E2E scenarios
3. **Performance**: Tối ưu hóa performance tests
4. **CI/CD**: Tích hợp tests vào CI/CD pipeline

---

**Last Updated**: January 2025  
**Status**: ✅ Testing System Complete

