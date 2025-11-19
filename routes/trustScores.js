const express = require('express');
const router = express.Router();
const {
  getTrustScore,
  getRanking,
  recalculateTrustScore,
  addRewardOrPenalty,
  getScoreHistory,
  getStats,
  recalculateAllTrustScores
} = require('../controllers/trustScoreController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes - Đặt routes cụ thể trước routes có params
router.get('/ranking', getRanking);
router.get('/stats', getStats);
router.get('/:supplierId/history', getScoreHistory);
router.get('/:supplierId', getTrustScore);

// Admin only routes
router.post('/:supplierId/recalculate', authenticate, authorize('admin'), recalculateTrustScore);
router.post('/:supplierId/reward-penalty', authenticate, authorize('admin'), addRewardOrPenalty);
router.post('/recalculate-all', authenticate, authorize('admin'), recalculateAllTrustScores);

module.exports = router;

