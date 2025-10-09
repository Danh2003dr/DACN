const express = require('express');
const router = express.Router();

// Import controllers
const {
  login,
  register,
  changePassword,
  firstChangePassword,
  getMe,
  updateProfile,
  uploadAvatar,
  logout,
  createDefaultAccounts
} = require('../controllers/authController');

// Import middleware
const {
  authenticate,
  authorize,
  requirePasswordChange
} = require('../middleware/auth');
const upload = require('../middleware/upload');

// Import validation
const {
  validate,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  firstChangePasswordSchema,
  updateProfileSchema
} = require('../utils/validation');

// @route   POST /api/auth/login
// @desc    Đăng nhập người dùng
// @access  Public
router.post('/login', validate(loginSchema), login);

// @route   POST /api/auth/register
// @desc    Đăng ký tài khoản mới (chỉ Admin)
// @access  Private (Admin only)
router.post('/register',
  authenticate,
  authorize('admin'),
  validate(registerSchema),
  register
);

// @route   PUT /api/auth/change-password
// @desc    Đổi mật khẩu
// @access  Private
router.put('/change-password',
  authenticate,
  requirePasswordChange,
  validate(changePasswordSchema),
  changePassword
);

// @route   PUT /api/auth/first-change-password
// @desc    Đổi mật khẩu lần đầu
// @access  Private
router.put('/first-change-password',
  authenticate,
  validate(firstChangePasswordSchema),
  firstChangePassword
);

// @route   GET /api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get('/me', authenticate, getMe);

// @route   PUT /api/auth/update-profile
// @desc    Cập nhật thông tin cá nhân
// @access  Private
router.put('/update-profile',
  authenticate,
  updateProfile
);

// @route   POST /api/auth/upload-avatar
// @desc    Upload avatar
// @access  Private
router.post('/upload-avatar',
  authenticate,
  upload.single('avatar'),
  uploadAvatar
);

// @route   POST /api/auth/logout
// @desc    Đăng xuất
// @access  Private
router.post('/logout', authenticate, logout);

// @route   POST /api/auth/create-default-accounts
// @desc    Tạo tài khoản mặc định cho demo
// @access  Private (Admin only)
router.post('/create-default-accounts',
  authenticate,
  authorize('admin'),
  createDefaultAccounts
);

module.exports = router;
