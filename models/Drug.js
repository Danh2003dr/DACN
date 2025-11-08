const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Schema cho Drug (Lô thuốc)
const drugSchema = new mongoose.Schema({
  // Thông tin cơ bản
  drugId: {
    type: String,
    required: [true, 'Mã lô thuốc là bắt buộc'],
    unique: true,
    default: () => `DRUG_${uuidv4().substring(0, 8).toUpperCase()}`
  },
  
  name: {
    type: String,
    required: [true, 'Tên thuốc là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên thuốc không được quá 200 ký tự']
  },
  
  activeIngredient: {
    type: String,
    required: [true, 'Thành phần hoạt chất là bắt buộc'],
    trim: true,
    maxlength: [500, 'Thành phần hoạt chất không được quá 500 ký tự']
  },
  
  dosage: {
    type: String,
    required: [true, 'Liều lượng là bắt buộc'],
    trim: true
  },
  
  form: {
    type: String,
    required: [true, 'Dạng bào chế là bắt buộc'],
    enum: ['viên nén', 'viên nang', 'siro', 'dung dịch tiêm', 'kem', 'gel', 'thuốc mỡ', 'cao khô', 'cao đặc', 'khác'],
    default: 'viên nén'
  },
  
  // Thông tin sản xuất
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Nhà sản xuất là bắt buộc']
  },
  
  batchNumber: {
    type: String,
    required: [true, 'Số lô sản xuất là bắt buộc'],
    trim: true
  },
  
  productionDate: {
    type: Date,
    required: [true, 'Ngày sản xuất là bắt buộc']
  },
  
  expiryDate: {
    type: Date,
    required: [true, 'Hạn sử dụng là bắt buộc'],
    validate: {
      validator: function(value) {
        return value > this.productionDate;
      },
      message: 'Hạn sử dụng phải sau ngày sản xuất'
    }
  },
  
  // Thông tin kiểm định
  qualityTest: {
    testDate: {
      type: Date,
      required: [true, 'Ngày kiểm định là bắt buộc']
    },
    testResult: {
      type: String,
      required: [true, 'Kết quả kiểm định là bắt buộc'],
      enum: ['đạt', 'không đạt', 'đang kiểm định'],
      default: 'đang kiểm định'
    },
    testBy: {
      type: String,
      required: [true, 'Cơ quan kiểm định là bắt buộc'],
      trim: true
    },
    testReport: {
      type: String,
      trim: true
    },
    certificateNumber: {
      type: String,
      trim: true
    }
  },
  
  // Thông tin blockchain
  blockchain: {
    blockchainId: {
      type: String,
      unique: true,
      trim: true
    },
    transactionHash: {
      type: String,
      trim: true
    },
    blockNumber: {
      type: Number
    },
    blockHash: {
      type: String,
      trim: true
    },
    gasUsed: {
      type: Number
    },
    contractAddress: {
      type: String,
      trim: true
    },
    isOnBlockchain: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    // Chữ ký số
    digitalSignature: {
      type: String,
      trim: true
    },
    // Hash của dữ liệu
    dataHash: {
      type: String,
      trim: true
    },
    // Timestamp blockchain
    blockchainTimestamp: {
      type: Number
    },
    // Trạng thái trên blockchain
    blockchainStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    },
    // Lịch sử giao dịch
    transactionHistory: [{
      transactionHash: String,
      blockNumber: Number,
      timestamp: Number,
      action: String, // 'create', 'update', 'recall', 'distribute'
      details: String
    }]
  },
  
  // QR Code
  qrCode: {
    data: {
      type: String,
      required: false,
      unique: true
    },
    imageUrl: {
      type: String
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    // Blockchain ID được nhúng trong QR code
    blockchainId: {
      type: String,
      trim: true
    },
    // URL để verify QR code
    verificationUrl: {
      type: String,
      trim: true
    }
  },
  
  // Thông tin phân phối
  distribution: {
    status: {
      type: String,
      enum: ['sản_xuất', 'kiểm_định', 'đóng_gói', 'vận_chuyển', 'tại_kho', 'đã_bán', 'đã_sử_dụng'],
      default: 'sản_xuất'
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['nhà_máy', 'kho_phân_phối', 'bệnh_viện', 'nhà_thuốc', 'bệnh_nhân'],
        default: 'nhà_máy'
      },
      organizationId: {
        type: String,
        trim: true
      },
      organizationName: {
        type: String,
        trim: true
      },
      address: {
        type: String,
        trim: true
      },
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    history: [{
      status: String,
      location: String,
      organizationId: String,
      organizationName: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  
  // Thông tin đóng gói
  packaging: {
    specifications: {
      type: String,
      trim: true
    },
    standard: {
      type: String,
      trim: true
    },
    shelfLife: {
      type: String,
      trim: true
    }
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
        default: '%'
      }
    },
    lightSensitive: {
      type: Boolean,
      default: false
    },
    specialInstructions: {
      type: String,
      trim: true
    }
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'recalled', 'expired', 'suspended'],
    default: 'active'
  },
  
  isRecalled: {
    type: Boolean,
    default: false
  },
  
  recallReason: {
    type: String,
    trim: true
  },
  
  recallDate: {
    type: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
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

// Virtual cho trạng thái hết hạn
drugSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual cho số ngày còn lại
drugSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual cho trạng thái gần hết hạn (30 ngày)
drugSchema.virtual('isNearExpiry').get(function() {
  return this.daysUntilExpiry <= 30 && this.daysUntilExpiry > 0;
});

// Index cho tìm kiếm
drugSchema.index({ drugId: 1 });
drugSchema.index({ name: 1 });
drugSchema.index({ batchNumber: 1 });
drugSchema.index({ manufacturerId: 1 });
drugSchema.index({ 'distribution.status': 1 });
drugSchema.index({ 'qualityTest.testResult': 1 });
drugSchema.index({ expiryDate: 1 });

// Middleware trước khi save - cập nhật updatedAt
drugSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware trước khi save - tạo QR code data
drugSchema.pre('save', function(next) {
  if (this.isNew && !this.qrCode.data) {
    this.qrCode.data = JSON.stringify({
      drugId: this.drugId,
      name: this.name,
      batchNumber: this.batchNumber,
      expiryDate: this.expiryDate,
      manufacturerId: this.manufacturerId,
      timestamp: Date.now()
    });
  }
  next();
});

// Method để cập nhật trạng thái phân phối
drugSchema.methods.updateDistributionStatus = function(status, location, organizationId, organizationName, note, updatedBy) {
  this.distribution.status = status;
  this.distribution.currentLocation = {
    type: location,
    organizationId: organizationId,
    organizationName: organizationName
  };
  
  this.distribution.history.push({
    status: status,
    location: location,
    organizationId: organizationId,
    organizationName: organizationName,
    note: note,
    updatedBy: updatedBy
  });
  
  return this.save();
};

// Method để đánh dấu thu hồi
drugSchema.methods.recall = function(reason, recalledBy) {
  this.isRecalled = true;
  this.status = 'recalled';
  this.recallReason = reason;
  this.recallDate = new Date();
  
  this.distribution.history.push({
    status: 'recalled',
    location: 'recalled',
    note: `Thu hồi: ${reason}`,
    updatedBy: recalledBy
  });
  
  return this.save();
};

// Method để tạo QR code data
drugSchema.methods.generateQRData = function() {
  const qrData = {
    drugId: this.drugId,
    name: this.name,
    batchNumber: this.batchNumber,
    manufacturer: this.manufacturerId,
    productionDate: this.productionDate,
    expiryDate: this.expiryDate,
    qualityTest: this.qualityTest,
    currentStatus: this.distribution.status,
    currentLocation: this.distribution.currentLocation,
    isRecalled: this.isRecalled,
    timestamp: Date.now()
  };
  
  // Thêm blockchain ID nếu có
  if (this.blockchain?.blockchainId) {
    qrData.blockchainId = this.blockchain.blockchainId;
    // Sử dụng getServerUrl để có URL đúng (tự động detect IP)
    try {
      const getServerUrl = require('../utils/getServerUrl');
      const serverUrl = getServerUrl();
      qrData.verificationUrl = `${serverUrl}/verify/${this.blockchain.blockchainId}`;
    } catch (error) {
      // Fallback về CLIENT_URL hoặc localhost
      qrData.verificationUrl = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${this.blockchain.blockchainId}`;
    }
  }
  
  return qrData;
};

// Static method để tìm thuốc theo QR code
drugSchema.statics.findByQRCode = async function(qrData) {
  try {
    // Nếu là string, thử parse JSON
    let data = qrData;
    if (typeof qrData === 'string') {
      // Bỏ qua các URL scheme không hợp lệ
      if (qrData.startsWith('tel:') || qrData.startsWith('mailto:') || qrData.startsWith('sms:')) {
        throw new Error('QR code không hợp lệ: Không phải là mã QR của hệ thống');
      }
      
      // Thử parse JSON
      try {
        data = JSON.parse(qrData);
      } catch (e) {
        // Nếu không parse được JSON, có thể là raw text
        // Nếu là blockchain ID (bắt đầu bằng 0x hoặc dài 66 ký tự)
        if (qrData.startsWith('0x') || qrData.length === 66) {
          // Tìm theo blockchain ID
          return await this.findOne({ 'blockchain.blockchainId': qrData })
            .populate('manufacturerId', 'fullName organizationInfo')
            .populate('distribution.history.updatedBy', 'fullName role');
        } else {
          // Tìm theo drugId
          return await this.findOne({ drugId: qrData })
            .populate('manufacturerId', 'fullName organizationInfo')
            .populate('distribution.history.updatedBy', 'fullName role');
        }
      }
    }
    
    // Nếu là object, tìm theo drugId hoặc blockchainId
    if (data.drugId) {
      return await this.findOne({ drugId: data.drugId })
        .populate('manufacturerId', 'fullName organizationInfo')
        .populate('distribution.history.updatedBy', 'fullName role');
    }
    
    if (data.blockchainId) {
      return await this.findOne({ 'blockchain.blockchainId': data.blockchainId })
        .populate('manufacturerId', 'fullName organizationInfo')
        .populate('distribution.history.updatedBy', 'fullName role');
    }
    
    // Không tìm thấy
    return null;
  } catch (error) {
    if (error.message.includes('QR code không hợp lệ')) {
      throw error;
    }
    throw new Error('QR code không hợp lệ: ' + error.message);
  }
};

// Static method để lấy thuốc sắp hết hạn
drugSchema.statics.getExpiringSoon = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: 'active',
    isRecalled: false
  }).populate('manufacturerId', 'fullName organizationInfo');
};

// Static method để lấy thuốc đã thu hồi
drugSchema.statics.getRecalled = function() {
  return this.find({
    isRecalled: true,
    status: 'recalled'
  }).populate('manufacturerId', 'fullName organizationInfo');
};

// Static method để thống kê theo nhà sản xuất
drugSchema.statics.getStatsByManufacturer = function(manufacturerId) {
  return this.aggregate([
    { $match: { manufacturerId: mongoose.Types.ObjectId(manufacturerId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Drug', drugSchema);
