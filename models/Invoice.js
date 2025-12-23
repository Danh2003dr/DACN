const mongoose = require('mongoose');

// Schema cho Invoice (Hóa đơn)
const invoiceSchema = new mongoose.Schema({
  // Số hóa đơn
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Loại hóa đơn
  invoiceType: {
    type: String,
    enum: ['sales', 'purchase', 'return', 'credit_note', 'debit_note'],
    required: true,
    index: true
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['draft', 'issued', 'sent', 'paid', 'cancelled', 'void'],
    default: 'draft',
    required: true,
    index: true
  },
  
  // Tham chiếu đến Order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  
  orderNumber: {
    type: String,
    index: true
  },
  
  // Người bán (Seller)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  sellerInfo: {
    name: String,
    organization: String,
    taxCode: String,
    address: String,
    phone: String,
    email: String
  },
  
  // Người mua (Buyer)
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  buyerInfo: {
    name: String,
    organization: String,
    taxCode: String,
    address: String,
    phone: String,
    email: String
  },
  
  // Chi tiết hóa đơn
  items: [{
    drugId: String,
    drugName: String,
    batchNumber: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    discount: Number,
    taxRate: Number,
    subtotal: Number,
    tax: Number,
    total: Number
  }],
  
  // Tổng giá trị
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
  
  // Giảm giá
  discount: {
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
    required: true,
    min: 0
  },
  
  // Số tiền đã thanh toán
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Số tiền còn nợ
  dueAmount: {
    type: Number,
    default: function() {
      return this.totalAmount - this.paidAmount;
    },
    min: 0
  },
  
  // Ngày phát hành
  issueDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Ngày đến hạn thanh toán
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Ngày thanh toán
  paidDate: {
    type: Date
  },
  
  // Phương thức thanh toán
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'momo', 'vnpay', 'other'],
    default: 'bank_transfer'
  },
  
  // Trạng thái thanh toán
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
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
  
  // File PDF của hóa đơn
  pdfFile: {
    type: String
  },
  
  // QR Code cho hóa đơn
  qrCode: {
    type: String
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

// Virtual cho số ngày quá hạn
invoiceSchema.virtual('daysOverdue').get(function() {
  if (this.paymentStatus === 'overdue' || (this.dueDate < new Date() && this.paymentStatus !== 'paid')) {
    return Math.floor((Date.now() - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual cho số ngày đến hạn
invoiceSchema.virtual('daysUntilDue').get(function() {
  if (this.dueDate > new Date()) {
    return Math.floor((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ paymentStatus: 1, dueDate: 1 });
invoiceSchema.index({ seller: 1, issueDate: -1 });
invoiceSchema.index({ buyer: 1, issueDate: -1 });

// Middleware trước khi save
invoiceSchema.pre('save', function(next) {
  // Cập nhật dueAmount
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  // Cập nhật paymentStatus
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else if (this.dueDate < new Date() && this.paymentStatus !== 'cancelled') {
    this.paymentStatus = 'overdue';
  }
  
  // Cập nhật updatedAt
  this.updatedAt = Date.now();
  
  next();
});

// Static method để tạo số hóa đơn
invoiceSchema.statics.generateInvoiceNumber = function(invoiceType) {
  const prefix = invoiceType === 'sales' ? 'HD' : invoiceType === 'purchase' ? 'HDM' : 'HD';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${year}${month}-${timestamp}`;
};

// Static method để lấy invoices với filter
invoiceSchema.statics.getInvoices = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'issueDate',
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
  query.populate('seller', 'fullName organizationInfo')
    .populate('buyer', 'fullName organizationInfo')
    .populate('order', 'orderNumber')
    .populate('createdBy', 'fullName');
  
  const [invoices, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method để lấy thống kê invoices
invoiceSchema.statics.getInvoiceStats = async function(dateRange = {}, filters = {}) {
  const match = { ...filters };
  
  if (dateRange.startDate || dateRange.endDate) {
    match.issueDate = {};
    if (dateRange.startDate) match.issueDate.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) match.issueDate.$lte = new Date(dateRange.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
        dueAmount: { $sum: '$dueAmount' },
        byStatus: { $push: '$status' },
        byPaymentStatus: { $push: '$paymentStatus' }
      }
    },
    {
      $project: {
        totalInvoices: 1,
        totalAmount: 1,
        paidAmount: 1,
        dueAmount: 1,
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
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    statusCounts: {},
    paymentStatusCounts: {}
  };
};

module.exports = mongoose.model('Invoice', invoiceSchema);

