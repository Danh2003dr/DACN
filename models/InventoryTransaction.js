const mongoose = require('mongoose');

// Schema cho Inventory Transaction (Giao dịch Kho)
const inventoryTransactionSchema = new mongoose.Schema({
  // Loại giao dịch
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'transfer', 'stocktake'],
    required: true,
    index: true
  },
  
  // Inventory item liên quan
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },
  
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
  
  batchNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Địa điểm kho
  location: {
    locationId: {
      type: String,
      required: true,
      index: true
    },
    locationName: {
      type: String,
      required: true
    }
  },
  
  // Số lượng
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Số lượng trước và sau
  quantityBefore: {
    type: Number,
    required: true,
    min: 0
  },
  
  quantityAfter: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Đơn vị
  unit: {
    type: String,
    enum: ['viên', 'hộp', 'chai', 'lọ', 'túi', 'ống', 'gói'],
    default: 'viên'
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
  
  // Lý do/Reference
  reason: {
    type: String,
    enum: [
      'purchase',           // Mua hàng
      'sale',               // Bán hàng
      'transfer_in',        // Nhận chuyển kho
      'transfer_out',       // Chuyển kho đi
      'return',             // Trả hàng
      'damage',             // Hư hỏng
      'expired',            // Hết hạn
      'recall',             // Thu hồi
      'adjustment',         // Điều chỉnh
      'stocktake',          // Kiểm kê
      'production',         // Sản xuất
      'consumption',        // Tiêu thụ
      'other'
    ],
    default: 'other'
  },
  
  // Reference đến các documents khác
  reference: {
    type: {
      type: String,
      enum: ['supply_chain', 'order', 'prescription', 'transfer', 'stocktake', 'other']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    },
    number: {
      type: String
    }
  },
  
  // Thông tin người thực hiện
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  performedByName: {
    type: String,
    required: true
  },
  
  // Thông tin người nhận/xuất (nếu có)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  recipientName: {
    type: String
  },
  
  // Địa điểm đích (cho transfer)
  destinationLocation: {
    locationId: String,
    locationName: String
  },
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'reversed'],
    default: 'completed',
    index: true
  },
  
  // Timestamp
  transactionDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
inventoryTransactionSchema.index({ transactionDate: -1 });
inventoryTransactionSchema.index({ type: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ drugId: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ 'location.locationId': 1, transactionDate: -1 });
inventoryTransactionSchema.index({ performedBy: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ status: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ reference: 1 });

// Compound indexes
inventoryTransactionSchema.index({ type: 1, status: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ 'location.locationId': 1, type: 1, transactionDate: -1 });

// Static method để lấy transactions với filter
inventoryTransactionSchema.statics.getTransactions = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'transactionDate',
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
  query.populate('inventory', 'drugName batchNumber location')
    .populate('drug', 'name activeIngredient')
    .populate('performedBy', 'fullName role')
    .populate('recipient', 'fullName role');
  
  const [transactions, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method để lấy thống kê transactions
inventoryTransactionSchema.statics.getTransactionStats = async function(dateRange = {}, locationId = null) {
  const match = {};
  
  if (dateRange.startDate || dateRange.endDate) {
    match.transactionDate = {};
    if (dateRange.startDate) match.transactionDate.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) match.transactionDate.$lte = new Date(dateRange.endDate);
  }
  
  if (locationId) {
    match['location.locationId'] = locationId;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalIn: {
          $sum: {
            $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0]
          }
        },
        totalOut: {
          $sum: {
            $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0]
          }
        },
        totalValue: { $sum: '$totalValue' },
        byType: {
          $push: '$type'
        },
        byReason: {
          $push: '$reason'
        }
      }
    },
    {
      $project: {
        totalTransactions: 1,
        totalIn: 1,
        totalOut: 1,
        netQuantity: { $subtract: ['$totalIn', '$totalOut'] },
        totalValue: 1,
        typeCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byType' },
              as: 'type',
              in: {
                k: '$$type',
                v: {
                  $size: {
                    $filter: {
                      input: '$byType',
                      cond: { $eq: ['$$this', '$$type'] }
                    }
                  }
                }
              }
            }
          }
        },
        reasonCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byReason' },
              as: 'reason',
              in: {
                k: '$$reason',
                v: {
                  $size: {
                    $filter: {
                      input: '$byReason',
                      cond: { $eq: ['$$this', '$$reason'] }
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
    totalTransactions: 0,
    totalIn: 0,
    totalOut: 0,
    netQuantity: 0,
    totalValue: 0,
    typeCounts: {},
    reasonCounts: {}
  };
};

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

