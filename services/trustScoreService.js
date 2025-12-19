const SupplierTrustScore = require('../models/SupplierTrustScore');
const Review = require('../models/Review');
const Task = require('../models/Task');
const DigitalSignature = require('../models/DigitalSignature');
const Drug = require('../models/Drug');
const User = require('../models/User');

/**
 * Tính điểm tín nhiệm cho nhà cung ứng
 */
class TrustScoreService {
  /**
   * Tính điểm từ đánh giá (0-300)
   */
  static async calculateReviewScore(supplierId, targetType) {
    const reviews = await Review.find({
      targetType,
      targetId: supplierId,
      status: 'approved'
    });
    
    if (reviews.length === 0) {
      return {
        score: 150, // Điểm trung bình khi chưa có đánh giá
        stats: {
          totalReviews: 0,
          averageRating: 0,
          verifiedReviews: 0,
          positiveReviews: 0,
          negativeReviews: 0
        }
      };
    }
    
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
    const verifiedReviews = reviews.filter(r => r.isVerified).length;
    const positiveReviews = reviews.filter(r => r.overallRating >= 4).length;
    const negativeReviews = reviews.filter(r => r.overallRating <= 2).length;
    
    // Tính điểm: dựa trên điểm trung bình và số lượng đánh giá
    // Điểm tối đa 300 = 5 sao với nhiều đánh giá đã xác minh
    let score = (averageRating / 5) * 200; // 0-200 từ điểm trung bình
    
    // Bonus cho số lượng đánh giá (tối đa +50)
    const reviewBonus = Math.min(50, (totalReviews / 20) * 50);
    
    // Bonus cho đánh giá đã xác minh (tối đa +50)
    const verifiedBonus = (verifiedReviews / totalReviews) * 50;
    
    // Penalty cho đánh giá tiêu cực
    const negativePenalty = (negativeReviews / totalReviews) * 50;
    
    score = score + reviewBonus + verifiedBonus - negativePenalty;
    score = Math.max(0, Math.min(300, score));
    
    return {
      score: Math.round(score),
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        verifiedReviews,
        positiveReviews,
        negativeReviews
      }
    };
  }
  
  /**
   * Tính điểm tuân thủ (0-250)
   */
  static async calculateComplianceScore(supplierId) {
    // 1. Tỷ lệ chữ ký số hợp lệ (0-100 điểm)
    const signatures = await DigitalSignature.find({ signedBy: supplierId });
    const totalSignatures = signatures.length;
    const validSignatures = signatures.filter(s => s.status === 'active' && s.isValid).length;
    const validSignatureRate = totalSignatures > 0 ? (validSignatures / totalSignatures) * 100 : 0;
    const signatureScore = (validSignatureRate / 100) * 100;
    
    // 2. Tỷ lệ hoàn thành nhiệm vụ đúng hạn (0-100 điểm)
    const tasks = await Task.find({ assignedTo: supplierId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const onTimeTasks = tasks.filter(t => {
      if (t.status !== 'completed') return false;
      if (!t.completedAt || !t.dueDate) return false;
      return t.completedAt <= t.dueDate;
    }).length;
    const onTimeTaskRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
    const taskScore = (onTimeTaskRate / 100) * 100;
    
    // 3. Tỷ lệ thuốc hợp lệ (0-50 điểm)
    const user = await User.findById(supplierId);
    let drugScore = 25; // Điểm mặc định
    let validDrugRate = 0;
    let totalDrugs = 0;
    let validDrugs = 0;
    let recalledDrugs = 0;
    
    if (user && user.role === 'manufacturer') {
      const drugs = await Drug.find({ manufacturerId: supplierId });
      totalDrugs = drugs.length;
      validDrugs = drugs.filter(d => 
        d.qualityTest && d.qualityTest.testResult === 'đạt' &&
        !d.isRecalled &&
        d.status === 'active'
      ).length;
      recalledDrugs = drugs.filter(d => d.isRecalled).length;
      validDrugRate = totalDrugs > 0 ? (validDrugs / totalDrugs) * 100 : 0;
      const recallPenalty = totalDrugs > 0 ? (recalledDrugs / totalDrugs) * 50 : 0;
      drugScore = (validDrugRate / 100) * 50 - recallPenalty;
      drugScore = Math.max(0, drugScore);
    }
    
    const totalScore = signatureScore + taskScore + drugScore;
    
    return {
      score: Math.round(Math.max(0, Math.min(250, totalScore))),
      stats: {
        validSignatureRate: Math.round(validSignatureRate * 10) / 10,
        totalSignatures,
        validSignatures,
        onTimeTaskRate: Math.round(onTimeTaskRate * 10) / 10,
        totalTasks,
        completedTasks,
        onTimeTasks,
        validDrugRate: Math.round(validDrugRate * 10) / 10,
        totalDrugs: totalDrugs,
        validDrugs: validDrugs,
        recalledDrugs: recalledDrugs
      }
    };
  }
  
  /**
   * Tính điểm chất lượng (0-200)
   */
  static async calculateQualityScore(supplierId) {
    const user = await User.findById(supplierId);
    
    if (!user || user.role !== 'manufacturer') {
      return {
        score: 100, // Điểm mặc định cho non-manufacturer
        stats: {
          averageQualityRating: 0,
          passedQualityTests: 0,
          failedQualityTests: 0,
          totalQualityTests: 0
        }
      };
    }
    
    const drugs = await Drug.find({ manufacturerId: supplierId });
    const qualityTests = drugs.filter(d => d.qualityTest).map(d => d.qualityTest);
    
    if (qualityTests.length === 0) {
      return {
        score: 100,
        stats: {
          averageQualityRating: 0,
          passedQualityTests: 0,
          failedQualityTests: 0,
          totalQualityTests: 0
        }
      };
    }
    
    const passedTests = qualityTests.filter(t => t.testResult === 'đạt').length;
    const failedTests = qualityTests.filter(t => t.testResult === 'không đạt').length;
    const totalTests = qualityTests.length;
    const passRate = (passedTests / totalTests) * 100;
    
    // Tính điểm từ tỷ lệ đạt
    let score = (passRate / 100) * 150;
    
    // Bonus cho số lượng test (tối đa +50)
    const testBonus = Math.min(50, (totalTests / 50) * 50);
    
    score = score + testBonus;
    score = Math.max(0, Math.min(200, score));
    
    // Tính điểm đánh giá chất lượng trung bình từ reviews
    const reviews = await Review.find({
      targetType: 'manufacturer',
      targetId: supplierId,
      status: 'approved',
      'criteriaRatings.drugQuality': { $exists: true }
    });
    
    let averageQualityRating = 0;
    if (reviews.length > 0) {
      const qualityRatings = reviews
        .map(r => r.criteriaRatings.drugQuality)
        .filter(r => r !== null && r !== undefined);
      if (qualityRatings.length > 0) {
        averageQualityRating = qualityRatings.reduce((sum, r) => sum + r, 0) / qualityRatings.length;
      }
    }
    
    // Nếu không có đánh giá, set null thay vì 0 để tránh validation error
    const finalAverageRating = averageQualityRating > 0 ? Math.round(averageQualityRating * 10) / 10 : null;
    
    return {
      score: Math.round(score),
      stats: {
        averageQualityRating: finalAverageRating,
        passedQualityTests: passedTests,
        failedQualityTests: failedTests,
        totalQualityTests: totalTests
      }
    };
  }
  
  /**
   * Tính điểm hiệu quả (0-150)
   */
  static async calculateEfficiencyScore(supplierId) {
    const tasks = await Task.find({ assignedTo: supplierId });
    
    if (tasks.length === 0) {
      return {
        score: 75, // Điểm trung bình
        stats: {}
      };
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = (completedTasks.length / tasks.length) * 100;
    
    // Tính điểm từ tỷ lệ hoàn thành
    let score = (completionRate / 100) * 100;
    
    // Bonus cho đánh giá chất lượng nhiệm vụ (tối đa +50)
    const ratedTasks = completedTasks.filter(t => t.qualityRating && t.qualityRating.rating);
    if (ratedTasks.length > 0) {
      const avgTaskRating = ratedTasks.reduce((sum, t) => sum + t.qualityRating.rating, 0) / ratedTasks.length;
      const ratingBonus = (avgTaskRating / 5) * 50;
      score = score + ratingBonus;
    }
    
    score = Math.max(0, Math.min(150, score));
    
    return {
      score: Math.round(score),
      stats: {
        completionRate: Math.round(completionRate * 10) / 10,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length
      }
    };
  }
  
  /**
   * Tính điểm thời gian (0-100)
   */
  static async calculateTimelinessScore(supplierId) {
    const tasks = await Task.find({ 
      assignedTo: supplierId,
      status: 'completed'
    });
    
    if (tasks.length === 0) {
      return {
        score: 50, // Điểm trung bình
        stats: {}
      };
    }
    
    const onTimeTasks = tasks.filter(t => {
      if (!t.completedAt || !t.dueDate) return false;
      return t.completedAt <= t.dueDate;
    }).length;
    
    const onTimeRate = (onTimeTasks / tasks.length) * 100;
    const score = (onTimeRate / 100) * 100;
    
    return {
      score: Math.round(Math.max(0, Math.min(100, score))),
      stats: {
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        totalCompletedTasks: tasks.length,
        onTimeTasks
      }
    };
  }
  
  /**
   * Tính toán và cập nhật điểm tín nhiệm cho nhà cung ứng
   */
  static async calculateAndUpdateTrustScore(supplierId) {
    const user = await User.findById(supplierId);
    
    if (!user || !['manufacturer', 'distributor', 'hospital', 'pharmacy', 'dealer'].includes(user.role)) {
      throw new Error('Người dùng không phải là nhà cung ứng');
    }
    
    // Xác định targetType cho reviews
    const targetType = user.role === 'manufacturer' ? 'manufacturer' : 
                      user.role === 'distributor' ? 'distributor' : 
                      user.role === 'hospital' ? 'hospital' : 'distributor';
    
    // Tính các điểm thành phần
    const [reviewData, complianceData, qualityData, efficiencyData, timelinessData] = await Promise.all([
      this.calculateReviewScore(supplierId, targetType),
      this.calculateComplianceScore(supplierId),
      this.calculateQualityScore(supplierId),
      this.calculateEfficiencyScore(supplierId),
      this.calculateTimelinessScore(supplierId)
    ]);
    
    // Tính điểm tổng
    const totalScore = 
      reviewData.score +
      complianceData.score +
      qualityData.score +
      efficiencyData.score +
      timelinessData.score;
    
    // Tìm hoặc tạo trust score record
    let trustScore = await SupplierTrustScore.findBySupplier(supplierId);
    
    if (!trustScore) {
      trustScore = new SupplierTrustScore({
        supplier: supplierId,
        supplierName: user.fullName || user.organizationInfo?.name || 'Unknown',
        supplierRole: user.role,
        organizationId: user.organizationId,
        trustScore: totalScore
      });
    } else {
      // Lưu lịch sử thay đổi
      const previousScore = trustScore.trustScore;
      const change = totalScore - previousScore;
      
      if (change !== 0) {
        trustScore.scoreHistory.push({
          previousScore,
          newScore: totalScore,
          change,
          reason: 'periodic_update',
          description: 'Cập nhật điểm định kỳ',
          changedAt: new Date()
        });
      }
    }
    
    // Cập nhật điểm và thống kê
    trustScore.trustScore = totalScore;
    trustScore.scoreBreakdown = {
      reviewScore: reviewData.score,
      complianceScore: complianceData.score,
      qualityScore: qualityData.score,
      efficiencyScore: efficiencyData.score,
      timelinessScore: timelinessData.score
    };
    
    trustScore.reviewStats = reviewData.stats;
    trustScore.complianceStats = complianceData.stats;
    trustScore.qualityStats = qualityData.stats;
    trustScore.lastCalculated = new Date();
    
    await trustScore.save();
    
    // Cập nhật xếp hạng
    await SupplierTrustScore.getRanking(supplierId);
    
    // #region agent log
    // Tự động award badges dựa trên điểm và thống kê
    await this.autoAwardBadges(trustScore);
    // #endregion
    
    return trustScore;
  }
  
  /**
   * Cập nhật điểm khi có đánh giá mới
   */
  static async updateScoreOnReview(reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) return;
    
    const targetType = review.targetType;
    if (!['manufacturer', 'distributor', 'hospital'].includes(targetType)) return;
    
    const supplierId = review.targetId;
    await this.calculateAndUpdateTrustScore(supplierId);
  }
  
  /**
   * Cập nhật điểm khi có nhiệm vụ hoàn thành
   */
  static async updateScoreOnTask(taskId) {
    const task = await Task.findById(taskId);
    if (!task) return;
    
    await this.calculateAndUpdateTrustScore(task.assignedTo);
  }
  
  /**
   * Cập nhật điểm khi có chữ ký số mới
   */
  static async updateScoreOnSignature(signatureId) {
    const signature = await DigitalSignature.findById(signatureId);
    if (!signature) return;
    
    await this.calculateAndUpdateTrustScore(signature.signedBy);
  }
  
  /**
   * Tự động award badges dựa trên điểm và thống kê
   */
  static async autoAwardBadges(trustScore) {
    try {
      // Badge: Excellence (Điểm ≥900)
      if (trustScore.trustScore >= 900) {
        await trustScore.addBadge(
          'excellence_900',
          'Xuất Sắc',
          'excellence',
          'Đạt điểm tín nhiệm ≥900 điểm'
        );
      }
      
      // Badge: Perfect Compliance (Tỷ lệ tuân thủ 100%)
      if (trustScore.complianceStats?.validSignatureRate === 100 && 
          trustScore.complianceStats?.onTimeTaskRate === 100) {
        await trustScore.addBadge(
          'perfect_compliance',
          'Tuân Thủ Hoàn Hảo',
          'compliance',
          'Tỷ lệ tuân thủ 100% (chữ ký và nhiệm vụ)'
        );
      }
      
      // Badge: Quality Master (Tỷ lệ chất lượng 100%)
      if (trustScore.qualityStats?.totalQualityTests > 0 &&
          trustScore.qualityStats?.passedQualityTests === trustScore.qualityStats?.totalQualityTests) {
        await trustScore.addBadge(
          'quality_master',
          'Bậc Thầy Chất Lượng',
          'quality',
          '100% test chất lượng đạt'
        );
      }
      
      // Badge: Reliability (Hoàn thành 100% nhiệm vụ đúng hạn)
      if (trustScore.complianceStats?.totalTasks > 0 &&
          trustScore.complianceStats?.onTimeTaskRate === 100) {
        await trustScore.addBadge(
          'reliability',
          'Đáng Tin Cậy',
          'reliability',
          'Hoàn thành 100% nhiệm vụ đúng hạn'
        );
      }
      
      // Badge: Customer Favorite (Nhiều đánh giá tích cực)
      if (trustScore.reviewStats?.totalReviews >= 10 &&
          trustScore.reviewStats?.positiveReviews >= trustScore.reviewStats?.totalReviews * 0.8) {
        await trustScore.addBadge(
          'customer_favorite',
          'Yêu Thích Khách Hàng',
          'excellence',
          '≥80% đánh giá tích cực từ ≥10 reviews'
        );
      }
      
      // Badge: Top Performer (Xếp hạng top 10)
      if (trustScore.ranking?.overall && trustScore.ranking.overall <= 10) {
        await trustScore.addBadge(
          'top_performer',
          'Top 10',
          'excellence',
          `Xếp hạng #${trustScore.ranking.overall} trong hệ thống`
        );
      }
    } catch (error) {
      console.error('Error auto-awarding badges:', error);
      // Không throw error, chỉ log
    }
  }
}

module.exports = TrustScoreService;

