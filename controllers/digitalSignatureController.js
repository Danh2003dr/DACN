const digitalSignatureService = require('../services/digitalSignatureService');
const DigitalSignature = require('../models/DigitalSignature');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const mongoose = require('mongoose');
const hsmService = require('../services/hsm/hsmService');

/**
 * Helper function để tạo Etherscan URL dựa trên network và transaction hash
 */
function getEtherscanUrl(network, transactionHash) {
  if (!transactionHash || !network || network === 'mock' || network === 'development') {
    return null;
  }
  
  const hash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`;
  
  // Mapping network names to Etherscan URLs
  const networkUrls = {
    'mainnet': 'https://etherscan.io',
    'sepolia': 'https://sepolia.etherscan.io',
    'bsc_mainnet': 'https://bscscan.com',
    'bsc_testnet': 'https://testnet.bscscan.com',
    'polygon_mainnet': 'https://polygonscan.com',
    'polygon_mumbai': 'https://mumbai.polygonscan.com',
    'arbitrum_one': 'https://arbiscan.io',
    'arbitrum_sepolia': 'https://sepolia.arbiscan.io',
    'optimism_mainnet': 'https://optimistic.etherscan.io',
    'optimism_sepolia': 'https://sepolia-optimism.etherscan.io'
  };
  
  const baseUrl = networkUrls[network];
  if (!baseUrl) {
    return null;
  }
  
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Helper function để chuẩn hóa ObjectId từ request body hoặc params
 * Xử lý trường hợp ObjectId là object thay vì string
 */
function normalizeObjectId(id) {
  if (!id) {
    return null;
  }
  
  // Reject string "[object Object]" ngay lập tức
  if (typeof id === 'string' && (id === '[object Object]' || id === '"[object Object]"')) {
    console.warn('Rejected invalid string "[object Object]"');
    return null;
  }
  
  // Nếu đã là string hợp lệ, trả về ngay
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  
  // Nếu đã là ObjectId instance, chuyển về string
  if (mongoose.Types.ObjectId.isValid(id)) {
    return String(id);
  }
  
  // Nếu là object với các keys như '0', '1', '2'... (char array)
  if (typeof id === 'object' && id !== null) {
    if (Object.keys(id).every(key => /^\d+$/.test(key))) {
      // Object có dạng { '0': '6', '1': '9', ... }
      const normalized = Object.keys(id)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => id[key])
        .join('');
      
      if (mongoose.Types.ObjectId.isValid(normalized)) {
        return normalized;
      }
    }
    
    // Thử lấy _id, id, hoặc giá trị đầu tiên
    if (id._id) {
      return normalizeObjectId(id._id);
    }
    if (id.id) {
      return normalizeObjectId(id.id);
    }
    
    // Thử toString() nếu có
    if (id.toString && typeof id.toString === 'function') {
      const str = id.toString();
      if (mongoose.Types.ObjectId.isValid(str) && str !== '[object Object]') {
        return str;
      }
    }
  }
  
  // Cuối cùng, thử convert sang string
  const str = String(id);
  // Reject nếu là "[object Object]"
  if (str === '[object Object]' || str === '"[object Object]"') {
    return null;
  }
  if (mongoose.Types.ObjectId.isValid(str)) {
    return str;
  }
  
  return null;
}

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
    
    // Normalize targetId để đảm bảo là ObjectId hợp lệ
    const normalizedTargetId = normalizeObjectId(targetId);
    if (!normalizedTargetId) {
      console.error('Invalid targetId:', targetId, 'Type:', typeof targetId);
      return res.status(400).json({
        success: false,
        message: 'targetId không hợp lệ'
      });
    }
    
    console.log('Signing document - targetType:', targetType, 'targetId:', normalizedTargetId, 'Original:', targetId);
    
    // Lấy dữ liệu đối tượng nếu không có data
    let documentData = data;
    if (!documentData) {
      if (targetType === 'drug') {
        const drug = await Drug.findById(normalizedTargetId);
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
        const supplyChain = await SupplyChain.findById(normalizedTargetId);
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
      normalizedTargetId,
      userId,
      documentData,
      options || {}
    );
    
    // Lưu chữ ký số lên blockchain
    let blockchainSaved = false;
    if (result.success && result.digitalSignature) {
      try {
        const blockchainService = require('../services/blockchainService');
        
        console.log('🔄 Đang khởi tạo blockchain service...');
        // Khởi tạo blockchain service nếu chưa
        if (!blockchainService.isInitialized) {
          await blockchainService.initialize();
          console.log('✅ Blockchain service đã được khởi tạo');
        } else {
          console.log('✅ Blockchain service đã sẵn sàng');
        }
        
        console.log('📝 Đang ghi chữ ký số lên blockchain...');
        // Ghi chữ ký số lên blockchain
        const blockchainResult = await blockchainService.recordDigitalSignatureOnBlockchain({
          signatureId: result.digitalSignature._id,
          targetType,
          targetId: normalizedTargetId,
          dataHash: result.dataHash,
          signature: result.digitalSignature.signature,
          certificateSerialNumber: result.digitalSignature.certificate.serialNumber,
          signedBy: userId,
          timestampedAt: result.digitalSignature.timestamp?.timestampedAt || new Date()
        });
        
        console.log('📊 Kết quả lưu blockchain:', {
          success: blockchainResult.success,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          mock: blockchainResult.mock
        });
        
        // Cập nhật thông tin blockchain vào chữ ký số
        if (blockchainResult.success) {
          // Lấy network từ blockchain service
          const currentNetwork = blockchainService.currentNetwork || process.env.BLOCKCHAIN_NETWORK || 'development';
          
          // Tạo Etherscan URL
          const etherscanUrl = getEtherscanUrl(currentNetwork, blockchainResult.transactionHash);
          
          result.digitalSignature.blockchain = {
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            timestamp: blockchainResult.timestamp,
            network: currentNetwork,
            etherscanUrl: etherscanUrl,
            mock: blockchainResult.mock || false
          };
          await result.digitalSignature.save();
          blockchainSaved = true;
          console.log('✅ Đã lưu chữ ký số lên blockchain thành công');
          if (etherscanUrl) {
            console.log('🔗 Etherscan URL:', etherscanUrl);
          }
          if (blockchainResult.mock) {
            console.log('⚠️  Lưu ý: Đang sử dụng mock blockchain (chế độ phát triển)');
          }
        } else {
          console.warn('⚠️  Không thể lưu lên blockchain:', blockchainResult.error);
        }
      } catch (blockchainError) {
        console.error('❌ Lỗi khi lưu chữ ký số lên blockchain:', blockchainError);
        console.error('Chi tiết lỗi:', {
          message: blockchainError.message,
          stack: blockchainError.stack
        });
        // Không throw error, vì chữ ký đã được lưu trong database
        // Chỉ log để debug
      }
    }
    
    // Cập nhật chữ ký số vào đối tượng được ký (nếu là drug)
    if (targetType === 'drug' && result.digitalSignature) {
      try {
        const drug = await Drug.findById(normalizedTargetId);
        if (drug) {
          drug.blockchain = drug.blockchain || {};
          drug.blockchain.digitalSignature = result.digitalSignature.signature;
          drug.blockchain.dataHash = result.dataHash;
          // Cập nhật thông tin blockchain nếu có
          if (result.digitalSignature.blockchain) {
            drug.blockchain.signatureTransactionHash = result.digitalSignature.blockchain.transactionHash;
            drug.blockchain.signatureBlockNumber = result.digitalSignature.blockchain.blockNumber;
          }
          await drug.save();
        }
      } catch (updateError) {
        console.error('Error updating drug digital signature:', updateError);
        // Không throw error, vì chữ ký đã được lưu trong DigitalSignature collection
      }
    }
    
    // Tạo thông báo chi tiết
    let message = 'Ký số thành công';
    if (blockchainSaved) {
      if (result.digitalSignature?.blockchain?.mock) {
        message += ' (đã lưu lên blockchain - chế độ mock)';
      } else {
        message += ' và đã lưu lên blockchain';
      }
    } else {
      message += ' (chưa lưu lên blockchain - xem log để biết chi tiết)';
    }
    
    res.status(201).json({
      success: true,
      message: message,
      data: {
        ...result,
        blockchainSaved: blockchainSaved
      }
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
    let { signatureId, data } = req.body;
    
    if (!signatureId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu signatureId'
      });
    }
    
    // Chuẩn hóa signatureId
    signatureId = normalizeObjectId(signatureId);
    
    if (!signatureId) {
      return res.status(400).json({
        success: false,
        message: 'signatureId không hợp lệ'
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
      } else if (signature.targetType === 'qualityTest') {
        // qualityTest là subdocument trong Drug, cần tìm drug chứa qualityTest
        // targetId có thể là ObjectId của qualityTest subdocument
        try {
          const drug = await Drug.findOne({ 'qualityTest._id': signature.targetId });
          if (drug && drug.qualityTest) {
            documentData = {
              targetType: 'qualityTest',
              drugId: drug.drugId,
              drugName: drug.name,
              batchNumber: drug.batchNumber,
              qualityTest: drug.qualityTest
            };
          }
        } catch (error) {
          console.error('Error finding drug with qualityTest:', error);
        }
      }
    }
    
    // Nếu vẫn không có documentData, không thể verify
    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: 'Không thể lấy dữ liệu để xác thực chữ ký. Đối tượng được ký có thể đã bị xóa hoặc không tồn tại.'
      });
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
    // Chỉ áp dụng filter nếu có user và không phải admin
    if (req.user && req.user.role !== 'admin' && !userId) {
      const userObjectId = req.user._id || req.user.id;
      if (userObjectId) {
        query.signedBy = mongoose.Types.ObjectId.isValid(userObjectId) 
          ? new mongoose.Types.ObjectId(userObjectId) 
          : userObjectId;
      }
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
      try {
        if (sig.targetType === 'drug') {
          await sig.populate({
            path: 'targetId',
            select: 'name drugId batchNumber manufacturerId',
            model: 'Drug'
          });
        } else if (sig.targetType === 'supplyChain') {
          await sig.populate({
            path: 'targetId',
            select: 'drugId currentLocation status',
            model: 'SupplyChain'
          });
        } else if (sig.targetType === 'qualityTest') {
          // qualityTest có thể là subdocument trong Drug, không cần populate
          // Hoặc có thể là document riêng, cần kiểm tra model
          const drug = await Drug.findOne({ 'qualityTest._id': sig.targetId });
          if (drug && drug.qualityTest) {
            sig.targetId = {
              _id: sig.targetId,
              testResult: drug.qualityTest.testResult,
              testDate: drug.qualityTest.testDate,
              testedBy: drug.qualityTest.testedBy
            };
          }
        }
      } catch (populateError) {
        console.error(`Error populating targetId for signature ${sig._id}:`, populateError);
        // Tiếp tục với các signature khác
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
      },
      message: `Tìm thấy ${total} chữ ký số`
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
    let { id } = req.params;
    
    // Chuẩn hóa id
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }
    
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
    let { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    // Chuẩn hóa id
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }
    
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
    // Xác định userId: nếu là admin và có query userId thì dùng, nếu không phải admin thì dùng user hiện tại
    let userId = null;
    if (req.query.userId && req.user && req.user.role === 'admin') {
      userId = req.query.userId;
    } else if (req.user && req.user.role !== 'admin') {
      userId = req.user._id || req.user.id;
    }
    
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

/**
 * Lấy danh sách CA providers
 */
exports.getCaProviders = async (req, res) => {
  try {
    const providers = await digitalSignatureService.listCaProviders();
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Thêm CA provider mới
 */
exports.createCaProvider = async (req, res) => {
  try {
    const provider = await digitalSignatureService.registerCaProvider({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({
      success: true,
      data: provider
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Kiểm tra kết nối HSM
 */
exports.testHsmConnection = async (req, res) => {
  try {
    const result = await hsmService.testConnection(req.body.providerId);
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

