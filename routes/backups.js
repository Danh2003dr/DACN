const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createBackup,
  getBackups,
  getBackupById,
  restoreBackup,
  downloadBackup,
  deleteBackup,
  getBackupStats,
  cleanupBackups
} = require('../controllers/backupController');

// Tất cả routes yêu cầu admin
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/backups/stats
// @desc    Lấy thống kê backups
// @access  Private (Admin only)
router.get('/stats', getBackupStats);

// @route   POST /api/backups/cleanup
// @desc    Cleanup expired backups
// @access  Private (Admin only)
router.post('/cleanup', cleanupBackups);

// @route   GET /api/backups
// @desc    Lấy danh sách backups
// @access  Private (Admin only)
router.get('/', getBackups);

// @route   POST /api/backups
// @desc    Tạo backup
// @access  Private (Admin only)
router.post('/', createBackup);

// @route   GET /api/backups/:id
// @desc    Lấy backup theo ID
// @access  Private (Admin only)
router.get('/:id', getBackupById);

// @route   GET /api/backups/:id/download
// @desc    Download backup file
// @access  Private (Admin only)
router.get('/:id/download', downloadBackup);

// @route   POST /api/backups/:id/restore
// @desc    Restore từ backup
// @access  Private (Admin only)
router.post('/:id/restore', restoreBackup);

// @route   DELETE /api/backups/:id
// @desc    Xóa backup
// @access  Private (Admin only)
router.delete('/:id', deleteBackup);

module.exports = router;

