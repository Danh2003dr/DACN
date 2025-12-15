const Bid = require('../models/Bid');
const Drug = require('../models/Drug');
const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// Debug logging helper
const debugLog = (data) => { try { fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug.log'), JSON.stringify(data) + '\n'); } catch(e) {} };

// Helper function để tìm drug an toàn (tránh CastError)
const findDrugSafely = async (drugId) => {
  console.log('🔥 findDrugSafely called with drugId:', drugId, 'Type:', typeof drugId);
  
  // Kiểm tra xem drugId có phải là ObjectId hợp lệ (24 hex characters)
  const isValidObjectId = mongoose.Types.ObjectId.isValid(drugId) && 
                          String(drugId).length === 24 && 
                          /^[0-9a-fA-F]{24}$/.test(String(drugId));
  
  console.log('🔥 isValidObjectId:', isValidObjectId);
  
  try {
    // Nếu KHÔNG phải ObjectId hợp lệ, dùng collection API ngay từ đầu
    if (!isValidObjectId) {
      console.log('🔥 Using collection API (not valid ObjectId)');
      const rawDrug = await Drug.collection.findOne({ drugId: String(drugId) });
      if (rawDrug) {
        console.log('🔥 Found raw drug, converting to mongoose document');
        const drug = await Drug.findById(rawDrug._id).populate('manufacturerId', 'fullName organizationInfo');
        return drug;
      }
      return null;
    }
    
    // Nếu là ObjectId hợp lệ, thử findById
    console.log('🔥 Using findById (valid ObjectId)');
    let drug = await Drug.findById(drugId).populate('manufacturerId', 'fullName organizationInfo');
    if (drug) {
      return drug;
    }
    
    // Nếu không tìm thấy, có thể drugId là field value, thử collection API
    console.log('🔥 Not found by _id, trying collection API');
    const rawDrug = await Drug.collection.findOne({ drugId: String(drugId) });
    if (rawDrug) {
      drug = await Drug.findById(rawDrug._id).populate('manufacturerId', 'fullName organizationInfo');
      return drug;
    }
    
    return null;
  } catch (error) {
    console.error('🔥 Error in findDrugSafely:', error.message, error.name);
    throw error;
  }
};

// @desc    Tạo bid mới
// @route   POST /api/bids
// @access  Private
const createBid = async (req, res) => {
  // UNIQUE MARKER - Nếu không thấy log này, server đang chạy code cũ
  console.log('🔥🔥🔥🔥🔥 CREATEBID FUNCTION VERSION 2.0 - NEW CODE LOADED 🔥🔥🔥🔥🔥');
  
  // Wrap toàn bộ function trong try-catch để bắt mọi lỗi
  try {
    // #region agent log
    console.log('🔥 createBid called', { drugId: req.body?.drugId, bidPrice: req.body?.bidPrice, quantity: req.body?.quantity, userId: req.user?._id?.toString() });
    debugLog({location:'controllers/bidController.js:13',message:'createBid entry - VERSION 2.0',data:{drugId:req.body?.drugId,bidPrice:req.body?.bidPrice,quantity:req.body?.quantity,userId:req.user?._id?.toString(),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'});
    // #endregion
  } catch (logError) {
    console.error('🔥 Error in createBid logging:', logError);
  }
  
  try {
    const { drugId, bidPrice, quantity, notes, expiryDate } = req.body;
    
    // Validation
    if (!drugId || !bidPrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin: drugId, bidPrice, quantity'
      });
    }
    
    if (parseFloat(bidPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá đấu thầu phải lớn hơn 0'
      });
    }
    
    if (parseInt(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0'
      });
    }
    
    // Kiểm tra drug có tồn tại không
    // Hỗ trợ cả ObjectId và drugId string (ví dụ: "DRUG_xxx")
    console.log('🔥 About to find drug with drugId:', drugId);
    const drug = await findDrugSafely(drugId);
    console.log('🔥 Drug found:', !!drug);
    
    // #region agent log
    debugLog({location:'controllers/bidController.js:100',message:'After finding drug',data:{drugFound:!!drug,drugId:drug?._id?.toString(),drugDrugId:drug?.drugId,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'});
    // #endregion
    
    // #region agent log
    debugLog({location:'controllers/bidController.js:62',message:'After finding drug',data:{drugFound:!!drug,drugId:drug?._id?.toString(),drugDrugId:drug?.drugId,manufacturerId:drug?.manufacturerId?._id?.toString(),manufacturerIdNull:!drug?.manufacturerId,manufacturerIdType:typeof drug?.manufacturerId,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'});
    // #endregion
    
    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Không cho phép nhà sản xuất đấu thầu sản phẩm của chính mình
    // #region agent log
    debugLog({location:'controllers/bidController.js:44',message:'Before manufacturerId check',data:{manufacturerIdExists:!!drug?.manufacturerId,manufacturerId_id:drug?.manufacturerId?._id?.toString(),userId:req.user?._id?.toString(),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'});
    // #endregion
    if (drug.manufacturerId && drug.manufacturerId._id && drug.manufacturerId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thể đấu thầu sản phẩm của chính mình'
      });
    }
    
    // Kiểm tra số lượng tối thiểu (MOQ)
    const minOrderQuantity = drug.minOrderQuantity || drug.moq || 1;
    if (parseInt(quantity) < minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Số lượng tối thiểu là ${minOrderQuantity}`
      });
    }
    
    // Lấy thông tin người đấu thầu
    // #region agent log
    debugLog({location:'controllers/bidController.js:61',message:'Before User.findById',data:{userId:req.user?._id?.toString(),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'});
    // #endregion
    const bidder = await User.findById(req.user._id);
    // #region agent log
    debugLog({location:'controllers/bidController.js:61',message:'After User.findById',data:{bidderFound:!!bidder,bidderFullName:bidder?.fullName,bidderOrgInfo:!!bidder?.organizationInfo,bidderOrgName:bidder?.organizationInfo?.name,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'});
    // #endregion
    
    // Tạo bid
    // #region agent log - UNIQUE MARKER TO CONFIRM NEW CODE
    console.log('🔥🔥🔥 NEW CODE VERSION - Starting bidNumber and totalAmount calculation');
    debugLog({location:'controllers/bidController.js:146',message:'NEW CODE VERSION - Before calculating bidNumber and totalAmount',data:{bidPrice,quantity,parsedBidPrice:parseFloat(bidPrice),parsedQuantity:parseInt(quantity),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'});
    // #endregion
    
    // Tính toán totalAmount - ĐẢM BẢO LUÔN CÓ GIÁ TRỊ
    const parsedBidPrice = parseFloat(bidPrice) || 0;
    const parsedQuantity = parseInt(quantity) || 0;
    const totalAmount = (parsedBidPrice * parsedQuantity) || 0;
    
    // Tạo bidNumber - ĐẢM BẢO LUÔN CÓ GIÁ TRỊ
    let bidNumber;
    try {
      const bidCount = await Bid.countDocuments();
      bidNumber = `BID${String(bidCount + 1).padStart(8, '0')}`;
      // Kiểm tra xem bidNumber đã tồn tại chưa (tránh race condition)
      const existingBid = await Bid.findOne({ bidNumber });
      if (existingBid) {
        // Nếu duplicate, thử với timestamp
        bidNumber = `BID${Date.now().toString().slice(-8)}`;
      }
    } catch (countError) {
      // Fallback nếu countDocuments fail
      console.error('🔥 Error counting bids:', countError);
      bidNumber = `BID${Date.now().toString().slice(-8)}`;
    }
    
    // Đảm bảo bidNumber và totalAmount có giá trị
    if (!bidNumber || typeof bidNumber !== 'string') {
      bidNumber = `BID${Date.now().toString().slice(-8)}`;
    }
    if (totalAmount === undefined || totalAmount === null || isNaN(totalAmount)) {
      console.error('🔥 ERROR: totalAmount is invalid!', { parsedBidPrice, parsedQuantity, totalAmount });
    }
    
    console.log('🔥 Calculated bidNumber:', bidNumber, 'totalAmount:', totalAmount, 'type:', typeof totalAmount);
    
    // #region agent log
    debugLog({location:'controllers/bidController.js:176',message:'After calculating bidNumber and totalAmount',data:{bidNumber,bidNumberType:typeof bidNumber,hasBidNumber:!!bidNumber,totalAmount,totalAmountType:typeof totalAmount,hasTotalAmount:totalAmount!==undefined&&totalAmount!==null&&!isNaN(totalAmount),parsedBidPrice,parsedQuantity,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'});
    // #endregion
    
    // #region agent log
    debugLog({location:'controllers/bidController.js:179',message:'Before creating bidData',data:{drugManufacturerId:drug?.manufacturerId?._id?.toString(),drugManufacturerName:drug?.manufacturerId?.organizationInfo?.name || drug?.manufacturerId?.fullName,bidderFullName:bidder?.fullName,bidderOrgName:bidder?.organizationInfo?.name || '',bidNumber,bidNumberType:typeof bidNumber,hasBidNumber:!!bidNumber,totalAmount,totalAmountType:typeof totalAmount,hasTotalAmount:totalAmount!==undefined&&totalAmount!==null&&!isNaN(totalAmount),parsedBidPrice,parsedQuantity,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'});
    // #endregion
    
    const bidData = {
      bidNumber: String(bidNumber), // Đảm bảo là string
      drugId: drug._id,
      drugName: drug.name,
      drugBatchNumber: drug.batchNumber,
      manufacturerId: drug.manufacturerId?._id || drug.manufacturerId,
      manufacturerName: drug.manufacturerId?.organizationInfo?.name || drug.manufacturerId?.fullName || 'Chưa có thông tin',
      bidderId: req.user._id,
      bidderName: bidder?.fullName || 'Chưa có tên',
      bidderOrganization: bidder?.organizationInfo?.name || '',
      bidPrice: Number(parsedBidPrice), // Đảm bảo là number
      quantity: Number(parsedQuantity), // Đảm bảo là number
      totalAmount: Number(totalAmount), // Đảm bảo là number và có giá trị
      notes: notes || '',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdBy: req.user._id
    };
    
    // #region agent log
    debugLog({location:'controllers/bidController.js:198',message:'After creating bidData object',data:{bidDataBidNumber:bidData.bidNumber,bidDataTotalAmount:bidData.totalAmount,bidNumberType:typeof bidData.bidNumber,totalAmountType:typeof bidData.totalAmount,hasBidNumber:!!bidData.bidNumber,hasTotalAmount:bidData.totalAmount!==undefined&&bidData.totalAmount!==null&&!isNaN(bidData.totalAmount),bidDataKeys:Object.keys(bidData),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'});
    // #endregion
    
    // Log chi tiết bidData để debug
    console.log('🔥 bidData before create:', JSON.stringify({ 
      bidNumber: bidData.bidNumber, 
      totalAmount: bidData.totalAmount, 
      bidPrice: bidData.bidPrice, 
      quantity: bidData.quantity,
      hasBidNumber: !!bidData.bidNumber,
      hasTotalAmount: bidData.totalAmount !== undefined && bidData.totalAmount !== null,
      totalAmountType: typeof bidData.totalAmount,
      bidNumberType: typeof bidData.bidNumber,
      bidDataKeys: Object.keys(bidData)
    }));
    
    // VALIDATION: Đảm bảo bidNumber và totalAmount tồn tại
    if (!bidData.bidNumber || typeof bidData.bidNumber !== 'string') {
      throw new Error(`bidNumber is missing or invalid: ${bidData.bidNumber}`);
    }
    if (bidData.totalAmount === undefined || bidData.totalAmount === null || isNaN(bidData.totalAmount)) {
      throw new Error(`totalAmount is missing or invalid: ${bidData.totalAmount}`);
    }
    
    // #region agent log
    debugLog({location:'controllers/bidController.js:211',message:'Before Bid.create',data:{bidDataManufacturerId:bidData.manufacturerId?.toString(),bidDataManufacturerName:bidData.manufacturerName,bidDataBidderName:bidData.bidderName,bidDataBidPrice:bidData.bidPrice,bidDataQuantity:bidData.quantity,bidDataBidNumber:bidData.bidNumber,bidDataTotalAmount:bidData.totalAmount,bidNumberType:typeof bidData.bidNumber,totalAmountType:typeof bidData.totalAmount,hasBidNumber:!!bidData.bidNumber,hasTotalAmount:bidData.totalAmount!==undefined&&bidData.totalAmount!==null,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'});
    // #endregion
    
    const bid = await Bid.create(bidData);
    // #region agent log
    debugLog({location:'controllers/bidController.js:80',message:'After Bid.create',data:{bidId:bid?._id?.toString(),bidNumber:bid?.bidNumber,status:bid?.status,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'});
    // #endregion
    
    // Populate để trả về đầy đủ thông tin
    // #region agent log
    debugLog({location:'controllers/bidController.js:83',message:'Before populate',data:{bidId:bid?._id?.toString(),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'});
    // #endregion
    await bid.populate([
      { path: 'drugId', select: 'name batchNumber imageUrl' },
      { path: 'bidderId', select: 'fullName email organizationInfo' },
      { path: 'manufacturerId', select: 'fullName email organizationInfo' }
    ]);
    // #region agent log
    debugLog({location:'controllers/bidController.js:87',message:'After populate, before response',data:{bidId:bid?._id?.toString(),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'});
    // #endregion
    
    res.status(201).json({
      success: true,
      message: 'Đã gửi đấu thầu thành công',
      data: { bid }
    });
    // #region agent log
    debugLog({location:'controllers/bidController.js:94',message:'createBid success exit',data:{bidId:bid?._id?.toString(),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'});
    // #endregion
  } catch (error) {
    // #region agent log
    console.error('🔥 createBid ERROR:', error.message, error.stack);
    debugLog({location:'controllers/bidController.js:95',message:'createBid error catch',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,500),errorName:error?.name,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'});
    // #endregion
    console.error('Create bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy danh sách bids
// @route   GET /api/bids
// @access  Private
const getBids = async (req, res) => {
  try {
    const { status, drugId, bidderId, manufacturerId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter theo status
    if (status) {
      query.status = status;
    }
    
    // Filter theo drugId - cần tìm drug trước nếu drugId là string (như "DRUG_xxx")
    if (drugId) {
      try {
        // Sử dụng findDrugSafely để hỗ trợ cả ObjectId và drugId string
        const drug = await findDrugSafely(drugId);
        if (drug) {
          query.drugId = drug._id; // Sử dụng _id của drug để query
        } else {
          // Nếu không tìm thấy drug, trả về empty array
          return res.status(200).json({
            success: true,
            data: {
              bids: [],
              pagination: {
                current: parseInt(page),
                pages: 0,
                total: 0
              }
            }
          });
        }
      } catch (drugError) {
        console.error('Error finding drug for bid filter:', drugError);
        // Nếu có lỗi khi tìm drug, trả về empty array thay vì lỗi 500
        return res.status(200).json({
          success: true,
          data: {
            bids: [],
            pagination: {
              current: parseInt(page),
              pages: 0,
              total: 0
            }
          }
        });
      }
    }
    
    // Filter theo bidderId
    if (bidderId) {
      query.bidderId = bidderId;
    }
    
    // Filter theo manufacturerId
    if (manufacturerId) {
      query.manufacturerId = manufacturerId;
    }
    
    // Nếu không phải admin, chỉ cho xem bids liên quan đến mình
    if (req.user.role !== 'admin') {
      // Manufacturer chỉ xem bids của sản phẩm mình
      if (req.user.role === 'manufacturer') {
        query.manufacturerId = req.user._id;
      } else {
        // Người khác chỉ xem bids của mình
        query.bidderId = req.user._id;
      }
    }
    
    const bids = await Bid.find(query)
      .populate('drugId', 'name batchNumber imageUrl')
      .populate('bidderId', 'fullName email organizationInfo')
      .populate('manufacturerId', 'fullName email organizationInfo')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Bid.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        bids,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get bids error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy bid theo ID
// @route   GET /api/bids/:id
// @access  Private
const getBidById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bid = await Bid.findById(id)
      .populate('drugId', 'name batchNumber imageUrl')
      .populate('bidderId', 'fullName email organizationInfo')
      .populate('manufacturerId', 'fullName email organizationInfo');
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đấu thầu'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && 
        bid.bidderId._id.toString() !== req.user._id.toString() &&
        bid.manufacturerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đấu thầu này'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { bid }
    });
  } catch (error) {
    console.error('Get bid by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy bids của user hiện tại
// @route   GET /api/bids/my-bids
// @access  Private
const getMyBids = async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:222',message:'getMyBids controller called',data:{path:req.path,originalUrl:req.originalUrl,userId:req.user?._id,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
  // #endregion
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { bidderId: req.user._id };
    if (status) {
      query.status = status;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:230',message:'Before Bid.find query',data:{query,skip:parseInt(skip),limit:parseInt(limit),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
    
    const bids = await Bid.find(query)
      .populate('drugId', 'name batchNumber imageUrl')
      .populate('manufacturerId', 'fullName email organizationInfo')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:238',message:'After Bid.find query',data:{bidsCount:bids.length,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
    
    const total = await Bid.countDocuments(query);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:243',message:'After countDocuments',data:{total,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:242',message:'Before sending response in getMyBids',data:{bidsCount:bids.length,total,page:parseInt(page),limit:parseInt(limit),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
    
    res.status(200).json({
      success: true,
      data: {
        bids,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:255',message:'After sending response in getMyBids',data:{statusCode:200,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controllers/bidController.js:260',message:'Error in getMyBids catch block',data:{errorMessage:error.message,errorStack:error.stack,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
    console.error('Get my bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đấu thầu của bạn',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy bids cho manufacturer (bids nhận được cho sản phẩm của họ)
// @route   GET /api/bids/manufacturer-bids
// @access  Private (Manufacturer)
const getManufacturerBids = async (req, res) => {
  try {
    // Chỉ manufacturer hoặc admin mới có thể xem
    if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ nhà sản xuất hoặc admin mới có thể xem bids này'
      });
    }
    
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Query logic:
    // - Nếu là admin: xem tất cả bids (manufacturerId có thể là bất kỳ ai)
    // - Nếu là manufacturer: chỉ xem bids của sản phẩm mình (manufacturerId = user._id)
    const query = {};
    if (req.user.role === 'manufacturer') {
      query.manufacturerId = req.user._id;
    }
    // Nếu là admin, không filter theo manufacturerId (xem tất cả)
    
    if (status) {
      query.status = status;
    }
    
    console.log('🔍 getManufacturerBids query:', JSON.stringify(query));
    console.log('🔍 User role:', req.user.role);
    console.log('🔍 User ID:', req.user._id);
    
    const bids = await Bid.find(query)
      .populate('drugId', 'name batchNumber imageUrl')
      .populate('bidderId', 'fullName email organizationInfo')
      .populate('manufacturerId', 'fullName email organizationInfo')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    console.log('🔍 Found bids count:', bids.length);
    
    const total = await Bid.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        bids,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get manufacturer bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Gửi counter offer
// @route   PUT /api/bids/:id/counter-offer
// @access  Private (Manufacturer)
const counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { counterPrice, counterNotes } = req.body;
    
    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá counter offer phải lớn hơn 0'
      });
    }
    
    const bid = await Bid.findById(id).populate('manufacturerId');
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đấu thầu'
      });
    }
    
    // Kiểm tra quyền - chỉ manufacturer sở hữu sản phẩm mới có thể gửi counter offer
    if (req.user.role !== 'admin' && bid.manufacturerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền gửi counter offer cho đấu thầu này'
      });
    }
    
    await bid.counterOffer(req.user._id, parseFloat(counterPrice), counterNotes);
    
    // Populate lại để trả về đầy đủ thông tin
    await bid.populate([
      { path: 'drugId', select: 'name batchNumber imageUrl' },
      { path: 'bidderId', select: 'fullName email organizationInfo' },
      { path: 'manufacturerId', select: 'fullName email organizationInfo' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Đã gửi counter offer thành công',
      data: { bid }
    });
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi counter offer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Chấp nhận bid (từ pending - manufacturer accept, hoặc từ countered - bidder accept counter offer)
// @route   PUT /api/bids/:id/accept
// @access  Private
const acceptBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Log để debug
    console.log('🔍 acceptBid - Received id:', id);
    console.log('🔍 acceptBid - id type:', typeof id);
    console.log('🔍 acceptBid - id value:', JSON.stringify(id));
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null' || id === '[object Object]' || id.includes('[object')) {
      console.error('❌ Invalid bid ID received:', id);
      return res.status(400).json({
        success: false,
        message: 'ID đấu thầu không hợp lệ'
      });
    }
    
    const bid = await Bid.findById(id)
      .populate('manufacturerId')
      .populate('bidderId')
      .populate('drugId');
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đấu thầu'
      });
    }
    
    // Kiểm tra quyền và trạng thái
    if (bid.status === 'pending') {
      // Nếu là pending, chỉ manufacturer mới có thể accept
      if (req.user.role !== 'admin' && bid.manufacturerId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chấp nhận đấu thầu này'
        });
      }
    } else if (bid.status === 'countered') {
      // Nếu là countered, chỉ bidder mới có thể accept counter offer
      if (req.user.role !== 'admin' && bid.bidderId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chấp nhận counter offer này'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể chấp nhận bid ở trạng thái pending hoặc countered'
      });
    }
    
    await bid.accept(req.user._id, notes);
    
    // TỰ ĐỘNG TẠO ORDER khi bid được accept (từ cả hai phía)
    try {
      const orderService = require('../services/orderService');
      const Drug = require('../models/Drug');
      
      // Lấy thông tin drug đầy đủ
      const drugIdObj = bid.drugId._id || bid.drugId;
      const drug = await Drug.findById(drugIdObj);
      
      if (!drug) {
        throw new Error('Không tìm thấy sản phẩm');
      }
      
      // Sử dụng giá cuối cùng: counterPrice nếu có, nếu không thì bidPrice
      const finalPrice = bid.counterPrice || bid.bidPrice;
      
      // Lấy thông tin buyer và seller
      const buyerId = bid.bidderId._id || bid.bidderId;
      const sellerId = bid.manufacturerId._id || bid.manufacturerId;
      
      // Tạo order data - orderService sẽ tìm drug bằng drugId string, nên cần dùng drug.drugId
      const orderData = {
        orderType: 'purchase',
        buyerId: buyerId,
        buyerName: bid.bidderName || (bid.bidderId.fullName ? bid.bidderId.fullName : ''),
        buyerOrganization: bid.bidderOrganization || (bid.bidderId.organizationInfo?.name || ''),
        sellerId: sellerId,
        sellerName: bid.manufacturerName || (bid.manufacturerId.organizationInfo?.name || bid.manufacturerId.fullName || ''),
        sellerOrganization: bid.manufacturerName || (bid.manufacturerId.organizationInfo?.name || ''),
        items: [{
          drugId: drug.drugId, // orderService tìm drug bằng drugId string
          quantity: bid.quantity,
          unitPrice: finalPrice,
          batchNumber: drug.batchNumber,
          unit: drug.packaging?.unit || 'unit'
        }],
        paymentMethod: 'bank_transfer', // Default payment method for bid orders
        notes: `Đơn hàng tự động tạo từ đấu thầu ${bid.bidNumber}. ${notes || ''}`.trim(),
        // Shipping và billing address sẽ được lấy từ user profile hoặc để trống (có thể cập nhật sau)
        shippingAddress: {},
        billingAddress: {}
      };
      
      // Tạo order thông qua service (sẽ set status = 'draft', sau đó có thể change status to 'processing')
      const orderResult = await orderService.createOrder(orderData, req.user, req);
      
      // Chuyển order sang trạng thái 'processing' ngay sau khi tạo từ bid
      if (orderResult.order) {
        await orderResult.order.changeStatus('processing', req.user._id, req.user.fullName || req.user.username, 'Đơn hàng tự động tạo từ đấu thầu đã được chấp nhận');
      }
      
      // Populate lại để trả về đầy đủ thông tin
      await bid.populate([
        { path: 'drugId', select: 'name batchNumber imageUrl' },
        { path: 'bidderId', select: 'fullName email organizationInfo' },
        { path: 'manufacturerId', select: 'fullName email organizationInfo' }
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Đã chấp nhận đấu thầu và tạo đơn hàng tự động',
        data: { 
          bid,
          order: orderResult.order
        }
      });
    } catch (orderError) {
      console.error('Error creating order from bid:', orderError);
      // Nếu tạo order thất bại, vẫn trả về bid đã accept nhưng có warning
      await bid.populate([
        { path: 'drugId', select: 'name batchNumber imageUrl' },
        { path: 'bidderId', select: 'fullName email organizationInfo' },
        { path: 'manufacturerId', select: 'fullName email organizationInfo' }
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Đã chấp nhận đấu thầu nhưng tạo đơn hàng thất bại. Vui lòng tạo đơn hàng thủ công.',
        warning: orderError.message,
        data: { bid }
      });
    }
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi chấp nhận đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Từ chối bid
// @route   PUT /api/bids/:id/reject
// @access  Private (Manufacturer)
const rejectBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const bid = await Bid.findById(id).populate('manufacturerId');
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đấu thầu'
      });
    }
    
    // Kiểm tra quyền - chỉ manufacturer sở hữu sản phẩm mới có thể từ chối
    if (req.user.role !== 'admin' && bid.manufacturerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền từ chối đấu thầu này'
      });
    }
    
    await bid.reject(req.user._id, notes);
    
    // Populate lại để trả về đầy đủ thông tin
    await bid.populate([
      { path: 'drugId', select: 'name batchNumber imageUrl' },
      { path: 'bidderId', select: 'fullName email organizationInfo' },
      { path: 'manufacturerId', select: 'fullName email organizationInfo' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Đã từ chối đấu thầu',
      data: { bid }
    });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi từ chối đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Hủy bid (chỉ người đấu thầu)
// @route   PUT /api/bids/:id/cancel
// @access  Private
const cancelBid = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bid = await Bid.findById(id);
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đấu thầu'
      });
    }
    
    await bid.cancel(req.user._id);
    
    // Populate lại để trả về đầy đủ thông tin
    await bid.populate([
      { path: 'drugId', select: 'name batchNumber imageUrl' },
      { path: 'bidderId', select: 'fullName email organizationInfo' },
      { path: 'manufacturerId', select: 'fullName email organizationInfo' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Đã hủy đấu thầu',
      data: { bid }
    });
  } catch (error) {
    console.error('Cancel bid error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi hủy đấu thầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createBid,
  getBids,
  getBidById,
  getMyBids,
  getManufacturerBids,
  counterOffer,
  acceptBid,
  rejectBid,
  cancelBid
};

