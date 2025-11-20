const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSystemOverview,
  getDashboardSummary,
  getModuleStats,
  getDistributionJourneyReport,
  getSuspiciousDrugsReport,
  getQualityAssessmentReport,
  exportReportExcel,
  exportReportPdf,
  getHighRiskDrugsReport
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

// @route   GET /api/reports/risky-drugs
// @desc    Lấy danh sách thuốc rủi ro cao theo AI (Drug Verification AI)
// @access  Private
router.get('/risky-drugs',
  authenticate,
  getHighRiskDrugsReport
);

// @route   GET /api/reports/quality-assessment
// @desc    Lấy báo cáo đánh giá chất lượng
// @access  Private
router.get('/quality-assessment',
  authenticate,
  getQualityAssessmentReport
);

// @route   GET /api/reports/export/excel
// @desc    Xuất báo cáo Excel theo module
// @access  Private
router.get('/export/excel',
  authenticate,
  exportReportExcel
);

// @route   GET /api/reports/export/pdf
// @desc    Xuất báo cáo PDF theo module
// @access  Private
router.get('/export/pdf',
  authenticate,
  exportReportPdf
);

// @route   GET /api/reports/kpi
// @desc    Lấy KPI tổng hợp
// @access  Private
router.get('/kpi',
  authenticate,
  require('../controllers/reportController').getKPIs
);

// @route   GET /api/reports/kpi/timeseries
// @desc    Lấy KPI time series cho biểu đồ
// @access  Private
router.get('/kpi/timeseries',
  authenticate,
  require('../controllers/reportController').getKPITimeSeries
);

// @route   GET /api/reports/alerts
// @desc    Lấy cảnh báo thời gian thực
// @access  Private
router.get('/alerts',
  authenticate,
  require('../controllers/reportController').getAlerts
);

// @route   POST /api/reports/alerts/:alertId/read
// @desc    Đánh dấu cảnh báo đã xem
// @access  Private
router.post('/alerts/:alertId/read',
  authenticate,
  require('../controllers/reportController').markAlertAsRead
);

// @route   POST /api/reports/export/custom
// @desc    Xuất báo cáo động với tùy chọn
// @access  Private
router.post('/export/custom',
  authenticate,
  require('../controllers/reportController').exportCustomReport
);

module.exports = router;
