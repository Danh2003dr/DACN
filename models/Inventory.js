const mongoose = require('mongoose');

// Schema cho Inventory (Quản lý Tồn kho)
const inventorySchema = new mongoose.Schema({
  // Thông tin thuốc
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true,
    index: true
  },
  
  drugId: {
    type: String,
    required: true,
    index: true
  },
  
  drugName: {
    type: String,
    required: true,
    trim: true
  },
  
  batchNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Địa điểm kho
  location: {
    type: {
      type: String,
      enum: ['warehouse', 'hospital', 'pharmacy', 'distribution_center', 'manufacturing_plant'],
      required: true,
      index: true
    },
    
    locationId: {
      type: String,
      required: true,
      index: true
    },
    
    locationName: {
      type: String,
      required: true,
      trim: true
    },
    
    address: {
      type: String,
      trim: true
    },
    
    organizationId: {
      type: String,
      trim: true,
      index: true
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
  
  // Thông tin tồn kho
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  unit: {
    type: String,
    enum: ['viên', 'hộp', 'chai', 'lọ', 'túi', 'ống', 'gói'],
    default: 'viên'
  },
  
  // Số lượng tối thiểu (cảnh báo khi hết hàng)
  minStock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Số lượng tối đa
  maxStock: {
    type: Number,
    default: null,
    min: 0
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['available', 'reserved', 'quarantine', 'expired', 'recalled', 'damaged'],
    default: 'available',
    index: true
  },
  
  // Thông tin bảo quản
  storage: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    
    humidity: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        default: 'percent'
      }
    },
    
    light: {
      type: String,
      enum: ['dark', 'low_light', 'normal', 'bright'],
      default: 'normal'
    },
    
    notes: {
      type: String,
      trim: true
    }
  },
  
  // Thông tin hạn sử dụng
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  
  productionDate: {
    type: Date,
    required: true
  },
  
  // Số ngày còn lại đến hết hạn
  daysUntilExpiry: {
    type: Number,
    default: function() {
      if (this.expiryDate) {
        const today = new Date();
        const expiry = new Date(this.expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return null;
    }
  },
  
  // Giá trị
  unitPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalValue: {
    type: Number,
    default: function() {
      return this.quantity * this.unitPrice;
    }
  },
  
  // Thông tin nhà cung cấp
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  supplierName: {
    type: String,
    trim: true
  },
  
  // Lịch sử giao dịch
  lastTransaction: {
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'transfer', 'stocktake']
    },
    date: Date,
    quantity: Number,
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Metadata
  notes: {
    type: String,
    trim: true
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

// Virtual cho trạng thái hết hạn
inventorySchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual cho trạng thái gần hết hạn (30 ngày)
inventorySchema.virtual('isNearExpiry').get(function() {
  return this.daysUntilExpiry <= 30 && this.daysUntilExpiry > 0;
});

// Virtual cho trạng thái sắp hết hàng
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStock && this.quantity > 0;
});

// Virtual cho trạng thái hết hàng
inventorySchema.virtual('isOutOfStock').get(function() {
  return this.quantity === 0;
});

// Indexes
inventorySchema.index({ drug: 1, 'location.locationId': 1 }); // Unique constraint sẽ được xử lý ở application level
inventorySchema.index({ batchNumber: 1, 'location.locationId': 1 });
inventorySchema.index({ 'location.locationId': 1, status: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ quantity: 1 });
inventorySchema.index({ status: 1, quantity: 1 });
inventorySchema.index({ 'location.coordinates.coordinates': '2dsphere' }); // GeoJSON index

// Middleware trước khi save
inventorySchema.pre('save', function(next) {
  // Cập nhật daysUntilExpiry
  if (this.expiryDate) {
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry - today;
    this.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Cập nhật totalValue
  this.totalValue = this.quantity * this.unitPrice;
  
  // Cập nhật updatedAt
  this.updatedAt = Date.now();
  
  next();
});

// Static method để tìm hoặc tạo inventory item
inventorySchema.statics.findOrCreate = async function(drugId, locationId, data = {}) {
  let inventory = await this.findOne({
    drugId,
    'location.locationId': locationId
  });
  
  if (!inventory) {
    inventory = await this.create({
      ...data,
      drugId,
      'location.locationId': locationId
    });
  }
  
  return inventory;
};

// Static method để lấy tồn kho theo location
inventorySchema.statics.getStockByLocation = async function(locationId, filters = {}) {
  const query = {
    'location.locationId': locationId,
    ...filters
  };
  
  return await this.find(query)
    .populate('drug', 'name activeIngredient dosage form')
    .populate('supplier', 'fullName organizationInfo')
    .populate('createdBy', 'fullName')
    .populate('updatedBy', 'fullName')
    .sort({ drugName: 1, expiryDate: 1 });
};

// Static method để lấy tổng tồn kho của một drug
inventorySchema.statics.getTotalStock = async function(drugId) {
  const result = await this.aggregate([
    {
      $match: {
        drugId: drugId,
        status: { $in: ['available', 'reserved'] }
      }
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalValue' },
        locations: { $addToSet: '$location.locationId' }
      }
    }
  ]);
  
  return result[0] || {
    totalQuantity: 0,
    totalValue: 0,
    locations: []
  };
};

// Static method để lấy thống kê tồn kho
inventorySchema.statics.getStockStats = async function(locationId = null) {
  const match = locationId ? { 'location.locationId': locationId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalValue' },
        byStatus: {
          $push: '$status'
        },
        lowStock: {
          $sum: {
            $cond: [
              { $lte: ['$quantity', '$minStock'] },
              1,
              0
            ]
          }
        },
        expired: {
          $sum: {
            $cond: [
              { $lt: ['$expiryDate', new Date()] },
              1,
              0
            ]
          }
        },
        nearExpiry: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lte: ['$daysUntilExpiry', 30] },
                  { $gt: ['$daysUntilExpiry', 0] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        totalItems: 1,
        totalQuantity: 1,
        totalValue: 1,
        lowStock: 1,
        expired: 1,
        nearExpiry: 1,
        statusCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byStatus' },
              as: 'status',
              in: {
                k: '$$status',
                v: {
                  $size: {
                    $filter: {
                      input: '$byStatus',
                      cond: { $eq: ['$$this', '$$status'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStock: 0,
    expired: 0,
    nearExpiry: 0,
    statusCounts: {}
  };
};

// Method để cập nhật số lượng
inventorySchema.methods.updateQuantity = async function(quantity, transactionType, userId, notes = '') {
  const oldQuantity = this.quantity;
  this.quantity = Math.max(0, quantity);
  
  this.lastTransaction = {
    type: transactionType,
    date: new Date(),
    quantity: this.quantity - oldQuantity,
    by: userId
  };
  
  if (notes) {
    this.notes = notes;
  }
  
  this.updatedBy = userId;
  await this.save();
  
  return {
    oldQuantity,
    newQuantity: this.quantity,
    difference: this.quantity - oldQuantity
  };
};

// Method để thêm vào kho
inventorySchema.methods.addStock = async function(quantity, userId, notes = '') {
  return await this.updateQuantity(this.quantity + quantity, 'in', userId, notes);
};

// Method để xuất kho
inventorySchema.methods.removeStock = async function(quantity, userId, notes = '') {
  if (this.quantity < quantity) {
    throw new Error(`Không đủ hàng trong kho. Tồn kho hiện tại: ${this.quantity}, yêu cầu: ${quantity}`);
  }
  return await this.updateQuantity(this.quantity - quantity, 'out', userId, notes);
};

module.exports = mongoose.model('Inventory', inventorySchema);

