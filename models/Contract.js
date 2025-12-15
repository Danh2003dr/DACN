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
  
  // Populate với error handling - sử dụng try-catch cho từng populate
  query.populate({
    path: 'supplier',
    select: 'name supplierCode',
    options: { strictPopulate: false }
  });
  
  query.populate({
    path: 'buyer',
    select: 'fullName organizationInfo',
    options: { strictPopulate: false }
  });
  
  // Populate digitalSignature chỉ nếu có (optional)
  query.populate({
    path: 'digitalSignature',
    select: 'signature certificate status createdAt',
    options: { strictPopulate: false }
  });
  
  query.populate({
    path: 'createdBy',
    select: 'fullName',
    options: { strictPopulate: false }
  });
  
  query.populate({
    path: 'updatedBy',
    select: 'fullName',
    options: { strictPopulate: false }
  });
  
  let contracts = [];
  let total = 0;
  
  try {
    [contracts, total] = await Promise.all([
      query.exec(),
      this.countDocuments(filters)
    ]);
  } catch (queryError) {
    console.error('Error in getContracts query:', queryError);
    console.error('Query error details:', {
      message: queryError.message,
      name: queryError.name,
      filters: JSON.stringify(filters, null, 2),
      stack: queryError.stack
    });
    
    // Nếu lỗi là do populate, thử lại không populate
    if (queryError.message && (
      queryError.message.includes('populate') || 
      queryError.message.includes('strictPopulate') ||
      queryError.message.includes('Cannot populate')
    )) {
      console.warn('Retrying query without populate due to populate error');
      try {
        const simpleQuery = this.find(filters);
        simpleQuery.sort(sort);
        simpleQuery.skip(skip).limit(limit);
        
        [contracts, total] = await Promise.all([
          simpleQuery.exec(),
          this.countDocuments(filters)
        ]);
      } catch (retryError) {
        console.error('Error in retry query:', retryError);
        contracts = [];
        total = 0;
      }
    } else {
      // Nếu không phải lỗi populate, throw lại
      throw queryError;
    }
  }
  
  return {
    contracts: Array.isArray(contracts) ? contracts : [],
    pagination: {
      page,
      limit,
      total: total || 0,
      pages: Math.ceil((total || 0) / limit)
    }
  };
};

module.exports = mongoose.model('Contract', contractSchema);

