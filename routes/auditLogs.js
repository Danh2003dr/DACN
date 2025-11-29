const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAuditLogs,
  getAuditLogById,
  getEntityHistory,
  getAuditStats,
  exportAuditLogs
} = require('../controllers/auditController');

// Tất cả routes yêu cầu admin
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/audit-logs
// @desc    Lấy danh sách audit logs
// @access  Private (Admin only)
router.get('/', getAuditLogs);

// @route   GET /api/audit-logs/stats
// @desc    Lấy thống kê audit logs
// @access  Private (Admin only)
router.get('/stats', getAuditStats);

// @route   GET /api/audit-logs/export
// @desc    Export audit logs
// @access  Private (Admin only)
router.get('/export', exportAuditLogs);

// @route   GET /api/audit-logs/entity/:entityType/:entityId
// @desc    Lấy lịch sử audit log cho một entity
// @access  Private (Admin only)
router.get('/entity/:entityType/:entityId', getEntityHistory);

// @route   GET /api/audit-logs/:id
// @desc    Lấy audit log theo ID
// @access  Private (Admin only)
router.get('/:id', getAuditLogById);

module.exports = router;

