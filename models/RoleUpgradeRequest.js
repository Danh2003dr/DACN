const mongoose = require('mongoose');

const roleUpgradeRequestSchema = new mongoose.Schema({
  // Người yêu cầu
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người yêu cầu là bắt buộc']
  },
  
  // Vai trò hiện tại
  currentRole: {
    type: String,
    enum: ['patient', 'manufacturer', 'distributor', 'hospital'],
    required: [true, 'Vai trò hiện tại là bắt buộc']
  },
  
  // Vai trò yêu cầu nâng cấp
  requestedRole: {
    type: String,
    enum: ['manufacturer', 'distributor', 'hospital'],
    required: [true, 'Vai trò yêu cầu là bắt buộc']
  },
  
  // Lý do yêu cầu
  reason: {
    type: String,
    maxlength: [500, 'Lý do không được quá 500 ký tự'],
    trim: true
  },
  
  // Thông tin bổ sung (thông tin tổ chức)
  additionalInfo: {
    organizationName: {
      type: String,
      trim: true
    },
    organizationAddress: {
      type: String,
      trim: true
    },
    organizationPhone: {
      type: String,
      trim: true
    },
    organizationEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    businessLicense: {
      type: String,
      trim: true
    },
    taxCode: {
      type: String,
      trim: true
    }
  },
  
  // Tài liệu đính kèm
  documents: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    documentType: {
      type: String,
      enum: ['business_license', 'tax_certificate', 'organization_document', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Trạng thái yêu cầu
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Người xem xét
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Thời gian xem xét
  reviewedAt: {
    type: Date
  },
  
  // Ghi chú của admin
  adminNotes: {
    type: String,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự'],
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
roleUpgradeRequestSchema.index({ requestedBy: 1, status: 1 });
roleUpgradeRequestSchema.index({ status: 1, createdAt: -1 });
roleUpgradeRequestSchema.index({ reviewedBy: 1 });

module.exports = mongoose.model('RoleUpgradeRequest', roleUpgradeRequestSchema);

