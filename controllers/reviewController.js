const Review = require('../models/Review');
const User = require('../models/User');
const Drug = require('../models/Drug');
const TrustScoreService = require('../services/trustScoreService');

// @desc    Tạo đánh giá mới
// @route   POST /api/reviews
// @access  Private/Public (cho đánh giá ẩn danh)
const createReview = async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      targetName,
      overallRating,
      criteriaRatings,
      title,
      content,
      reviewType,
      isAnonymous,
      reviewerInfo,
      verificationInfo,
      tags
    } = req.body;

    // Validation cơ bản
    if (!targetType || !targetName || !overallRating || (!targetId && !targetName)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Điểm đánh giá phải từ 1 đến 5'
      });
    }

    // Kiểm tra đối tượng được đánh giá có tồn tại không
    let resolvedTargetId = targetId;
    if (targetType === 'drug') {
      let drug = null;
      if (targetId) {
        drug = await Drug.findById(targetId);
      } else if (targetName) {
        drug = await Drug.findOne({
          $or: [
            { name: targetName },
            { drugId: targetName },
            { batchNumber: targetName }
          ]
        });
      }

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lô thuốc hoặc ID không hợp lệ'
        });
      }

      resolvedTargetId = drug._id;
    }

    // Tạo đánh giá
    const reviewData = {
      targetType,
      targetId: resolvedTargetId,
      targetName,
      overallRating,
      criteriaRatings: criteriaRatings || {},
      title,
      content,
      reviewType: reviewType || 'usage',
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
      reviewerInfo: reviewerInfo || {},
      verificationInfo: verificationInfo || {},
      tags: tags || [],
      source: 'web',
      language: 'vi'
    };

    // Nếu không phải đánh giá ẩn danh và có user đăng nhập
    if (!isAnonymous && req.user) {
      reviewData.reviewer = req.user._id;
      reviewData.reviewerInfo.role = req.user.role;
    }

    // Thêm thông tin IP và User Agent (cho bảo mật)
    reviewData.ipAddress = req.ip || req.connection.remoteAddress;
    reviewData.userAgent = req.get('User-Agent');

    const review = new Review(reviewData);
    await review.save();

    // Populate để trả về thông tin đầy đủ
    if (review.reviewer) {
      await review.populate('reviewer', 'fullName email role avatar');
    }

    // Cập nhật điểm tín nhiệm nếu đánh giá được duyệt tự động hoặc đã được duyệt
    if (review.status === 'approved' && ['manufacturer', 'distributor', 'hospital'].includes(review.targetType)) {
      try {
        await TrustScoreService.updateScoreOnReview(review._id);
      } catch (error) {
        console.error('Error updating trust score on review creation:', error);
        // Không throw error để không ảnh hưởng đến response
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tạo đánh giá thành công',
      data: {
        review
      }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đánh giá'
    });
  }
};

// @desc    Lấy danh sách đánh giá theo đối tượng
// @route   GET /api/reviews/target/:targetType/:targetId
// @access  Public
const getReviewsByTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const {
      page = 1,
      limit = 10,
      minRating,
      maxRating,
      reviewType,
      verifiedOnly,
      sortBy = 'newest'
    } = req.query;

    const skip = (page - 1) * limit;

    const options = {
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
      reviewType,
      verifiedOnly: verifiedOnly === 'true',
      sortBy,
      limit: parseInt(limit)
    };

    const reviews = await Review.getReviewsByTarget(targetType, targetId, options);
    const total = await Review.countDocuments({
      targetType,
      targetId,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get reviews by target error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá'
    });
  }
};

// @desc    Lấy thống kê đánh giá
// @route   GET /api/reviews/stats/:targetType/:targetId
// @access  Public
const getReviewStats = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    const stats = await Review.getReviewStats(targetType, targetId);
    
    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      verifiedReviews: 0,
      anonymousReviews: 0,
      totalHelpfulVotes: 0,
      totalNotHelpfulVotes: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    res.status(200).json({
      success: true,
      data: {
        stats: result
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đánh giá'
    });
  }
};

// @desc    Lấy đánh giá chi tiết
// @route   GET /api/reviews/:id
// @access  Public
const getReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('reviewer', 'fullName email role avatar')
      .populate('response.respondedBy', 'fullName email role')
      .populate('reports.reporter', 'fullName email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        review
      }
    });

  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đánh giá'
    });
  }
};

// @desc    Vote hữu ích cho đánh giá
// @route   POST /api/reviews/:id/vote/helpful
// @access  Private
const voteHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    await review.voteHelpful(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Đã vote hữu ích',
      data: {
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes
      }
    });

  } catch (error) {
    console.error('Vote helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi vote'
    });
  }
};

// @desc    Vote không hữu ích cho đánh giá
// @route   POST /api/reviews/:id/vote/not-helpful
// @access  Private
const voteNotHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    await review.voteNotHelpful(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Đã vote không hữu ích',
      data: {
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes
      }
    });

  } catch (error) {
    console.error('Vote not helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi vote'
    });
  }
};

// @desc    Phản hồi đánh giá
// @route   POST /api/reviews/:id/response
// @access  Private
const addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi là bắt buộc'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    // Kiểm tra quyền phản hồi (chỉ admin hoặc người liên quan)
    if (req.user.role !== 'admin') {
      // Có thể thêm logic kiểm tra quyền theo targetType
      return res.status(403).json({
        success: false,
        message: 'Không có quyền phản hồi đánh giá này'
      });
    }

    await review.addResponse(content, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Phản hồi thành công',
      data: {
        response: review.response
      }
    });

  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm phản hồi'
    });
  }
};

// @desc    Báo cáo đánh giá vi phạm
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Lý do báo cáo là bắt buộc'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    await review.report(req.user._id, reason, description);

    res.status(200).json({
      success: true,
      message: 'Báo cáo thành công'
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi báo cáo'
    });
  }
};

// @desc    Lấy top đánh giá cao
// @route   GET /api/reviews/top-rated/:targetType
// @access  Public
const getTopRatedTargets = async (req, res) => {
  try {
    const { targetType } = req.params;
    const { limit = 10 } = req.query;

    const topRated = await Review.getTopRatedTargets(targetType, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        topRated
      }
    });

  } catch (error) {
    console.error('Get top rated error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá cao'
    });
  }
};

// @desc    Quản lý đánh giá (Admin)
// @route   GET /api/reviews/admin
// @access  Private (Admin only)
const getReviewsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      targetType,
      minRating,
      maxRating,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Xây dựng filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (targetType) {
      filter.targetType = targetType;
    }
    
    if (minRating || maxRating) {
      filter.overallRating = {};
      if (minRating) filter.overallRating.$gte = parseInt(minRating);
      if (maxRating) filter.overallRating.$lte = parseInt(maxRating);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { targetName: { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'fullName email role')
      .populate('response.respondedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get reviews for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá'
    });
  }
};

// @desc    Cập nhật trạng thái đánh giá
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin only)
const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    review.status = status;
    await review.save();

    // Cập nhật điểm tín nhiệm khi đánh giá được duyệt
    if (status === 'approved' && ['manufacturer', 'distributor', 'hospital'].includes(review.targetType)) {
      try {
        await TrustScoreService.updateScoreOnReview(review._id);
      } catch (error) {
        console.error('Error updating trust score on review approval:', error);
        // Không throw error để không ảnh hưởng đến response
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: {
        review
      }
    });

  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái'
    });
  }
};

// @desc    Xóa đánh giá
// @route   DELETE /api/reviews/:id
// @access  Private (Admin only)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Đánh giá không tồn tại'
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đánh giá'
    });
  }
};

module.exports = {
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
};
