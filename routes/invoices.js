const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createInvoiceFromOrder,
  createInvoice,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getInvoiceStats
} = require('../controllers/invoiceController');

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// @route   GET /api/invoices/stats
// @desc    Lấy thống kê hóa đơn
// @access  Private
router.get('/stats', getInvoiceStats);

// @route   GET /api/invoices
// @desc    Lấy danh sách hóa đơn
// @access  Private
router.get('/', getInvoices);

// @route   POST /api/invoices
// @desc    Tạo hóa đơn trực tiếp
// @access  Private
router.post('/', createInvoice);

// @route   POST /api/invoices/from-order/:orderId
// @desc    Tạo hóa đơn từ order
// @access  Private
router.post('/from-order/:orderId', createInvoiceFromOrder);

// @route   GET /api/invoices/:id
// @desc    Lấy hóa đơn theo ID
// @access  Private
router.get('/:id', getInvoiceById);

// @route   POST /api/invoices/:id/payment
// @desc    Ghi nhận thanh toán
// @access  Private
router.post('/:id/payment', recordPayment);

module.exports = router;

