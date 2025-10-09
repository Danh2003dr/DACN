const express = require('express');
const router = express.Router();

// Import controllers
const {
  createReview,
  getReviewsByTarget,
  getReviewStats,
  getReview,
  voteHelpful,
  voteNotHelpful,
  addResponse,
  reportReview,
  getTopRatedTargets,
  getReviewsForAdmin,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/target/:targetType/:targetId', getReviewsByTarget);
router.get('/stats/:targetType/:targetId', getReviewStats);
router.get('/top-rated/:targetType', getTopRatedTargets);
router.get('/:id', getReview);

// Protected routes (require authentication)
router.post('/', createReview); // Cho phép tạo đánh giá ẩn danh
router.post('/:id/vote/helpful', authenticate, voteHelpful);
router.post('/:id/vote/not-helpful', authenticate, voteNotHelpful);
router.post('/:id/report', authenticate, reportReview);

// Admin routes
router.get('/admin/list', authenticate, authorize(['admin']), getReviewsForAdmin);
router.post('/:id/response', authenticate, authorize(['admin', 'manufacturer', 'distributor', 'hospital']), addResponse);
router.put('/:id/status', authenticate, authorize(['admin']), updateReviewStatus);
router.delete('/:id', authenticate, authorize(['admin']), deleteReview);

module.exports = router;
