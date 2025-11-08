const express = require('express');
const router = express.Router();

// Import controllers
const {
  createDrug,
  getDrugs,
  getDrugById,
  updateDrug,
  updateDistributionStatus,
  scanQRCode,
  getServerUrl,
  recallDrug,
  getDrugStats,
  deleteDrug,
  verifyQRCode,
  verifyDrugByBlockchainId,
  generateQRCode
} = require('../controllers/drugController');

// Import middleware
const {
  authenticate,
  authorize,
  checkPermission
} = require('../middleware/auth');

// Import validation
const {
  validate,
  validateQuery,
  paginationSchema
} = require('../utils/validation');

// @route   POST /api/drugs
// @desc    Tạo lô thuốc mới
// @access  Private (Admin, Manufacturer)
router.post('/',
  authenticate,
  authorize('admin', 'manufacturer'),
  createDrug
);

// @route   GET /api/drugs
// @desc    Lấy danh sách lô thuốc
// @access  Private
router.get('/',
  authenticate,
  validateQuery(paginationSchema),
  getDrugs
);

// @route   GET /api/drugs/stats
// @desc    Lấy thống kê lô thuốc
// @access  Private
router.get('/stats',
  authenticate,
  getDrugStats
);

// @route   POST /api/drugs/scan-qr
// @desc    Quét QR code để tra cứu
// @access  Private
router.post('/scan-qr',
  authenticate,
  scanQRCode
);

// @route   GET /api/drugs/server-url
// @desc    Lấy server URL (cho frontend sử dụng để tạo QR code)
// @access  Public
router.get('/server-url', getServerUrl);

// @route   POST /api/drugs/:id/generate-qr
// @desc    Generate QR code cho drug nếu chưa có
// @access  Private (Admin, Manufacturer)
router.post('/:id/generate-qr',
  authenticate,
  authorize('admin', 'manufacturer'),
  generateQRCode
);

// @route   GET /api/drugs/:id
// @desc    Lấy thông tin lô thuốc theo ID
// @access  Private
router.get('/:id',
  authenticate,
  getDrugById
);

// @route   PUT /api/drugs/:id
// @desc    Cập nhật thông tin lô thuốc
// @access  Private (Admin, Manufacturer)
router.put('/:id',
  authenticate,
  authorize('admin', 'manufacturer'),
  updateDrug
);

// @route   PUT /api/drugs/:id/distribution
// @desc    Cập nhật trạng thái phân phối
// @access  Private
router.put('/:id/distribution',
  authenticate,
  updateDistributionStatus
);

// @route   PUT /api/drugs/:id/recall
// @desc    Thu hồi lô thuốc
// @access  Private (Admin, Manufacturer)
router.put('/:id/recall',
  authenticate,
  authorize('admin', 'manufacturer'),
  recallDrug
);

// @route   DELETE /api/drugs/:id
// @desc    Xóa lô thuốc (chỉ Admin)
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize('admin'),
  deleteDrug
);

// @route   GET /api/drugs/verify/:blockchainId
// @desc    Verify QR code và lấy thông tin từ blockchain
// @access  Public
router.get('/verify/:blockchainId', verifyQRCode);

// @route   GET /api/drugs/blockchain-verify/:blockchainId
// @desc    Xác minh thuốc từ blockchain ID
// @access  Public
router.get('/blockchain-verify/:blockchainId', verifyDrugByBlockchainId);

module.exports = router;
