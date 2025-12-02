const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

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
  createDefaultAccounts,
  loginWithFirebase
} = require('../controllers/authController');

// Import Google OAuth controllers
const {
  googleCallback,
  googleSuccess,
  googleFailure
} = require('../controllers/googleAuthController');

// Import middleware
const {
  authenticate,
  authorize,
  requirePasswordChange,
  rateLimit
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

// Rate limiter cho login để chống brute-force
const loginRateLimiter = rateLimit(5 * 60 * 1000, 10); // 10 requests / 5 phút / IP

// @route   POST /api/auth/login
// @desc    Đăng nhập người dùng
// @access  Public
router.post('/login', loginRateLimiter, validate(loginSchema), login);

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

// Middleware để kiểm tra Google OAuth có được cấu hình không
const checkGoogleOAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth chưa được cấu hình. Vui lòng thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env'
    });
  }
  next();
};

// Google OAuth Routes
// @route   GET /api/auth/google
// @desc    Bắt đầu quá trình đăng nhập bằng Google
// @access  Public
router.get('/google',
  checkGoogleOAuth,
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  checkGoogleOAuth,
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Google auth error:', err);
        const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      
      if (!user) {
        const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      
      // Gán user vào req để sử dụng trong callback handler
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

// @route   GET /api/auth/google/success
// @desc    Google OAuth success endpoint
// @access  Public
router.get('/google/success', checkGoogleOAuth, googleSuccess);

// @route   GET /api/auth/google/failure
// @desc    Google OAuth failure endpoint
// @access  Public
router.get('/google/failure', checkGoogleOAuth, googleFailure);

// Firebase Authentication
// @route   POST /api/auth/firebase
// @desc    Đăng nhập bằng Firebase (Google)
// @access  Public
router.post('/firebase', loginWithFirebase);

module.exports = router;
