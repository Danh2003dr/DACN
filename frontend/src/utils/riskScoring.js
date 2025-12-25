// Risk scoring (frontend heuristic) for drug batches.
// Mục tiêu: cảnh báo vận hành nhanh (không cần sửa backend).
// Có thể thay thế sau bằng mô hình ML/AI thật ở backend/service.

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const safeNumber = (n) => (Number.isFinite(Number(n)) ? Number(n) : null);

export const computeDaysUntil = (dateLike) => {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const getDrugRisk = (drug) => {
  const factors = [];
  let score = 0;

  // 1) Recalled / expired are always critical drivers
  if (drug?.isRecalled) {
    score += 100;
    factors.push({
      code: 'recalled',
      weight: 100,
      label: 'Đã thu hồi',
      description: 'Lô thuốc đã bị thu hồi — nguy cơ rất cao.'
    });
  }

  const daysUntilExpiry =
    safeNumber(drug?.daysUntilExpiry) ??
    computeDaysUntil(drug?.expiryDate);

  if (drug?.isExpired || (daysUntilExpiry !== null && daysUntilExpiry <= 0)) {
    score = Math.max(score, 90);
    factors.push({
      code: 'expired',
      weight: 90,
      label: 'Đã hết hạn',
      description: 'Lô thuốc đã hết hạn hoặc quá hạn.'
    });
  } else if (drug?.isNearExpiry || (daysUntilExpiry !== null && daysUntilExpiry <= 30)) {
    score = Math.max(score, 70);
    factors.push({
      code: 'near_expiry',
      weight: 70,
      label: 'Gần hết hạn',
      description: `Còn ${daysUntilExpiry ?? 'ít'} ngày là hết hạn — cần ưu tiên xử lý.`
    });
  } else if (daysUntilExpiry !== null && daysUntilExpiry <= 90) {
    score += 35;
    factors.push({
      code: 'mid_expiry',
      weight: 35,
      label: 'Hạn sử dụng trong 90 ngày',
      description: `Còn ${daysUntilExpiry} ngày là hết hạn — theo dõi sát.`
    });
  } else if (daysUntilExpiry !== null && daysUntilExpiry <= 180) {
    score += 10;
    factors.push({
      code: 'low_expiry',
      weight: 10,
      label: 'Hạn sử dụng trong 180 ngày',
      description: `Còn ${daysUntilExpiry} ngày là hết hạn — lên kế hoạch luân chuyển.`
    });
  } else if (daysUntilExpiry === null) {
    score += 15;
    factors.push({
      code: 'unknown_expiry',
      weight: 15,
      label: 'Thiếu/không hợp lệ hạn dùng',
      description: 'Không xác định được hạn sử dụng — cần kiểm tra dữ liệu.'
    });
  }

  // 2) Data quality / traceability signals (heuristic)
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
      description: 'Thiếu thông tin nhà sản xuất — cần bổ sung để vận hành.'
    });
  }

  if (String(drug?.status || '').toLowerCase() === 'suspended') {
    score += 25;
    factors.push({
      code: 'suspended',
      weight: 25,
      label: 'Tạm dừng',
      description: 'Lô thuốc đang bị tạm dừng — cần rà soát nguyên nhân.'
    });
  }

  score = clamp(score, 0, 100);

  const sortedFactors = [...factors].sort((a, b) => (b.weight || 0) - (a.weight || 0));

  let level = 'normal';
  if (score >= 85) level = 'critical';
  else if (score >= 65) level = 'high';
  else if (score >= 35) level = 'medium';
  else if (score >= 15) level = 'low';

  return {
    score,
    level,
    daysUntilExpiry,
    factors: sortedFactors
  };
};


