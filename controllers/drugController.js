const mongoose = require('mongoose');
const Drug = require('../models/Drug');
const User = require('../models/User');
const SupplyChain = require('../models/SupplyChain');
const QRScanLog = require('../models/QRScanLog');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const blockchainService = require('../services/blockchainService');
const getServerUrl = require('../utils/getServerUrl');
const drugRiskService = require('../services/drugRiskService');
const auditService = require('../services/auditService');
// Import JSON helper utilities để xử lý BigInt
const { toJSONSafe, safeJsonResponse } = require('../utils/jsonHelper');
// Debug logging helper
const debugLog = (data) => { try { fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug.log'), JSON.stringify(data) + '\n'); } catch(e) {} };

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

    // Khởi tạo blockchain service với Sepolia network nếu chưa có
    const networkName = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
    if (!blockchainService.isInitialized || blockchainService.currentNetwork !== networkName) {
      console.log(`🔗 Đang khởi tạo blockchain service với network: ${networkName}...`);
      await blockchainService.initialize(networkName);
    }

    // Ghi dữ liệu lên blockchain Sepolia
    let blockchainResult;
    try {
      console.log(`📤 Đang ghi lô thuốc ${drug.drugId} lên blockchain ${networkName}...`);
      blockchainResult = await blockchainService.recordDrugBatchOnBlockchain({
        ...drugData,
        drugId: drug.drugId
      });
      
      console.log('Blockchain result:', JSON.stringify(blockchainResult, null, 2));
    } catch (error) {
      console.error('Error recording to blockchain:', error);
      blockchainResult = {
        success: false,
        error: error.message
      };
    }
    
    if (blockchainResult && blockchainResult.success) {
      // Lấy contract address từ blockchain service
      const contractAddress = blockchainService.getContractAddress 
        ? blockchainService.getContractAddress(blockchainService.currentNetwork)
        : (process.env.CONTRACT_ADDRESS_SEPOLIA || process.env.CONTRACT_ADDRESS || 'mock');
      
      // Cập nhật thông tin blockchain vào drug
      drug.blockchain = {
        blockchainId: blockchainResult.blockchainId,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        blockchainTimestamp: blockchainResult.timestamp,
        digitalSignature: blockchainResult.signature,
        dataHash: blockchainResult.hash,
        isOnBlockchain: true,
        blockchainStatus: blockchainResult.mock ? 'pending' : 'confirmed',
        contractAddress: contractAddress,
        transactionHistory: [{
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          timestamp: blockchainResult.timestamp,
          action: 'create',
          details: 'Tạo lô thuốc mới trên blockchain'
        }]
      };
      
      await drug.save();
      console.log(`✅ Drug ${drug.drugId} đã được ghi lên blockchain: ${blockchainResult.transactionHash}`);
    } else {
      // Vẫn lưu drug nhưng đánh dấu là pending
      drug.blockchain = {
        isOnBlockchain: false,
        blockchainStatus: 'pending',
        lastUpdated: new Date(),
        transactionHistory: [],
        error: blockchainResult?.error || 'Unknown error'
      };
      await drug.save();
      console.warn(`⚠️ Drug ${drug.drugId} chưa được ghi lên blockchain: ${blockchainResult?.error || 'Unknown error'}`);
    }

    // Tạo QR code với blockchain ID
    const qrData = drug.generateQRData();
    // Thêm blockchain ID vào QR data
    qrData.blockchainId = drug.blockchain?.blockchainId || drug.drugId;
    // Sử dụng server URL để tạo verification URL (tự động detect IP)
    const serverUrl = getServerUrl();
    qrData.verificationUrl = `${serverUrl}/verify/${drug.blockchain?.blockchainId || drug.drugId}`;
    
    // Tạo QR code với options để đảm bảo chất lượng tốt và dễ quét
    const qrCodeOptions = {
      errorCorrectionLevel: 'M', // Medium error correction - cân bằng giữa dung lượng và khả năng sửa lỗi
      type: 'image/png',
      quality: 0.92,
      margin: 1, // Margin nhỏ để QR code gọn hơn
      color: {
        dark: '#000000', // Màu đen cho phần tối
        light: '#FFFFFF' // Màu trắng cho phần sáng
      },
      width: 500 // Kích thước đủ lớn để dễ quét (tối thiểu 300px, khuyến nghị 500px)
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), qrCodeOptions);

    // Cập nhật QR code vào drug
    drug.qrCode.data = JSON.stringify(qrData);
    drug.qrCode.imageUrl = qrCodeDataURL;
    drug.qrCode.blockchainId = drug.blockchain?.blockchainId;
    drug.qrCode.verificationUrl = qrData.verificationUrl;
    await drug.save();

    // Populate manufacturer info
    await drug.populate('manufacturerId', 'fullName organizationInfo');

    // Ghi audit log
    await auditService.logCRUD.create(
      req.user,
      'Drug',
      drug._id,
      { name: drug.name, batchNumber: drug.batchNumber, drugId: drug.drugId },
      'drug',
      req,
      `Tạo lô thuốc mới: ${drug.name} (${drug.batchNumber})`
    );

    // Ghi audit log cho blockchain
    if (blockchainResult.success) {
      await auditService.logBlockchain.record(
        req.user,
        'Drug',
        drug._id,
        blockchainResult,
        req
      );
    }

    // Tạo message response dựa trên kết quả blockchain
    let successMessage = 'Tạo lô thuốc thành công.';
    if (blockchainResult && blockchainResult.success) {
      successMessage = 'Tạo lô thuốc thành công và đã ghi lên blockchain.';
    } else {
      successMessage = 'Tạo lô thuốc thành công, nhưng chưa thể ghi lên blockchain. Vui lòng sync lại sau.';
      console.warn(`⚠️ Lô thuốc ${drug.drugId} chưa được ghi lên blockchain: ${blockchainResult?.error || 'Unknown error'}`);
    }

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        drug,
        qrCode: qrCodeDataURL,
        blockchain: blockchainResult,
        blockchainStatus: blockchainResult?.success ? 'confirmed' : 'pending'
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

    // Kiểm tra quyền - chỉ admin và manufacturer mới có thể filter theo manufacturerId
    // Các role khác (distributor, hospital, patient) có thể xem tất cả thuốc
    if (req.user.role === 'manufacturer') {
      // Manufacturer chỉ xem thuốc của chính mình nếu không có filter cụ thể
      if (!manufacturerId) {
        filter.manufacturerId = req.user._id;
      }
    }
    // Admin xem tất cả (không filter)
    // Distributor, Hospital, Patient xem tất cả (không filter)

    // Loại trừ các thuốc đã được kiểm định bởi Bộ Y tế (chỉ áp dụng cho các role không phải admin)
    // Admin có thể xem tất cả thuốc, kể cả thuốc đã được Bộ Y tế kiểm định
    if (req.user.role !== 'admin') {
      filter['qualityTest.testBy'] = {
        $not: {
          $regex: /(Bộ Y tế|Cục Quản lý Dược)/i
        }
      };
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'ENTRY',data:{paramsId:req?.params?.id,method:req?.method,path:req?.originalUrl,userRole:req?.user?.role,userId:req?.user?._id?.toString?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1,H2'})}).catch(()=>{});
  // #endregion
  // #region agent log
  debugLog({location:'drugController.js:327',message:'getDrugById entry',data:{paramsId:req.params.id,paramsIdType:typeof req.params.id,isObjectId:mongoose.Types.ObjectId.isValid(req.params.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'});
  // #endregion
  try {
    // #region agent log
    debugLog({location:'drugController.js:330',message:'Before Drug.findById',data:{paramsId:req.params.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'});
    // #endregion
    
    // Tìm drug với error handling an toàn
    let drug = null;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'Before findById',data:{paramsId:req?.params?.id,isValidObjectId:mongoose.Types.ObjectId.isValid(req?.params?.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    try {
      drug = await Drug.findById(req.params.id)
        .populate('manufacturerId', 'fullName organizationInfo')
        .lean();
    } catch (findError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'findById ERROR',data:{name:findError?.name,message:findError?.message,paramsId:req?.params?.id,isValidObjectId:mongoose.Types.ObjectId.isValid(req?.params?.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3,H4'})}).catch(()=>{});
      // #endregion
      // Nếu lỗi do invalid ObjectId, thử tìm theo drugId
      if (findError.name === 'CastError' || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.log('⚠️ Invalid ObjectId, trying to find by drugId:', req.params.id);
      } else {
        throw findError; // Nếu lỗi khác, throw lại
      }
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'After findById',data:{found:!!drug,drugId:drug?.drugId,_id:drug?._id?.toString?.(),hasManufacturer:!!drug?.manufacturerId},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    debugLog({location:'drugController.js:337',message:'After Drug.findById',data:{drugFound:!!drug,drugId:drug?.drugId,drug_id:drug?._id?.toString(),manufacturerIdExists:!!drug?.manufacturerId,manufacturerIdType:typeof drug?.manufacturerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'});
    // #endregion

    // Nếu không tìm thấy theo _id, thử tìm theo drugId
    if (!drug) {
      // #region agent log
      debugLog({location:'drugController.js:343',message:'Drug not found by _id, trying drugId',data:{paramsId:req.params.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'Before findOne by drugId',data:{paramsId:req?.params?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      try {
        drug = await Drug.findOne({ drugId: req.params.id })
          .populate('manufacturerId', 'fullName organizationInfo')
          .lean();
      } catch (findError) {
        console.error('❌ Lỗi khi tìm drug theo drugId:', findError.message);
        // Tiếp tục, sẽ trả về 404 nếu không tìm thấy
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'After findOne by drugId',data:{found:!!drug,drugId:drug?.drugId,_id:drug?._id?.toString?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      // #region agent log
      debugLog({location:'drugController.js:348',message:'After Drug.findOne by drugId',data:{drugFound:!!drug,drugId:drug?.drugId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'});
      // #endregion
      
      // Nếu vẫn không tìm thấy, trả về 404
      if (!drug) {
        console.log('⚠️ Drug not found:', req.params.id);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'RETURN 404 not found',data:{paramsId:req?.params?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lô thuốc với ID hoặc mã thuốc này.',
          drugId: req.params.id
        });
      }
    }

    // Kiểm tra quyền truy cập một cách an toàn
    try {
      if (req.user && req.user.role === 'manufacturer' && 
          drug.manufacturerId && 
          drug.manufacturerId._id) {
        const manufacturerId = drug.manufacturerId._id.toString ? 
          drug.manufacturerId._id.toString() : 
          String(drug.manufacturerId._id);
        if (manufacturerId !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem thông tin lô thuốc này. Chỉ có thể xem thuốc do bạn sản xuất.'
          });
        }
      }
    } catch (permissionError) {
      console.warn('⚠️ Lỗi khi kiểm tra quyền truy cập:', permissionError.message);
      // Không throw, tiếp tục xử lý
    }

    // #region agent log
    debugLog({location:'drugController.js:396',message:'Returning success response',data:{drugId:drug.drugId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'});
    // #endregion
    
    // Vì đã dùng lean(), drug đã là plain object, không cần convert
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'RETURN 200',data:{paramsId:req?.params?.id,drugId:drug?.drugId,_id:drug?._id?.toString?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    res.status(200).json({
      success: true,
      data: { drug }
    });

  } catch (error) {
    // #region agent log
    debugLog({location:'drugController.js:405',message:'Error caught',data:{errorName:error.name,errorMessage:error.message,errorStack:error.stack?.substring(0,200),paramsId:req.params.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H5'});
    // #endregion
    console.error('❌ Lỗi trong getDrugById:', {
      message: error.message,
      stack: error.stack,
      paramsId: req.params.id,
      errorName: error.name
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/drugController.js:getDrugById',message:'CATCH ERROR',data:{name:error?.name,message:error?.message,paramsId:req?.params?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    // Nếu là lỗi CastError (invalid ObjectId), trả về 404 thay vì 500
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc với ID này.',
        drugId: req.params.id
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin lô thuốc.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi khi xử lý yêu cầu.'
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

    // Lưu dữ liệu trước khi cập nhật
    const beforeData = {
      name: drug.name,
      activeIngredient: drug.activeIngredient,
      dosage: drug.dosage,
      form: drug.form,
      qualityTest: drug.qualityTest,
      storage: drug.storage
    };

    const updatedDrug = await Drug.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('manufacturerId', 'fullName organizationInfo');

    // Ghi audit log
    await auditService.logCRUD.update(
      req.user,
      'Drug',
      drug._id,
      beforeData,
      updateData,
      'drug',
      req,
      `Cập nhật lô thuốc: ${drug.name} (${drug.batchNumber})`
    );

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

// Helper: ghi log quét QR
const logQRScan = async ({ qrData, drug, user, success, alertType, errorMessage }) => {
  try {
    const rawData = typeof qrData === 'string' ? qrData : JSON.stringify(qrData);
    await QRScanLog.create({
      rawData,
      drug: drug?._id || null,
      drugId: drug?.drugId || null,
      batchNumber: drug?.batchNumber || null,
      blockchainId: drug?.blockchain?.blockchainId || null,
      user: user?._id || null,
      success: !!success,
      alertType: alertType || null,
      errorMessage: errorMessage || null,
      ipAddress: user?.ip || null,
      userAgent: user?.userAgent || null
    });
  } catch (logError) {
    // Không làm fail request chính nếu log lỗi
    console.error('QRScanLog error:', logError.message);
  }
};

// @desc    Quét QR code để tra cứu
// @route   POST /api/drugs/scan-qr
// @access  Private
const scanQRCode = async (req, res) => {
  try {
    console.log('🔍 scanQRCode controller được gọi');
    console.log('Request body:', req.body);
    console.log('User:', req.user ? req.user._id : 'No user');
    
    const { qrData } = req.body;

    if (!qrData) {
      await logQRScan({
        qrData: '',
        drug: null,
        user: req.user,
        success: false,
        errorMessage: 'Thiếu dữ liệu QR code'
      });
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp dữ liệu QR code.'
      });
    }

    // Log QR data để debug
    console.log('📋 QR Data received (raw):', {
      type: typeof qrData,
      length: typeof qrData === 'string' ? qrData.length : 'N/A',
      preview: typeof qrData === 'string' ? qrData.substring(0, 100) : JSON.stringify(qrData).substring(0, 100),
      fullData: typeof qrData === 'string' ? qrData : JSON.stringify(qrData)
    });

    // Clean QR data - loại bỏ các ký tự thừa
    if (typeof qrData === 'string') {
      const originalQR = qrData;
      let cleanedQR = qrData.trim();
      
      // Thử extract blockchainId từ JSON nếu có
      const jsonMatch = cleanedQR.match(/"blockchainId"\s*:\s*"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) {
        cleanedQR = jsonMatch[1];
        console.log('📦 Đã extract blockchainId từ JSON:', cleanedQR);
      } else {
        // Loại bỏ các ký tự thừa ở cuối: ", ', }, ], và các ký tự đặc biệt
        cleanedQR = cleanedQR.replace(/["'}\]\]]+$/, '');
        
        // Loại bỏ các ký tự thừa ở đầu
        cleanedQR = cleanedQR.replace(/^["'{}\[\]]+/, '');
        
        // Trim lại
        cleanedQR = cleanedQR.trim();
      }
      
      // Cập nhật qrData nếu đã thay đổi
      if (cleanedQR !== originalQR) {
        console.log('🧹 Đã làm sạch QR data:', {
          original: originalQR,
          cleaned: cleanedQR,
          removed: originalQR.length - cleanedQR.length,
          originalLength: originalQR.length,
          cleanedLength: cleanedQR.length
        });
        qrData = cleanedQR;
      }
    }
    
    // Log QR data đã làm sạch (với try-catch để tránh lỗi)
    try {
      console.log('📋 QR Data received (cleaned):', {
        type: typeof qrData,
        length: typeof qrData === 'string' ? qrData.length : 'N/A',
        preview: typeof qrData === 'string' ? qrData.substring(0, 100) : JSON.stringify(qrData).substring(0, 100)
      });
    } catch (logError) {
      console.warn('⚠️ Lỗi khi log QR data cleaned:', logError.message);
      console.log('📋 QR Data (cleaned, simplified):', typeof qrData === 'string' ? qrData.substring(0, 50) : 'object');
    }

    console.log('🔍 Bắt đầu tìm kiếm thuốc với QR data đã làm sạch...');

    let drug;
    let searchAttempts = [];

    // Xử lý lỗi QR code không hợp lệ rõ ràng hơn
    try {
      console.log('🔎 Gọi Drug.findByQRCode với:', qrData);
      drug = await Drug.findByQRCode(qrData);
      if (drug) {
        searchAttempts.push('findByQRCode: found');
        console.log('✅ Tìm thấy thuốc bằng findByQRCode:', drug.drugId || drug.batchNumber);
      } else {
        searchAttempts.push('findByQRCode: not found');
      }
    } catch (findError) {
      if (findError.message && findError.message.startsWith('QR code không hợp lệ')) {
        await logQRScan({
          qrData,
          drug: null,
          user: req.user,
          success: false,
          errorMessage: findError.message
        });
        return res.status(400).json({
          success: false,
          message: findError.message
        });
      }
      // Log lỗi nhưng vẫn tiếp tục thử tìm bằng cách khác
      console.error('Error in findByQRCode:', findError);
      searchAttempts.push(`findByQRCode: error - ${findError.message}`);
    }

    // Nếu không tìm thấy bằng findByQRCode, thử tìm trực tiếp bằng blockchain ID, drugId, hoặc batchNumber
    if (!drug) {
      const searchText = typeof qrData === 'string' ? qrData.trim() : (qrData.blockchainId || qrData.drugId || qrData.batchNumber || '');
      
      console.log('🔎 Đang tìm kiếm với searchText:', searchText);
      console.log('📏 Độ dài searchText:', searchText.length);
      console.log('🔤 SearchText bytes:', Buffer.from(searchText).toString('hex'));
      
      // Thử tìm theo blockchain ID (ưu tiên)
      if (searchText) {
        try {
          // Thử tìm với exact match (không populate distribution.history.updatedBy để tránh lỗi)
          let blockchainResult = await Drug.findOne({ 'blockchain.blockchainId': searchText })
            .populate('manufacturerId', 'fullName organizationInfo');
          
          if (blockchainResult) {
            drug = blockchainResult;
            searchAttempts.push('blockchainId: found');
            console.log('✅ Tìm thấy thuốc bằng blockchainId:', searchText);
          } else {
            // Nếu không tìm thấy, thử tìm với regex (case-insensitive)
            console.log('⚠️ Không tìm thấy với exact match, thử regex...');
            blockchainResult = await Drug.findOne({ 
              'blockchain.blockchainId': { $regex: new RegExp(`^${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            })
              .populate('manufacturerId', 'fullName organizationInfo');
            
            if (blockchainResult) {
              drug = blockchainResult;
              searchAttempts.push('blockchainId: found (regex)');
              console.log('✅ Tìm thấy thuốc bằng blockchainId (regex):', searchText);
            } else {
              searchAttempts.push('blockchainId: not found');
              // Debug: Kiểm tra xem có blockchainId nào tương tự không
              const similarBlockchainIds = await Drug.find({
                'blockchain.blockchainId': { $regex: searchText.substring(0, 10) }
              }).select('blockchain.blockchainId').limit(3);
              if (similarBlockchainIds.length > 0) {
                console.log('🔍 Tìm thấy các blockchainId tương tự:', similarBlockchainIds.map(d => d.blockchain?.blockchainId));
              }
            }
          }
        } catch (populateError) {
          // Nếu populate lỗi, thử tìm không populate
          console.warn('⚠️ Lỗi populate, thử tìm không populate:', populateError.message);
          try {
            const blockchainResultNoPopulate = await Drug.findOne({ 'blockchain.blockchainId': searchText });
            if (blockchainResultNoPopulate) {
              drug = blockchainResultNoPopulate;
              searchAttempts.push('blockchainId: found (no populate)');
              console.log('✅ Tìm thấy thuốc bằng blockchainId (không populate):', searchText);
            } else {
              searchAttempts.push('blockchainId: not found');
            }
          } catch (findError) {
            console.error('❌ Lỗi khi tìm không populate:', findError.message);
            searchAttempts.push(`blockchainId: error - ${findError.message}`);
          }
        }
      }
      
          // Nếu không có, thử tìm theo drugId
      if (!drug && searchText) {
        try {
          const drugIdResult = await Drug.findOne({ drugId: searchText })
            .populate('manufacturerId', 'fullName organizationInfo');
          if (drugIdResult) {
            drug = drugIdResult;
            searchAttempts.push('drugId: found');
            console.log('✅ Tìm thấy thuốc bằng drugId:', searchText);
          } else {
            searchAttempts.push('drugId: not found');
          }
        } catch (populateError) {
          console.warn('⚠️ Lỗi populate, thử tìm không populate:', populateError.message);
          const drugIdResultNoPopulate = await Drug.findOne({ drugId: searchText });
          if (drugIdResultNoPopulate) {
            drug = drugIdResultNoPopulate;
            searchAttempts.push('drugId: found (no populate)');
            console.log('✅ Tìm thấy thuốc bằng drugId (không populate):', searchText);
          } else {
            searchAttempts.push('drugId: not found');
          }
        }
      }
      
      // Nếu vẫn không có, thử tìm theo batchNumber
      if (!drug && searchText) {
        try {
          const batchResult = await Drug.findOne({ batchNumber: searchText })
            .populate('manufacturerId', 'fullName organizationInfo');
          if (batchResult) {
            drug = batchResult;
            searchAttempts.push('batchNumber: found');
            console.log('✅ Tìm thấy thuốc bằng batchNumber:', searchText);
          } else {
            searchAttempts.push('batchNumber: not found');
          }
        } catch (populateError) {
          console.warn('⚠️ Lỗi populate, thử tìm không populate:', populateError.message);
          const batchResultNoPopulate = await Drug.findOne({ batchNumber: searchText });
          if (batchResultNoPopulate) {
            drug = batchResultNoPopulate;
            searchAttempts.push('batchNumber: found (no populate)');
            console.log('✅ Tìm thấy thuốc bằng batchNumber (không populate):', searchText);
          } else {
            searchAttempts.push('batchNumber: not found');
          }
        }
      }

      // Nếu vẫn không có, thử parse JSON từ QR data
      if (!drug && typeof qrData === 'string') {
        try {
          const parsed = JSON.parse(qrData);
          console.log('📦 Parsed QR data:', parsed);
          
          if (parsed.blockchainId) {
            const parsedBlockchainResult = await Drug.findOne({ 'blockchain.blockchainId': parsed.blockchainId })
              .populate('manufacturerId', 'fullName organizationInfo');
            if (parsedBlockchainResult) {
              drug = parsedBlockchainResult;
              searchAttempts.push('parsed.blockchainId: found');
              console.log('✅ Tìm thấy thuốc bằng parsed blockchainId:', parsed.blockchainId);
            } else {
              searchAttempts.push('parsed.blockchainId: not found');
            }
          }
          
          if (!drug && parsed.drugId) {
            const parsedDrugIdResult = await Drug.findOne({ drugId: parsed.drugId })
              .populate('manufacturerId', 'fullName organizationInfo');
            if (parsedDrugIdResult) {
              drug = parsedDrugIdResult;
              searchAttempts.push('parsed.drugId: found');
              console.log('✅ Tìm thấy thuốc bằng parsed drugId:', parsed.drugId);
            } else {
              searchAttempts.push('parsed.drugId: not found');
            }
          }
          
          if (!drug && parsed.batchNumber) {
            const parsedBatchResult = await Drug.findOne({ batchNumber: parsed.batchNumber })
              .populate('manufacturerId', 'fullName organizationInfo');
            if (parsedBatchResult) {
              drug = parsedBatchResult;
              searchAttempts.push('parsed.batchNumber: found');
              console.log('✅ Tìm thấy thuốc bằng parsed batchNumber:', parsed.batchNumber);
            } else {
              searchAttempts.push('parsed.batchNumber: not found');
            }
          }
        } catch (parseError) {
          // Không phải JSON, bỏ qua
          searchAttempts.push('JSON parse: failed');
        }
      }
    }

    if (!drug) {
      // Log thống kê để debug
      const totalDrugs = await Drug.countDocuments();
      const drugsWithBlockchain = await Drug.countDocuments({ 'blockchain.blockchainId': { $exists: true, $ne: null } });
      
      console.log('❌ Không tìm thấy thuốc. Thống kê:', {
        totalDrugs,
        drugsWithBlockchain,
        searchAttempts,
        qrDataPreview: typeof qrData === 'string' ? qrData.substring(0, 200) : JSON.stringify(qrData).substring(0, 200)
      });

      await logQRScan({
        qrData,
        drug: null,
        user: req.user,
        success: false,
        errorMessage: 'Không tìm thấy thông tin thuốc. Vui lòng kiểm tra lại mã blockchain ID, mã thuốc hoặc số lô.'
      });
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thuốc. Vui lòng kiểm tra lại mã blockchain ID, mã thuốc hoặc số lô.',
        debug: process.env.NODE_ENV === 'development' ? {
          searchAttempts,
          qrDataType: typeof qrData,
          qrDataPreview: typeof qrData === 'string' ? qrData.substring(0, 100) : 'object'
        } : undefined,
        data: {
          drug: null,
          blockchain: null,
          blockchainInfo: null,
          risk: null
        }
      });
    }

    // Đảm bảo drug object có thể serialize được (nếu chưa populate đầy đủ)
    try {
      // Thử populate lại nếu cần (tránh lỗi khi serialize)
      if (drug && !drug.manufacturerId || typeof drug.manufacturerId === 'string') {
        await drug.populate('manufacturerId', 'fullName organizationInfo');
      }
    } catch (populateError) {
      console.warn('⚠️ Lỗi populate manufacturerId, bỏ qua:', populateError.message);
      // Không throw, tiếp tục xử lý
    }

    // Lấy thông tin từ blockchain (nếu có)
    const actualBlockchainId = drug.blockchain?.blockchainId;
    let blockchainData = null;
    
    try {
      if (actualBlockchainId && drug.blockchain?.isOnBlockchain) {
        blockchainData = await blockchainService.getDrugBatchFromBlockchain(actualBlockchainId);
      }
    } catch (blockchainError) {
      console.error('Error fetching blockchain data:', blockchainError);
      // Không throw error, chỉ log - vẫn trả về dữ liệu thuốc
    }

    // Tính điểm rủi ro AI cho lô thuốc (bao lỗi để không làm fail verify)
    let risk = null;
    try {
      risk = await drugRiskService.calculateDrugRisk(drug);
    } catch (riskError) {
      console.error('Error calculating drug risk:', riskError);
      // Không throw, chỉ log để vẫn trả về kết quả verify
      risk = null;
    }

    // Kiểm tra thuốc có bị thu hồi không
    if (drug.isRecalled) {
      await logQRScan({
        qrData,
        drug,
        user: req.user,
        success: true,
        alertType: 'recalled'
      });
      return res.status(400).json({
        success: false,
        message: 'CẢNH BÁO: Lô thuốc này đã bị thu hồi!',
        alertType: 'recalled',
        data: {
          drug: drug,
          recallReason: drug.recallReason,
          recallDate: drug.recallDate,
          blockchain: blockchainData,
          blockchainInfo: drug.blockchain,
          risk
        }
      });
    }

    // Kiểm tra thuốc có hết hạn không
    if (drug.isExpired) {
      await logQRScan({
        qrData,
        drug,
        user: req.user,
        success: true,
        alertType: 'expired'
      });
      return res.status(400).json({
        success: false,
        message: 'CẢNH BÁO: Thuốc đã hết hạn sử dụng!',
        alertType: 'expired',
        data: {
          drug: drug,
          expiryDate: drug.expiryDate,
          daysExpired: Math.abs(drug.daysUntilExpiry),
          blockchain: blockchainData,
          blockchainInfo: drug.blockchain,
          risk
        }
      });
    }

    // Kiểm tra thuốc gần hết hạn
    if (drug.isNearExpiry) {
      await logQRScan({
        qrData,
        drug,
        user: req.user,
        success: true,
        alertType: 'near_expiry'
      });
      return res.status(200).json({
        success: true,
        message: 'Thuốc hợp lệ nhưng gần hết hạn.',
        warning: `Thuốc sẽ hết hạn trong ${drug.daysUntilExpiry} ngày.`,
        data: { 
          drug,
          blockchain: blockchainData,
          blockchainInfo: drug.blockchain,
          risk
        }
      });
    }

    await logQRScan({
      qrData,
      drug,
      user: req.user,
      success: true
    });

    // Đảm bảo drug object có thể serialize được
    try {
      // Convert drug to plain object để tránh lỗi serialize
      const drugObject = drug.toObject ? drug.toObject() : drug;
      
      res.status(200).json({
        success: true,
        message: 'Thuốc hợp lệ và an toàn.',
        data: { 
          drug: drugObject,
          blockchain: blockchainData,
          blockchainInfo: drug.blockchain,
          risk
        }
      });
    } catch (serializeError) {
      console.error('❌ Lỗi khi serialize drug object:', {
        message: serializeError.message,
        stack: serializeError.stack,
        drugId: drug?.drugId,
        drugType: typeof drug
      });
      
      // Thử serialize với toJSON nếu có
      try {
        const drugJSON = drug.toJSON ? drug.toJSON() : JSON.parse(JSON.stringify(drug));
        res.status(200).json({
          success: true,
          message: 'Thuốc hợp lệ và an toàn.',
          data: { 
            drug: drugJSON,
            blockchain: blockchainData,
            blockchainInfo: drug.blockchain,
            risk
          }
        });
      } catch (jsonError) {
        // Nếu vẫn lỗi, trả về dữ liệu tối thiểu
        console.error('❌ Lỗi khi serialize với toJSON:', jsonError.message);
        throw new Error(`Lỗi khi serialize drug object: ${serializeError.message}`);
      }
    }

  } catch (error) {
    // Log chi tiết lỗi để debug
    console.error('❌ Lỗi trong scanQRCode:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      qrData: req.body?.qrData,
      user: req.user?._id
    });
    
    await logQRScan({
      qrData: req.body?.qrData || '',
      drug: null,
      user: req.user,
      success: false,
      errorMessage: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi quét QR code.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Đã xảy ra lỗi khi xử lý yêu cầu.',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Lấy server URL (cho frontend sử dụng)
// @route   GET /api/drugs/server-url
// @access  Public
const getServerUrlController = (req, res) => {
  try {
    const serverUrl = getServerUrl();
    
    res.json({
      success: true,
      data: {
        serverUrl,
        frontendUrl: serverUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy server URL.',
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
    // Tạo filter để loại trừ thuốc đã được Bộ Y tế kiểm định (chỉ cho role không phải admin)
    const baseFilter = {};
    if (req.user.role !== 'admin') {
      baseFilter['qualityTest.testBy'] = {
        $not: {
          $regex: /(Bộ Y tế|Cục Quản lý Dược)/i
        }
      };
    }

    const totalDrugs = await Drug.countDocuments(baseFilter);
    const activeFilter = { ...baseFilter, status: 'active' };
    const activeDrugs = await Drug.countDocuments(activeFilter);
    const recalledFilter = { ...baseFilter, isRecalled: true };
    const recalledDrugs = await Drug.countDocuments(recalledFilter);
    const expiredFilter = { 
      ...baseFilter,
      expiryDate: { $lt: new Date() } 
    };
    const expiredDrugs = await Drug.countDocuments(expiredFilter);

    const drugsByStatus = await Drug.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Lấy thuốc sắp hết hạn với filter
    const expiringSoonFilter = {
      expiryDate: { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        $gte: new Date()
      },
      status: 'active',
      isRecalled: false,
      ...baseFilter
    };
    const expiringSoon = await Drug.find(expiringSoonFilter);

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

    // Lưu dữ liệu trước khi xóa
    const drugData = {
      name: drug.name,
      batchNumber: drug.batchNumber,
      drugId: drug.drugId
    };

    await Drug.findByIdAndDelete(req.params.id);

    // Ghi audit log
    await auditService.logCRUD.delete(
      req.user,
      'Drug',
      drug._id,
      drugData,
      'drug',
      req,
      `Xóa lô thuốc: ${drug.name} (${drug.batchNumber})`
    );

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

// Helper function để populate drug với đầy đủ thông tin
const populateDrug = async (query) => {
  if (!query) return null;
  
  try {
    // Populate đơn giản với error handling
    const drug = await query
      .populate('manufacturerId', 'fullName organizationInfo phone email address location')
      .populate('createdBy', 'fullName role');
    
    return drug;
  } catch (error) {
    console.error('[populateDrug] Error:', error.message);
    console.error('[populateDrug] Error stack:', error.stack);
    
    // Nếu populate lỗi, tạo query mới không populate
    try {
      const Model = query.model;
      const conditions = query.getQuery();
      const drug = await Model.findOne(conditions);
      return drug;
    } catch (fallbackError) {
      console.error('[populateDrug] Fallback error:', fallbackError.message);
      return null;
    }
  }
};

const formatDrugResponse = (drugDoc) => {
  if (!drugDoc) {
    console.error('[formatDrugResponse] drugDoc is null or undefined');
    return null;
  }

  try {
    const manufacturerDoc = drugDoc.manufacturerId;
    const manufacturer = manufacturerDoc
      ? {
          fullName: manufacturerDoc.fullName || null,
          organizationInfo: manufacturerDoc.organizationInfo || null,
          phone: manufacturerDoc.phone || null,
          email: manufacturerDoc.email || null,
          address: manufacturerDoc.address || null,
          location: manufacturerDoc.location || null
        }
      : null;

  const distributionHistory = (drugDoc.distribution?.history || [])
    .slice(-5)
    .map(entry => {
      let updatedBy = null;
      if (entry.updatedBy) {
        // Xử lý trường hợp updatedBy đã được populate (là object) hoặc chưa (là ObjectId)
        if (typeof entry.updatedBy === 'object' && entry.updatedBy._id) {
          updatedBy = {
            id: entry.updatedBy._id,
            fullName: entry.updatedBy.fullName || null,
            role: entry.updatedBy.role || null
          };
        } else if (typeof entry.updatedBy === 'object' && entry.updatedBy.toString) {
          // Chỉ là ObjectId, không populate
          updatedBy = {
            id: entry.updatedBy.toString()
          };
        }
      }
      
      return {
        status: entry.status,
        location: entry.location,
        organizationId: entry.organizationId,
        organizationName: entry.organizationName,
        note: entry.note,
        timestamp: entry.timestamp,
        updatedBy
      };
    })
    .reverse();

  return {
    drugId: drugDoc.drugId,
    name: drugDoc.name,
    activeIngredient: drugDoc.activeIngredient,
    dosage: drugDoc.dosage,
    form: drugDoc.form,
    batchNumber: drugDoc.batchNumber,
    productionDate: drugDoc.productionDate,
    expiryDate: drugDoc.expiryDate,
    packaging: drugDoc.packaging || null,
    storage: drugDoc.storage || null,
    qualityTest: drugDoc.qualityTest || null,
    manufacturer,
    distribution: drugDoc.distribution
      ? {
          status: drugDoc.distribution.status,
          currentLocation: drugDoc.distribution.currentLocation || null,
          history: distributionHistory
        }
      : null,
    status: drugDoc.status,
    isRecalled: drugDoc.isRecalled,
    recallReason: drugDoc.recallReason || null,
    recallDate: drugDoc.recallDate || null,
    daysUntilExpiry: (() => {
      try {
        if (typeof drugDoc.daysUntilExpiry === 'number') return drugDoc.daysUntilExpiry;
        // Tính toán nếu là virtual field
        if (drugDoc.expiryDate) {
          const today = new Date();
          const expiry = new Date(drugDoc.expiryDate);
          const diffTime = expiry - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        }
        return null;
      } catch (e) {
        return null;
      }
    })(),
    isNearExpiry: (() => {
      try {
        if (typeof drugDoc.isNearExpiry === 'boolean') return drugDoc.isNearExpiry;
        // Tính toán nếu là virtual field
        if (drugDoc.expiryDate) {
          const today = new Date();
          const expiry = new Date(drugDoc.expiryDate);
          const diffTime = expiry - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        }
        return false;
      } catch (e) {
        return false;
      }
    })(),
    blockchain: drugDoc.blockchain ? toJSONSafe(drugDoc.blockchain) : null,
    createdAt: drugDoc.createdAt || null,
    updatedAt: drugDoc.updatedAt || null
  };
  } catch (error) {
    console.error('[formatDrugResponse] Error formatting drug:', error);
    console.error('[formatDrugResponse] Error stack:', error.stack);
    console.error('[formatDrugResponse] drugDoc keys:', drugDoc ? Object.keys(drugDoc) : 'null');
    // Trả về object tối thiểu nếu có lỗi
    return {
      drugId: drugDoc?.drugId || drugDoc?._id?.toString() || null,
      name: drugDoc?.name || null,
      batchNumber: drugDoc?.batchNumber || null,
      blockchain: drugDoc?.blockchain || null
    };
  }
};

// @desc    Verify QR code và lấy thông tin từ blockchain
// @route   GET /api/drugs/verify/:blockchainId
// @access  Public
const verifyQRCode = async (req, res) => {
  let blockchainId;
  try {
    blockchainId = req.params?.blockchainId;
    console.log('[verifyQRCode] Starting verification for blockchainId:', blockchainId);

    if (!blockchainId) {
      return safeJsonResponse(res, 400, {
        success: false,
        message: 'Blockchain ID hoặc số lô là bắt buộc.'
      });
    }

    // Tìm drug trong database - thử nhiều cách
    let drug = null;
    
    try {
      // 1. Thử tìm bằng blockchain.blockchainId (ưu tiên nhất)
      console.log('[verifyQRCode] Attempt 1: Searching by blockchain.blockchainId');
      const query1 = Drug.findOne({ 'blockchain.blockchainId': blockchainId });
      drug = await populateDrug(query1);
      if (drug) {
        console.log('[verifyQRCode] Found drug by blockchain.blockchainId:', drug.drugId);
      }
    } catch (err) {
      console.error('[verifyQRCode] Error in attempt 1:', err.message);
    }

    // 2. Nếu không tìm thấy, thử tìm bằng drugId (format DRUG_...)
    if (!drug && blockchainId.startsWith('DRUG_')) {
      try {
        console.log('[verifyQRCode] Attempt 2: Searching by drugId (DRUG_ format)');
        const query2 = Drug.findOne({ drugId: blockchainId });
        drug = await populateDrug(query2);
        if (drug) {
          console.log('[verifyQRCode] Found drug by drugId:', drug.drugId);
        }
      } catch (err) {
        console.error('[verifyQRCode] Error in attempt 2:', err.message);
      }
    }
    
    // 3. Nếu vẫn không tìm thấy, thử tìm bằng batchNumber
    if (!drug) {
      try {
        console.log('[verifyQRCode] Attempt 3: Searching by batchNumber');
        const query3 = Drug.findOne({ batchNumber: blockchainId });
        drug = await populateDrug(query3);
        if (drug) {
          console.log('[verifyQRCode] Found drug by batchNumber:', drug.drugId);
        }
      } catch (err) {
        console.error('[verifyQRCode] Error in attempt 3:', err.message);
      }
    }
    
    // 4. Thử tìm bằng drugId nếu chưa tìm thấy (cho các trường hợp khác)
    if (!drug) {
      try {
        console.log('[verifyQRCode] Attempt 4: Searching by drugId (any format)');
        const query4 = Drug.findOne({ drugId: blockchainId });
        drug = await populateDrug(query4);
        if (drug) {
          console.log('[verifyQRCode] Found drug by drugId (any):', drug.drugId);
        }
      } catch (err) {
        console.error('[verifyQRCode] Error in attempt 4:', err.message);
      }
    }
    
    // 5. Nếu vẫn không tìm thấy, thử tìm từ SupplyChain
    if (!drug) {
      try {
        console.log('[verifyQRCode] Attempt 5: Searching in SupplyChain');
        const supplyChain = await SupplyChain.findOne({
          $or: [
            { 'qrCode.blockchainId': blockchainId },
            { 'qrCode.code': blockchainId },
            { drugBatchNumber: blockchainId }
          ]
        }).populate('drugId');
        
        if (supplyChain && supplyChain.drugId) {
          const query5 = Drug.findById(supplyChain.drugId);
          drug = await populateDrug(query5);
          if (drug) {
            console.log('[verifyQRCode] Found drug via SupplyChain:', drug.drugId);
          }
        }
      } catch (err) {
        console.error('[verifyQRCode] Error in attempt 5:', err.message);
      }
    }

    if (!drug) {
      console.log('[verifyQRCode] Drug not found for blockchainId:', blockchainId);
      return safeJsonResponse(res, 404, {
        success: false,
        message: 'Không tìm thấy lô thuốc với blockchain ID, số lô hoặc mã thuốc này. Vui lòng kiểm tra lại thông tin.',
        blockchainId: blockchainId
      });
    }

    console.log('[verifyQRCode] Drug found:', drug.drugId || drug._id);
    
    // Validate drug object
    if (!drug || (!drug.drugId && !drug._id)) {
      console.error('[verifyQRCode] Invalid drug object:', drug);
      return safeJsonResponse(res, 500, {
        success: false,
        message: 'Dữ liệu lô thuốc không hợp lệ.'
      });
    }

    // Lấy thông tin từ blockchain (nếu có)
    // Sử dụng blockchainId của drug nếu có, nếu không thì dùng tham số truyền vào
    const actualBlockchainId = drug.blockchain?.blockchainId || blockchainId;
    let blockchainData = null;
    
    try {
      if (actualBlockchainId && drug.blockchain?.isOnBlockchain) {
        const rawBlockchainData = await blockchainService.getDrugBatchFromBlockchain(actualBlockchainId);
        // Xử lý BigInt ngay khi lấy được - xử lý nhiều lần để chắc chắn
        blockchainData = toJSONSafe(rawBlockchainData);
        blockchainData = toJSONSafe(blockchainData); // Double check
        // Đảm bảo không có BigInt bằng cách serialize và parse lại
        try {
          JSON.stringify(blockchainData, (key, value) => {
            if (typeof value === 'bigint') {
              throw new Error(`Found BigInt at key: ${key}`);
            }
            return value;
          });
        } catch (bigIntCheck) {
          console.error('[verifyQRCode] Found BigInt in blockchainData after toJSONSafe:', bigIntCheck);
          blockchainData = toJSONSafe(blockchainData); // Xử lý lại
        }
      }
    } catch (blockchainError) {
      console.error('Error fetching blockchain data:', blockchainError);
      // Không throw error, chỉ log
    }

    // Tính điểm rủi ro AI cho lô thuốc (bao lỗi để không làm fail verify)
    let risk = null;
    try {
      const rawRisk = await drugRiskService.calculateDrugRisk(drug);
      // Xử lý BigInt trong risk data
      risk = rawRisk ? toJSONSafe(rawRisk) : null;
    } catch (riskError) {
      console.error('Error calculating drug risk:', riskError);
      // Không throw, để vẫn trả về dữ liệu xác minh
      risk = null;
    }

    // Format drug response với error handling
    let formattedDrug;
    try {
      formattedDrug = formatDrugResponse(drug);
      // Xử lý BigInt trong formattedDrug
      formattedDrug = toJSONSafe(formattedDrug);
    } catch (formatError) {
      console.error('[verifyQRCode] Error formatting drug response:', formatError);
      console.error('[verifyQRCode] Format error stack:', formatError.stack);
      // Nếu format lỗi, trả về dữ liệu đơn giản hơn
      formattedDrug = {
        drugId: drug.drugId || drug._id?.toString(),
        name: drug.name,
        batchNumber: drug.batchNumber,
        blockchain: drug.blockchain || null
      };
      formattedDrug = toJSONSafe(formattedDrug);
    }

    console.log('[verifyQRCode] Verification successful for:', blockchainId);

    // Xây dựng response payload và xử lý BigInt ngay từ đầu
    const responsePayload = {
      success: true,
      message: 'Thông tin lô thuốc hợp lệ.',
      data: {
        drug: formattedDrug,
        blockchain: blockchainData,
        verification: {
          isValid: true,
          verifiedAt: new Date().toISOString(), // Convert Date thành ISO string ngay
          blockchainStatus: drug.blockchain?.blockchainStatus || 'unknown'
        },
        risk: risk
      }
    };

    // Kiểm tra BigInt trong responsePayload trước khi gửi
    try {
      JSON.stringify(responsePayload, (key, value) => {
        if (typeof value === 'bigint') {
          console.error(`[verifyQRCode] Found BigInt in responsePayload at key: ${key}, value: ${value}`);
          throw new Error(`BigInt found at ${key}`);
        }
        return value;
      });
    } catch (bigIntCheck) {
      console.error('[verifyQRCode] BigInt detected in responsePayload, processing again...');
      // Xử lý lại toàn bộ payload
      responsePayload.data.drug = toJSONSafe(responsePayload.data.drug);
      responsePayload.data.blockchain = toJSONSafe(responsePayload.data.blockchain);
      responsePayload.data.risk = toJSONSafe(responsePayload.data.risk);
    }

    // Convert toàn bộ response để tránh BigInt
    try {
      safeJsonResponse(res, 200, responsePayload);
      return;
    } catch (jsonError) {
      console.error('[verifyQRCode] Error serializing response:', jsonError);
      console.error('[verifyQRCode] JSON error details:', {
        message: jsonError.message,
        stack: jsonError.stack
      });
      // Fallback: trả về response đơn giản nhất
      safeJsonResponse(res, 200, {
        success: true,
        message: 'Thông tin lô thuốc hợp lệ.',
        data: {
          drug: {
            drugId: String(drug.drugId || drug._id || ''),
            name: String(drug.name || ''),
            batchNumber: String(drug.batchNumber || '')
          }
        }
      });
      return;
    }

  } catch (error) {
    console.error('[verifyQRCode] Error verifying QR code:', error);
    console.error('[verifyQRCode] Error stack:', error.stack);
    console.error('[verifyQRCode] Blockchain ID:', blockchainId);
    safeJsonResponse(res, 500, {
      success: false,
      message: 'Lỗi server khi xác minh QR code.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Vui lòng thử lại sau.'
    });
  }
};

// @desc    Xác minh thuốc từ blockchain ID
// @route   GET /api/drugs/verify/:blockchainId
// @access  Public
const verifyDrugByBlockchainId = async (req, res) => {
  try {
    const { blockchainId } = req.params;

    if (!blockchainId) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain ID là bắt buộc.'
      });
    }

    // Tìm thuốc theo blockchain ID
    const drug = await populateDrug(Drug.findOne({ 
      'blockchain.blockchainId': blockchainId 
    }));

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc với blockchain ID này.'
      });
    }

    // Lấy thông tin blockchain
    const blockchainData = {
      blockchainId: drug.blockchain?.blockchainId,
      transactionHash: drug.blockchain?.transactionHash,
      blockNumber: drug.blockchain?.blockNumber,
      timestamp: drug.blockchain?.blockchainTimestamp,
      gasUsed: drug.blockchain?.gasUsed,
      contractAddress: drug.blockchain?.contractAddress,
      isOnBlockchain: drug.blockchain?.isOnBlockchain,
      digitalSignature: drug.blockchain?.digitalSignature,
      dataHash: drug.blockchain?.dataHash,
      transactionHistory: drug.blockchain?.transactionHistory || []
    };

    // Kiểm tra tính hợp lệ của blockchain data
    const isValid = drug.blockchain?.isOnBlockchain && 
                   drug.blockchain?.blockchainId && 
                   drug.blockchain?.transactionHash;

    res.json({
      success: true,
      message: 'Xác minh thành công.',
      data: {
        drug: formatDrugResponse(drug),
        blockchain: blockchainData,
        verification: {
          isValid: isValid,
          verifiedAt: new Date().toISOString(),
          status: isValid ? 'verified' : 'unverified'
        }
      }
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác minh blockchain.',
      error: error.message
    });
  }
};

// @desc    Generate QR code cho drug nếu chưa có
// @route   POST /api/drugs/:id/generate-qr
// @access  Private (Admin, Manufacturer)
const generateQRCode = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    
    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lô thuốc.'
      });
    }

    // Populate manufacturer trước khi check
    await drug.populate('manufacturerId', 'fullName organizationInfo');

    // Nếu đã có QR code thì trả về luôn
    if (drug.qrCode?.imageUrl || drug.qrCode?.data) {
      let qrData = null;
      if (drug.qrCode?.data) {
        try {
          qrData = typeof drug.qrCode.data === 'string' 
            ? JSON.parse(drug.qrCode.data)
            : drug.qrCode.data;
        } catch (e) {
          // Nếu parse lỗi, tạo lại từ drug info
          qrData = drug.generateQRData();
          if (drug.blockchain?.blockchainId) {
            qrData.blockchainId = drug.blockchain.blockchainId;
            const serverUrl = getServerUrl();
            qrData.verificationUrl = `${serverUrl}/verify/${drug.blockchain.blockchainId || drug.drugId}`;
          }
        }
      } else {
        // Nếu không có data, tạo từ drug info
        qrData = drug.generateQRData();
        if (drug.blockchain?.blockchainId) {
          qrData.blockchainId = drug.blockchain.blockchainId;
          const serverUrl = getServerUrl();
          qrData.verificationUrl = `${serverUrl}/verify/${drug.blockchain.blockchainId || drug.drugId}`;
        }
      }
      
      return res.json({
        success: true,
        message: 'QR code đã tồn tại.',
        data: {
          qrCode: drug.qrCode?.imageUrl || null,
          qrData: qrData,
          drug: drug
        }
      });
    }

    // Tạo QR code
    const qrData = drug.generateQRData();
    // Thêm blockchain ID vào QR data nếu có
    if (drug.blockchain?.blockchainId) {
      qrData.blockchainId = drug.blockchain.blockchainId;
      const serverUrl = getServerUrl();
      qrData.verificationUrl = `${serverUrl}/verify/${drug.blockchain.blockchainId || drug.drugId}`;
    }
    
    // Tạo QR code với options để đảm bảo chất lượng tốt và dễ quét
    const qrCodeOptions = {
      errorCorrectionLevel: 'M', // Medium error correction - cân bằng giữa dung lượng và khả năng sửa lỗi
      type: 'image/png',
      quality: 0.92,
      margin: 1, // Margin nhỏ để QR code gọn hơn
      color: {
        dark: '#000000', // Màu đen cho phần tối
        light: '#FFFFFF' // Màu trắng cho phần sáng
      },
      width: 500 // Kích thước đủ lớn để dễ quét (tối thiểu 300px, khuyến nghị 500px)
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), qrCodeOptions);

    // Cập nhật QR code vào drug
    drug.qrCode.data = JSON.stringify(qrData);
    drug.qrCode.imageUrl = qrCodeDataURL;
    if (drug.blockchain?.blockchainId) {
      drug.qrCode.blockchainId = drug.blockchain.blockchainId;
      drug.qrCode.verificationUrl = qrData.verificationUrl;
    }
    drug.qrCode.generatedAt = new Date();
    await drug.save();

    // Populate thông tin manufacturer để trả về đầy đủ
    await drug.populate('manufacturerId', 'fullName organizationInfo');

    res.json({
      success: true,
      message: 'Tạo QR code thành công.',
      data: {
        qrCode: qrCodeDataURL,
        qrData: qrData, // Trả về cả QR data để frontend có thể generate trực tiếp
        drug: drug
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo QR code.',
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
  getServerUrl: getServerUrlController,
  recallDrug,
  getDrugStats,
  deleteDrug,
  verifyQRCode,
  verifyDrugByBlockchainId,
  generateQRCode
};
