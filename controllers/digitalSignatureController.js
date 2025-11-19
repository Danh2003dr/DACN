const digitalSignatureService = require('../services/digitalSignatureService');
const DigitalSignature = require('../models/DigitalSignature');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const mongoose = require('mongoose');

/**
 * Ký số cho một đối tượng (drug, supplyChain, etc.)
 */
exports.signDocument = async (req, res) => {
  try {
    const { targetType, targetId, data, options } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin targetType hoặc targetId'
      });
    }
    
    // Lấy dữ liệu đối tượng nếu không có data
    let documentData = data;
    if (!documentData) {
      if (targetType === 'drug') {
        const drug = await Drug.findById(targetId);
        if (!drug) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy lô thuốc'
          });
        }
        documentData = {
          drugId: drug.drugId,
          name: drug.name,
          batchNumber: drug.batchNumber,
          productionDate: drug.productionDate,
          expiryDate: drug.expiryDate,
          manufacturerId: drug.manufacturerId,
          qualityTest: drug.qualityTest
        };
      } else if (targetType === 'supplyChain') {
        const supplyChain = await SupplyChain.findById(targetId);
        if (!supplyChain) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy chuỗi cung ứng'
          });
        }
        documentData = supplyChain.toObject();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Loại đối tượng không được hỗ trợ'
        });
      }
    }
    
    // Ký số
    const result = await digitalSignatureService.signDocument(
      targetType,
      targetId,
      userId,
      documentData,
      options || {}
    );
    
    // Cập nhật chữ ký số vào đối tượng được ký (nếu là drug)
    if (targetType === 'drug' && result.digitalSignature) {
      try {
        const drug = await Drug.findById(targetId);
        if (drug) {
          drug.blockchain = drug.blockchain || {};
          drug.blockchain.digitalSignature = result.digitalSignature.signature;
          drug.blockchain.dataHash = result.dataHash;
          await drug.save();
        }
      } catch (updateError) {
        console.error('Error updating drug digital signature:', updateError);
        // Không throw error, vì chữ ký đã được lưu trong DigitalSignature collection
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Ký số thành công',
      data: result
    });
  } catch (error) {
    console.error('Error signing document:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi ký số: ' + error.message
    });
  }
};

/**
 * Xác thực chữ ký số
 */
exports.verifySignature = async (req, res) => {
  try {
    const { signatureId, data } = req.body;
    
    if (!signatureId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu signatureId'
      });
    }
    
    // Nếu không có data, lấy từ đối tượng được ký
    let documentData = data;
    if (!documentData) {
      const signature = await DigitalSignature.findById(signatureId);
      if (!signature) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chữ ký số'
        });
      }
      
      if (signature.targetType === 'drug') {
        const drug = await Drug.findById(signature.targetId);
        if (drug) {
          documentData = {
            drugId: drug.drugId,
            name: drug.name,
            batchNumber: drug.batchNumber,
            productionDate: drug.productionDate,
            expiryDate: drug.expiryDate,
            manufacturerId: drug.manufacturerId,
            qualityTest: drug.qualityTest
          };
        }
      } else if (signature.targetType === 'supplyChain') {
        const supplyChain = await SupplyChain.findById(signature.targetId);
        if (supplyChain) {
          documentData = supplyChain.toObject();
        }
      }
    }
    
    // Xác thực chữ ký
    const result = await digitalSignatureService.verifySignatureById(
      signatureId,
      documentData
    );
    
    res.json({
      success: result.valid,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực chữ ký: ' + error.message
    });
  }
};

/**
 * Lấy danh sách chữ ký số
 */
exports.getSignatures = async (req, res) => {
  try {
    const { targetType, targetId, userId, status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Filter theo targetType
    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }
    
    // Filter theo targetId
    if (targetId) {
      try {
        query.targetId = mongoose.Types.ObjectId.isValid(targetId) 
          ? new mongoose.Types.ObjectId(targetId) 
          : targetId;
      } catch (e) {
        query.targetId = targetId;
      }
    }
    
    // Filter theo userId
    if (userId) {
      try {
        query.signedBy = mongoose.Types.ObjectId.isValid(userId) 
          ? new mongoose.Types.ObjectId(userId) 
          : userId;
      } catch (e) {
        query.signedBy = userId;
      }
    }
    
    // Filter theo status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Tìm kiếm
    if (search) {
      query.$or = [
        { signedByName: { $regex: search, $options: 'i' } },
        { 'certificate.serialNumber': { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Nếu không phải admin, chỉ hiển thị chữ ký của user đó
    if (req.user.role !== 'admin' && !userId) {
      query.signedBy = req.user._id || req.user.id;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const signatures = await DigitalSignature.find(query)
      .populate('signedBy', 'fullName email role')
      .populate('revokedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Populate targetId dựa trên targetType
    for (let sig of signatures) {
      if (sig.targetType === 'drug') {
        await sig.populate({
          path: 'targetId',
          select: 'name drugId batchNumber',
          model: 'Drug'
        });
      }
    }
    
    const total = await DigitalSignature.countDocuments(query);
    
    res.json({
      success: true,
      data: signatures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chữ ký: ' + error.message
    });
  }
};

/**
 * Lấy chi tiết chữ ký số
 */
exports.getSignatureById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const signature = await DigitalSignature.findById(id)
      .populate('signedBy', 'fullName email role organization')
      .populate('revokedBy', 'fullName email');
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chữ ký số'
      });
    }
    
    res.json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('Error getting signature:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chữ ký: ' + error.message
    });
  }
};

/**
 * Lấy chữ ký số của một đối tượng
 */
exports.getSignaturesByTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    const signatures = await DigitalSignature.findByTarget(targetType, targetId);
    
    res.json({
      success: true,
      data: signatures
    });
  } catch (error) {
    console.error('Error getting signatures by target:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chữ ký số: ' + error.message
    });
  }
};

/**
 * Thu hồi chữ ký số
 */
exports.revokeSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do thu hồi'
      });
    }
    
    // Chỉ admin hoặc người ký mới được thu hồi
    const signature = await DigitalSignature.findById(id);
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chữ ký số'
      });
    }
    
    if (req.user.role !== 'admin' && signature.signedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thu hồi chữ ký số này'
      });
    }
    
    const result = await digitalSignatureService.revokeSignature(id, reason, userId);
    
    res.json({
      success: true,
      message: 'Thu hồi chữ ký số thành công',
      data: result.digitalSignature
    });
  } catch (error) {
    console.error('Error revoking signature:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thu hồi chữ ký: ' + error.message
    });
  }
};

/**
 * Thống kê chữ ký số
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.query.userId || (req.user.role === 'admin' ? null : (req.user._id || req.user.id));
    
    const stats = await DigitalSignature.getStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting signature stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê: ' + error.message
    });
  }
};

