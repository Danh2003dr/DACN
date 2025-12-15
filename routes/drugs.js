const express = require('express');
const router = express.Router();

// Import models
const Drug = require('../models/Drug');

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

// @route   GET /api/drugs/search
// @desc    Tìm kiếm thuốc (cho mobile app)
// @access  Private
router.get('/search',
  authenticate,
  async (req, res) => {
    try {
      const query = req.query.q || req.query.search || '';
      const limit = parseInt(req.query.limit) || 100;

      console.log('🔍 [Search Drugs] Query:', query);
      console.log('🔍 [Search Drugs] User:', req.user._id, req.user.role);

      if (!query || query.trim() === '') {
        console.log('⚠️ [Search Drugs] Empty query, returning empty array');
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      const searchTerm = query.trim();

      // Tạo filter tìm kiếm
      const filter = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { drugId: { $regex: searchTerm, $options: 'i' } },
          { batchNumber: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Loại trừ các thuốc đã được kiểm định bởi Bộ Y tế (chỉ áp dụng cho các role không phải admin)
      if (req.user.role !== 'admin') {
        filter['qualityTest.testBy'] = {
          $not: {
            $regex: /(Bộ Y tế|Cục Quản lý Dược)/i
          }
        };
      }

      // Nếu là manufacturer, chỉ xem thuốc của chính mình
      if (req.user.role === 'manufacturer') {
        filter.manufacturerId = req.user._id;
      }

      console.log('🔍 [Search Drugs] Filter:', JSON.stringify(filter, null, 2));

      // Query drugs với populate
      const drugs = await Drug.find(filter)
        .populate('manufacturerId', 'fullName organizationInfo')
        .sort({ createdAt: -1 })
        .limit(limit);

      console.log(`✅ [Search Drugs] Found ${drugs.length} drugs for query: "${searchTerm}"`);

      res.status(200).json({
        success: true,
        data: drugs
      });

    } catch (error) {
      console.error('❌ [Search Drugs] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm thuốc',
        error: error.message
      });
    }
  }
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
  (req, res, next) => {
    console.log('✅ Route /api/drugs/scan-qr được gọi');
    console.log('Request body:', req.body);
    next();
  },
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
