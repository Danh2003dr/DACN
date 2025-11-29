const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getPayments,
  getPaymentById,
  getPaymentStats
} = require('../controllers/paymentController');

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// @route   GET /api/payments/stats
// @desc    Lấy thống kê thanh toán
// @access  Private
router.get('/stats', getPaymentStats);

// @route   GET /api/payments
// @desc    Lấy danh sách thanh toán
// @access  Private
router.get('/', getPayments);

// @route   GET /api/payments/:id
// @desc    Lấy thanh toán theo ID
// @access  Private
router.get('/:id', getPaymentById);

module.exports = router;

