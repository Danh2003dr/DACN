const mongoose = require('mongoose');

// Schema cho Digital Signature (Chữ ký số)
const digitalSignatureSchema = new mongoose.Schema({
  // Thông tin đối tượng được ký
  targetType: {
    type: String,
    required: true,
    enum: ['drug', 'supplyChain', 'qualityTest', 'recall', 'distribution', 'other'],
    index: true
  },
  
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Thông tin người ký
  signedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  signedByName: {
    type: String,
    required: true,
    trim: true
  },
  
  signedByRole: {
    type: String,
    required: true,
    enum: ['admin', 'manufacturer', 'distributor', 'hospital', 'pharmacy', 'dealer']
  },
  
  // Dữ liệu được ký (hash)
  dataHash: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Chữ ký số (signature)
  signature: {
    type: String,
    required: true,
    trim: true
  },
  
  // Chứng chỉ số (Certificate)
  certificate: {
    // Số seri chứng chỉ
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    
    // Nhà cung cấp CA (Certificate Authority)
    caProvider: {
      type: String,
      required: true,
      enum: ['vnca', 'viettel-ca', 'fpt-ca', 'bkav-ca', 'vietnam-post-ca', 'other'],
      default: 'vnca'
    },
    
    // Tên CA (hiển thị)
    caName: {
      type: String,
      required: true,
      default: 'CA Quốc gia Việt Nam'
    },
    
    // Thông tin chứng chỉ (JSON)
    certificateInfo: {
      subject: String,        // CN=...
      issuer: String,        // O=...
      validFrom: Date,
      validTo: Date,
      publicKey: String,     // Public key (PEM format)
      algorithm: {
        type: String,
        default: 'RSA-SHA256'
      }
    },
    
    // Trạng thái chứng chỉ
    certificateStatus: {
      type: String,
      enum: ['valid', 'expired', 'revoked', 'unknown'],
      default: 'valid',
      index: true
    },
    
    // Ngày kiểm tra chứng chỉ lần cuối
    lastVerified: {
      type: Date,
      default: Date.now
    }
  },
  
  // Timestamp Authority (TSA) - Tăng giá trị pháp lý
  timestamp: {
    // Timestamp token từ TSA
    timestampToken: {
      type: String,
      trim: true
    },
    
    // URL của TSA server
    tsaUrl: {
      type: String,
      default: 'https://tsa.vnca.gov.vn'
    },
    
    // Thời gian được timestamp bởi TSA
    timestampedAt: {
      type: Date,
      default: Date.now
    },
    
    // Hash của timestamp token (để verify)
    timestampHash: {
      type: String,
      trim: true
    },
    
    // Trạng thái timestamp
    timestampStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'not_required'],
      default: 'pending',
      index: true
    },
    
    // Thông tin TSA response
    tsaResponse: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  
  // Thông tin bổ sung
  purpose: {
    type: String,
    trim: true,
    default: 'Xác thực nguồn gốc và tính toàn vẹn dữ liệu'
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Trạng thái chữ ký
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'invalid'],
    default: 'active',
    index: true
  },
  
  // Lý do thu hồi (nếu có)
  revocationReason: {
    type: String,
    trim: true
  },
  
  // Ngày thu hồi
  revokedAt: {
    type: Date
  },
  
  // Người thu hồi
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Blockchain info (nếu có)
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    blockHash: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
digitalSignatureSchema.index({ targetType: 1, targetId: 1 });
digitalSignatureSchema.index({ signedBy: 1, createdAt: -1 });
digitalSignatureSchema.index({ status: 1, createdAt: -1 });
digitalSignatureSchema.index({ 'certificate.serialNumber': 1 });
digitalSignatureSchema.index({ 'timestamp.timestampStatus': 1 });

// Virtual: Kiểm tra chữ ký còn hiệu lực không
digitalSignatureSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  if (this.certificate.certificateStatus !== 'valid') return false;
  if (this.certificate.certificateInfo.validTo < new Date()) return false;
  return true;
});

// Virtual: Kiểm tra timestamp đã được xác thực chưa
digitalSignatureSchema.virtual('isTimestamped').get(function() {
  return this.timestamp.timestampStatus === 'verified' && 
         this.timestamp.timestampToken && 
         this.timestamp.timestampedAt;
});

// Method: Thu hồi chữ ký
digitalSignatureSchema.methods.revoke = function(reason, revokedBy) {
  this.status = 'revoked';
  this.revocationReason = reason;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  return this.save();
};

// Method: Xác thực chữ ký
digitalSignatureSchema.methods.verify = async function(data) {
  // Logic xác thực chữ ký sẽ được implement trong service
  // Kiểm tra cơ bản:
  if (this.status !== 'active') {
    return { valid: false, reason: 'Chữ ký đã bị thu hồi hoặc không hợp lệ' };
  }
  
  if (this.certificate.certificateStatus !== 'valid') {
    return { valid: false, reason: 'Chứng chỉ số không hợp lệ' };
  }
  
  if (this.certificate.certificateInfo.validTo < new Date()) {
    return { valid: false, reason: 'Chứng chỉ số đã hết hạn' };
  }
  
  return { valid: true };
};

// Static method: Tìm chữ ký theo đối tượng
digitalSignatureSchema.statics.findByTarget = function(targetType, targetId) {
  return this.find({ 
    targetType, 
    targetId,
    status: 'active'
  }).sort({ createdAt: -1 }).populate('signedBy', 'fullName email role');
};

// Static method: Tìm chữ ký của người dùng
digitalSignatureSchema.statics.findByUser = function(userId, options = {}) {
  const query = { signedBy: userId };
  if (options.status) query.status = options.status;
  if (options.targetType) query.targetType = options.targetType;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('targetId')
    .limit(options.limit || 50);
};

// Static method: Thống kê chữ ký
digitalSignatureSchema.statics.getStats = async function(userId = null) {
  const match = userId ? { signedBy: userId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments(match);
  const valid = await this.countDocuments({ ...match, status: 'active' });
  const expired = await this.countDocuments({ ...match, status: 'expired' });
  const revoked = await this.countDocuments({ ...match, status: 'revoked' });
  
  return {
    total,
    active: valid,
    expired,
    revoked,
    byStatus: stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

const DigitalSignature = mongoose.model('DigitalSignature', digitalSignatureSchema);

module.exports = DigitalSignature;

