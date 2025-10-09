const express = require('express');
const router = express.Router();

// Import controllers
const {
  createSupplyChain,
  addSupplyChainStep,
  getSupplyChain,
  getSupplyChainByQR,
  getSupplyChains,
  recallSupplyChain
} = require('../controllers/supplyChainController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/supply-chain
// @desc    Tạo hành trình chuỗi cung ứng mới
// @access  Private (Manufacturer, Admin)
router.post('/',
  authenticate,
  authorize(['admin', 'manufacturer']),
  createSupplyChain
);

// @route   GET /api/supply-chain
// @desc    Lấy danh sách hành trình
// @access  Private
router.get('/',
  authenticate,
  getSupplyChains
);

// @route   GET /api/supply-chain/:id
// @desc    Lấy thông tin hành trình chi tiết
// @access  Private
router.get('/:id',
  authenticate,
  getSupplyChain
);

// @route   POST /api/supply-chain/:id/steps
// @desc    Thêm bước mới vào hành trình
// @access  Private
router.post('/:id/steps',
  authenticate,
  addSupplyChainStep
);

// @route   POST /api/supply-chain/:id/recall
// @desc    Thu hồi thuốc
// @access  Private (Admin, Manufacturer)
router.post('/:id/recall',
  authenticate,
  authorize(['admin', 'manufacturer']),
  recallSupplyChain
);

// @route   GET /api/supply-chain/qr/:batchNumber
// @desc    Truy xuất nguồn gốc qua QR code (Public)
// @access  Public
router.get('/qr/:batchNumber', getSupplyChainByQR);

module.exports = router;
