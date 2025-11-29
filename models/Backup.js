const mongoose = require('mongoose');

// Schema cho Backup (Sao lưu dữ liệu)
const backupSchema = new mongoose.Schema({
  // Tên backup
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Loại backup
  type: {
    type: String,
    enum: ['full', 'incremental', 'differential'],
    default: 'full',
    required: true
  },
  
  // Phạm vi backup
  scope: {
    type: String,
    enum: ['all', 'database', 'files', 'config'],
    default: 'all',
    required: true
  },
  
  // Đường dẫn file backup
  filePath: {
    type: String,
    required: true
  },
  
  // Kích thước file (bytes)
  fileSize: {
    type: Number,
    default: 0
  },
  
  // Format backup
  format: {
    type: String,
    enum: ['mongodump', 'json', 'csv', 'tar', 'zip'],
    default: 'mongodump'
  },
  
  // Trạng thái backup
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'expired'],
    default: 'pending',
    required: true,
    index: true
  },
  
  // Thông tin database được backup
  database: {
    name: String,
    collections: [String],
    recordCount: Number
  },
  
  // Metadata
  metadata: {
    mongooseVersion: String,
    nodeVersion: String,
    timestamp: Date,
    checksum: String
  },
  
  // Người tạo backup
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Ngày tạo
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Ngày hoàn thành
  completedAt: {
    type: Date
  },
  
  // Ngày hết hạn (tự động xóa sau ngày này)
  expiresAt: {
    type: Date,
    index: true
  },
  
  // Thông báo lỗi (nếu có)
  error: {
    message: String,
    stack: String,
    occurredAt: Date
  },
  
  // Ghi chú
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho thời gian backup (seconds)
backupSchema.virtual('duration').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.floor((this.completedAt - this.createdAt) / 1000);
  }
  return null;
});

// Virtual cho trạng thái hết hạn
backupSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Indexes
backupSchema.index({ createdAt: -1 });
backupSchema.index({ status: 1, createdAt: -1 });
backupSchema.index({ type: 1, createdAt: -1 });
backupSchema.index({ expiresAt: 1 });

// Static method để lấy backups với filter
backupSchema.statics.getBackups = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
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
  query.populate('createdBy', 'fullName username');
  
  const [backups, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    backups,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method để lấy thống kê backups
backupSchema.statics.getBackupStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byStatus: { $push: '$status' },
        byType: { $push: '$type' },
        totalSize: { $sum: '$fileSize' },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        total: 1,
        totalSize: 1,
        successful: 1,
        failed: 1,
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
        typeCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byType' },
              as: 'type',
              in: {
                k: '$$type',
                v: {
                  $size: {
                    $filter: {
                      input: '$byType',
                      cond: { $eq: ['$$this', '$$type'] }
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
    total: 0,
    totalSize: 0,
    successful: 0,
    failed: 0,
    statusCounts: {},
    typeCounts: {}
  };
};

module.exports = mongoose.model('Backup', backupSchema);

