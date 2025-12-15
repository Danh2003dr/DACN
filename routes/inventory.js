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
  getTransactionStats,
  getLocations
} = require('../controllers/inventoryController');

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// @route   GET /api/inventory
// @desc    Lấy danh sách tồn kho
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getInventory);

// @route   GET /api/inventory/stats
// @desc    Lấy thống kê tồn kho
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/stats', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getInventoryStats);

// @route   GET /api/inventory/locations
// @desc    Lấy danh sách các locations có sẵn
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/locations', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getLocations);

// @route   GET /api/inventory/location/:locationId
// @desc    Lấy tồn kho theo địa điểm
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/location/:locationId', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getInventoryByLocation);

// @route   GET /api/inventory/drug/:drugId/total
// @desc    Lấy tổng tồn kho của một drug
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/drug/:drugId/total', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getTotalStock);

// @route   GET /api/inventory/:id
// @desc    Lấy tồn kho theo ID
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/:id', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getInventoryById);

// @route   POST /api/inventory/stock-in
// @desc    Nhập kho
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.post('/stock-in', authorize('admin', 'manufacturer', 'distributor', 'hospital'), stockIn);

// @route   POST /api/inventory/stock-out
// @desc    Xuất kho
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.post('/stock-out', authorize('admin', 'manufacturer', 'distributor', 'hospital'), stockOut);

// @route   POST /api/inventory/adjust
// @desc    Điều chỉnh kho
// @access  Private (Admin, Manufacturer)
router.post('/adjust', authorize('admin', 'manufacturer'), adjustStock);

// @route   POST /api/inventory/transfer
// @desc    Chuyển kho
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.post('/transfer', authorize('admin', 'manufacturer', 'distributor', 'hospital'), transferStock);

// @route   POST /api/inventory/stocktake
// @desc    Kiểm kê kho
// @access  Private (Admin, Manufacturer)
router.post('/stocktake', authorize('admin', 'manufacturer'), stocktake);

// @route   GET /api/inventory/transactions
// @desc    Lấy danh sách transactions
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/transactions', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getTransactions);

// @route   GET /api/inventory/transactions/stats
// @desc    Lấy thống kê transactions
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/transactions/stats', authorize('admin', 'manufacturer', 'distributor', 'hospital'), getTransactionStats);

module.exports = router;

