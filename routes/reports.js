const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSystemOverview,
  getDashboardSummary,
  getModuleStats,
  getDistributionJourneyReport,
  getSuspiciousDrugsReport,
  getQualityAssessmentReport
} = require('../controllers/reportController');

// @route   GET /api/reports/overview
// @desc    Lấy thống kê tổng quan hệ thống
// @access  Private (Admin only)
router.get('/overview',
  authenticate,
  authorize('admin'),
  getSystemOverview
);

// @route   GET /api/reports/dashboard
// @desc    Lấy dữ liệu dashboard thực tế
// @access  Private
router.get('/dashboard',
  authenticate,
  getDashboardSummary
);

// @route   GET /api/reports/module/:module
// @desc    Lấy thống kê chi tiết theo module
// @access  Private
router.get('/module/:module',
  authenticate,
  getModuleStats
);

// @route   GET /api/reports/distribution-journey
// @desc    Lấy báo cáo hành trình phân phối
// @access  Private
router.get('/distribution-journey',
  authenticate,
  getDistributionJourneyReport
);

// @route   GET /api/reports/suspicious-drugs
// @desc    Lấy báo cáo thuốc nghi vấn
// @access  Private
router.get('/suspicious-drugs',
  authenticate,
  getSuspiciousDrugsReport
);

// @route   GET /api/reports/quality-assessment
// @desc    Lấy báo cáo đánh giá chất lượng
// @access  Private
router.get('/quality-assessment',
  authenticate,
  getQualityAssessmentReport
);

module.exports = router;
