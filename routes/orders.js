const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  confirmOrder,
  processOrder,
  shipOrder,
  deliverOrder,
  cancelOrder,
  getOrderStats,
  reorder
} = require('../controllers/orderController');

// Tất cả routes yêu cầu authentication và chỉ cho phép admin, manufacturer, distributor, hospital
router.use(authenticate);
router.use(authorize('admin', 'manufacturer', 'distributor', 'hospital'));

// @route   GET /api/orders/stats
// @desc    Lấy thống kê đơn hàng
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/stats', getOrderStats);

// @route   GET /api/orders
// @desc    Lấy danh sách đơn hàng
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/', getOrders);

// @route   POST /api/orders
// @desc    Tạo đơn hàng mới
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.post('/', createOrder);

// @route   GET /api/orders/:id
// @desc    Lấy đơn hàng theo ID
// @access  Private
router.get('/:id', getOrderById);

// @route   POST /api/orders/:id/confirm
// @desc    Xác nhận đơn hàng
// @access  Private
router.post('/:id/confirm', confirmOrder);

// @route   POST /api/orders/:id/process
// @desc    Xử lý đơn hàng
// @access  Private
router.post('/:id/process', processOrder);

// @route   POST /api/orders/:id/ship
// @desc    Giao hàng
// @access  Private
router.post('/:id/ship', shipOrder);

// @route   POST /api/orders/:id/deliver
// @desc    Xác nhận nhận hàng
// @access  Private
router.post('/:id/deliver', deliverOrder);

// @route   POST /api/orders/:id/cancel
// @desc    Hủy đơn hàng
// @access  Private
router.post('/:id/cancel', cancelOrder);

// @route   POST /api/orders/:id/reorder
// @desc    Đặt lại đơn hàng (lấy items từ order cũ)
// @access  Private
router.post('/:id/reorder', reorder);

module.exports = router;

