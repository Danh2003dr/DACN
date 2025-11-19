const express = require('express');
const router = express.Router();

// Import controllers
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  updateNotificationPreferences
} = require('../controllers/profileController');

// Import middleware
const authenticate = require('../middlewares/authMiddleware');
const { single: uploadAvatarMiddleware, handleUploadError } = require('../middlewares/uploadAvatar');

// Import validators
const {
  validate,
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationPreferencesSchema
} = require('../validators/profileValidator');

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private
 */
router.get('/me', 
  authenticate,
  getProfile
);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Cập nhật thông tin profile
 * @access  Private
 */
router.put('/update-profile',
  authenticate,
  validate(updateProfileSchema),
  updateProfile
);

/**
 * @route   POST /api/auth/upload-avatar
 * @desc    Upload avatar cho user
 * @access  Private
 */
router.post('/upload-avatar',
  authenticate,
  uploadAvatarMiddleware,
  handleUploadError,
  uploadAvatar
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Đổi mật khẩu
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @route   PATCH /api/auth/notification-preferences
 * @desc    Cập nhật cài đặt thông báo
 * @access  Private
 */
router.patch('/notification-preferences',
  authenticate,
  validate(updateNotificationPreferencesSchema),
  updateNotificationPreferences
);

module.exports = router;

