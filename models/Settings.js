const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Thông tin hệ thống
  systemName: {
    type: String,
    default: 'Drug Traceability Blockchain System',
    trim: true
  },
  
  // Thông tin công ty
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  companyAddress: {
    type: String,
    trim: true,
    default: ''
  },
  companyPhone: {
    type: String,
    trim: true,
    default: ''
  },
  companyEmail: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Cài đặt Blockchain
  blockchainNetwork: {
    type: String,
    enum: ['sepolia', 'mainnet', 'polygon', 'bsc'],
    default: 'sepolia'
  },
  blockchainProvider: {
    type: String,
    enum: ['infura', 'alchemy', 'ganache'],
    default: 'infura'
  },
  
  // Cài đặt thông báo
  notificationEmail: {
    type: String,
    trim: true,
    default: ''
  },
  backupFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  
  // Cài đặt bảo mật
  sessionTimeout: {
    type: Number,
    min: 5,
    max: 480, // 8 hours
    default: 60
  },
  maxLoginAttempts: {
    type: Number,
    min: 3,
    max: 10,
    default: 5
  },
  passwordMinLength: {
    type: Number,
    min: 6,
    max: 20,
    default: 8
  },
  requireSpecialChars: {
    type: Boolean,
    default: true
  },
  enableTwoFactor: {
    type: Boolean,
    default: false
  },
  enableAuditLog: {
    type: Boolean,
    default: true
  },
  
  // Cài đặt thông báo
  enableEmailNotifications: {
    type: Boolean,
    default: true
  },
  enableSMSNotifications: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index để đảm bảo chỉ có một document settings
settingsSchema.index({}, { unique: true });

module.exports = mongoose.model('Settings', settingsSchema);
