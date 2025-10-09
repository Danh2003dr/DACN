const Drug = require('../models/Drug');
const User = require('../models/User');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const blockchainService = require('../services/blockchainService');

// @desc    Tạo lô thuốc mới
// @route   POST /api/drugs
// @access  Private (Admin, Manufacturer)
const createDrug = async (req, res) => {
  try {
    const {
      name,
      activeIngredient,
      dosage,
      form,
      batchNumber,
      productionDate,
      expiryDate,
      qualityTest,
      storage,
      manufacturerId
    } = req.body;

    // Validation
    if (!name || !activeIngredient || !dosage || !form || !batchNumber || !productionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.'
      });
    }

    // Kiểm tra ngày hết hạn
    if (new Date(expiryDate) <= new Date(productionDate)) {
      return res.status(400).json({
        success: false,
        message: 'Hạn sử dụng phải sau ngày sản xuất.'
      });
    }

    // Kiểm tra batch number đã tồn tại chưa
    const existingDrug = await Drug.findOne({ batchNumber });
    if (existingDrug) {
      return res.status(400).json({
        success: false,
        message: 'Số lô sản xuất đã tồn tại.'
      });
    }

    // Tạo drug mới
    const drugData = {
      name,
      activeIngredient,
      dosage,
      form,
      batchNumber,
      productionDate,
      expiryDate,
      qualityTest: qualityTest || {
        testDate: new Date(),
        testResult: 'đang kiểm định',
        testBy: 'Hệ thống'
      },
      storage: storage || {},
      manufacturerId: manufacturerId || req.user._id,
      createdBy: req.user._id
    };

    const drug = await Drug.create(drugData);

    // Ghi dữ liệu lên blockchain
    const blockchainResult = await blockchainService.recordDrugBatchOnBlockchain(drugData);
    
    if (blockchainResult.success) {
      // Cập nhật thông tin blockchain vào drug
      drug.blockchain = {
        blockchainId: blockchainResult.blockchainId,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        blockchainTimestamp: blockchainResult.timestamp,
        digitalSignature: blockchainResult.signature,
        dataHash: blockchainResult.hash,
        isOnBlockchain: true,
        blockchainStatus: 'confirmed',
        contractAddress: process.env.CONTRACT_ADDRESS || 'mock',
        transactionHistory: [{
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          timestamp: blockchainResult.timestamp,
          action: 'create',
          details: 'Tạo lô thuốc mới trên blockchain'
        }]
      };
      
      await drug.save();
    }

    // Tạo QR code với blockchain ID
    const qrData = drug.generateQRData();
    // Thêm blockchain ID vào QR data
    qrData.blockchainId = drug.blockchain?.blockchainId;
    qrData.verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/verify/${drug.blockchain?.blockchainId}`;
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

    // Cập nhật QR code vào drug
    drug.qrCode.imageUrl = qrCodeDataURL;
    drug.qrCode.blockchainId = drug.blockchain?.blockchainId;
    drug.qrCode.verificationUrl = qrData.verificationUrl;
    await drug.save();

    // Populate manufacturer info
    await drug.populate('manufacturerId', 'fullName organizationInfo');

    res.status(201).json({
      success: true,
      message: 'Tạo lô thuốc thành công và đã ghi lên blockchain.',
      data: {
        drug,
        qrCode: qrCodeDataURL,
        blockchain: blockchainResult
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách lô thuốc
// @route   GET /api/drugs
// @access  Private
const getDrugs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const status = req.query.status;
    const manufacturerId = req.query.manufacturerId;

    // Tạo filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { drugId: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (manufacturerId) {
      filter.manufacturerId = manufacturerId;
    }

    // Kiểm tra quyền - chỉ admin mới xem tất cả
    if (req.user.role !== 'admin' && req.user.role !== 'manufacturer') {
      filter.manufacturerId = req.user._id;
    }

    // Tính toán pagination
    const skip = (page - 1) * limit;

    // Query drugs
    const drugs = await Drug.find(filter)
      .populate('manufacturerId', 'fullName organizationInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Drug.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        drugs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin lô thuốc theo ID
// @route   GET /api/drugs/:id
// @access  Private
const getDrugById = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id)
      .populate('manufacturerId', 'fullName organizationInfo')
      .populate('distribution.history.updatedBy', 'fullName role');

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc.'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && 
        req.user.role !== 'manufacturer' && 
        drug.manufacturerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin lô thuốc này.'
      });
    }

    res.status(200).json({
      success: true,
      data: { drug }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin lô thuốc
// @route   PUT /api/drugs/:id
// @access  Private (Admin, Manufacturer)
const updateDrug = async (req, res) => {
  try {
    const {
      name,
      activeIngredient,
      dosage,
      form,
      qualityTest,
      storage
    } = req.body;

    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc.'
      });
    }

    // Kiểm tra quyền cập nhật
    if (req.user.role !== 'admin' && 
        drug.manufacturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lô thuốc này.'
      });
    }

    // Cập nhật thông tin
    const updateData = {};
    if (name) updateData.name = name;
    if (activeIngredient) updateData.activeIngredient = activeIngredient;
    if (dosage) updateData.dosage = dosage;
    if (form) updateData.form = form;
    if (qualityTest) updateData.qualityTest = qualityTest;
    if (storage) updateData.storage = storage;

    const updatedDrug = await Drug.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('manufacturerId', 'fullName organizationInfo');

    res.status(200).json({
      success: true,
      message: 'Cập nhật lô thuốc thành công.',
      data: { drug: updatedDrug }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Cập nhật trạng thái phân phối
// @route   PUT /api/drugs/:id/distribution
// @access  Private
const updateDistributionStatus = async (req, res) => {
  try {
    const {
      status,
      location,
      organizationId,
      organizationName,
      note
    } = req.body;

    if (!status || !location) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin trạng thái và vị trí.'
      });
    }

    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc.'
      });
    }

    // Cập nhật trạng thái phân phối
    await drug.updateDistributionStatus(
      status,
      location,
      organizationId,
      organizationName,
      note,
      req.user._id
    );

    // Populate thông tin
    await drug.populate('manufacturerId', 'fullName organizationInfo');
    await drug.populate('distribution.history.updatedBy', 'fullName role');

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái phân phối thành công.',
      data: { drug }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái phân phối.',
      error: error.message
    });
  }
};

// @desc    Quét QR code để tra cứu
// @route   POST /api/drugs/scan-qr
// @access  Private
const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp dữ liệu QR code.'
      });
    }

    const drug = await Drug.findByQRCode(qrData);

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thuốc. Có thể đây là thuốc giả hoặc không có trong hệ thống.'
      });
    }

    // Kiểm tra thuốc có bị thu hồi không
    if (drug.isRecalled) {
      return res.status(400).json({
        success: false,
        message: 'CẢNH BÁO: Lô thuốc này đã bị thu hồi!',
        data: {
          drug: drug,
          recallReason: drug.recallReason,
          recallDate: drug.recallDate
        }
      });
    }

    // Kiểm tra thuốc có hết hạn không
    if (drug.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'CẢNH BÁO: Thuốc đã hết hạn sử dụng!',
        data: {
          drug: drug,
          expiryDate: drug.expiryDate,
          daysExpired: Math.abs(drug.daysUntilExpiry)
        }
      });
    }

    // Kiểm tra thuốc gần hết hạn
    if (drug.isNearExpiry) {
      return res.status(200).json({
        success: true,
        message: 'Thuốc hợp lệ nhưng gần hết hạn.',
        warning: `Thuốc sẽ hết hạn trong ${drug.daysUntilExpiry} ngày.`,
        data: { drug }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Thuốc hợp lệ và an toàn.',
      data: { drug }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi quét QR code.',
      error: error.message
    });
  }
};

// @desc    Thu hồi lô thuốc
// @route   PUT /api/drugs/:id/recall
// @access  Private (Admin, Manufacturer)
const recallDrug = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do thu hồi.'
      });
    }

    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc.'
      });
    }

    // Kiểm tra quyền thu hồi
    if (req.user.role !== 'admin' && 
        drug.manufacturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thu hồi lô thuốc này.'
      });
    }

    // Thu hồi thuốc
    await drug.recall(reason, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Thu hồi lô thuốc thành công.',
      data: { drug }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thu hồi lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê lô thuốc
// @route   GET /api/drugs/stats
// @access  Private
const getDrugStats = async (req, res) => {
  try {
    const totalDrugs = await Drug.countDocuments();
    const activeDrugs = await Drug.countDocuments({ status: 'active' });
    const recalledDrugs = await Drug.countDocuments({ isRecalled: true });
    const expiredDrugs = await Drug.countDocuments({ 
      expiryDate: { $lt: new Date() } 
    });

    const drugsByStatus = await Drug.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const expiringSoon = await Drug.getExpiringSoon(30);

    res.status(200).json({
      success: true,
      data: {
        total: totalDrugs,
        active: activeDrugs,
        recalled: recalledDrugs,
        expired: expiredDrugs,
        expiringSoon: expiringSoon.length,
        byStatus: drugsByStatus
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Xóa lô thuốc (chỉ Admin)
// @route   DELETE /api/drugs/:id
// @access  Private (Admin only)
const deleteDrug = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc.'
      });
    }

    // Chỉ admin mới được xóa
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản trị viên mới có thể xóa lô thuốc.'
      });
    }

    await Drug.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa lô thuốc thành công.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa lô thuốc.',
      error: error.message
    });
  }
};

// @desc    Verify QR code và lấy thông tin từ blockchain
// @route   GET /api/drugs/verify/:blockchainId
// @access  Public
const verifyQRCode = async (req, res) => {
  try {
    const { blockchainId } = req.params;

    if (!blockchainId) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain ID là bắt buộc.'
      });
    }

    // Tìm drug trong database
    const drug = await Drug.findOne({ 'blockchain.blockchainId': blockchainId })
      .populate('manufacturerId', 'fullName organizationInfo')
      .populate('createdBy', 'fullName role');

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc với blockchain ID này.'
      });
    }

    // Lấy thông tin từ blockchain (nếu có)
    const blockchainData = await blockchainService.getDrugBatchFromBlockchain(blockchainId);

    res.json({
      success: true,
      message: 'Thông tin lô thuốc hợp lệ.',
      data: {
        drug: {
          drugId: drug.drugId,
          name: drug.name,
          activeIngredient: drug.activeIngredient,
          dosage: drug.dosage,
          form: drug.form,
          batchNumber: drug.batchNumber,
          productionDate: drug.productionDate,
          expiryDate: drug.expiryDate,
          qualityTest: drug.qualityTest,
          manufacturer: drug.manufacturerId,
          blockchain: drug.blockchain,
          status: drug.status,
          isRecalled: drug.isRecalled
        },
        blockchain: blockchainData,
        verification: {
          isValid: true,
          verifiedAt: new Date(),
          blockchainStatus: drug.blockchain?.blockchainStatus || 'unknown'
        }
      }
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác minh QR code.',
      error: error.message
    });
  }
};

module.exports = {
  createDrug,
  getDrugs,
  getDrugById,
  updateDrug,
  updateDistributionStatus,
  scanQRCode,
  recallDrug,
  getDrugStats,
  deleteDrug,
  verifyQRCode
};
