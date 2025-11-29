const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getInventory,
  getInventoryById,
  getInventoryByLocation,
  getTotalStock,
  getInventoryStats,
  stockIn,
  stockOut,
  adjustStock,
  transferStock,
  stocktake,
  getTransactions,
  getTransactionStats
} = require('../controllers/inventoryController');

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// @route   GET /api/inventory
// @desc    Lấy danh sách tồn kho
// @access  Private
router.get('/', getInventory);

// @route   GET /api/inventory/stats
// @desc    Lấy thống kê tồn kho
// @access  Private
router.get('/stats', getInventoryStats);

// @route   GET /api/inventory/location/:locationId
// @desc    Lấy tồn kho theo địa điểm
// @access  Private
router.get('/location/:locationId', getInventoryByLocation);

// @route   GET /api/inventory/drug/:drugId/total
// @desc    Lấy tổng tồn kho của một drug
// @access  Private
router.get('/drug/:drugId/total', getTotalStock);

// @route   GET /api/inventory/:id
// @desc    Lấy tồn kho theo ID
// @access  Private
router.get('/:id', getInventoryById);

// @route   POST /api/inventory/stock-in
// @desc    Nhập kho
// @access  Private
router.post('/stock-in', stockIn);

// @route   POST /api/inventory/stock-out
// @desc    Xuất kho
// @access  Private
router.post('/stock-out', stockOut);

// @route   POST /api/inventory/adjust
// @desc    Điều chỉnh kho
// @access  Private
router.post('/adjust', adjustStock);

// @route   POST /api/inventory/transfer
// @desc    Chuyển kho
// @access  Private
router.post('/transfer', transferStock);

// @route   POST /api/inventory/stocktake
// @desc    Kiểm kê kho
// @access  Private
router.post('/stocktake', stocktake);

// @route   GET /api/inventory/transactions
// @desc    Lấy danh sách transactions
// @access  Private
router.get('/transactions', getTransactions);

// @route   GET /api/inventory/transactions/stats
// @desc    Lấy thống kê transactions
// @access  Private
router.get('/transactions/stats', getTransactionStats);

module.exports = router;

