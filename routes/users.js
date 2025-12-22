const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserLock,
  resetUserPassword,
  getUserStats,
  getUsersByOrganization,
  getOrganizations
} = require('../controllers/userController');

// Import middleware
const {
  authenticate,
  authorize,
  checkOwnership,
  checkOrganizationAccess,
  protectSensitiveRoutes
} = require('../middleware/auth');

// Import validation
const {
  validate,
  validateQuery,
  updateProfileSchema,
  resetPasswordSchema,
  paginationSchema
} = require('../utils/validation');

// @route   GET /api/users
// @desc    Lấy danh sách tất cả users (chỉ Admin)
// @access  Private (Admin only)
router.get('/',
  authenticate,
  authorize('admin'),
  validateQuery(paginationSchema),
  getAllUsers
);

// @route   GET /api/users/stats
// @desc    Lấy thống kê users (chỉ Admin)
// @access  Private (Admin only)
router.get('/stats',
  authenticate,
  authorize('admin'),
  getUserStats
);

// @route   GET /api/users/organizations
// @desc    Lấy danh sách tổ chức công khai (cho tạo đánh giá)
// @access  Private (Tất cả user đã đăng nhập)
router.get('/organizations',
  authenticate,
  getOrganizations
);

// @route   GET /api/users/organization/:organizationId
// @desc    Lấy danh sách users theo tổ chức
// @access  Private
router.get('/organization/:organizationId',
  authenticate,
  checkOrganizationAccess,
  getUsersByOrganization
);

// @route   GET /api/users/:id
// @desc    Lấy thông tin user theo ID
// @access  Private
router.get('/:id',
  authenticate,
  checkOwnership,
  getUserById
);

// @route   PUT /api/users/:id
// @desc    Cập nhật thông tin user
// @access  Private
router.put('/:id',
  authenticate,
  checkOwnership,
  validate(updateProfileSchema),
  updateUser
);

// @route   DELETE /api/users/:id
// @desc    Xóa user (chỉ Admin)
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize('admin'),
  deleteUser
);

// @route   PUT /api/users/:id/toggle-lock
// @desc    Khóa/Mở khóa tài khoản user (chỉ Admin)
// @access  Private (Admin only)
router.put('/:id/toggle-lock',
  authenticate,
  authorize('admin'),
  toggleUserLock
);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset mật khẩu user (chỉ Admin)
// @access  Private (Admin only)
router.put('/:id/reset-password',
  authenticate,
  authorize('admin'),
  validate(resetPasswordSchema),
  resetUserPassword
);

module.exports = router;
