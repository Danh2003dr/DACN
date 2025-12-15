const mongoose = require('mongoose');

// Schema cho Bid (Đấu thầu)
const bidSchema = new mongoose.Schema({
  // Mã đấu thầu
  bidNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Sản phẩm được đấu thầu
  drugId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: [true, 'Sản phẩm là bắt buộc'],
    index: true
  },
  
  // Thông tin sản phẩm (denormalized để dễ query)
  drugName: {
    type: String,
    required: true,
    trim: true
  },
  
  drugBatchNumber: {
    type: String,
    trim: true
  },
  
  // Nhà sản xuất sở hữu sản phẩm
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Nhà sản xuất là bắt buộc'],
    index: true
  },
  
  manufacturerName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Người đấu thầu
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người đấu thầu là bắt buộc'],
    index: true
  },
  
  bidderName: {
    type: String,
    required: true,
    trim: true
  },
  
  bidderOrganization: {
    type: String,
    trim: true
  },
  
  // Giá đấu thầu (VND)
  bidPrice: {
    type: Number,
    required: [true, 'Giá đấu thầu là bắt buộc'],
    min: [0, 'Giá đấu thầu phải lớn hơn 0']
  },
  
  // Số lượng đấu thầu
  quantity: {
    type: Number,
    required: [true, 'Số lượng là bắt buộc'],
    min: [1, 'Số lượng phải lớn hơn 0']
  },
  
  // Tổng giá trị đấu thầu
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Trạng thái đấu thầu
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled', 'countered'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // Counter Offer - Giá đối ứng từ nhà sản xuất
  counterPrice: {
    type: Number,
    min: 0
  },
  
  // Ghi chú counter offer từ nhà sản xuất
  counterNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
  },
  
  // Thời gian counter offer được gửi
  counteredAt: {
    type: Date
  },
  
  // Người gửi counter offer (thường là manufacturer)
  counteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Ghi chú của người đấu thầu
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
  },
  
  // Ghi chú của nhà sản xuất khi chấp nhận/từ chối
  manufacturerNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
  },
  
  // Ngày hết hạn đấu thầu (nếu có)
  expiryDate: {
    type: Date
  },
  
  // Thời gian được chấp nhận/từ chối
  respondedAt: {
    type: Date
  },
  
  // Người xử lý (thường là nhà sản xuất)
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index cho tìm kiếm
bidSchema.index({ drugId: 1, status: 1 });
bidSchema.index({ bidderId: 1, status: 1 });
bidSchema.index({ manufacturerId: 1, status: 1 });
bidSchema.index({ createdAt: -1 });

// Virtual để tính toán thời gian còn lại
bidSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual để kiểm tra có thể chỉnh sửa không
bidSchema.virtual('canEdit').get(function() {
  return (this.status === 'pending' || this.status === 'countered') && !this.isExpired;
});

// Virtual để lấy giá cuối cùng (counterPrice nếu có, nếu không thì bidPrice)
bidSchema.virtual('finalPrice').get(function() {
  return this.counterPrice || this.bidPrice;
});

// Pre-save middleware để tạo bidNumber và tính totalAmount
bidSchema.pre('save', async function(next) {
  // Tạo bidNumber nếu chưa có
  if (!this.bidNumber) {
    const count = await mongoose.model('Bid').countDocuments();
    this.bidNumber = `BID${String(count + 1).padStart(8, '0')}`;
  }
  
  // Tính tổng giá trị
  if (this.bidPrice && this.quantity) {
    this.totalAmount = this.bidPrice * this.quantity;
  }
  
  // Cập nhật status thành expired nếu quá hạn
  if (this.expiryDate && new Date() > this.expiryDate && this.status === 'pending') {
    this.status = 'expired';
  }
  
  next();
});

// Static method để lấy bids theo drug
bidSchema.statics.findByDrug = function(drugId, status = null) {
  const query = { drugId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('drugId', 'name batchNumber imageUrl')
    .populate('bidderId', 'fullName email organizationInfo')
    .populate('manufacturerId', 'fullName email organizationInfo')
    .sort({ createdAt: -1 });
};

// Static method để lấy bids của một user
bidSchema.statics.findByBidder = function(bidderId, status = null) {
  const query = { bidderId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('drugId', 'name batchNumber imageUrl')
    .populate('manufacturerId', 'fullName email organizationInfo')
    .sort({ createdAt: -1 });
};

// Static method để lấy bids cho một manufacturer
bidSchema.statics.findByManufacturer = function(manufacturerId, status = null) {
  const query = { manufacturerId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('drugId', 'name batchNumber imageUrl')
    .populate('bidderId', 'fullName email organizationInfo')
    .sort({ createdAt: -1 });
};

// Method để gửi counter offer
// NOTE: Authorization đã được kiểm tra ở controller level, method này chỉ xử lý logic business
bidSchema.methods.counterOffer = async function(userId, counterPrice, counterNotes = null) {
  if (this.status !== 'pending' && this.status !== 'countered') {
    throw new Error('Chỉ có thể gửi counter offer cho bid đang ở trạng thái pending hoặc countered');
  }
  
  if (this.isExpired) {
    throw new Error('Bid đã hết hạn');
  }
  
  // NOTE: Authorization check đã được thực hiện ở controller level
  // Method này chỉ xử lý logic business, không kiểm tra quyền
  
  if (!counterPrice || counterPrice <= 0) {
    throw new Error('Giá counter offer phải lớn hơn 0');
  }
  
  this.status = 'countered';
  this.counterPrice = counterPrice;
  this.counterNotes = counterNotes || '';
  this.counteredAt = new Date();
  this.counteredBy = userId;
  
  return await this.save();
};

// Method để chấp nhận bid (có thể từ pending hoặc countered)
// NOTE: Authorization đã được kiểm tra ở controller level, method này chỉ xử lý logic business
bidSchema.methods.accept = async function(userId, notes = null) {
  // Có thể accept từ pending (manufacturer accept bidder's bid)
  // hoặc từ countered (bidder accept manufacturer's counter offer)
  if (this.status !== 'pending' && this.status !== 'countered') {
    throw new Error('Chỉ có thể chấp nhận bid đang ở trạng thái pending hoặc countered');
  }
  
  if (this.isExpired) {
    throw new Error('Bid đã hết hạn');
  }
  
  // NOTE: Authorization check đã được thực hiện ở controller level
  // Method này chỉ xử lý logic business, không kiểm tra quyền
  
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.respondedBy = userId;
  if (notes) {
    this.manufacturerNotes = notes;
  }
  
  return await this.save();
};

// Method để từ chối bid
bidSchema.methods.reject = async function(userId, notes = null) {
  if (this.status !== 'pending') {
    throw new Error('Chỉ có thể từ chối bid đang ở trạng thái pending');
  }
  
  this.status = 'rejected';
  this.respondedAt = new Date();
  this.respondedBy = userId;
  if (notes) {
    this.manufacturerNotes = notes;
  }
  
  return await this.save();
};

// Method để hủy bid
bidSchema.methods.cancel = async function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Chỉ có thể hủy bid đang ở trạng thái pending');
  }
  
  // Chỉ người đấu thầu mới có thể hủy
  if (this.bidderId.toString() !== userId.toString()) {
    throw new Error('Chỉ người đấu thầu mới có thể hủy bid này');
  }
  
  this.status = 'cancelled';
  return await this.save();
};

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;

