const mongoose = require('mongoose');

// Schema cho Supplier (Nhà cung ứng)
const supplierSchema = new mongoose.Schema({
  // Mã nhà cung ứng
  supplierCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Thông tin cơ bản
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Loại nhà cung ứng
  type: {
    type: String,
    enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'other'],
    required: true,
    index: true
  },
  
  // Thông tin liên hệ
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    mobile: {
      type: String,
      trim: true
    },
    fax: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Địa chỉ
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Việt Nam'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: null
      }
    }
  },
  
  // Thông tin pháp lý
  legal: {
    taxCode: {
      type: String,
      index: true
    },
    businessLicense: String,
    registrationNumber: String,
    registrationDate: Date,
    representative: String,
    capital: Number
  },
  
  // Thông tin ngân hàng
  banking: {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    branch: String
  },
  
  // Thông tin sản phẩm/dịch vụ
  products: [{
    category: String,
    description: String,
    certifications: [String]
  }],
  
  // Đánh giá và xếp hạng
  rating: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    quality: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    delivery: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    service: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Trust Score (tích hợp với TrustScore model)
  trustScore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplierTrustScore'
  },
  
  trustScoreValue: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active',
    index: true
  },
  
  // Thông tin hợp đồng
  contracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  }],
  
  // Thống kê
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    onTimeDelivery: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      default: 0
    }
  },
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  },
  
  // Internal notes
  internalNotes: {
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

// Indexes
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ name: 1 });
supplierSchema.index({ type: 1, status: 1 });
supplierSchema.index({ 'address.coordinates.coordinates': '2dsphere' });
supplierSchema.index({ 'legal.taxCode': 1 });
supplierSchema.index({ trustScoreValue: -1 });

// Static method để tạo supplier code
supplierSchema.statics.generateSupplierCode = function() {
  const timestamp = Date.now().toString().slice(-8);
  return `SUP-${timestamp}`;
};

// Static method để lấy suppliers với filter
supplierSchema.statics.getSuppliers = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'trustScoreValue',
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
  
  // Populate (sử dụng lean() để tránh lỗi với populate)
  // Sử dụng strictPopulate: false để tránh lỗi nếu model không tồn tại
  query.populate({
    path: 'trustScore',
    select: 'trustScore trustLevel',
    strictPopulate: false
  })
    .populate({
      path: 'contracts',
      select: 'contractNumber contractType status startDate endDate',
      strictPopulate: false
    })
    .populate({
      path: 'createdBy',
      select: 'fullName username',
      strictPopulate: false
    })
    .populate({
      path: 'updatedBy',
      select: 'fullName username',
      strictPopulate: false
    });
  
  let suppliers, total;
  try {
    [suppliers, total] = await Promise.all([
      query.lean().exec(),
      this.countDocuments(filters)
    ]);
  } catch (error) {
    // Nếu có lỗi, thử lại không populate
    console.warn('Error in getSuppliers query, retrying without populate:', error.message);
    try {
      const simpleQuery = this.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      [suppliers, total] = await Promise.all([
        simpleQuery.lean().exec(),
        this.countDocuments(filters)
      ]);
    } catch (retryError) {
      // Nếu vẫn lỗi, trả về empty data thay vì throw error
      console.error('Error in getSuppliers (retry failed):', retryError.message);
      suppliers = [];
      total = 0;
    }
  }
  
  // Đảm bảo suppliers luôn là array
  if (!Array.isArray(suppliers)) {
    suppliers = [];
  }
  
  return {
    suppliers,
    pagination: {
      page,
      limit,
      total: total || 0,
      pages: Math.ceil((total || 0) / limit)
    }
  };
};

module.exports = mongoose.model('Supplier', supplierSchema);

