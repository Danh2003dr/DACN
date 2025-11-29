const mongoose = require('mongoose');

// Schema cho Payment (Thanh toán)
const paymentSchema = new mongoose.Schema({
  // Số giao dịch
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Loại thanh toán
  paymentType: {
    type: String,
    enum: ['invoice_payment', 'advance', 'refund', 'adjustment', 'other'],
    required: true,
    index: true
  },
  
  // Tham chiếu đến Invoice
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    index: true
  },
  
  invoiceNumber: {
    type: String,
    index: true
  },
  
  // Tham chiếu đến Order (nếu có)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  
  // Người thanh toán
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  payerInfo: {
    name: String,
    organization: String,
    accountNumber: String
  },
  
  // Người nhận thanh toán
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  payeeInfo: {
    name: String,
    organization: String,
    accountNumber: String
  },
  
  // Số tiền
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Phương thức thanh toán
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'mobile_payment', 'other'],
    required: true,
    index: true
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // Ngày thanh toán
  paymentDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Thông tin giao dịch ngân hàng
  bankTransaction: {
    bankName: String,
    accountNumber: String,
    transactionId: String,
    referenceNumber: String
  },
  
  // Thông tin thẻ tín dụng
  cardTransaction: {
    cardType: String,
    last4Digits: String,
    transactionId: String,
    authorizationCode: String
  },
  
  // Thông tin cổng thanh toán
  gatewayTransaction: {
    gateway: String,
    transactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  },
  
  // Receipt/Chứng từ
  receipt: {
    file: String,
    number: String
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

// Indexes
paymentSchema.index({ transactionNumber: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ payer: 1, paymentDate: -1 });
paymentSchema.index({ payee: 1, paymentDate: -1 });
paymentSchema.index({ invoice: 1 });

// Static method để tạo số giao dịch
paymentSchema.statics.generateTransactionNumber = function() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAY-${timestamp}-${random}`;
};

// Static method để lấy payments với filter
paymentSchema.statics.getPayments = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'paymentDate',
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
  query.populate('payer', 'fullName organizationInfo')
    .populate('payee', 'fullName organizationInfo')
    .populate('invoice', 'invoiceNumber totalAmount')
    .populate('order', 'orderNumber')
    .populate('createdBy', 'fullName');
  
  const [payments, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method để lấy thống kê payments
paymentSchema.statics.getPaymentStats = async function(dateRange = {}, filters = {}) {
  const match = { ...filters };
  
  if (dateRange.startDate || dateRange.endDate) {
    match.paymentDate = {};
    if (dateRange.startDate) match.paymentDate.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) match.paymentDate.$lte = new Date(dateRange.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        byStatus: { $push: '$status' },
        byMethod: { $push: '$method' }
      }
    },
    {
      $project: {
        totalPayments: 1,
        totalAmount: 1,
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
        methodCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byMethod' },
              as: 'method',
              in: {
                k: '$$method',
                v: {
                  $size: {
                    $filter: {
                      input: '$byMethod',
                      cond: { $eq: ['$$this', '$$method'] }
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
    totalPayments: 0,
    totalAmount: 0,
    statusCounts: {},
    methodCounts: {}
  };
};

module.exports = mongoose.model('Payment', paymentSchema);

