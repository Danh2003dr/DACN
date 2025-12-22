const express = require('express');
const router = express.Router();

// Import controllers
const {
  createSupplyChain,
  addSupplyChainStep,
  getSupplyChain,
  getSupplyChainByQR,
  getSupplyChains,
  recallSupplyChain,
  getSupplyChainMapData,
  subscribeSupplyChainEvents,
  bulkDeleteSupplyChains,
  exportSupplyChains
} = require('../controllers/supplyChainController');

// Import middleware
const { authenticate, authorize, rateLimit } = require('../middleware/auth');
const { validate, validateQuery } = require('../utils/validation');
const { 
  createSupplyChainSchema, 
  addSupplyChainStepSchema, 
  recallSupplyChainSchema,
  paginationSchema 
} = require('../utils/validation');

// @route   POST /api/supply-chain
// @desc    Tạo hành trình chuỗi cung ứng mới
// @access  Private (Manufacturer, Admin)
router.post('/',
  authenticate,
  authorize(['admin', 'manufacturer']),
  validate(createSupplyChainSchema),
  createSupplyChain
);

// @route   GET /api/supply-chain
// @desc    Lấy danh sách hành trình
// @access  Private
router.get('/',
  authenticate,
  validateQuery(paginationSchema),
  getSupplyChains
);

// @route   GET /api/supply-chain/map/data
// @desc    Lấy dữ liệu bản đồ chuỗi cung ứng
// @access  Private
// QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh conflict
router.get('/map/data', authenticate, (req, res, next) => {
  console.log('[Route] /map/data called');
  next();
}, getSupplyChainMapData);

// @route   GET /api/supply-chain/events
// @desc    Đăng ký sự kiện real-time (SSE)
// @access  Private
// QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh conflict
router.get('/events',
  authenticate,
  subscribeSupplyChainEvents
);

// @route   POST /api/supply-chain/bulk-delete
// @desc    Xóa nhiều chuỗi cung ứng
// @access  Private (Admin)
router.post('/bulk-delete',
  authenticate,
  authorize(['admin']),
  bulkDeleteSupplyChains
);

// @route   GET /api/supply-chain/export
// @desc    Export chuỗi cung ứng
// @access  Private
// QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh conflict
router.get('/export',
  authenticate,
  exportSupplyChains
);

// @route   GET /api/supply-chain/qr/:batchNumber
// @desc    Truy xuất nguồn gốc qua QR code (Public)
// @access  Public
// QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh conflict
// Rate limiting: 30 requests / 1 phút / IP để tránh abuse
const qrRateLimiter = rateLimit(60 * 1000, 30); // 30 requests per minute
router.get('/qr/:batchNumber', qrRateLimiter, getSupplyChainByQR);

// @route   GET /api/supply-chain/:id
// @desc    Lấy thông tin hành trình chi tiết
// @access  Private
// PHẢI ĐẶT CUỐI CÙNG để tránh match với các route cụ thể khác
router.get('/:id',
  authenticate,
  getSupplyChain
);

// @route   POST /api/supply-chain/:id/steps
// @desc    Thêm bước mới vào hành trình
// @access  Private
router.post('/:id/steps',
  authenticate,
  validate(addSupplyChainStepSchema),
  addSupplyChainStep
);

// @route   POST /api/supply-chain/:id/recall
// @desc    Thu hồi thuốc
// @access  Private (Admin, Manufacturer)
router.post('/:id/recall',
  authenticate,
  authorize(['admin', 'manufacturer']),
  validate(recallSupplyChainSchema),
  recallSupplyChain
);


module.exports = router;
