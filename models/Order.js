const mongoose = require('mongoose');

// Schema cho Order (Đơn hàng)
const orderSchema = new mongoose.Schema({
  // Mã đơn hàng
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Loại đơn hàng
  orderType: {
    type: String,
    enum: ['purchase', 'sales', 'transfer'],
    required: true,
    index: true
  },
  
  // Trạng thái đơn hàng
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'],
    default: 'draft',
    required: true,
    index: true
  },
  
  // Người tạo đơn hàng
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Thông tin người mua (cho sales order) hoặc người bán (cho purchase order)
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  buyerName: {
    type: String,
    trim: true
  },
  
  buyerOrganization: {
    type: String,
    trim: true
  },
  
  // Thông tin người bán (cho sales order) hoặc người mua (cho purchase order)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  sellerName: {
    type: String,
    trim: true
  },
  
  sellerOrganization: {
    type: String,
    trim: true
  },
  
  // Địa chỉ giao hàng
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    province: String,
    postalCode: String,
    phone: String,
    email: String
  },
  
  // Địa chỉ thanh toán
  billingAddress: {
    name: String,
    address: String,
    city: String,
    province: String,
    postalCode: String,
    phone: String,
    email: String
  },
  
  // Chi tiết đơn hàng (sẽ được populate từ OrderItem)
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem'
  }],
  
  // Tổng số lượng items
  totalItems: {
    type: Number,
    default: 0
  },
  
  // Tổng số lượng sản phẩm
  totalQuantity: {
    type: Number,
    default: 0
  },
  
  // Tổng giá trị đơn hàng
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Thuế VAT
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Phí vận chuyển
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tổng giá trị cuối cùng
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Phương thức thanh toán
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'momo', 'other'],
    default: 'bank_transfer'
  },
  
  // Trạng thái thanh toán
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Ngày thanh toán
  paidDate: {
    type: Date
  },
  
  // Thông tin vận chuyển
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup', 'other']
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    notes: String
  },
  
  // Ngày đặt hàng
  orderDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Ngày yêu cầu giao hàng
  requiredDate: {
    type: Date
  },
  
  // Ngày giao hàng thực tế
  deliveredDate: {
    type: Date
  },
  
  // Ngày hủy
  cancelledDate: {
    type: Date
  },
  
  // Lý do hủy
  cancellationReason: {
    type: String,
    trim: true
  },
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  },
  
  // Internal notes (chỉ admin/internal users thấy)
  internalNotes: {
    type: String,
    trim: true
  },
  
  // Tham chiếu đến Supply Chain
  supplyChain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplyChain'
  },
  
  // Tham chiếu đến Contract/Hợp đồng
  contract: {
    contractNumber: String,
    contractDate: Date,
    contractFile: String
  },
  
  // Lịch sử thay đổi trạng thái
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedByName: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
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

// Virtual cho số ngày từ khi đặt hàng
orderSchema.virtual('daysSinceOrder').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

// Virtual cho số ngày đến ngày yêu cầu giao hàng
orderSchema.virtual('daysUntilRequired').get(function() {
  if (!this.requiredDate) return null;
  return Math.floor((this.requiredDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderType: 1, status: 1 });
orderSchema.index({ createdBy: 1, orderDate: -1 });
orderSchema.index({ buyer: 1, orderDate: -1 });
orderSchema.index({ seller: 1, orderDate: -1 });
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ paymentStatus: 1, orderDate: -1 });
orderSchema.index({ orderDate: -1 });

// Middleware trước khi save
orderSchema.pre('save', function(next) {
  // Cập nhật updatedAt
  this.updatedAt = Date.now();
  
  // Tính tổng giá trị
  this.totalAmount = this.subtotal + this.tax + this.shippingFee;
  
  next();
});

// Method để thay đổi trạng thái
orderSchema.methods.changeStatus = async function(newStatus, userId, userName, notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Thêm vào lịch sử
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    notes: notes || `Thay đổi từ ${oldStatus} sang ${newStatus}`
  });
  
  // Cập nhật các ngày liên quan
  if (newStatus === 'delivered' && !this.deliveredDate) {
    this.deliveredDate = new Date();
  }
  if (newStatus === 'cancelled' && !this.cancelledDate) {
    this.cancelledDate = new Date();
  }
  if (newStatus === 'completed' && !this.deliveredDate) {
    this.deliveredDate = new Date();
  }
  
  await this.save();
  return { oldStatus, newStatus };
};

// Static method để tạo order number
orderSchema.statics.generateOrderNumber = function(orderType) {
  const prefix = orderType === 'purchase' ? 'PO' : orderType === 'sales' ? 'SO' : 'TO';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Static method để lấy orders với filter
orderSchema.statics.getOrders = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'orderDate',
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
  query.populate('createdBy', 'fullName role')
    .populate('buyer', 'fullName organizationInfo')
    .populate('seller', 'fullName organizationInfo')
    .populate('items', 'drugName quantity unitPrice')
    .populate('supplyChain', 'status');
  
  const [orders, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method để lấy thống kê orders
orderSchema.statics.getOrderStats = async function(dateRange = {}, filters = {}) {
  const match = { ...filters };
  
  if (dateRange.startDate || dateRange.endDate) {
    match.orderDate = {};
    if (dateRange.startDate) match.orderDate.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) match.orderDate.$lte = new Date(dateRange.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        byType: {
          $push: '$orderType'
        },
        byStatus: {
          $push: '$status'
        },
        byPaymentStatus: {
          $push: '$paymentStatus'
        }
      }
    },
    {
      $project: {
        totalOrders: 1,
        totalAmount: 1,
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
        },
        paymentStatusCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byPaymentStatus' },
              as: 'paymentStatus',
              in: {
                k: '$$paymentStatus',
                v: {
                  $size: {
                    $filter: {
                      input: '$byPaymentStatus',
                      cond: { $eq: ['$$this', '$$paymentStatus'] }
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
    totalOrders: 0,
    totalAmount: 0,
    typeCounts: {},
    statusCounts: {},
    paymentStatusCounts: {}
  };
};

module.exports = mongoose.model('Order', orderSchema);

