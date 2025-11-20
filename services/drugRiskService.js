const Drug = require('../models/Drug');
const SupplierTrustScore = require('../models/SupplierTrustScore');
const Review = require('../models/Review');

/**
 * Tính điểm rủi ro (0-100) cho một lô thuốc dựa trên:
 * - Trạng thái lô (thu hồi, hết hạn, sắp hết hạn)
 * - Kết quả kiểm định chất lượng
 * - Điểm tín nhiệm nhà cung ứng (SupplierTrustScore)
 * - Đánh giá người dùng (Review) cho lô thuốc
 *
 * Đây là AI theo kiểu rule-based / heuristic, dễ giải thích trong báo cáo.
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const mapRiskLevel = (score) => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

async function getSupplierTrustInfo(drug) {
  if (!drug?.manufacturerId) {
    return { trustScore: null, trustLevel: null };
  }

  const supplierTrust = await SupplierTrustScore.findOne({
    supplier: drug.manufacturerId
  }).lean();

  if (!supplierTrust) {
    return { trustScore: null, trustLevel: null };
  }

  return {
    trustScore: supplierTrust.trustScore,
    trustLevel: supplierTrust.trustLevel
  };
}

async function getDrugReviewStats(drugId) {
  const statsArr = await Review.getReviewStats('drug', drugId);
  if (!statsArr || statsArr.length === 0) {
    return {
      totalReviews: 0,
      averageRating: null,
      negativeRatio: 0
    };
  }

  const stats = statsArr[0];
  const total = stats.totalReviews || 0;

  let negativeRatio = 0;
  if (total > 0 && stats.ratingDistribution) {
    const dist = stats.ratingDistribution;
    const negative =
      (dist['1'] || dist[1] || 0) +
      (dist['2'] || dist[2] || 0);
    negativeRatio = negative / total;
  }

  return {
    totalReviews: total,
    averageRating: stats.averageRating ?? null,
    negativeRatio
  };
}

/**
 * Tính điểm rủi ro cho một document Drug đã được load.
 * Trả về { score, level, factors }.
 */
async function calculateDrugRisk(drugDoc) {
  if (!drugDoc) {
    throw new Error('Drug document is required to calculate risk');
  }

  // Nếu là document Mongoose, convert sang object để dùng virtuals
  const drug = drugDoc.toObject({ virtuals: true });

  let score = 0;
  const factors = [];

  // 1. Trạng thái thu hồi / hết hạn / gần hết hạn
  if (drug.isRecalled || drug.status === 'recalled') {
    score += 60;
    factors.push({
      key: 'recalled',
      weight: 60,
      description: 'Lô thuốc đã bị thu hồi'
    });
  }

  if (drug.isExpired || drug.status === 'expired') {
    score += 50;
    factors.push({
      key: 'expired',
      weight: 50,
      description: 'Thuốc đã hết hạn sử dụng'
    });
  } else if (drug.isNearExpiry) {
    score += 20;
    factors.push({
      key: 'near_expiry',
      weight: 20,
      description: 'Thuốc gần hết hạn (≤ 30 ngày)'
    });
  }

  // 2. Kết quả kiểm định chất lượng
  const qualityResult = drug.qualityTest?.testResult;
  if (qualityResult === 'không đạt') {
    score += 40;
    factors.push({
      key: 'quality_fail',
      weight: 40,
      description: 'Lô thuốc không đạt kiểm định chất lượng'
    });
  } else if (qualityResult === 'đang kiểm định') {
    score += 10;
    factors.push({
      key: 'quality_pending',
      weight: 10,
      description: 'Lô thuốc đang trong quá trình kiểm định, chưa có kết luận cuối cùng'
    });
  }

  // 3. Điểm tín nhiệm nhà cung ứng (trust score)
  const supplierInfo = await getSupplierTrustInfo(drug);
  if (supplierInfo.trustScore == null) {
    score += 10;
    factors.push({
      key: 'no_trust_score',
      weight: 10,
      description: 'Chưa có điểm tín nhiệm cho nhà cung ứng, tăng rủi ro do thiếu dữ liệu'
    });
  } else {
    const ts = supplierInfo.trustScore;
    if (ts < 400) {
      score += 30;
      factors.push({
        key: 'low_trust_score',
        weight: 30,
        description: `Nhà cung ứng có điểm tín nhiệm thấp (${ts}/1000)`
      });
    } else if (ts < 600) {
      score += 20;
      factors.push({
        key: 'medium_trust_score',
        weight: 20,
        description: `Nhà cung ứng có điểm tín nhiệm trung bình (${ts}/1000)`
      });
    } else if (ts < 800) {
      score += 10;
      factors.push({
        key: 'good_trust_score',
        weight: 10,
        description: `Nhà cung ứng có điểm tín nhiệm khá (${ts}/1000)`
      });
    } else {
      // Trust rất cao, có thể giảm nhẹ tổng điểm rủi ro
      score -= 5;
      factors.push({
        key: 'excellent_trust_score',
        weight: -5,
        description: `Nhà cung ứng có điểm tín nhiệm rất cao (${ts}/1000)`
      });
    }
  }

  // 4. Đánh giá người dùng (Review cho lô thuốc)
  const reviewStats = await getDrugReviewStats(drugDoc._id);
  if (reviewStats.totalReviews === 0) {
    factors.push({
      key: 'no_reviews',
      weight: 0,
      description: 'Chưa có đánh giá người dùng cho lô thuốc này'
    });
  } else {
    const avg = reviewStats.averageRating || 0;
    const negRatio = reviewStats.negativeRatio || 0;

    if (avg < 2.5) {
      score += 25;
      factors.push({
        key: 'low_rating',
        weight: 25,
        description: `Điểm đánh giá trung bình thấp (${avg.toFixed(1)}/5)`
      });
    } else if (avg < 3.5) {
      score += 10;
      factors.push({
        key: 'medium_rating',
        weight: 10,
        description: `Điểm đánh giá trung bình trung bình (${avg.toFixed(1)}/5)`
      });
    } else {
      score -= 5;
      factors.push({
        key: 'high_rating',
        weight: -5,
        description: `Điểm đánh giá trung bình cao (${avg.toFixed(1)}/5)`
      });
    }

    if (negRatio >= 0.3) {
      score += 15;
      factors.push({
        key: 'many_negative_reviews',
        weight: 15,
        description: `Tỷ lệ đánh giá tiêu cực cao (${Math.round(negRatio * 100)}%)`
      });
    }
  }

  // Chuẩn hóa và tính level
  const normalizedScore = clamp(score, 0, 100);
  const level = mapRiskLevel(normalizedScore);

  return {
    score: normalizedScore,
    level,
    factors
  };
}

/**
 * Tính rủi ro cho tất cả các lô thuốc đang hoạt động.
 * Dùng cho dashboard hoặc báo cáo AI.
 */
async function calculateRiskForAllDrugs() {
  const drugs = await Drug.find().lean({ virtuals: true });
  const results = [];

  for (const drug of drugs) {
    const risk = await calculateDrugRisk(new Drug(drug));
    results.push({
      drugId: drug.drugId,
      _id: drug._id,
      name: drug.name,
      batchNumber: drug.batchNumber,
      status: drug.status,
      isRecalled: drug.isRecalled,
      isExpired: drug.isExpired,
      isNearExpiry: drug.isNearExpiry,
      risk
    });
  }

  return results;
}

module.exports = {
  calculateDrugRisk,
  calculateRiskForAllDrugs
};


