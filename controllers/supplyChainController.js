const EventEmitter = require('events');
const SupplyChain = require('../models/SupplyChain');
const Drug = require('../models/Drug');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const geocodeService = require('../services/geocodeService');
const getServerUrl = require('../utils/getServerUrl');
const mongoose = require('mongoose');

const supplyChainEvents = new EventEmitter();
const emitSupplyChainEvent = (type, payload) => {
  supplyChainEvents.emit('update', {
    type,
    timestamp: new Date(),
    payload
  });
};

const hasValidCoordinates = (coords) => {
  if (!coords || !Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  if (lng === null || lat === null || lng === undefined || lat === undefined) return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  return true;
};

// Chuẩn hoá location để tránh lưu `coordinates: []` (làm map/geocode bị kẹt)
const sanitizeLocation = (loc) => {
  if (!loc) return null;
  let out = loc;
  if (typeof out === 'string') {
    out = { address: out };
  } else if (out.toObject && typeof out.toObject === 'function') {
    out = out.toObject();
  }

  const address = typeof out.address === 'string' ? out.address.trim() : null;
  const coords = out.coordinates;

  const sanitized = {
    ...out,
    address: address || null
  };

  if (hasValidCoordinates(coords)) {
    sanitized.coordinates = coords;
  } else {
    // Xoá các trường hợp: [], [x], [x,y,z], [null,null], ...
    delete sanitized.coordinates;
  }

  // Đồng bộ type GeoJSON
  sanitized.type = 'Point';

  return sanitized;
};

// @desc    Tạo hành trình chuỗi cung ứng mới
// @route   POST /api/supply-chain
// @access  Private (Manufacturer, Admin)
const createSupplyChain = async (req, res) => {
  try {
    let { drugId, drugBatchNumber, metadata, participants = [] } = req.body;
    
    // Sanitize input
    drugId = sanitizeInput(drugId);
    drugBatchNumber = sanitizeInput(drugBatchNumber);
    metadata = sanitizeInput(metadata);
    participants = Array.isArray(participants) ? participants.map(p => sanitizeInput(p)) : [];
    
    // Kiểm tra quyền (chỉ manufacturer và admin)
    if (!['admin', 'manufacturer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền tạo hành trình chuỗi cung ứng'
      });
    }
    
    // Validate input
    if (!drugId || !drugBatchNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: drugId và drugBatchNumber'
      });
    }
    
    // Validate drugBatchNumber length để tránh DoS
    if (drugBatchNumber.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Số lô thuốc quá dài (tối đa 100 ký tự)'
      });
    }
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(drugId)) {
      return res.status(400).json({
        success: false,
        message: 'ID thuốc không hợp lệ'
      });
    }
    
    // Kiểm tra thuốc tồn tại
    const drug = await Drug.findById(drugId);
    if (!drug) {
      return res.status(404).json({
        success: false,
        message: 'Thuốc không tồn tại'
      });
    }
    
    // Kiểm tra hành trình đã tồn tại chưa
    const existingSupplyChain = await SupplyChain.findOne({
      drugId,
      drugBatchNumber
    });
    
    if (existingSupplyChain) {
      return res.status(400).json({
        success: false,
        message: 'Hành trình cho lô thuốc này đã tồn tại'
      });
    }
    
    // Tạo hành trình mới
    // Sử dụng blockchainId từ drug nếu có, nếu không thì dùng batchNumber cho verification
    const verificationId = drug.blockchain?.blockchainId || drug.drugId || drugBatchNumber;
    const serverUrl = getServerUrl();
    
    const actorProfiles = [];
    
    for (const participant of participants) {
      const profile = await buildActorProfile(participant);
      if (profile) {
        actorProfiles.push(profile);
      }
    }
    
    const creatorProfile = await buildActorProfile({ actorId: req.user._id, role: req.user.role });
    if (creatorProfile && !actorProfiles.some(ap => ap.actorId.toString() === creatorProfile.actorId.toString())) {
      actorProfiles.push(creatorProfile);
    }
    
    const supplyChain = new SupplyChain({
      drugId,
      drugBatchNumber,
      qrCode: {
        code: `${drugBatchNumber}-${Date.now()}`,
        blockchainId: drug.blockchain?.blockchainId || `SC-${drugBatchNumber}-${Date.now()}`,
        verificationUrl: `${serverUrl}/verify/${verificationId}`
      },
      actors: actorProfiles,
      createdBy: req.user._id,
      steps: []
    });
    
    // Chuẩn hoá + geocode vị trí khởi tạo (nếu có address nhưng thiếu coordinates hợp lệ)
    let initialLocation = sanitizeLocation(req.user.location || null);
    if (initialLocation?.address && !hasValidCoordinates(initialLocation.coordinates)) {
      console.log(`📍 Geocoding initial location: "${initialLocation.address}"`);
      const coordinates = await geocodeService.geocodeToCoordinates(initialLocation.address);
      if (coordinates && coordinates.length === 2) {
        initialLocation = { ...initialLocation, coordinates, type: 'Point' };
      }
    }

    // Thêm bước đầu tiên (sản xuất)
    const initialStep = {
      stepType: 'production',
      actorId: req.user._id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'created',
      timestamp: new Date(),
      location: initialLocation,
      metadata: {
        ...metadata,
        batchNumber: drugBatchNumber,
        quantity: metadata?.quantity || 1,
        unit: metadata?.unit || 'unit'
      },
      verificationMethod: 'auto'
    };
    
    supplyChain.steps.push(initialStep);
    supplyChain.currentLocation = {
      actorId: req.user._id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      address: initialLocation?.address || req.user.location?.address,
      coordinates: hasValidCoordinates(initialLocation?.coordinates) ? initialLocation.coordinates : undefined,
      lastUpdated: new Date()
    };
    
    await supplyChain.save();
    
    // Ghi lên blockchain với retry mechanism
    try {
      const blockchainResult = await recordToBlockchainWithRetry({
        supplyChainId: supplyChain._id,
        drugBatchNumber,
        step: initialStep,
        actor: req.user,
        operation: 'create'
      });
      
      if (blockchainResult) {
        supplyChain.blockchain = {
          contractAddress: blockchainResult.contractAddress,
          blockchainId: blockchainResult.blockchainId,
          isOnBlockchain: true,
          lastBlockchainUpdate: new Date()
        };
        
        initialStep.blockchain = {
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed,
          timestamp: new Date()
        };
        
        await supplyChain.save();
      }
    } catch (blockchainError) {
      console.error('Blockchain error (final):', blockchainError);
      // Vẫn lưu vào database dù blockchain lỗi, nhưng đánh dấu chưa sync
      supplyChain.blockchain = {
        ...supplyChain.blockchain,
        isOnBlockchain: false,
        syncError: blockchainError.message || 'Blockchain sync failed'
      };
      await supplyChain.save();
    }
    
    emitSupplyChainEvent('supplyChain:created', {
      supplyChainId: supplyChain._id,
      status: supplyChain.status,
      currentLocation: supplyChain.currentLocation,
      drugBatchNumber,
      actors: supplyChain.actors
    });
    
    // Gửi thông báo cho các actors liên quan
    try {
      await sendSupplyChainNotifications(supplyChain, 'created', req.user);
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError);
    }
    
    // Populate before sending response
    const populatedSupplyChain = await SupplyChain.findById(supplyChain._id)
      .populate({
        path: 'drugId',
        select: 'name genericName manufacturer dosageForm activeIngredient',
        options: { lean: false }
      })
      .populate({
        path: 'createdBy',
        select: 'fullName role',
        options: { lean: false }
      })
      .populate({
        path: 'steps.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      });
    
    res.status(201).json({
      success: true,
      message: 'Tạo hành trình chuỗi cung ứng thành công',
      data: {
        supplyChain: populatedSupplyChain
      }
    });
    
  } catch (error) {
    console.error('Create supply chain error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo hành trình chuỗi cung ứng'
    });
  }
};

// @desc    Thêm bước mới vào hành trình
// @route   POST /api/supply-chain/:id/steps
// @access  Private
const addSupplyChainStep = async (req, res) => {
  try {
    const { id } = req.params;
    let { action, location, conditions, metadata, qualityChecks, handover } = req.body;
    
    // Sanitize input
    action = sanitizeInput(action);
    location = sanitizeInput(location);
    conditions = sanitizeInput(conditions);
    metadata = sanitizeInput(metadata);
    qualityChecks = sanitizeInput(qualityChecks);
    handover = sanitizeInput(handover);
    
    // Validate input
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Hành động là bắt buộc'
      });
    }
    
    // Validate action enum
    const validActions = ['created', 'shipped', 'received', 'stored', 'dispensed', 'recalled', 'quality_check', 'handover', 'reported', 'consumed'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Hành động không hợp lệ. Các hành động hợp lệ: ${validActions.join(', ')}`
      });
    }
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID hành trình không hợp lệ'
      });
    }
    
    const supplyChain = await SupplyChain.findById(id);
    if (!supplyChain) {
      return res.status(404).json({
        success: false,
        message: 'Hành trình không tồn tại'
      });
    }
    
    // Kiểm tra quyền thêm bước
    const canAddStep = checkStepPermission(req.user.role, action);
    if (!canAddStep) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện hành động này'
      });
    }
    
    // Validate sequence của steps - đảm bảo logic nghiệp vụ
    const sequenceError = validateStepSequence(supplyChain, action, req.user.role);
    if (sequenceError) {
      return res.status(400).json({
        success: false,
        message: sequenceError
      });
    }
    
    if (!supplyChain.actors) {
      supplyChain.actors = [];
    }
    
    if (!supplyChain.actors.some(actor => actor.actorId?.toString() === req.user._id.toString())) {
      const profile = await buildActorProfile({ actorId: req.user._id, role: req.user.role });
      if (profile) {
        supplyChain.actors.push(profile);
      }
    }
    
    // Geocode địa chỉ nếu có address nhưng chưa có coordinates
    let processedLocation = sanitizeLocation(location || req.user.location || null);
    
    // NOTE: tránh case coordinates = [] làm điều kiện "!processedLocation.coordinates" sai
    if (processedLocation && processedLocation.address && !hasValidCoordinates(processedLocation.coordinates)) {
      console.log(`📍 Geocoding address: "${processedLocation.address}"`);
      const coordinates = await geocodeService.geocodeToCoordinates(processedLocation.address);
      
      if (coordinates && coordinates.length === 2) {
        processedLocation = {
          ...processedLocation,
          coordinates: coordinates,
          type: 'Point' // MongoDB GeoJSON type
        };
        console.log(`✅ Geocoded to coordinates: [${coordinates[1]}, ${coordinates[0]}]`); // Log lat, lng để dễ đọc
      } else {
        console.warn(`⚠️ Không thể geocode địa chỉ: "${processedLocation.address}"`);
      }
    }
    
    // Tạo bước mới
    const newStep = {
      stepType: getStepType(req.user.role),
      actorId: req.user._id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action,
      timestamp: new Date(),
      location: processedLocation,
      conditions: conditions || null,
      metadata: metadata || {},
      verificationMethod: 'manual'
    };
    
    if (handover) {
      // Validate handover token nếu có
      if (handover.token) {
        const token = sanitizeInput(handover.token);
        // Token phải là string hợp lệ, không rỗng
        if (!token || token.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Token bàn giao không hợp lệ'
          });
        }
        
        // Kiểm tra token có tồn tại trong handoverLogs không (nếu là xác nhận)
        if (handover.isConfirmation) {
          const existingHandover = supplyChain.handoverLogs?.find(
            log => log.token === token && !log.confirmedAt
          );
          if (!existingHandover) {
            return res.status(400).json({
              success: false,
              message: 'Token bàn giao không tồn tại hoặc đã được xác nhận'
            });
          }
        }
      }
      
      // Validate toRole
      const validRoles = ['manufacturer', 'distributor', 'dealer', 'pharmacy', 'hospital', 'patient', 'admin'];
      if (handover.toRole && !validRoles.includes(handover.toRole)) {
        return res.status(400).json({
          success: false,
          message: `Vai trò người nhận không hợp lệ. Các vai trò hợp lệ: ${validRoles.join(', ')}`
        });
      }
      
      newStep.handover = {
        fromRole: handover.fromRole || req.user.role,
        toRole: handover.toRole,
        token: handover.token ? sanitizeInput(handover.token) : null,
        confirmedBy: req.user._id
      };
      
      supplyChain.handoverLogs = supplyChain.handoverLogs || [];
      supplyChain.handoverLogs.push({
        fromRole: newStep.handover.fromRole,
        toRole: newStep.handover.toRole,
        fromActor: req.user._id,
        toActor: handover.toActorId || null,
        token: newStep.handover.token,
        confirmedAt: handover.confirmedAt || (handover.isConfirmation ? new Date() : null),
        createdAt: new Date()
      });
    }
    
    supplyChain.steps.push(newStep);
    
    // Cập nhật currentLocation với coordinates đã geocode (nếu có)
    const finalCoordinates =
      hasValidCoordinates(processedLocation?.coordinates)
        ? processedLocation.coordinates
        : (hasValidCoordinates(req.user.location?.coordinates) ? req.user.location.coordinates : undefined);
    supplyChain.currentLocation = {
      actorId: req.user._id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      address: processedLocation?.address || req.user.location?.address,
      coordinates: finalCoordinates,
      lastUpdated: new Date()
    };
    
    // Log để debug
    if (finalCoordinates && finalCoordinates.length === 2) {
      console.log(`✅ Updated currentLocation with coordinates: [${finalCoordinates[1]}, ${finalCoordinates[0]}] (lat, lng)`);
    } else {
      console.warn(`⚠️ No coordinates for currentLocation. Address: "${supplyChain.currentLocation.address}"`);
    }
    
    if (qualityChecks && qualityChecks.length > 0) {
      supplyChain.qualityChecks = supplyChain.qualityChecks || [];
      qualityChecks.forEach(check => {
        supplyChain.qualityChecks.push({
          ...check,
          checkedBy: req.user._id,
          checkedAt: new Date()
        });
      });
    }
    
    await supplyChain.save();
    
    // Ghi lên blockchain với retry mechanism
    try {
      const blockchainResult = await recordToBlockchainWithRetry({
        supplyChainId: supplyChain._id,
        drugBatchNumber: supplyChain.drugBatchNumber,
        step: newStep,
        actor: req.user,
        operation: 'addStep'
      });
      
      if (blockchainResult) {
        newStep.blockchain = {
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed,
          timestamp: new Date()
        };
        
        supplyChain.blockchain = supplyChain.blockchain || {};
        supplyChain.blockchain.lastBlockchainUpdate = new Date();
        supplyChain.blockchain.isOnBlockchain = true;
        if (supplyChain.blockchain.syncError) {
          delete supplyChain.blockchain.syncError;
        }
        await supplyChain.save();
      }
    } catch (blockchainError) {
      console.error('Blockchain error (final):', blockchainError);
      // Đánh dấu lỗi nhưng không block operation
      supplyChain.blockchain = supplyChain.blockchain || {};
      supplyChain.blockchain.syncError = blockchainError.message || 'Blockchain sync failed';
      await supplyChain.save();
    }
    
    // Ghi log truy cập
    await supplyChain.logAccess({
      accessedBy: req.user._id,
      accessType: 'update',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    emitSupplyChainEvent('supplyChain:step_added', {
      supplyChainId: supplyChain._id,
      step: newStep,
      currentLocation: supplyChain.currentLocation,
      status: supplyChain.status
    });
    
    // Gửi thông báo cho các actors liên quan
    try {
      await sendSupplyChainNotifications(supplyChain, 'step_added', req.user, { step: newStep });
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError);
    }
    
    // Populate before sending response
    const populatedSupplyChain = await SupplyChain.findById(supplyChain._id)
      .populate({
        path: 'drugId',
        select: 'name genericName manufacturer dosageForm',
        options: { lean: false }
      })
      .populate({
        path: 'steps.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      })
      .populate({
        path: 'currentLocation.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      });
    
    res.status(200).json({
      success: true,
      message: 'Thêm bước thành công',
      data: {
        step: newStep,
        supplyChain: populatedSupplyChain
      }
    });
    
  } catch (error) {
    console.error('Add supply chain step error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm bước hành trình'
    });
  }
};

// @desc    Lấy thông tin hành trình
// @route   GET /api/supply-chain/:id
// @access  Private
const getSupplyChain = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID hành trình không hợp lệ'
      });
    }
    
    const supplyChain = await SupplyChain.findById(id)
      .populate({
        path: 'drugId',
        select: 'name genericName manufacturer dosageForm activeIngredient batchNumber drugId description',
        options: { lean: false }
      })
      .populate({
        path: 'steps.actorId',
        select: 'fullName role organizationInfo phone email',
        options: { lean: false }
      })
      .populate({
        path: 'qualityChecks.checkedBy',
        select: 'fullName role',
        options: { lean: false }
      })
      .populate({
        path: 'accessLog.accessedBy',
        select: 'fullName role',
        options: { lean: false }
      })
      .populate({
        path: 'currentLocation.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      })
      .populate({
        path: 'createdBy',
        select: 'fullName role',
        options: { lean: false }
      });
    
    if (!supplyChain) {
      return res.status(404).json({
        success: false,
        message: 'Hành trình không tồn tại'
      });
    }
    
    // Kiểm tra quyền xem
    const canView = checkViewPermission(req.user, supplyChain);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem hành trình này'
      });
    }
    
    // Ghi log truy cập
    await supplyChain.logAccess({
      accessedBy: req.user._id,
      accessType: 'view',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(200).json({
      success: true,
      data: {
        supplyChain
      }
    });
    
  } catch (error) {
    console.error('Get supply chain error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin hành trình'
    });
  }
};

// @desc    Truy xuất nguồn gốc qua QR code
// @route   GET /api/supply-chain/qr/:batchNumber
// @access  Public
const getSupplyChainByQR = async (req, res) => {
  try {
    let { batchNumber } = req.params;
    
    // Sanitize input
    batchNumber = sanitizeInput(batchNumber);
    
    // Validate batchNumber
    if (!batchNumber || batchNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lô thuốc không hợp lệ'
      });
    }
    
    // Giới hạn độ dài để tránh DoS
    if (batchNumber.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Số lô thuốc quá dài'
      });
    }
    
    const supplyChain = await SupplyChain.findOne({ drugBatchNumber: batchNumber })
      .populate({
        path: 'drugId',
        select: 'name genericName manufacturer dosageForm description activeIngredient batchNumber',
        options: { lean: false }
      })
      .populate({
        path: 'steps.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      })
      .populate({
        path: 'qualityChecks.checkedBy',
        select: 'fullName role',
        options: { lean: false }
      })
      .populate({
        path: 'currentLocation.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      });
    
    if (!supplyChain) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lô thuốc'
      });
    }
    
    // Lọc thông tin theo vai trò người xem
    const publicInfo = filterPublicInfo(supplyChain, req.user);
    
    res.status(200).json({
      success: true,
      data: {
        supplyChain: publicInfo
      }
    });
    
  } catch (error) {
    console.error('Get supply chain by QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi truy xuất thông tin'
    });
  }
};

// @desc    Lấy danh sách hành trình
// @route   GET /api/supply-chain
// @access  Private
const getSupplyChains = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Xây dựng filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { drugBatchNumber: { $regex: search, $options: 'i' } },
        { 'steps.actorName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Lọc theo vai trò
    // Admin và Patient xem tất cả
    // Manufacturer xem những hành trình họ tạo hoặc tham gia
    // Distributor và Hospital xem những hành trình họ tham gia
    if (req.user.role !== 'admin' && req.user.role !== 'patient') {
      // Nếu đã có filter $or từ search, merge với role filter
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          {
            $or: [
              { 'steps.actorId': req.user._id },
              { createdBy: req.user._id }
            ]
          }
        ];
        delete filter.$or;
      } else {
        filter.$or = [
          { 'steps.actorId': req.user._id },
          { createdBy: req.user._id }
        ];
      }
    }
    // Admin và Patient xem tất cả (không filter)
    
    const supplyChains = await SupplyChain.find(filter)
      .populate({
        path: 'drugId',
        select: 'name genericName manufacturer activeIngredient dosageForm batchNumber drugId',
        options: { lean: false }
      })
      .populate({
        path: 'steps.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      })
      .populate({
        path: 'currentLocation.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      })
      .populate({
        path: 'createdBy',
        select: 'fullName role',
        options: { lean: false }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SupplyChain.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        supplyChains,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
    
  } catch (error) {
    console.error('Get supply chains error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hành trình'
    });
  }
};

// @desc    Thu hồi thuốc
// @route   POST /api/supply-chain/:id/recall
// @access  Private (Admin, Manufacturer)
const recallSupplyChain = async (req, res) => {
  try {
    const { id } = req.params;
    let { reason, action, affectedUnits } = req.body;
    
    // Sanitize input
    reason = sanitizeInput(reason);
    action = sanitizeInput(action);
    affectedUnits = Array.isArray(affectedUnits) ? affectedUnits.map(u => sanitizeInput(u)) : [];
    
    // Kiểm tra quyền
    if (!['admin', 'manufacturer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thu hồi thuốc'
      });
    }
    
    // Validate input
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Lý do thu hồi phải có ít nhất 10 ký tự'
      });
    }
    
    // Giới hạn độ dài để tránh DoS
    if (reason.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Lý do thu hồi quá dài (tối đa 1000 ký tự)'
      });
    }
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID hành trình không hợp lệ'
      });
    }
    
    const supplyChain = await SupplyChain.findById(id);
    if (!supplyChain) {
      return res.status(404).json({
        success: false,
        message: 'Hành trình không tồn tại'
      });
    }
    
    // Cập nhật thông tin thu hồi
    supplyChain.status = 'recalled';
    supplyChain.recall = {
      isRecalled: true,
      recallReason: reason,
      recallDate: new Date(),
      recalledBy: req.user._id,
      recallAction: action,
      affectedUnits: affectedUnits || []
    };
    
    await supplyChain.save();
    
    // Ghi lên blockchain với retry mechanism
    try {
      await recordToBlockchainWithRetry({
        supplyChainId: supplyChain._id,
        drugBatchNumber: supplyChain.drugBatchNumber,
        recallData: supplyChain.recall,
        actor: req.user,
        operation: 'recall'
      });
      
      // Cập nhật blockchain status nếu thành công
      supplyChain.blockchain = supplyChain.blockchain || {};
      supplyChain.blockchain.lastBlockchainUpdate = new Date();
      if (supplyChain.blockchain.syncError) {
        delete supplyChain.blockchain.syncError;
      }
      await supplyChain.save();
    } catch (blockchainError) {
      console.error('Blockchain error (final):', blockchainError);
      // Đánh dấu lỗi nhưng không block recall operation
      supplyChain.blockchain = supplyChain.blockchain || {};
      supplyChain.blockchain.syncError = blockchainError.message || 'Blockchain sync failed';
      await supplyChain.save();
    }
    
    // Gửi thông báo cho tất cả actors trong supply chain
    try {
      await sendSupplyChainNotifications(supplyChain, 'recalled', req.user, { 
        recallReason: reason,
        recallAction: action 
      });
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Thu hồi thuốc thành công',
      data: {
        supplyChain
      }
    });
    
  } catch (error) {
    console.error('Recall supply chain error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thu hồi thuốc'
    });
  }
};

// Helper functions
const ROLE_PERMISSIONS = {
  manufacturer: ['created', 'shipped', 'stored', 'quality_check', 'handover'],
  distributor: ['shipped', 'received', 'stored', 'quality_check', 'handover'],
  dealer: ['received', 'stored', 'shipped', 'quality_check', 'handover', 'reported'],
  pharmacy: ['received', 'stored', 'dispensed', 'quality_check', 'reported', 'handover'],
  hospital: ['received', 'stored', 'dispensed', 'quality_check', 'reported'],
  patient: ['received', 'consumed', 'reported'],
  admin: ['created', 'shipped', 'received', 'stored', 'dispensed', 'quality_check', 'recalled', 'handover', 'reported', 'consumed']
};

const getRolePermissions = (role) => ROLE_PERMISSIONS[role] || [];

const checkStepPermission = (role, action) => {
  return getRolePermissions(role).includes(action);
};

const getStepType = (role) => {
  const stepTypes = {
    manufacturer: 'production',
    distributor: 'distribution',
    dealer: 'dealer',
    pharmacy: 'pharmacy',
    hospital: 'hospital',
    patient: 'patient',
    admin: 'production'
  };
  
  return stepTypes[role] || 'production';
};

const checkViewPermission = (user, supplyChain) => {
  // Admin có thể xem tất cả
  if (user.role === 'admin') return true;
  
  // Kiểm tra xem user có trong hành trình không
  const isInSupplyChain = supplyChain.steps.some(step => 
    step.actorId.toString() === user._id.toString()
  );
  
  if (isInSupplyChain) return true;
  
  // Patient chỉ xem được thông tin công khai
  if (user.role === 'patient') return true;
  
  return false;
};

const filterPublicInfo = (supplyChain, user) => {
  const filtered = supplyChain.toObject();
  
  // Patient chỉ xem được thông tin cơ bản
  if (!user || user.role === 'patient') {
    filtered.steps = filtered.steps.map(step => ({
      action: step.action,
      timestamp: step.timestamp,
      actorName: step.actorName,
      actorRole: step.actorRole,
      location: step.location?.address || null,
      isVerified: step.isVerified
    }));
    
    filtered.qualityChecks = filtered.qualityChecks.map(check => ({
      checkType: check.checkType,
      result: check.result,
      checkedAt: check.checkedAt
    }));
    
    delete filtered.accessLog;
    delete filtered.createdBy;
  }
  
  return filtered;
};

// Validate sequence của steps - đảm bảo logic nghiệp vụ
const validateStepSequence = (supplyChain, newAction, userRole) => {
  const steps = supplyChain.steps || [];
  if (steps.length === 0) {
    // Bước đầu tiên phải là 'created'
    if (newAction !== 'created') {
      return 'Bước đầu tiên phải là "created" (tạo hành trình)';
    }
    return null;
  }
  
  const lastStep = steps[steps.length - 1];
  const lastAction = lastStep.action;
  
  // Định nghĩa các sequence hợp lệ
  const validSequences = {
    'created': ['shipped', 'stored', 'quality_check', 'handover'],
    'shipped': ['received', 'stored', 'quality_check'],
    'received': ['stored', 'shipped', 'dispensed', 'quality_check', 'handover', 'consumed'],
    'stored': ['shipped', 'dispensed', 'quality_check', 'handover'],
    'dispensed': ['consumed', 'reported'],
    'quality_check': ['shipped', 'received', 'stored', 'dispensed', 'handover'],
    'handover': ['received', 'stored', 'shipped', 'dispensed'],
    'reported': ['recalled', 'quality_check'],
    'consumed': ['reported'],
    'recalled': [] // Sau khi recalled, không thể thêm step nào nữa
  };
  
  // Kiểm tra nếu đã bị thu hồi
  if (supplyChain.status === 'recalled' || supplyChain.recall?.isRecalled) {
    if (newAction !== 'reported') {
      return 'Không thể thêm bước mới sau khi thuốc đã bị thu hồi. Chỉ có thể báo cáo.';
    }
  }
  
  // Kiểm tra sequence hợp lệ
  const allowedActions = validSequences[lastAction] || [];
  if (!allowedActions.includes(newAction)) {
    return `Không thể thực hiện "${newAction}" sau "${lastAction}". Các hành động hợp lệ tiếp theo: ${allowedActions.join(', ')}`;
  }
  
  // Kiểm tra logic đặc biệt
  if (newAction === 'received' && lastAction !== 'shipped' && lastAction !== 'handover') {
    return 'Chỉ có thể "received" sau khi đã "shipped" hoặc "handover"';
  }
  
  if (newAction === 'dispensed' && !['received', 'stored'].includes(lastAction)) {
    return 'Chỉ có thể "dispensed" sau khi đã "received" hoặc "stored"';
  }
  
  if (newAction === 'consumed' && lastAction !== 'dispensed') {
    return 'Chỉ có thể "consumed" sau khi đã "dispensed"';
  }
  
  return null;
};

// Helper function để ghi blockchain với retry mechanism
const recordToBlockchainWithRetry = async (params, maxRetries = 3, delay = 1000) => {
  const { operation, ...blockchainParams } = params;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result;
      switch (operation) {
        case 'create':
          result = await blockchainService.recordSupplyChainStep(blockchainParams);
          break;
        case 'addStep':
          result = await blockchainService.recordSupplyChainStep(blockchainParams);
          break;
        case 'recall':
          result = await blockchainService.recordRecall(blockchainParams);
          break;
        default:
          throw new Error(`Unknown blockchain operation: ${operation}`);
      }
      return result;
    } catch (error) {
      console.error(`Blockchain attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error; // Throw error ở lần thử cuối
      }
      
      // Exponential backoff: delay * 2^(attempt-1)
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Sanitize input để tránh XSS và injection
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Loại bỏ các ký tự nguy hiểm
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};

// Helper function để gửi thông báo cho các actors trong supply chain
const sendSupplyChainNotifications = async (supplyChain, eventType, triggeredBy, extraData = {}) => {
  try {
    const Notification = require('../models/Notification');
    
    // Lấy danh sách actors cần thông báo
    const actorsToNotify = supplyChain.actors || [];
    
    // Tạo nội dung thông báo
    let title = '';
    let content = '';
    let priority = 'medium';
    let notificationType = 'supply_chain_update';
    
    switch (eventType) {
      case 'created':
        title = 'Hành trình chuỗi cung ứng mới được tạo';
        content = `Hành trình cho lô thuốc ${supplyChain.drugBatchNumber} đã được tạo bởi ${triggeredBy.fullName}. Bạn là một trong những người tham gia hành trình này.`;
        priority = 'high';
        notificationType = 'supply_chain_update';
        break;
      case 'step_added':
        const actionNames = {
          'created': 'Tạo',
          'shipped': 'Gửi hàng',
          'received': 'Nhận hàng',
          'stored': 'Lưu kho',
          'dispensed': 'Cấp phát',
          'quality_check': 'Kiểm tra chất lượng',
          'handover': 'Bàn giao',
          'reported': 'Báo cáo',
          'consumed': 'Đã sử dụng',
          'recalled': 'Thu hồi'
        };
        const actionName = actionNames[extraData.step?.action] || extraData.step?.action || 'Cập nhật';
        title = 'Cập nhật hành trình chuỗi cung ứng';
        content = `Bước "${actionName}" đã được thêm vào hành trình lô ${supplyChain.drugBatchNumber} bởi ${triggeredBy.fullName}.`;
        priority = 'medium';
        notificationType = 'supply_chain_update';
        break;
      case 'recalled':
        title = '⚠️ CẢNH BÁO: Thuốc bị thu hồi';
        content = `Lô thuốc ${supplyChain.drugBatchNumber} đã bị thu hồi bởi ${triggeredBy.fullName}.\n\nLý do: ${extraData.recallReason || 'Không xác định'}\nHành động: ${extraData.recallAction || 'Không xác định'}\n\nVui lòng kiểm tra và xử lý ngay lập tức.`;
        priority = 'urgent';
        notificationType = 'drug_recall';
        break;
      default:
        title = 'Cập nhật chuỗi cung ứng';
        content = `Hành trình cho lô ${supplyChain.drugBatchNumber} đã được cập nhật bởi ${triggeredBy.fullName}.`;
    }
    
    // Tạo danh sách userIds để gửi thông báo
    const userIds = actorsToNotify
      .filter(actor => actor.actorId && actor.actorId.toString() !== triggeredBy._id.toString())
      .map(actor => actor.actorId);
    
    if (userIds.length === 0) {
      console.log('📧 [Notification] No recipients to notify');
      return;
    }
    
    // Tạo thông báo sử dụng Notification model
    try {
      const notificationData = {
        title,
        content,
        type: notificationType,
        priority,
        sender: triggeredBy._id,
        scope: 'specific_users',
        scopeDetails: {
          userIds: userIds
        },
        relatedModule: 'supply_chain',
        relatedId: supplyChain._id,
        isPublic: false,
        requiresAction: eventType === 'recalled', // Yêu cầu hành động nếu là recall
        actionUrl: eventType === 'recalled' ? `/supply-chain/${supplyChain._id}` : null,
        actionText: eventType === 'recalled' ? 'Xem chi tiết thu hồi' : null
      };
      
      const notification = await Notification.createNotification(notificationData);
      console.log(`📧 [Notification] Created notification ${notification._id} for ${userIds.length} users`);
    } catch (notifCreateError) {
      console.error('Error creating notification:', notifCreateError);
      // Fallback: chỉ log nếu không tạo được notification
      for (const actor of actorsToNotify) {
        if (actor.actorId && actor.actorId.toString() !== triggeredBy._id.toString()) {
          console.log(`📧 [Notification Fallback] Should notify ${actor.actorName}: ${title} - ${content}`);
        }
      }
    }
  } catch (error) {
    console.error('Error sending supply chain notifications:', error);
    // Không throw error để không block main operation
  }
};

const buildActorProfile = async (participant = {}) => {
  if (!participant.actorId) return null;
  
  const actor = await User.findById(participant.actorId).select('fullName phone email organizationInfo role');
  if (!actor) return null;
  
  const resolvedRole = participant.role || actor.role;
  
  return {
    actorId: actor._id,
    actorName: actor.fullName,
    role: resolvedRole,
    organization: participant.organization || actor.organizationInfo?.name || null,
    contact: {
      phone: participant.contact?.phone || actor.phone || null,
      email: participant.contact?.email || actor.email || null
    },
    permissions: participant.permissions || getRolePermissions(resolvedRole)
  };
};

const getSupplyChainMapData = async (req, res) => {
  console.log('🗺️ ========== getSupplyChainMapData CALLED ==========');
  console.log('🗺️ Request query:', req.query);
  console.log('🗺️ Request method:', req.method);
  console.log('🗺️ Request URL:', req.originalUrl);
  try {
    // Cache theo request để tránh geocode trùng địa chỉ (giảm delay + tránh rate-limit)
    const geocodeCache = new Map(); // key(normalizedAddress) -> coordinates|null
    const normalizeAddressKey = (address) =>
      String(address || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const geocodeCached = async (address) => {
      if (!address || typeof address !== 'string') return null;
      const key = normalizeAddressKey(address);
      if (!key) return null;
      if (geocodeCache.has(key)) return geocodeCache.get(key);
      const coords = await geocodeService.geocodeToCoordinates(address);
      geocodeCache.set(key, coords || null);
      return coords || null;
    };

    const { status, role } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (role) {
      filter['currentLocation.actorRole'] = role;
    }
    
    console.log('[getSupplyChainMapData] Filter:', filter);
    
    const supplyChains = await SupplyChain.find(filter)
      .select('drugBatchNumber status currentLocation steps drugId actors')
      .populate({
        path: 'drugId',
        select: 'name genericName',
        options: { lean: false }
      })
      .populate({
        path: 'currentLocation.actorId',
        select: 'fullName role organizationInfo',
        options: { lean: false }
      });
    
    console.log('[getSupplyChainMapData] Found supply chains:', supplyChains.length);
    
    // Process supply chains và geocode các address chưa có coordinates
    const dataPromises = supplyChains.map(async (chain) => {
      // Geocode currentLocation nếu có address nhưng chưa có coordinates
      let currentLocation = chain.currentLocation;
      
      // Handle currentLocation có thể là object hoặc null
      if (currentLocation) {
        // Convert to object nếu cần
        if (currentLocation.toObject) {
          currentLocation = currentLocation.toObject();
        }
        
        console.log(`🔍 Checking currentLocation for ${chain.drugBatchNumber}:`, {
          hasAddress: !!currentLocation.address,
          address: currentLocation.address,
          hasCoordinates: !!currentLocation.coordinates,
          coordinates: currentLocation.coordinates,
          coordinatesType: typeof currentLocation.coordinates,
          isArray: Array.isArray(currentLocation.coordinates)
        });
        
        // Kiểm tra nếu có address nhưng chưa có coordinates hợp lệ
        // coordinates có thể là: null, undefined, [], hoặc [lng, lat]
        const hasValidCoordinates = currentLocation.coordinates && 
                                   Array.isArray(currentLocation.coordinates) && 
                                   currentLocation.coordinates.length === 2 &&
                                   !isNaN(currentLocation.coordinates[0]) &&
                                   !isNaN(currentLocation.coordinates[1]) &&
                                   currentLocation.coordinates[0] !== null &&
                                   currentLocation.coordinates[1] !== null;
        
        console.log(`🔍 Validation for ${chain.drugBatchNumber}:`, {
          hasAddress: !!currentLocation.address,
          address: currentLocation.address,
          hasCoordinates: !!currentLocation.coordinates,
          coordinatesType: Array.isArray(currentLocation.coordinates) ? 'array' : typeof currentLocation.coordinates,
          coordinatesLength: Array.isArray(currentLocation.coordinates) ? currentLocation.coordinates.length : 'N/A',
          coordinatesValue: currentLocation.coordinates,
          hasValidCoordinates: hasValidCoordinates,
          shouldGeocode: !!(currentLocation.address && !hasValidCoordinates)
        });
        
        if (currentLocation.address && !hasValidCoordinates) {
          console.log(`📍 Geocoding currentLocation for batch ${chain.drugBatchNumber}: "${currentLocation.address}"`);
          try {
            const coordinates = await geocodeCached(currentLocation.address);
            if (coordinates && coordinates.length === 2) {
              currentLocation = {
                ...currentLocation,
                coordinates: coordinates
              };
              console.log(`✅ Geocoded currentLocation: [${coordinates[1]}, ${coordinates[0]}] (lat, lng)`);
            } else {
              console.warn(`⚠️ Không thể geocode currentLocation: "${currentLocation.address}" - geocodeService returned:`, coordinates);
            }
          } catch (error) {
            console.error(`❌ Geocoding error for "${currentLocation.address}":`, error.message);
          }
        } else if (!currentLocation.address) {
          console.warn(`⚠️ currentLocation for ${chain.drugBatchNumber} không có address`);
        } else if (hasValidCoordinates) {
          console.log(`✅ currentLocation đã có coordinates hợp lệ: [${currentLocation.coordinates[1]}, ${currentLocation.coordinates[0]}]`);
        }
      } else {
        console.warn(`⚠️ Chain ${chain.drugBatchNumber} không có currentLocation`);
      }
      
      // Process steps và geocode nếu cần
      console.log(`🔍 Processing ${chain.steps?.length || 0} steps for ${chain.drugBatchNumber}`);
      const pathPromises = (chain.steps || []).map(async (step, stepIndex) => {
        let stepLocation = step.location;
        let address = null;
        
        console.log(`  Step ${stepIndex + 1} (${step.action}):`, {
          hasLocation: !!stepLocation,
          locationType: typeof stepLocation,
          locationIsArray: Array.isArray(stepLocation),
          location: stepLocation
        });
        
        // Handle location có thể là object hoặc string
        if (!stepLocation) {
          console.warn(`  ⚠️ Step ${stepIndex + 1} không có location`);
          return null;
        }
        
        // Convert toObject nếu là Mongoose document
        if (stepLocation.toObject && typeof stepLocation.toObject === 'function') {
          stepLocation = stepLocation.toObject();
        }
        
        // Nếu location là string (địa chỉ đơn giản)
        if (typeof stepLocation === 'string') {
          address = stepLocation;
          stepLocation = { address: address };
          console.log(`  ✅ Converted location string to object: "${address}"`);
        } else if (stepLocation.address) {
          address = stepLocation.address;
        } else {
          console.warn(`  ⚠️ Step ${stepIndex + 1} location không có address property:`, Object.keys(stepLocation));
        }
        
        // Nếu có coordinates hợp lệ, dùng luôn
        const hasValidStepCoordinates = stepLocation?.coordinates && 
                                       Array.isArray(stepLocation.coordinates) && 
                                       stepLocation.coordinates.length === 2 &&
                                       !isNaN(stepLocation.coordinates[0]) &&
                                       !isNaN(stepLocation.coordinates[1]);
        
        if (hasValidStepCoordinates) {
          return {
            coordinates: stepLocation.coordinates,
            address: address || stepLocation.address || null,
            action: step.action,
            actorRole: step.actorRole,
            timestamp: step.timestamp
          };
        }
        
        // Nếu có address nhưng chưa có coordinates hợp lệ, geocode
        if (address) {
          console.log(`📍 Geocoding step "${step.action}" for batch ${chain.drugBatchNumber}: "${address}"`);
          try {
            const coordinates = await geocodeCached(address);
            if (coordinates && coordinates.length === 2) {
              console.log(`✅ Geocoded step "${step.action}": [${coordinates[1]}, ${coordinates[0]}] (lat, lng)`);
              return {
                coordinates: coordinates,
                address: address,
                action: step.action,
                actorRole: step.actorRole,
                timestamp: step.timestamp
              };
            } else {
              console.warn(`⚠️ Không thể geocode địa chỉ cho step "${step.action}": "${address}" - geocodeService returned:`, coordinates);
            }
          } catch (error) {
            console.error(`❌ Geocoding error for step "${step.action}":`, error.message);
          }
        }
        
        // Không có đủ thông tin, return null để filter
        console.warn(`  ⚠️ Step ${stepIndex + 1} không có đủ thông tin để hiển thị trên bản đồ`);
        return null;
      });
      
      const path = (await Promise.all(pathPromises)).filter(item => item !== null);
      console.log(`✅ Processed path for ${chain.drugBatchNumber}: ${path.length} points`);
      
      // Clean up currentLocation: Nếu coordinates là mảng rỗng, set thành undefined
      if (currentLocation) {
        if (Array.isArray(currentLocation.coordinates) && currentLocation.coordinates.length === 0) {
          console.log(`🧹 Cleaning empty coordinates array for ${chain.drugBatchNumber}`);
          delete currentLocation.coordinates;
        }
        
        // Log final currentLocation state
        console.log(`📤 Final currentLocation for ${chain.drugBatchNumber}:`, {
          hasAddress: !!currentLocation.address,
          address: currentLocation.address,
          hasCoordinates: !!currentLocation.coordinates,
          coordinates: currentLocation.coordinates
        });
      }
      
      return {
      id: chain._id,
      batchNumber: chain.drugBatchNumber,
      status: chain.status,
      drug: chain.drugId ? {
        id: chain.drugId._id,
        name: chain.drugId.name
      } : null,
        currentLocation: currentLocation,
      actors: chain.actors,
        path: path
      };
    });
    
    const data = await Promise.all(dataPromises);
    
    // Log summary
    const totalPoints = data.reduce((sum, chain) => {
      return sum + (chain.path?.length || 0) + (chain.currentLocation?.coordinates ? 1 : 0);
    }, 0);
    console.log(`🗺️ Map data summary: ${data.length} chains, ${totalPoints} total points`);
    data.forEach((chain, idx) => {
      console.log(`  Chain ${idx + 1} (${chain.batchNumber}): ${chain.path?.length || 0} path points, ${chain.currentLocation?.coordinates ? '1' : '0'} currentLocation`);
    });
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get supply chain map data error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu bản đồ'
    });
  }
};

const subscribeSupplyChainEvents = (req, res) => {
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive'
  });
  
  if (res.flushHeaders) {
    res.flushHeaders();
  }
  
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);
  
  const onUpdate = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  
  supplyChainEvents.on('update', onUpdate);
  
  req.on('close', () => {
    clearInterval(heartbeat);
    supplyChainEvents.removeListener('update', onUpdate);
  });
};

// @route   POST /api/supply-chain/bulk-delete
// @desc    Xóa nhiều chuỗi cung ứng
// @access  Private (Admin)
const bulkDeleteSupplyChains = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách ID để xóa'
      });
    }

    const result = await SupplyChain.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({
      success: true,
      message: `Đã xóa ${result.deletedCount} hành trình`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete supply chains error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa hành trình'
    });
  }
};

// @route   GET /api/supply-chain/export
// @desc    Export chuỗi cung ứng ra CSV/Excel
// @access  Private
const exportSupplyChains = async (req, res) => {
  try {
    const { format = 'csv', ...queryParams } = req.query;
    const importExportService = require('../services/importExportService');
    
    // Sanitize và validate input
    const sanitizedFormat = sanitizeInput(format);
    const validFormats = ['csv', 'xlsx', 'xls'];
    if (!validFormats.includes(sanitizedFormat)) {
      return res.status(400).json({
        success: false,
        message: `Định dạng không hợp lệ. Chỉ hỗ trợ: ${validFormats.join(', ')}`
      });
    }
    
    // Build filter từ query params với sanitization
    const filter = {};
    if (queryParams.status) {
      const sanitizedStatus = sanitizeInput(queryParams.status);
      const validStatuses = ['active', 'recalled', 'expired', 'completed', 'suspended'];
      if (validStatuses.includes(sanitizedStatus)) {
        filter.status = sanitizedStatus;
      }
    }
    if (queryParams.role) {
      filter['currentLocation.actorRole'] = sanitizeInput(queryParams.role);
    }
    if (queryParams.search) {
      const sanitizedSearch = sanitizeInput(queryParams.search);
      if (sanitizedSearch && sanitizedSearch.length > 0) {
        filter.$or = [
          { drugBatchNumber: { $regex: sanitizedSearch, $options: 'i' } },
          { 'drugId.name': { $regex: sanitizedSearch, $options: 'i' } }
        ];
      }
    }
    
    // Pagination để tránh memory issues với dataset lớn
    const limit = Math.min(parseInt(queryParams.limit) || 10000, 50000); // Max 50k records
    const page = parseInt(queryParams.page) || 1;
    const skip = (page - 1) * limit;

    // Count total để thông báo nếu cần pagination
    const total = await SupplyChain.countDocuments(filter);
    
    if (total > limit && page === 1) {
      console.warn(`⚠️ Export request có ${total} records, chỉ export ${limit} records đầu tiên. Cần pagination.`);
    }

    const supplyChains = await SupplyChain.find(filter)
      .populate({
        path: 'drugId',
        select: 'name activeIngredient genericName',
        options: { lean: false }
      })
      .populate({
        path: 'createdBy',
        select: 'fullName role',
        options: { lean: false }
      })
      .populate({
        path: 'steps.actorId',
        select: 'fullName role',
        options: { lean: false }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Convert to plain objects for export

    if (supplyChains.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không có dữ liệu để xuất'
      });
    }

    try {
      if (sanitizedFormat === 'csv') {
        const csv = await importExportService.exportSupplyChainsToCSV(supplyChains);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=supply-chains-${Date.now()}.csv`);
        res.send(Buffer.from('\ufeff' + csv, 'utf-8'));
      } else if (sanitizedFormat === 'xlsx' || sanitizedFormat === 'xls') {
        const workbook = await importExportService.exportSupplyChainsToExcel(supplyChains);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=supply-chains-${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (exportError) {
      console.error('Export processing error:', exportError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý file export: ' + (exportError.message || 'Unknown error')
      });
    }
  } catch (error) {
    console.error('Export supply chains error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất file: ' + (error.message || 'Unknown error')
    });
  }
};

module.exports = {
  createSupplyChain,
  addSupplyChainStep,
  getSupplyChain,
  getSupplyChainByQR,
  getSupplyChains,
  recallSupplyChain,
  getSupplyChainMapData,
  subscribeSupplyChainEvents,
  bulkDeleteSupplyChains,
  exportSupplyChains
};
