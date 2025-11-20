const mongoose = require('mongoose');

// Schema cho điểm tín nhiệm nhà cung ứng
const supplierTrustScoreSchema = new mongoose.Schema({
  // Nhà cung ứng (manufacturer, distributor, hospital)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Nhà cung ứng là bắt buộc'],
    unique: true,
    index: true
  },
  
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  
  supplierRole: {
    type: String,
    enum: ['manufacturer', 'distributor', 'hospital', 'pharmacy', 'dealer'],
    required: true,
    index: true
  },
  
  organizationId: {
    type: String,
    index: true
  },
  
  // Điểm tín nhiệm tổng thể (0-1000)
  trustScore: {
    type: Number,
    min: 0,
    max: 1000,
    default: 500, // Điểm khởi đầu
    required: true
  },
  
  // Cấp độ tín nhiệm (A, B, C, D)
  trustLevel: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    default: 'C',
    required: true,
    index: true
  },
  
  // Điểm chi tiết theo từng tiêu chí
  scoreBreakdown: {
    // Điểm từ đánh giá (0-300)
    reviewScore: {
      type: Number,
      min: 0,
      max: 300,
      default: 150
    },
    
    // Điểm tuân thủ (0-250)
    complianceScore: {
      type: Number,
      min: 0,
      max: 250,
      default: 125
    },
    
    // Điểm chất lượng (0-200)
    qualityScore: {
      type: Number,
      min: 0,
      max: 200,
      default: 100
    },
    
    // Điểm hiệu quả (0-150)
    efficiencyScore: {
      type: Number,
      min: 0,
      max: 150,
      default: 75
    },
    
    // Điểm thời gian (0-100)
    timelinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  
  // Thống kê đánh giá
  reviewStats: {
    totalReviews: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    verifiedReviews: {
      type: Number,
      default: 0
    },
    positiveReviews: {
      type: Number,
      default: 0 // >= 4 sao
    },
    negativeReviews: {
      type: Number,
      default: 0 // <= 2 sao
    }
  },
  
  // Thống kê tuân thủ
  complianceStats: {
    // Tỷ lệ chữ ký số hợp lệ
    validSignatureRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    totalSignatures: {
      type: Number,
      default: 0
    },
    validSignatures: {
      type: Number,
      default: 0
    },
    
    // Tỷ lệ hoàn thành nhiệm vụ đúng hạn
    onTimeTaskRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    onTimeTasks: {
      type: Number,
      default: 0
    },
    
    // Tỷ lệ thuốc hợp lệ
    validDrugRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    totalDrugs: {
      type: Number,
      default: 0
    },
    validDrugs: {
      type: Number,
      default: 0
    },
    recalledDrugs: {
      type: Number,
      default: 0
    }
  },
  
  // Thống kê chất lượng
  qualityStats: {
    averageQualityRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    passedQualityTests: {
      type: Number,
      default: 0
    },
    failedQualityTests: {
      type: Number,
      default: 0
    },
    totalQualityTests: {
      type: Number,
      default: 0
    }
  },
  
  // Lịch sử thay đổi điểm
  scoreHistory: [{
    previousScore: Number,
    newScore: Number,
    change: Number, // Số điểm thay đổi (+ hoặc -)
    reason: {
      type: String,
      enum: [
        'review_added',
        'review_updated',
        'task_completed',
        'task_overdue',
        'signature_added',
        'signature_invalid',
        'quality_test_passed',
        'quality_test_failed',
        'drug_recalled',
        'compliance_violation',
        'manual_adjustment',
        'periodic_update'
      ],
      required: true
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    relatedType: {
      type: String,
      enum: ['review', 'task', 'signature', 'drug', 'quality_test', 'manual'],
      default: null
    },
    description: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  
  // Lịch sử thưởng/phạt
  rewardsAndPenalties: [{
    type: {
      type: String,
      enum: ['reward', 'penalty'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: String,
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    relatedType: {
      type: String,
      enum: ['review', 'task', 'signature', 'drug', 'quality_test', 'compliance', 'manual'],
      default: null
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  
  // Badges và thành tích
  badges: [{
    badgeId: {
      type: String,
      required: true
    },
    badgeName: {
      type: String,
      required: true
    },
    badgeType: {
      type: String,
      enum: ['quality', 'compliance', 'efficiency', 'reliability', 'excellence'],
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  
  // Xếp hạng
  ranking: {
    overall: {
      type: Number,
      default: null
    },
    byRole: {
      type: Number,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Thời gian cập nhật
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
supplierTrustScoreSchema.index({ trustScore: -1 });
supplierTrustScoreSchema.index({ trustLevel: 1, trustScore: -1 });
supplierTrustScoreSchema.index({ supplierRole: 1, trustScore: -1 });
supplierTrustScoreSchema.index({ 'ranking.overall': 1 });

// Pre-save middleware
supplierTrustScoreSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Tự động tính cấp độ tín nhiệm dựa trên điểm
  if (this.trustScore >= 800) {
    this.trustLevel = 'A';
  } else if (this.trustScore >= 600) {
    this.trustLevel = 'B';
  } else if (this.trustScore >= 400) {
    this.trustLevel = 'C';
  } else {
    this.trustLevel = 'D';
  }
  
  next();
});

// Virtual: Tính điểm tổng từ các điểm thành phần
supplierTrustScoreSchema.virtual('calculatedScore').get(function() {
  const breakdown = this.scoreBreakdown;
  return (
    breakdown.reviewScore +
    breakdown.complianceScore +
    breakdown.qualityScore +
    breakdown.efficiencyScore +
    breakdown.timelinessScore
  );
});

// Virtual: Tổng thưởng/phạt
supplierTrustScoreSchema.virtual('totalRewards').get(function() {
  return this.rewardsAndPenalties
    .filter(rp => rp.type === 'reward')
    .reduce((sum, rp) => sum + rp.amount, 0);
});

supplierTrustScoreSchema.virtual('totalPenalties').get(function() {
  return this.rewardsAndPenalties
    .filter(rp => rp.type === 'penalty')
    .reduce((sum, rp) => sum + rp.amount, 0);
});

// Methods
supplierTrustScoreSchema.methods.addScoreChange = function(change, reason, relatedId, relatedType, description, changedBy) {
  const previousScore = this.trustScore;
  const newScore = Math.max(0, Math.min(1000, this.trustScore + change));
  
  this.scoreHistory.push({
    previousScore,
    newScore,
    change,
    reason,
    relatedId,
    relatedType,
    description,
    changedAt: new Date(),
    changedBy
  });
  
  this.trustScore = newScore;
  return this.save();
};

supplierTrustScoreSchema.methods.addRewardOrPenalty = function(type, amount, reason, description, relatedId, relatedType, appliedBy) {
  this.rewardsAndPenalties.push({
    type,
    amount,
    reason,
    description,
    relatedId,
    relatedType,
    appliedAt: new Date(),
    appliedBy
  });
  
  // Cập nhật điểm
  const change = type === 'reward' ? amount : -amount;
  return this.addScoreChange(change, reason, relatedId, relatedType, description, appliedBy);
};

supplierTrustScoreSchema.methods.addBadge = function(badgeId, badgeName, badgeType, description) {
  // Kiểm tra xem đã có badge này chưa
  const existingBadge = this.badges.find(b => b.badgeId === badgeId);
  if (!existingBadge) {
    this.badges.push({
      badgeId,
      badgeName,
      badgeType,
      earnedAt: new Date(),
      description
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
supplierTrustScoreSchema.statics.findBySupplier = function(supplierId) {
  return this.findOne({ supplier: supplierId });
};

supplierTrustScoreSchema.statics.getTopSuppliers = function(limit = 10, role = null) {
  const query = role ? { supplierRole: role } : {};
  return this.find(query)
    .populate('supplier', 'fullName email organizationInfo')
    .sort({ trustScore: -1 })
    .limit(limit);
};

supplierTrustScoreSchema.statics.getRanking = async function(supplierId) {
  const supplier = await this.findOne({ supplier: supplierId });
  if (!supplier) return null;
  
  // Xếp hạng tổng thể
  const overallRank = await this.countDocuments({
    trustScore: { $gt: supplier.trustScore }
  }) + 1;
  
  // Xếp hạng theo vai trò
  const roleRank = await this.countDocuments({
    supplierRole: supplier.supplierRole,
    trustScore: { $gt: supplier.trustScore }
  }) + 1;
  
  supplier.ranking = {
    overall: overallRank,
    byRole: roleRank,
    lastUpdated: new Date()
  };
  
  await supplier.save();
  
  return supplier.ranking;
};

module.exports = mongoose.model('SupplierTrustScore', supplierTrustScoreSchema);

