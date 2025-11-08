const express = require('express');
const router = express.Router();

// Import controllers
const {
  getSettings,
  updateSettings,
  getSystemInfo,
  getBlockchainStatus,
  testBlockchainConnection,
  resetToDefaults
} = require('../controllers/settingsController');

// Import middleware
const {
  authenticate,
  authorize
} = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Lấy cài đặt hệ thống
// @access  Private (Admin only)
router.get('/',
  authenticate,
  authorize('admin'),
  getSettings
);

// @route   PUT /api/settings
// @desc    Cập nhật cài đặt hệ thống
// @access  Private (Admin only)
router.put('/',
  authenticate,
  authorize('admin'),
  updateSettings
);

// @route   GET /api/settings/system-info
// @desc    Lấy thông tin hệ thống
// @access  Private (Admin only)
router.get('/system-info',
  authenticate,
  authorize('admin'),
  getSystemInfo
);

// @route   GET /api/settings/blockchain-status
// @desc    Lấy trạng thái blockchain
// @access  Private (Admin only)
router.get('/blockchain-status',
  authenticate,
  authorize('admin'),
  getBlockchainStatus
);

// @route   POST /api/settings/test-blockchain
// @desc    Test kết nối blockchain
// @access  Private (Admin only)
router.post('/test-blockchain',
  authenticate,
  authorize('admin'),
  testBlockchainConnection
);

// @route   POST /api/settings/reset
// @desc    Reset cài đặt về mặc định
// @access  Private (Admin only)
router.post('/reset',
  authenticate,
  authorize('admin'),
  resetToDefaults
);

module.exports = router;