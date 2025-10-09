const mongoose = require('mongoose');

const taskAttachmentSchema = new mongoose.Schema({
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
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  description: {
    type: String,
    default: ''
  }
});

const taskUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
    required: true
  },
  
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  updateText: {
    type: String,
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  attachments: [taskAttachmentSchema],
  
  isPublic: {
    type: Boolean,
    default: true
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề nhiệm vụ là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  
  description: {
    type: String,
    required: [true, 'Mô tả nhiệm vụ là bắt buộc'],
    trim: true,
    maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
  },
  
  type: {
    type: String,
    enum: ['transport', 'quality_check', 'storage', 'distribution', 'manufacturing', 'recall', 'other'],
    default: 'other',
    required: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
    default: 'pending',
    required: true
  },
  
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Thời gian
  startDate: {
    type: Date,
    default: Date.now
  },
  
  dueDate: {
    type: Date,
    required: [true, 'Thời hạn hoàn thành là bắt buộc']
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Người thực hiện
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người thực hiện là bắt buộc']
  },
  
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người giao nhiệm vụ là bắt buộc']
  },
  
  // Liên quan đến chuỗi cung ứng
  relatedSupplyChain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplyChain',
    default: null
  },
  
  relatedDrug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    default: null
  },
  
  batchNumber: {
    type: String,
    default: null
  },
  
  // Địa điểm và thông tin chi tiết
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number], // [longitude, latitude]
    address: String,
    name: String
  },
  
  // Tệp đính kèm ban đầu
  attachments: [taskAttachmentSchema],
  
  // Lịch sử cập nhật
  updates: [taskUpdateSchema],
  
  // Đánh giá chất lượng
  qualityRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      default: ''
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    ratedAt: {
      type: Date,
      default: null
    }
  },
  
  // Thông báo
  notifications: [{
    type: {
      type: String,
      enum: ['assignment', 'update', 'reminder', 'overdue', 'completion'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tags và phân loại
  tags: [{
    type: String,
    trim: true
  }],
  
  category: {
    type: String,
    enum: ['logistics', 'quality', 'compliance', 'maintenance', 'training', 'other'],
    default: 'other'
  },
  
  // Thông tin bổ sung
  estimatedDuration: {
    value: Number, // Số giờ ước tính
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'hours'
    }
  },
  
  actualDuration: {
    value: Number, // Số giờ thực tế
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'hours'
    }
  },
  
  cost: {
    estimated: {
      type: Number,
      default: 0
    },
    actual: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'VND'
    }
  },
  
  // Metadata
  isArchived: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ type: 1 });
taskSchema.index({ relatedSupplyChain: 1 });
taskSchema.index({ relatedDrug: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ createdAt: -1 });

// Pre-save middleware
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Tự động cập nhật trạng thái nếu đã hoàn thành
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  
  next();
});

// Virtual fields
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed';
});

taskSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

taskSchema.virtual('totalUpdates').get(function() {
  return this.updates.length;
});

taskSchema.virtual('latestUpdate').get(function() {
  if (this.updates.length === 0) return null;
  return this.updates[this.updates.length - 1];
});

// Methods
taskSchema.methods.addUpdate = function(updateData) {
  this.updates.push(updateData);
  
  // Cập nhật trạng thái và tiến độ chính
  if (updateData.status) {
    this.status = updateData.status;
  }
  if (updateData.progress !== undefined) {
    this.progress = updateData.progress;
  }
  
  return this.save();
};

taskSchema.methods.addAttachment = function(attachmentData) {
  this.attachments.push(attachmentData);
  return this.save();
};

taskSchema.methods.addNotification = function(notificationData) {
  this.notifications.push(notificationData);
  return this.save();
};

taskSchema.methods.rateQuality = function(rating, comment, ratedBy) {
  this.qualityRating = {
    rating,
    comment,
    ratedBy,
    ratedAt: new Date()
  };
  return this.save();
};

taskSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

taskSchema.methods.getPriorityColor = function() {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };
  return colors[this.priority] || 'gray';
};

taskSchema.methods.getStatusColor = function() {
  const colors = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
    on_hold: 'yellow'
  };
  return colors[this.status] || 'gray';
};

// Static methods
taskSchema.statics.getTasksByUser = function(userId, options = {}) {
  const query = { assignedTo: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  if (options.overdue) {
    query.dueDate = { $lt: new Date() };
    query.status = { $ne: 'completed' };
  }
  
  return this.find(query)
    .populate('assignedBy', 'fullName email')
    .populate('relatedSupplyChain', 'drugBatchNumber')
    .populate('relatedDrug', 'name batchNumber')
    .sort({ dueDate: 1 });
};

taskSchema.statics.getOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  })
    .populate('assignedTo', 'fullName email')
    .populate('assignedBy', 'fullName email')
    .sort({ dueDate: 1 });
};

module.exports = mongoose.model('Task', taskSchema);
