const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate: authMiddleware } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  getSystemInfo,
  getBlockchainStatus,
  testBlockchainConnection,
  resetToDefaults
} = require('../controllers/settingsController');

// Validation rules
const settingsValidation = [
  body('systemName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tên hệ thống phải từ 1-100 ký tự'),
  
  body('companyName')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Tên công ty không được quá 200 ký tự'),
  
  body('companyAddress')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ không được quá 500 ký tự'),
  
  body('companyPhone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('companyEmail')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ'),
  
  body('blockchainNetwork')
    .optional()
    .isIn(['sepolia', 'mainnet', 'polygon', 'bsc'])
    .withMessage('Mạng blockchain không hợp lệ'),
  
  body('blockchainProvider')
    .optional()
    .isIn(['infura', 'alchemy', 'ganache'])
    .withMessage('Provider blockchain không hợp lệ'),
  
  body('notificationEmail')
    .optional()
    .isEmail()
    .withMessage('Email thông báo không hợp lệ'),
  
  body('backupFrequency')
    .optional()
    .isIn(['hourly', 'daily', 'weekly', 'monthly'])
    .withMessage('Tần suất sao lưu không hợp lệ'),
  
  body('sessionTimeout')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Timeout phiên phải từ 5-480 phút'),
  
  body('maxLoginAttempts')
    .optional()
    .isInt({ min: 3, max: 10 })
    .withMessage('Số lần đăng nhập tối đa phải từ 3-10'),
  
  body('passwordMinLength')
    .optional()
    .isInt({ min: 6, max: 20 })
    .withMessage('Độ dài mật khẩu tối thiểu phải từ 6-20'),
  
  body('requireSpecialChars')
    .optional()
    .isBoolean()
    .withMessage('Yêu cầu ký tự đặc biệt phải là boolean'),
  
  body('enableTwoFactor')
    .optional()
    .isBoolean()
    .withMessage('Bật xác thực 2 yếu tố phải là boolean'),
  
  body('enableAuditLog')
    .optional()
    .isBoolean()
    .withMessage('Bật nhật ký kiểm tra phải là boolean'),
  
  body('enableEmailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Bật thông báo email phải là boolean'),
  
  body('enableSMSNotifications')
    .optional()
    .isBoolean()
    .withMessage('Bật thông báo SMS phải là boolean')
];

// @route   GET /api/settings
// @desc    Lấy cài đặt hệ thống
// @access  Admin
router.get('/', authMiddleware, getSettings);

// @route   PUT /api/settings
// @desc    Cập nhật cài đặt hệ thống
// @access  Admin
router.put('/', authMiddleware, settingsValidation, updateSettings);

// @route   GET /api/settings/system-info
// @desc    Lấy thông tin hệ thống
// @access  Admin
router.get('/system-info', authMiddleware, getSystemInfo);

// @route   GET /api/settings/blockchain-status
// @desc    Lấy trạng thái blockchain
// @access  Admin
router.get('/blockchain-status', authMiddleware, getBlockchainStatus);

// @route   POST /api/settings/test-blockchain
// @desc    Test kết nối blockchain
// @access  Admin
router.post('/test-blockchain', authMiddleware, testBlockchainConnection);

// @route   POST /api/settings/reset
// @desc    Reset về cài đặt mặc định
// @access  Admin
router.post('/reset', authMiddleware, resetToDefaults);

module.exports = router;
