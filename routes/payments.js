const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getPayments,
  getPaymentById,
  getPaymentStats,
  createMomoPayment,
  momoCallback,
  checkMomoPaymentStatus,
  createVnpayPayment,
  vnpayReturn,
  vnpayIpn
} = require('../controllers/paymentController');

// MoMo callback route - không cần authentication (MoMo sẽ gọi)
// @route   POST /api/payments/momo/callback
// @desc    Xử lý callback từ MoMo
// @access  Public
router.post('/momo/callback', momoCallback);

// VNPay callback routes - không cần authentication (VNPay sẽ gọi/redirect)
// @route   GET /api/payments/vnpay/return
// @desc    Xử lý return URL từ VNPay (khách hàng được redirect về đây)
// @access  Public
router.get('/vnpay/return', vnpayReturn);

// @route   GET /api/payments/vnpay/ipn
// @desc    Xử lý IPN (Instant Payment Notification) từ VNPay
// @access  Public (VNPay sẽ gọi endpoint này ngầm)
router.get('/vnpay/ipn', vnpayIpn);

// Tất cả routes khác yêu cầu authentication
router.use(authenticate);

// @route   GET /api/payments/stats
// @desc    Lấy thống kê thanh toán
// @access  Private
router.get('/stats', getPaymentStats);

// @route   POST /api/payments/momo/create
// @desc    Tạo payment request với MoMo
// @access  Private
router.post('/momo/create', createMomoPayment);

// @route   GET /api/payments/momo/status/:paymentId
// @desc    Kiểm tra trạng thái thanh toán MoMo
// @access  Private
router.get('/momo/status/:paymentId', checkMomoPaymentStatus);

// @route   POST /api/payments/vnpay/create
// @desc    Tạo payment URL với VNPay
// @access  Private
router.post('/vnpay/create', createVnpayPayment);

// @route   GET /api/payments
// @desc    Lấy danh sách thanh toán
// @access  Private
router.get('/', getPayments);

// @route   GET /api/payments/:id
// @desc    Lấy thanh toán theo ID
// @access  Private
router.get('/:id', getPaymentById);

module.exports = router;

