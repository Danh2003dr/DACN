const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const safeNumber = (n) => (Number.isFinite(Number(n)) ? Number(n) : null);

const computeDaysUntil = (dateLike) => {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const mapRiskLevel = (score) => {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 15) return 'low';
  return 'normal';
};

/**
 * Risk scoring v2 (rule-based) dựa trên:
 * - Trạng thái lô: recalled/expired/near-expiry
 * - Kết quả kiểm định: đạt/không đạt/đang kiểm định
 * - Trust score nhà sản xuất (proxy từ /trust-scores/:id)
 * - Review stats (proxy từ /reviews/stats/drug/:id)
 * - QR scan anomalies (proxy từ /reports/module/qr-scans) - nhẹ, dựa trên recent
 */
function computeDrugRiskV2({
  drug,
  supplierTrust,
  reviewStats,
  qrSignals
}) {
  const factors = [];
  let score = 0;

  // Base: recalled/expired
  if (drug?.isRecalled || String(drug?.status || '').toLowerCase() === 'recalled') {
    score += 60;
    factors.push({
      code: 'recalled',
      weight: 60,
      label: 'Đã thu hồi',
      description: 'Lô thuốc đã bị thu hồi'
    });
  }

  const daysUntilExpiry =
    safeNumber(drug?.daysUntilExpiry) ??
    computeDaysUntil(drug?.expiryDate);

  if (drug?.isExpired || String(drug?.status || '').toLowerCase() === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry <= 0)) {
    score += 50;
    factors.push({
      code: 'expired',
      weight: 50,
      label: 'Đã hết hạn',
      description: 'Thuốc đã hết hạn sử dụng'
    });
  } else if (drug?.isNearExpiry || (daysUntilExpiry !== null && daysUntilExpiry <= 30)) {
    score += 20;
    factors.push({
      code: 'near_expiry',
      weight: 20,
      label: 'Gần hết hạn',
      description: 'Thuốc gần hết hạn (≤ 30 ngày)'
    });
  }

  // Quality test
  const qualityResult = drug?.qualityTest?.testResult;
  if (qualityResult === 'không đạt') {
    score += 40;
    factors.push({
      code: 'quality_fail',
      weight: 40,
      label: 'Kiểm định không đạt',
      description: 'Lô thuốc không đạt kiểm định chất lượng'
    });
  } else if (qualityResult === 'đang kiểm định') {
    score += 10;
    factors.push({
      code: 'quality_pending',
      weight: 10,
      label: 'Đang kiểm định',
      description: 'Lô thuốc đang trong quá trình kiểm định'
    });
  }

  // Trust score
  const trustScore = supplierTrust?.trustScore ?? null;
  const trustLevel = supplierTrust?.trustLevel ?? null;
  if (trustScore == null) {
    score += 10;
    factors.push({
      code: 'no_trust_score',
      weight: 10,
      label: 'Thiếu trust score',
      description: 'Chưa có điểm tín nhiệm cho nhà cung ứng/nhà sản xuất'
    });
  } else if (trustScore < 400) {
    score += 30;
    factors.push({
      code: 'low_trust_score',
      weight: 30,
      label: 'Trust thấp',
      description: `Nhà cung ứng có điểm tín nhiệm thấp (${trustScore}/1000)`
    });
  } else if (trustScore < 600) {
    score += 20;
    factors.push({
      code: 'medium_trust_score',
      weight: 20,
      label: 'Trust trung bình',
      description: `Nhà cung ứng có điểm tín nhiệm trung bình (${trustScore}/1000)`
    });
  } else if (trustScore < 800) {
    score += 10;
    factors.push({
      code: 'good_trust_score',
      weight: 10,
      label: 'Trust khá',
      description: `Nhà cung ứng có điểm tín nhiệm khá (${trustScore}/1000)`
    });
  } else {
    score -= 5;
    factors.push({
      code: 'excellent_trust_score',
      weight: -5,
      label: 'Trust rất cao',
      description: `Nhà cung ứng có điểm tín nhiệm rất cao (${trustScore}/1000)`
    });
  }

  // Review stats
  const totalReviews = reviewStats?.totalReviews ?? 0;
  const avgRating = reviewStats?.averageRating ?? null;
  const negativeRatio = reviewStats?.negativeRatio ?? 0;
  if (totalReviews > 0 && typeof avgRating === 'number') {
    if (avgRating < 2.5) {
      score += 25;
      factors.push({
        code: 'low_rating',
        weight: 25,
        label: 'Đánh giá thấp',
        description: `Điểm đánh giá trung bình thấp (${avgRating.toFixed(1)}/5)`
      });
    } else if (avgRating < 3.5) {
      score += 10;
      factors.push({
        code: 'medium_rating',
        weight: 10,
        label: 'Đánh giá trung bình',
        description: `Điểm đánh giá trung bình (${avgRating.toFixed(1)}/5)`
      });
    } else {
      score -= 5;
      factors.push({
        code: 'high_rating',
        weight: -5,
        label: 'Đánh giá tốt',
        description: `Điểm đánh giá trung bình cao (${avgRating.toFixed(1)}/5)`
      });
    }

    if (negativeRatio >= 0.3) {
      score += 15;
      factors.push({
        code: 'many_negative_reviews',
        weight: 15,
        label: 'Nhiều đánh giá tiêu cực',
        description: `Tỷ lệ đánh giá tiêu cực cao (${Math.round(negativeRatio * 100)}%)`
      });
    }
  } else {
    factors.push({
      code: 'no_reviews',
      weight: 0,
      label: 'Chưa có đánh giá',
      description: 'Chưa có đánh giá người dùng cho lô thuốc này'
    });
  }

  // QR scan signals (light)
  const recentFails = qrSignals?.recentFails ?? 0;
  const recentTotal = qrSignals?.recentTotal ?? 0;
  if (recentTotal >= 3 && recentFails / Math.max(recentTotal, 1) >= 0.5) {
    score += 12;
    factors.push({
      code: 'qr_scan_fail_rate',
      weight: 12,
      label: 'Quét QR lỗi nhiều',
      description: `Tỷ lệ quét QR thất bại cao gần đây (${recentFails}/${recentTotal})`
    });
  }

  // Data quality / traceability
  const hasBlockchainId = Boolean(drug?.blockchain?.blockchainId);
  if (!hasBlockchainId) {
    score += 8;
    factors.push({
      code: 'no_blockchain',
      weight: 8,
      label: 'Thiếu liên kết blockchain',
      description: 'Lô thuốc chưa có blockchainId — giảm khả năng truy vết.'
    });
  }

  if (!drug?.batchNumber) {
    score += 6;
    factors.push({
      code: 'missing_batch_number',
      weight: 6,
      label: 'Thiếu số lô',
      description: 'Thiếu số lô sản xuất — dễ gây sai lệch khi truy vết.'
    });
  }

  if (!drug?.manufacturerId) {
    score += 4;
    factors.push({
      code: 'missing_manufacturer',
      weight: 4,
      label: 'Thiếu nhà sản xuất',
      description: 'Thiếu thông tin nhà sản xuất — cần bổ sung.'
    });
  }

  score = clamp(score, 0, 100);
  const level = mapRiskLevel(score);
  const sortedFactors = [...factors].sort((a, b) => (b.weight || 0) - (a.weight || 0));

  return {
    score,
    level,
    daysUntilExpiry,
    factors: sortedFactors,
    signals: {
      trustScore,
      trustLevel,
      totalReviews,
      averageRating: avgRating,
      negativeRatio,
      recentQr: { recentTotal, recentFails }
    }
  };
}

module.exports = {
  computeDrugRiskV2
};


