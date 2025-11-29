const mongoose = require('mongoose');

// Schema cho OrderItem (Chi tiết đơn hàng)
const orderItemSchema = new mongoose.Schema({
  // Đơn hàng
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Thuốc
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
    trim: true
  },
  
  // Số lượng đặt
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Số lượng đã giao
  quantityDelivered: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Số lượng còn lại
  quantityPending: {
    type: Number,
    default: function() {
      return this.quantity - this.quantityDelivered;
    }
  },
  
  // Đơn vị
  unit: {
    type: String,
    enum: ['viên', 'hộp', 'chai', 'lọ', 'túi', 'ống', 'gói'],
    default: 'viên'
  },
  
  // Giá đơn vị
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tổng giá trị
  totalPrice: {
    type: Number,
    default: function() {
      return this.quantity * this.unitPrice;
    },
    min: 0
  },
  
  // Giảm giá (%)
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Giá sau giảm
  finalPrice: {
    type: Number,
    default: function() {
      return this.totalPrice * (1 - this.discount / 100);
    },
    min: 0
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  },
  
  // Tham chiếu đến Inventory (nếu đã được xử lý)
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  
  // Tham chiếu đến Supply Chain
  supplyChainItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplyChain'
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

// Virtual cho trạng thái hoàn thành
orderItemSchema.virtual('isCompleted').get(function() {
  return this.quantityDelivered >= this.quantity;
});

// Indexes
orderItemSchema.index({ order: 1, drug: 1 });
orderItemSchema.index({ orderNumber: 1 });
orderItemSchema.index({ drugId: 1 });
orderItemSchema.index({ status: 1 });

// Middleware trước khi save
orderItemSchema.pre('save', function(next) {
  // Cập nhật quantityPending
  this.quantityPending = this.quantity - this.quantityDelivered;
  
  // Cập nhật finalPrice
  this.finalPrice = this.totalPrice * (1 - this.discount / 100);
  
  // Cập nhật updatedAt
  this.updatedAt = Date.now();
  
  next();
});

// Method để cập nhật số lượng đã giao
orderItemSchema.methods.updateDeliveredQuantity = async function(quantity, notes = '') {
  if (quantity > this.quantity) {
    throw new Error('Số lượng giao không được vượt quá số lượng đặt');
  }
  
  this.quantityDelivered = quantity;
  this.quantityPending = this.quantity - quantity;
  
  if (this.quantityDelivered >= this.quantity) {
    this.status = 'delivered';
  } else if (this.quantityDelivered > 0) {
    this.status = 'processing';
  }
  
  if (notes) {
    this.notes = notes;
  }
  
  await this.save();
  return {
    quantityDelivered: this.quantityDelivered,
    quantityPending: this.quantityPending,
    isCompleted: this.isCompleted
  };
};

module.exports = mongoose.model('OrderItem', orderItemSchema);

