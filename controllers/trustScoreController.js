const SupplierTrustScore = require('../models/SupplierTrustScore');
const TrustScoreService = require('../services/trustScoreService');
const User = require('../models/User');

// @desc    Lấy điểm tín nhiệm của nhà cung ứng
// @route   GET /api/trust-scores/:supplierId
// @access  Public
const getTrustScore = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Kiểm tra supplier có tồn tại không
    const supplier = await User.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung ứng'
      });
    }
    
    let trustScore = await SupplierTrustScore.findBySupplier(supplierId)
      .populate('supplier', 'fullName email organizationInfo role organizationId');
    
    if (!trustScore) {
      // Tạo điểm tín nhiệm mới nếu chưa có
      try {
        await TrustScoreService.calculateAndUpdateTrustScore(supplierId);
        trustScore = await SupplierTrustScore.findBySupplier(supplierId)
          .populate('supplier', 'fullName email organizationInfo role organizationId');
      } catch (calcError) {
        console.error('Error calculating trust score:', calcError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi tính toán điểm tín nhiệm: ' + calcError.message
        });
      }
    }
    
    if (!trustScore) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy điểm tín nhiệm'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        trustScore
      }
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy điểm tín nhiệm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy bảng xếp hạng nhà cung ứng
// @route   GET /api/trust-scores/ranking
// @access  Public
const getRanking = async (req, res) => {
  try {
    const { role, limit = 50, page = 1, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (role) {
      query.supplierRole = role;
    }
    
    // Thêm tìm kiếm theo tên nhà cung ứng hoặc organizationId
    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { organizationId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const suppliers = await SupplierTrustScore.find(query)
      .populate('supplier', 'fullName email organizationInfo')
      .sort({ trustScore: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await SupplierTrustScore.countDocuments(query);
    
    // Cập nhật xếp hạng cho từng nhà cung ứng (chỉ khi có supplier) - không blocking
    suppliers.forEach(supplier => {
      if (supplier.supplier && supplier.supplier._id) {
        SupplierTrustScore.getRanking(supplier.supplier._id || supplier.supplier)
          .catch(error => {
            console.error('Error updating ranking for supplier:', error);
          });
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        suppliers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy bảng xếp hạng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Tính toán lại điểm tín nhiệm
// @route   POST /api/trust-scores/:supplierId/recalculate
// @access  Private (Admin only)
const recalculateTrustScore = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    const trustScore = await TrustScoreService.calculateAndUpdateTrustScore(supplierId);
    
    res.status(200).json({
      success: true,
      message: 'Tính toán lại điểm tín nhiệm thành công',
      data: {
        trustScore
      }
    });
  } catch (error) {
    console.error('Recalculate trust score error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tính toán lại điểm tín nhiệm'
    });
  }
};

// @desc    Thêm thưởng/phạt thủ công
// @route   POST /api/trust-scores/:supplierId/reward-penalty
// @access  Private (Admin only)
const addRewardOrPenalty = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { type, amount, reason, description, relatedId, relatedType } = req.body;
    
    if (!type || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    if (!['reward', 'penalty'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại không hợp lệ (phải là reward hoặc penalty)'
      });
    }
    
    let trustScore = await SupplierTrustScore.findBySupplier(supplierId);
    
    if (!trustScore) {
      // Tạo điểm tín nhiệm mới nếu chưa có
      await TrustScoreService.calculateAndUpdateTrustScore(supplierId);
      trustScore = await SupplierTrustScore.findBySupplier(supplierId);
    }
    
    await trustScore.addRewardOrPenalty(
      type,
      amount,
      reason,
      description,
      relatedId,
      relatedType,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      message: `${type === 'reward' ? 'Thưởng' : 'Phạt'} đã được áp dụng`,
      data: {
        trustScore
      }
    });
  } catch (error) {
    console.error('Add reward/penalty error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm thưởng/phạt'
    });
  }
};

// @desc    Lấy lịch sử thay đổi điểm
// @route   GET /api/trust-scores/:supplierId/history
// @access  Public
const getScoreHistory = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const trustScore = await SupplierTrustScore.findBySupplier(supplierId);
    
    if (!trustScore) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy điểm tín nhiệm'
      });
    }
    
    const history = trustScore.scoreHistory
      .sort((a, b) => b.changedAt - a.changedAt)
      .slice(skip, skip + parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(trustScore.scoreHistory.length / limit),
          total: trustScore.scoreHistory.length
        }
      }
    });
  } catch (error) {
    console.error('Get score history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử điểm'
    });
  }
};

// @desc    Lấy thống kê tổng quan
// @route   GET /api/trust-scores/stats
// @access  Public
const getStats = async (req, res) => {
  try {
    const stats = await SupplierTrustScore.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          averageScore: { $avg: '$trustScore' },
          levelA: {
            $sum: { $cond: [{ $eq: ['$trustLevel', 'A'] }, 1, 0] }
          },
          levelB: {
            $sum: { $cond: [{ $eq: ['$trustLevel', 'B'] }, 1, 0] }
          },
          levelC: {
            $sum: { $cond: [{ $eq: ['$trustLevel', 'C'] }, 1, 0] }
          },
          levelD: {
            $sum: { $cond: [{ $eq: ['$trustLevel', 'D'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const roleStats = await SupplierTrustScore.aggregate([
      {
        $group: {
          _id: '$supplierRole',
          count: { $sum: 1 },
          averageScore: { $avg: '$trustScore' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalSuppliers: 0,
          averageScore: 0,
          levelA: 0,
          levelB: 0,
          levelC: 0,
          levelD: 0
        },
        byRole: roleStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê'
    });
  }
};

// @desc    Tính toán lại tất cả điểm tín nhiệm
// @route   POST /api/trust-scores/recalculate-all
// @access  Private (Admin only)
const recalculateAllTrustScores = async (req, res) => {
  try {
    const suppliers = await User.find({
      role: { $in: ['manufacturer', 'distributor', 'hospital', 'pharmacy', 'dealer'] }
    });
    
    const results = [];
    const errors = [];
    
    for (const supplier of suppliers) {
      try {
        const trustScore = await TrustScoreService.calculateAndUpdateTrustScore(supplier._id);
        results.push({
          supplierId: supplier._id,
          supplierName: supplier.fullName,
          trustScore: trustScore.trustScore
        });
      } catch (error) {
        errors.push({
          supplierId: supplier._id,
          supplierName: supplier.fullName,
          error: error.message
        });
      }
    }
    
    const message = errors.length > 0 
      ? `Đã tính toán lại điểm cho ${results.length} nhà cung ứng. ${errors.length} nhà cung ứng gặp lỗi.`
      : `Đã tính toán lại điểm cho ${results.length} nhà cung ứng`;

    res.status(200).json({
      success: true,
      message: message,
      data: {
        success: results.length,
        failed: errors.length,
        total: suppliers.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Recalculate all trust scores error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tính toán lại tất cả điểm tín nhiệm'
    });
  }
};

module.exports = {
  getTrustScore,
  getRanking,
  recalculateTrustScore,
  addRewardOrPenalty,
  getScoreHistory,
  getStats,
  recalculateAllTrustScores
};

