const mongoose = require('mongoose');

// Log cho mỗi lần quét QR (từ trang QRScanner hoặc API tương ứng)
const qrScanLogSchema = new mongoose.Schema({
  // Payload thô nhận được từ client (chuỗi hoặc JSON stringify)
  rawData: {
    type: String,
    required: true
  },

  // Thông tin ánh xạ (nếu tìm được thuốc)
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    default: null
  },
  drugId: {
    type: String,
    default: null
  },
  batchNumber: {
    type: String,
    default: null
  },
  blockchainId: {
    type: String,
    default: null
  },

  // Người thực hiện (nếu đã đăng nhập)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Kết quả quét
  success: {
    type: Boolean,
    default: false
  },
  alertType: {
    type: String,
    enum: ['recalled', 'expired', 'near_expiry', null],
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },

  // Metadata
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

qrScanLogSchema.index({ drugId: 1 });
qrScanLogSchema.index({ blockchainId: 1 });
qrScanLogSchema.index({ success: 1 });

module.exports = mongoose.model('QRScanLog', qrScanLogSchema);


