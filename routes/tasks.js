const express = require('express');
const router = express.Router();

// Import controllers
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  addTaskUpdate,
  rateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/tasks
// @desc    Tạo nhiệm vụ mới
// @access  Private
router.post('/',
  authenticate,
  createTask
);

// @route   GET /api/tasks
// @desc    Lấy danh sách nhiệm vụ
// @access  Private
router.get('/',
  authenticate,
  getTasks
);

// @route   GET /api/tasks/stats
// @desc    Lấy thống kê nhiệm vụ
// @access  Private
router.get('/stats',
  authenticate,
  getTaskStats
);

// @route   GET /api/tasks/:id
// @desc    Lấy thông tin nhiệm vụ chi tiết
// @access  Private
router.get('/:id',
  authenticate,
  getTask
);

// @route   PUT /api/tasks/:id
// @desc    Cập nhật nhiệm vụ
// @access  Private
router.put('/:id',
  authenticate,
  updateTask
);

// @route   POST /api/tasks/:id/updates
// @desc    Thêm cập nhật tiến độ
// @access  Private
router.post('/:id/updates',
  authenticate,
  addTaskUpdate
);

// @route   POST /api/tasks/:id/rate
// @desc    Đánh giá chất lượng nhiệm vụ
// @access  Private
router.post('/:id/rate',
  authenticate,
  rateTask
);

// @route   DELETE /api/tasks/:id
// @desc    Xóa nhiệm vụ
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  deleteTask
);

module.exports = router;
