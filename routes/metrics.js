const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const metricsCollector = require('../utils/metrics');
const alertingSystem = require('../utils/alerting');

/**
 * @route   GET /api/metrics
 * @desc    Get system metrics (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize(['admin']), (req, res) => {
  try {
    const summary = metricsCollector.getSummary();
    const fullMetrics = metricsCollector.getMetrics();
    
    res.json({
      success: true,
      data: {
        summary,
        full: fullMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy metrics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/metrics/summary
 * @desc    Get metrics summary for dashboard
 * @access  Private/Admin
 */
router.get('/summary', authenticate, authorize(['admin']), (req, res) => {
  try {
    const summary = metricsCollector.getSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy metrics summary',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/metrics/alerts
 * @desc    Get recent alerts
 * @access  Private/Admin
 */
router.get('/alerts', authenticate, authorize(['admin']), (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const level = req.query.level;
    
    let alerts = alertingSystem.getRecentAlerts(limit);
    if (level) {
      alerts = alertingSystem.getAlertsByLevel(level);
    }
    
    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy alerts',
      error: error.message
    });
  }
});

module.exports = router;


