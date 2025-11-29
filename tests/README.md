# Testing Documentation

## Tổng quan

Hệ thống testing được tổ chức theo các cấp độ:

1. **Unit Tests**: Test các components, functions, methods riêng lẻ
2. **Integration Tests**: Test các luồng nghiệp vụ hoàn chỉnh
3. **E2E Tests**: Test user journey từ đầu đến cuối
4. **Performance Tests**: Test hiệu năng và load testing

## Cấu trúc thư mục

```
tests/
├── unit/                    # Unit tests
│   ├── controllers/        # Controller tests
│   ├── services/           # Service tests
│   ├── models/             # Model tests
│   └── middleware/          # Middleware tests
├── integration/            # Integration tests
│   ├── auth.test.js
│   ├── drugFlow.test.js
│   └── supplyChainFlow.test.js
├── e2e/                    # E2E tests (Cypress)
│   ├── cypress.config.js
│   └── specs/
│       └── drug-lifecycle.cy.js
├── performance/            # Performance tests
│   └── load-test.js
├── helpers/                # Test helpers
├── mocks/                  # Mock files
└── setup.js               # Jest setup file
```

## Chạy Tests

### Backend Tests

```bash
# Chạy tất cả tests
npm test

# Chạy unit tests
npm run test:unit

# Chạy integration tests
npm run test:integration

# Chạy với coverage
npm run test:coverage

# Chạy watch mode
npm run test:watch
```

### Frontend Tests

```bash
cd frontend
npm test
```

### E2E Tests

```bash
# Chạy E2E tests (headless)
npm run test:e2e

# Mở Cypress UI
npm run test:e2e:open
```

### Performance Tests

```bash
npm run test:performance
```

## Coverage Goals

- **Backend**: > 80% coverage
- **Frontend**: > 70% coverage
- **Critical Paths**: 100% coverage

## Test Data

Test data được tạo tự động trong `beforeEach` và `beforeAll` hooks. Sử dụng MongoDB Memory Server để tránh ảnh hưởng đến database thật.

## Mock Services

Các services phức tạp được mock trong tests:
- `blockchainService`: Mock blockchain operations
- `digitalSignatureService`: Mock digital signature operations
- `auditService`: Mock audit logging

## Best Practices

1. **Isolation**: Mỗi test phải độc lập, không phụ thuộc vào test khác
2. **Cleanup**: Luôn cleanup data sau mỗi test
3. **Descriptive Names**: Tên test phải mô tả rõ ràng điều đang test
4. **AAA Pattern**: Arrange, Act, Assert
5. **Mock External Dependencies**: Mock các external services và APIs

## Troubleshooting

### Tests fail với MongoDB connection
- Đảm bảo MongoDB Memory Server được setup đúng trong `tests/setup.js`

### Tests timeout
- Tăng timeout trong `jest.config.js` hoặc trong test file
- Kiểm tra async operations đã được await đúng cách

### Coverage không đạt mục tiêu
- Chạy `npm run test:coverage` để xem coverage report
- Tập trung vào các file có coverage thấp
