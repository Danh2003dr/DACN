const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Đối tượng được đánh giá
  targetType: {
    type: String,
    enum: ['drug', 'distributor', 'hospital', 'manufacturer'],
    required: [true, 'Loại đối tượng đánh giá là bắt buộc']
  },
  
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ID đối tượng đánh giá là bắt buộc']
  },
  
  targetName: {
    type: String,
    required: [true, 'Tên đối tượng đánh giá là bắt buộc']
  },
  
  // Người đánh giá
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null nếu đánh giá ẩn danh
  },
  
  // Thông tin người đánh giá (cho đánh giá ẩn danh)
  reviewerInfo: {
    role: {
      type: String,
      enum: ['patient', 'hospital', 'distributor', 'manufacturer', 'anonymous'],
      default: 'anonymous'
    },
    location: {
      type: String,
      default: null
    },
    experience: {
      type: String,
      enum: ['first_time', 'occasional', 'regular', 'professional', null],
      default: null
    }
  },
  
  // Đánh giá chính
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Điểm đánh giá tổng thể là bắt buộc']
  },
  
  // Đánh giá chi tiết theo tiêu chí
  criteriaRatings: {
    // Đối với thuốc
    drugQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    effectiveness: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    sideEffects: {
      type: Number,
      min: 1,
      max: 5,
      default: null // 1 = nhiều tác dụng phụ, 5 = ít tác dụng phụ
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    
    // Đối với nhà phân phối/bệnh viện
    deliveryTime: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    customerService: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },
  
  // Nội dung đánh giá
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    default: null
  },
  
  content: {
    type: String,
    trim: true,
    maxlength: [2000, 'Nội dung không được quá 2000 ký tự'],
    default: null
  },
  
  // Loại đánh giá
  reviewType: {
    type: String,
    enum: ['purchase', 'usage', 'service', 'quality_check', 'complaint', 'recommendation'],
    default: 'usage'
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Ẩn danh
  isAnonymous: {
    type: Boolean,
    default: true
  },
  
  // Xác minh
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Thông tin xác minh
  verificationInfo: {
    purchaseDate: {
      type: Date,
      default: null
    },
    batchNumber: {
      type: String,
      default: null
    },
    orderId: {
      type: String,
      default: null
    },
    verificationMethod: {
      type: String,
      enum: ['receipt', 'qr_code', 'order_confirmation', 'manual', null],
      default: null
    }
  },
  
  // Phản hồi từ đối tượng được đánh giá
  response: {
    content: {
      type: String,
      default: null
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  
  // Thống kê
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  notHelpfulVotes: {
    type: Number,
    default: 0
  },
  
  // Người đã vote
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'not_helpful']
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags và phân loại
  tags: [{
    type: String,
    trim: true
  }],
  
  // Báo cáo vi phạm
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'irrelevant', 'other']
    },
    description: {
      type: String,
      default: null
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  
  // Metadata
  language: {
    type: String,
    default: 'vi'
  },
  
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'import'],
    default: 'web'
  },
  
  ipAddress: {
    type: String,
    default: null
  },
  
  userAgent: {
    type: String,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ overallRating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ isAnonymous: 1 });
reviewSchema.index({ isVerified: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });

// Compound indexes
reviewSchema.index({ targetType: 1, targetId: 1, status: 1 });
reviewSchema.index({ targetType: 1, overallRating: 1, status: 1 });

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Tự động tính toán điểm trung bình nếu có các tiêu chí
  if (this.criteriaRatings) {
    const ratings = Object.values(this.criteriaRatings).filter(rating => rating !== null);
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      this.overallRating = Math.round(averageRating * 2) / 2; // Làm tròn đến 0.5
    }
  }
  
  next();
});

// Virtual fields
reviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpfulVotes + this.notHelpfulVotes;
  return total > 0 ? Math.round((this.helpfulVotes / total) * 100) : 0;
});

reviewSchema.virtual('isHelpful').get(function() {
  return this.helpfulVotes > this.notHelpfulVotes;
});

reviewSchema.virtual('hasResponse').get(function() {
  return this.response && this.response.content;
});

reviewSchema.virtual('isFlagged').get(function() {
  return this.reports && this.reports.length > 0;
});

// Methods
reviewSchema.methods.voteHelpful = function(userId) {
  // Kiểm tra xem user đã vote chưa
  const existingVote = this.voters.find(voter => voter.user.toString() === userId.toString());
  
  if (existingVote) {
    if (existingVote.vote === 'helpful') {
      // Đã vote helpful rồi, không làm gì
      return Promise.resolve(this);
    } else {
      // Đã vote not_helpful, chuyển sang helpful
      existingVote.vote = 'helpful';
      this.notHelpfulVotes--;
      this.helpfulVotes++;
    }
  } else {
    // Chưa vote, thêm vote helpful
    this.voters.push({
      user: userId,
      vote: 'helpful',
      votedAt: new Date()
    });
    this.helpfulVotes++;
  }
  
  return this.save();
};

reviewSchema.methods.voteNotHelpful = function(userId) {
  // Kiểm tra xem user đã vote chưa
  const existingVote = this.voters.find(voter => voter.user.toString() === userId.toString());
  
  if (existingVote) {
    if (existingVote.vote === 'not_helpful') {
      // Đã vote not_helpful rồi, không làm gì
      return Promise.resolve(this);
    } else {
      // Đã vote helpful, chuyển sang not_helpful
      existingVote.vote = 'not_helpful';
      this.helpfulVotes--;
      this.notHelpfulVotes++;
    }
  } else {
    // Chưa vote, thêm vote not_helpful
    this.voters.push({
      user: userId,
      vote: 'not_helpful',
      votedAt: new Date()
    });
    this.notHelpfulVotes++;
  }
  
  return this.save();
};

reviewSchema.methods.addResponse = function(content, respondedBy) {
  this.response = {
    content,
    respondedBy,
    respondedAt: new Date()
  };
  return this.save();
};

reviewSchema.methods.report = function(reporterId, reason, description) {
  // Kiểm tra xem user đã report chưa
  const existingReport = this.reports.find(report => report.reporter.toString() === reporterId.toString());
  
  if (!existingReport) {
    this.reports.push({
      reporter: reporterId,
      reason,
      description,
      reportedAt: new Date(),
      status: 'pending'
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

reviewSchema.methods.getRatingColor = function() {
  const colors = {
    1: 'red',
    2: 'orange',
    3: 'yellow',
    4: 'lightgreen',
    5: 'green'
  };
  return colors[this.overallRating] || 'gray';
};

// Static methods
reviewSchema.statics.getReviewsByTarget = function(targetType, targetId, options = {}) {
  const query = {
    targetType,
    targetId,
    status: 'approved'
  };
  
  // Lọc theo rating
  if (options.minRating) {
    query.overallRating = { $gte: options.minRating };
  }
  
  if (options.maxRating) {
    query.overallRating = { ...query.overallRating, $lte: options.maxRating };
  }
  
  // Lọc theo loại đánh giá
  if (options.reviewType) {
    query.reviewType = options.reviewType;
  }
  
  // Lọc theo xác minh
  if (options.verifiedOnly) {
    query.isVerified = true;
  }
  
  // Sắp xếp
  const sortOptions = {};
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'highest_rated':
        sortOptions.overallRating = -1;
        break;
      case 'lowest_rated':
        sortOptions.overallRating = 1;
        break;
      case 'most_helpful':
        sortOptions.helpfulVotes = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }
  } else {
    sortOptions.createdAt = -1;
  }
  
  return this.find(query)
    .populate('reviewer', 'fullName email role avatar')
    .populate('response.respondedBy', 'fullName email role')
    .sort(sortOptions)
    .limit(options.limit || 20);
};

reviewSchema.statics.getReviewStats = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType,
        targetId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        ratingDistribution: {
          $push: '$overallRating'
        },
        verifiedReviews: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        anonymousReviews: {
          $sum: { $cond: ['$isAnonymous', 1, 0] }
        },
        totalHelpfulVotes: { $sum: '$helpfulVotes' },
        totalNotHelpfulVotes: { $sum: '$notHelpfulVotes' }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        verifiedReviews: 1,
        anonymousReviews: 1,
        totalHelpfulVotes: 1,
        totalNotHelpfulVotes: 1,
        ratingDistribution: {
          $reduce: {
            input: [1, 2, 3, 4, 5],
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{
                      k: { $toString: '$$this' },
                      v: {
                        $size: {
                          $filter: {
                            input: '$ratingDistribution',
                            as: 'rating',
                            cond: { $eq: ['$$rating', '$$this'] }
                          }
                        }
                      }
                    }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

reviewSchema.statics.getTopRatedTargets = function(targetType, limit = 10) {
  return this.aggregate([
    {
      $match: {
        targetType,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$targetId',
        targetName: { $first: '$targetName' },
        averageRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        verifiedReviews: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        }
      }
    },
    {
      $match: {
        totalReviews: { $gte: 5 } // Ít nhất 5 đánh giá
      }
    },
    {
      $sort: {
        averageRating: -1,
        totalReviews: -1
      }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('Review', reviewSchema);
