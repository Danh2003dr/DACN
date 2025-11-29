const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplierRating,
  createContract,
  getContracts
} = require('../controllers/supplierController');

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// @route   GET /api/suppliers
// @desc    Lấy danh sách nhà cung ứng
// @access  Private
router.get('/', getSuppliers);

// @route   POST /api/suppliers
// @desc    Tạo nhà cung ứng mới
// @access  Private
router.post('/', createSupplier);

// @route   GET /api/suppliers/:id
// @desc    Lấy nhà cung ứng theo ID
// @access  Private
router.get('/:id', getSupplierById);

// @route   POST /api/suppliers/:id/rating
// @desc    Cập nhật đánh giá nhà cung ứng
// @access  Private
router.post('/:id/rating', updateSupplierRating);

// @route   POST /api/suppliers/:id/contracts
// @desc    Tạo hợp đồng với nhà cung ứng
// @access  Private
router.post('/:id/contracts', createContract);

// @route   GET /api/contracts
// @desc    Lấy danh sách hợp đồng
// @access  Private
router.get('/contracts', getContracts);

module.exports = router;

