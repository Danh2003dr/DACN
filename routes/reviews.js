const express = require('express');
const router = express.Router();

// Import controllers
const {
  createReview,
  getMyReviews,
  getReviewsByTarget,
  getReviewStats,
  getReview,
  voteHelpful,
  voteNotHelpful,
  addResponse,
  reportReview,
  getTopRatedTargets,
  getPublicReviews,
  getReviewsForAdmin,
  updateReviewReportStatus,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// Public routes - đặt các route cố định trước route động
router.get('/public', getPublicReviews);
router.get('/target/:targetType/:targetId', getReviewsByTarget);
router.get('/stats/:targetType/:targetId', getReviewStats);
router.get('/top-rated/:targetType', getTopRatedTargets);
// Lưu ý: đặt route cố định trước route động "/:id" để tránh match nhầm (ví dụ "/my")
router.get('/my', authenticate, getMyReviews);
// Chỉ match ObjectId hợp lệ (24 hex) để tránh nuốt các route khác
router.get('/:id([0-9a-fA-F]{24})', getReview);

// Protected routes (require authentication)
// "Ẩn danh" = ẩn hiển thị danh tính, vẫn cần đăng nhập để gắn reviewer (xem "Đánh giá của tôi")
router.post('/', authenticate, createReview);
router.post('/:id([0-9a-fA-F]{24})/vote/helpful', authenticate, voteHelpful);
router.post('/:id([0-9a-fA-F]{24})/vote/not-helpful', authenticate, voteNotHelpful);
router.post('/:id([0-9a-fA-F]{24})/report', authenticate, reportReview);

// Admin routes
router.get('/admin/list', authenticate, authorize(['admin']), getReviewsForAdmin);
router.put('/:id([0-9a-fA-F]{24})/reports/:reportId([0-9a-fA-F]{24})', authenticate, authorize(['admin']), updateReviewReportStatus);
router.post('/:id([0-9a-fA-F]{24})/response', authenticate, authorize(['admin', 'manufacturer', 'distributor', 'hospital']), addResponse);
router.put('/:id([0-9a-fA-F]{24})/status', authenticate, authorize(['admin']), updateReviewStatus);
router.delete('/:id([0-9a-fA-F]{24})', authenticate, authorize(['admin']), deleteReview);

module.exports = router;
