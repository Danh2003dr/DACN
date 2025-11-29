const mongoose = require('mongoose');

// Schema cho Contract (Hợp đồng)
const contractSchema = new mongoose.Schema({
  // Số hợp đồng
  contractNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Loại hợp đồng
  contractType: {
    type: String,
    enum: ['supply', 'service', 'distribution', 'partnership', 'other'],
    required: true,
    index: true
  },
  
  // Nhà cung ứng
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  
  supplierCode: {
    type: String,
    required: true,
    index: true
  },
  
  // Bên mua (có thể là organization hoặc user)
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  buyerInfo: {
    name: String,
    organization: String,
    taxCode: String
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'expired', 'terminated', 'cancelled'],
    default: 'draft',
    required: true,
    index: true
  },
  
  // Ngày ký
  signedDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Ngày bắt đầu hiệu lực
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Ngày kết thúc
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Điều khoản hợp đồng
  terms: {
    // Giá trị hợp đồng
    contractValue: {
      type: Number,
      min: 0
    },
    
    // Đơn vị tiền tệ
    currency: {
      type: String,
      default: 'VND'
    },
    
    // Điều khoản thanh toán
    paymentTerms: {
      method: String,
      schedule: String,
      advance: Number,
      retention: Number
    },
    
    // Điều khoản giao hàng
    deliveryTerms: {
      method: String,
      location: String,
      timeframe: String
    },
    
    // Điều khoản chất lượng
    qualityTerms: {
      standards: [String],
      inspection: String,
      warranty: String
    },
    
    // Điều khoản khác
    otherTerms: {
      type: String,
      trim: true
    }
  },
  
  // File hợp đồng
  contractFile: {
    type: String
  },
  
  // Chữ ký số
  digitalSignature: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalSignature'
  },
  
  // Thông tin gia hạn
  renewals: [{
    renewalDate: Date,
    newEndDate: Date,
    notes: String,
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Lịch sử thay đổi
  history: [{
    action: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho số ngày còn lại
contractSchema.virtual('daysRemaining').get(function() {
  if (this.endDate > new Date()) {
    return Math.floor((this.endDate - Date.now()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual cho trạng thái hết hạn
contractSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date() && this.status !== 'expired';
});

// Virtual cho trạng thái sắp hết hạn (30 ngày)
contractSchema.virtual('isNearExpiry').get(function() {
  return this.daysRemaining <= 30 && this.daysRemaining > 0;
});

// Indexes
contractSchema.index({ contractNumber: 1 });
contractSchema.index({ supplier: 1, status: 1 });
contractSchema.index({ startDate: 1, endDate: 1 });
contractSchema.index({ status: 1, endDate: 1 });

// Static method để tạo số hợp đồng
contractSchema.statics.generateContractNumber = function() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-8);
  return `HD-${year}-${timestamp}`;
};

// Static method để lấy contracts với filter
contractSchema.statics.getContracts = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'signedDate',
    sortOrder = 'desc'
  } = options;
  
  const query = this.find(filters);
  
  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  query.sort(sort);
  
  // Pagination
  const skip = (page - 1) * limit;
  query.skip(skip).limit(limit);
  
  // Populate
  query.populate('supplier', 'name supplierCode')
    .populate('buyer', 'fullName organizationInfo')
    .populate('digitalSignature')
    .populate('createdBy', 'fullName')
    .populate('updatedBy', 'fullName');
  
  const [contracts, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    contracts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('Contract', contractSchema);

