const express = require('express');
const router = express.Router();

// Import controllers
const {
  createNotification,
  getUserNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  updateNotification,
  deleteNotification,
  getNotificationStats,
  getSentNotifications,
  sendSystemNotification
} = require('../controllers/notificationController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/notifications
// @desc    Tạo thông báo mới
// @access  Private
router.post('/',
  authenticate,
  createNotification
);

// @route   GET /api/notifications
// @desc    Lấy danh sách thông báo của người dùng
// @access  Private
router.get('/',
  authenticate,
  getUserNotifications
);

// @route   GET /api/notifications/stats
// @desc    Lấy thống kê thông báo
// @access  Private
router.get('/stats',
  authenticate,
  getNotificationStats
);

// @route   GET /api/notifications/sent
// @desc    Lấy danh sách thông báo đã gửi
// @access  Private
router.get('/sent',
  authenticate,
  getSentNotifications
);

// @route   POST /api/notifications/system
// @desc    Gửi thông báo hệ thống
// @access  Private (Admin only)
router.post('/system',
  authenticate,
  authorize(['admin']),
  sendSystemNotification
);

// @route   GET /api/notifications/:id
// @desc    Lấy thông báo chi tiết
// @access  Private
router.get('/:id',
  authenticate,
  getNotification
);

// @route   PUT /api/notifications/:id
// @desc    Cập nhật thông báo
// @access  Private
router.put('/:id',
  authenticate,
  updateNotification
);

// @route   DELETE /api/notifications/:id
// @desc    Xóa thông báo
// @access  Private
router.delete('/:id',
  authenticate,
  deleteNotification
);

// @route   PUT /api/notifications/:id/read
// @desc    Đánh dấu thông báo là đã đọc
// @access  Private
router.put('/:id/read',
  authenticate,
  markAsRead
);

// @route   PUT /api/notifications/:id/unread
// @desc    Đánh dấu thông báo là chưa đọc
// @access  Private
router.put('/:id/unread',
  authenticate,
  markAsUnread
);

// @route   PUT /api/notifications/read-all
// @desc    Đánh dấu tất cả thông báo là đã đọc
// @access  Private
router.put('/read-all',
  authenticate,
  markAllAsRead
);

module.exports = router;
