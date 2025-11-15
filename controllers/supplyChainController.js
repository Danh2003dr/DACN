const EventEmitter = require('events');
const SupplyChain = require('../models/SupplyChain');
const Drug = require('../models/Drug');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const getServerUrl = require('../utils/getServerUrl');

const supplyChainEvents = new EventEmitter();
const emitSupplyChainEvent = (type, payload) => {
  supplyChainEvents.emit('update', {
    type,
    timestamp: new Date(),
    payload
  });
};

// @desc    Tạo hành trình chuỗi cung ứng mới
// @route   POST /api/supply-chain
// @access  Private (Manufacturer, Admin)
const createSupplyChain = async (req, res) => {
  try {
    const { drugId, drugBatchNumber, metadata, participants = [] } = req.body;
    
    // Kiểm tra quyền (chỉ manufacturer và admin)
    if (!['admin', 'manufacturer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền tạo hành trình chuỗi cung ứng'
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
    
    // Thêm bước đầu tiên (sản xuất)
    const initialStep = {
      stepType: 'production',
      actorId: req.user._id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'created',
      timestamp: new Date(),
      location: req.user.location || null,
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
      address: req.user.location?.address,
      coordinates: req.user.location?.coordinates,
      lastUpdated: new Date()
    };
    
    await supplyChain.save();
    
    // Ghi lên blockchain
    try {
      const blockchainResult = await blockchainService.recordSupplyChainStep({
        supplyChainId: supplyChain._id,
        drugBatchNumber,
        step: initialStep,
        actor: req.user
      });
      
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
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      // Vẫn lưu vào database dù blockchain lỗi
    }
    
    emitSupplyChainEvent('supplyChain:created', {
      supplyChainId: supplyChain._id,
      status: supplyChain.status,
      currentLocation: supplyChain.currentLocation,
      drugBatchNumber,
      actors: supplyChain.actors
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo hành trình chuỗi cung ứng thành công',
      data: {
        supplyChain
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
    const { action, location, conditions, metadata, qualityChecks, handover } = req.body;
    
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
    
    if (!supplyChain.actors) {
      supplyChain.actors = [];
    }
    
    if (!supplyChain.actors.some(actor => actor.actorId?.toString() === req.user._id.toString())) {
      const profile = await buildActorProfile({ actorId: req.user._id, role: req.user.role });
      if (profile) {
        supplyChain.actors.push(profile);
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
      location: location || req.user.location || null,
      conditions: conditions || null,
      metadata: metadata || {},
      verificationMethod: 'manual'
    };
    
    if (handover) {
      newStep.handover = {
        fromRole: handover.fromRole || req.user.role,
        toRole: handover.toRole,
        token: handover.token,
        confirmedBy: req.user._id
      };
      
      supplyChain.handoverLogs = supplyChain.handoverLogs || [];
      supplyChain.handoverLogs.push({
        fromRole: newStep.handover.fromRole,
        toRole: newStep.handover.toRole,
        fromActor: req.user._id,
        toActor: handover.toActorId || null,
        token: handover.token,
        confirmedAt: handover.confirmedAt || new Date()
      });
    }
    
    supplyChain.steps.push(newStep);
    supplyChain.currentLocation = {
      actorId: req.user._id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      address: (location && location.address) || req.user.location?.address,
      coordinates: location?.coordinates || req.user.location?.coordinates,
      lastUpdated: new Date()
    };
    
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
    
    // Ghi lên blockchain
    try {
      const blockchainResult = await blockchainService.recordSupplyChainStep({
        supplyChainId: supplyChain._id,
        drugBatchNumber: supplyChain.drugBatchNumber,
        step: newStep,
        actor: req.user
      });
      
      newStep.blockchain = {
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        gasUsed: blockchainResult.gasUsed,
        timestamp: new Date()
      };
      
      supplyChain.blockchain.lastBlockchainUpdate = new Date();
      await supplyChain.save();
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
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
    
    res.status(200).json({
      success: true,
      message: 'Thêm bước thành công',
      data: {
        step: newStep,
        supplyChain
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
    
    const supplyChain = await SupplyChain.findById(id)
      .populate('drugId', 'name genericName manufacturer dosageForm')
      .populate('steps.actorId', 'fullName role organizationInfo')
      .populate('qualityChecks.checkedBy', 'fullName')
      .populate('accessLog.accessedBy', 'fullName role');
    
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
    const { batchNumber } = req.params;
    
    const supplyChain = await SupplyChain.findOne({ drugBatchNumber: batchNumber })
      .populate('drugId', 'name genericName manufacturer dosageForm description')
      .populate('steps.actorId', 'fullName role organizationInfo')
      .populate('qualityChecks.checkedBy', 'fullName');
    
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
      .populate('drugId', 'name genericName manufacturer')
      .populate('steps.actorId', 'fullName role')
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
    const { reason, action, affectedUnits } = req.body;
    
    // Kiểm tra quyền
    if (!['admin', 'manufacturer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thu hồi thuốc'
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
    
    // Ghi lên blockchain
    try {
      await blockchainService.recordRecall({
        supplyChainId: supplyChain._id,
        drugBatchNumber: supplyChain.drugBatchNumber,
        recallData: supplyChain.recall,
        actor: req.user
      });
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
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
  try {
    const { status, role } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (role) {
      filter['currentLocation.actorRole'] = role;
    }
    
    const supplyChains = await SupplyChain.find(filter)
      .select('drugBatchNumber status currentLocation steps drugId actors')
      .populate('drugId', 'name');
    
    const data = supplyChains.map(chain => ({
      id: chain._id,
      batchNumber: chain.drugBatchNumber,
      status: chain.status,
      drug: chain.drugId ? {
        id: chain.drugId._id,
        name: chain.drugId.name
      } : null,
      currentLocation: chain.currentLocation,
      actors: chain.actors,
      path: (chain.steps || [])
        .filter(step => step.location?.coordinates?.length === 2)
        .map(step => ({
          coordinates: step.location.coordinates,
          address: step.location.address,
          action: step.action,
          actorRole: step.actorRole,
          timestamp: step.timestamp
        }))
    }));
    
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

module.exports = {
  createSupplyChain,
  addSupplyChainStep,
  getSupplyChain,
  getSupplyChainByQR,
  getSupplyChains,
  recallSupplyChain,
  getSupplyChainMapData,
  subscribeSupplyChainEvents
};
