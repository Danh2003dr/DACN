const mongoose = require('mongoose');

const supplyChainStepSchema = new mongoose.Schema({
  stepType: {
    type: String,
    enum: ['production', 'distribution', 'hospital', 'patient'],
    required: true
  },
  
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  actorName: {
    type: String,
    required: true
  },
  
  actorRole: {
    type: String,
    enum: ['manufacturer', 'distributor', 'hospital', 'patient'],
    required: true
  },
  
  action: {
    type: String,
    required: true,
    enum: [
      'created',           // Nhà sản xuất tạo
      'shipped',           // Nhà phân phối gửi hàng
      'received',          // Bệnh viện nhận hàng
      'stored',            // Lưu kho
      'dispensed',         // Cấp phát cho bệnh nhân
      'recalled',          // Thu hồi
      'quality_check'      // Kiểm tra chất lượng
    ]
  },
  
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number], // [longitude, latitude]
    address: String
  },
  
  conditions: {
    temperature: Number,   // Nhiệt độ bảo quản
    humidity: Number,      // Độ ẩm
    light: String,         // Điều kiện ánh sáng
    notes: String          // Ghi chú
  },
  
  metadata: {
    batchNumber: String,
    serialNumber: String,
    quantity: Number,
    unit: String,
    expiryDate: Date,
    notes: String
  },
  
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number,
    timestamp: Date
  },
  
  digitalSignature: String,
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationMethod: {
    type: String,
    enum: ['qr_scan', 'manual', 'blockchain', 'auto'],
    default: 'manual'
  }
});

const supplyChainSchema = new mongoose.Schema({
  drugId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true,
    index: true
  },
  
  drugBatchNumber: {
    type: String,
    required: true,
    index: true
  },
  
  qrCode: {
    code: String,
    blockchainId: String,
    verificationUrl: String
  },
  
  status: {
    type: String,
    enum: ['active', 'recalled', 'expired', 'completed', 'suspended'],
    default: 'active'
  },
  
  steps: [supplyChainStepSchema],
  
  currentLocation: {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actorName: String,
    actorRole: String,
    address: String,
    coordinates: [Number],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Thông tin blockchain
  blockchain: {
    contractAddress: String,
    blockchainId: String,
    isOnBlockchain: {
      type: Boolean,
      default: false
    },
    lastBlockchainUpdate: Date
  },
  
  // Thông tin chất lượng
  qualityChecks: [{
    checkType: {
      type: String,
      enum: ['temperature', 'humidity', 'integrity', 'expiry', 'custom']
    },
    result: {
      type: String,
      enum: ['pass', 'fail', 'warning']
    },
    value: String,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Thông tin thu hồi
  recall: {
    isRecalled: {
      type: Boolean,
      default: false
    },
    recallReason: String,
    recallDate: Date,
    recalledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recallAction: String,
    affectedUnits: [String]
  },
  
  // Thông tin truy xuất
  accessLog: [{
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessType: {
      type: String,
      enum: ['view', 'scan', 'update', 'verify']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
supplyChainSchema.index({ drugId: 1, drugBatchNumber: 1 });
supplyChainSchema.index({ 'steps.timestamp': -1 });
supplyChainSchema.index({ 'currentLocation.actorId': 1 });
supplyChainSchema.index({ status: 1 });
supplyChainSchema.index({ 'blockchain.blockchainId': 1 });

// Pre-save middleware
supplyChainSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for total steps
supplyChainSchema.virtual('totalSteps').get(function() {
  return this.steps.length;
});

// Virtual for current step
supplyChainSchema.virtual('currentStep').get(function() {
  if (this.steps.length === 0) return null;
  return this.steps[this.steps.length - 1];
});

// Virtual for journey summary
supplyChainSchema.virtual('journeySummary').get(function() {
  const summary = [];
  this.steps.forEach(step => {
    summary.push({
      step: step.action,
      actor: step.actorName,
      timestamp: step.timestamp,
      location: step.location?.address
    });
  });
  return summary;
});

// Methods
supplyChainSchema.methods.addStep = function(stepData) {
  this.steps.push(stepData);
  this.currentLocation = {
    actorId: stepData.actorId,
    actorName: stepData.actorName,
    actorRole: stepData.actorRole,
    address: stepData.location?.address,
    coordinates: stepData.location?.coordinates,
    lastUpdated: new Date()
  };
  return this.save();
};

supplyChainSchema.methods.verifyStep = function(stepIndex, verificationData) {
  if (this.steps[stepIndex]) {
    this.steps[stepIndex].isVerified = true;
    this.steps[stepIndex].verificationMethod = verificationData.method || 'manual';
    return this.save();
  }
  throw new Error('Step not found');
};

supplyChainSchema.methods.addQualityCheck = function(checkData) {
  this.qualityChecks.push(checkData);
  return this.save();
};

supplyChainSchema.methods.logAccess = function(accessData) {
  this.accessLog.push(accessData);
  return this.save();
};

module.exports = mongoose.model('SupplyChain', supplyChainSchema);
