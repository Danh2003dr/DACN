const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề thông báo là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  
  content: {
    type: String,
    required: [true, 'Nội dung thông báo là bắt buộc'],
    trim: true,
    maxlength: [2000, 'Nội dung không được quá 2000 ký tự']
  },
  
  type: {
    type: String,
    enum: ['system', 'drug_recall', 'task_assignment', 'supply_chain_update', 'quality_alert', 'general', 'urgent'],
    default: 'general',
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
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    required: true
  },
  
  // Người gửi
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người gửi là bắt buộc']
  },
  
  // Người nhận
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Phạm vi gửi
  scope: {
    type: String,
    enum: ['all', 'roles', 'specific_users', 'organization'],
    default: 'all',
    required: true
  },
  
  // Chi tiết phạm vi
  scopeDetails: {
    roles: [{
      type: String,
      enum: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    }],
    organizationIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Liên quan đến các module khác
  relatedModule: {
    type: String,
    enum: ['drug', 'supply_chain', 'task', 'user', 'system'],
    default: 'system'
  },
  
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Tệp đính kèm
  attachments: [{
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
    }
  }],
  
  // Thời gian
  scheduledAt: {
    type: Date,
    default: null // Nếu null thì gửi ngay lập tức
  },
  
  expiresAt: {
    type: Date,
    default: null // Nếu null thì không hết hạn
  },
  
  // Thống kê
  stats: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalRead: {
      type: Number,
      default: 0
    },
    totalUnread: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  
  isPublic: {
    type: Boolean,
    default: true // Bệnh nhân chỉ nhận thông báo công khai
  },
  
  requiresAction: {
    type: Boolean,
    default: false // Thông báo có yêu cầu hành động không
  },
  
  actionUrl: {
    type: String,
    default: null // URL để thực hiện hành động
  },
  
  actionText: {
    type: String,
    default: null // Text cho button hành động
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
notificationSchema.index({ sender: 1 });
notificationSchema.index({ 'recipients.user': 1, 'recipients.isRead': 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scope: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ isPublic: 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Tính toán thống kê
  this.stats.totalSent = this.recipients.length;
  this.stats.totalRead = this.recipients.filter(r => r.isRead).length;
  this.stats.totalUnread = this.stats.totalSent - this.stats.totalRead;
  
  next();
});

// Virtual fields
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledAt && this.scheduledAt > new Date();
});

notificationSchema.virtual('readPercentage').get(function() {
  if (this.stats.totalSent === 0) return 0;
  return Math.round((this.stats.totalRead / this.stats.totalSent) * 100);
});

// Methods
notificationSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && !recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.markAsUnread = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && recipient.isRead) {
    recipient.isRead = false;
    recipient.readAt = null;
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.addRecipient = function(userId) {
  const existingRecipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (!existingRecipient) {
    this.recipients.push({
      user: userId,
      isRead: false,
      readAt: null
    });
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.removeRecipient = function(userId) {
  this.recipients = this.recipients.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

notificationSchema.methods.addAttachment = function(attachmentData) {
  this.attachments.push(attachmentData);
  return this.save();
};

notificationSchema.methods.getPriorityColor = function() {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };
  return colors[this.priority] || 'gray';
};

notificationSchema.methods.getTypeIcon = function() {
  const icons = {
    system: 'settings',
    drug_recall: 'alert-triangle',
    task_assignment: 'check-circle',
    supply_chain_update: 'truck',
    quality_alert: 'shield',
    general: 'bell',
    urgent: 'alert-circle'
  };
  return icons[this.type] || 'bell';
};

// Static methods
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const baseQuery = {
    'recipients.user': userId,
    status: 'published'
  };
  
  // Lọc theo loại
  if (options.type) {
    baseQuery.type = options.type;
  }
  
  // Lọc theo mức độ ưu tiên
  if (options.priority) {
    baseQuery.priority = options.priority;
  }
  
  // Lọc theo trạng thái đọc
  if (options.unreadOnly) {
    baseQuery['recipients.isRead'] = false;
  }
  
  // Lọc theo thời gian
  if (options.fromDate) {
    baseQuery.createdAt = { $gte: new Date(options.fromDate) };
  }
  
  if (options.toDate) {
    baseQuery.createdAt = { ...baseQuery.createdAt, $lte: new Date(options.toDate) };
  }
  
  // Điều kiện chung: chưa hết hạn
  const andConditions = [
    {
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }
  ];
  
  // Tìm kiếm theo tiêu đề/nội dung nếu có search
  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i');
    andConditions.push({
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    });
  }
  
  const finalQuery = andConditions.length
    ? { ...baseQuery, $and: andConditions }
    : baseQuery;
  
  return this.find(finalQuery)
    .populate('sender', 'fullName email role avatar')
    .populate('recipients.user', 'fullName email role')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.createNotification = async function(notificationData) {
  const {
    title,
    content,
    type,
    priority,
    sender,
    scope,
    scopeDetails,
    relatedModule,
    relatedId,
    isPublic,
    requiresAction,
    actionUrl,
    actionText,
    scheduledAt,
    expiresAt,
    tags
  } = notificationData;
  
  // Xác định danh sách người nhận dựa trên phạm vi
  let recipients = [];
  
  if (scope === 'all') {
    // Lấy tất cả người dùng
    const User = mongoose.model('User');
    const users = await User.find({});
    recipients = users.map(user => ({
      user: user._id,
      isRead: false,
      readAt: null
    }));
  } else if (scope === 'roles' && scopeDetails?.roles) {
    // Lấy người dùng theo role
    const User = mongoose.model('User');
    const users = await User.find({ role: { $in: scopeDetails.roles } });
    recipients = users.map(user => ({
      user: user._id,
      isRead: false,
      readAt: null
    }));
  } else if (scope === 'specific_users' && scopeDetails?.userIds) {
    // Lấy người dùng cụ thể
    recipients = scopeDetails.userIds.map(userId => ({
      user: userId,
      isRead: false,
      readAt: null
    }));
  }
  
  // Lọc theo isPublic nếu cần
  if (!isPublic) {
    const User = mongoose.model('User');
    const patientUsers = recipients.filter(r => {
      // Chỉ giữ lại non-patient users
      return r.user.role !== 'patient';
    });
    recipients = patientUsers;
  }
  
  // Tạo thông báo
  const notification = new this({
    title,
    content,
    type,
    priority,
    sender,
    scope,
    scopeDetails,
    recipients,
    relatedModule,
    relatedId,
    isPublic,
    requiresAction,
    actionUrl,
    actionText,
    scheduledAt,
    expiresAt,
    tags
  });
  
  return notification.save();
};

notificationSchema.statics.getNotificationStats = function(userId) {
  return this.aggregate([
    {
        $match: {
          'recipients.user': new mongoose.Types.ObjectId(userId),
          status: 'published',
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
    },
    {
      $project: {
        total: 1,
        unread: {
          $size: {
            $filter: {
              input: '$recipients',
              cond: {
                $and: [
                  { $eq: ['$$this.user', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$$this.isRead', false] }
                ]
              }
            }
          }
        },
        priority: 1,
        type: 1
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: { $sum: '$unread' },
        urgent: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0]
          }
        },
        high: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'high'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);
