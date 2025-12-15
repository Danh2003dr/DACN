const mongoose = require('mongoose');

// Schema cho Audit Log (Nhật ký Kiểm toán)
const auditLogSchema = new mongoose.Schema({
  // Thông tin người thực hiện
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for system actions
    index: true
  },
  
  username: {
    type: String,
    required: true,
    index: true
  },
  
  userRole: {
    type: String,
    enum: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient', 'system'],
    required: true,
    index: true
  },
  
  // Loại hành động
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'login', 'logout', 'login_failed', 'password_change', 'password_reset',
      // User Management
      'user_create', 'user_update', 'user_delete', 'user_lock', 'user_unlock',
      // Drug Management
      'drug_create', 'drug_update', 'drug_delete', 'drug_recall', 'drug_verify',
      // Supply Chain
      'supply_chain_create', 'supply_chain_update', 'supply_chain_status_change',
      // Digital Signature
      'signature_create', 'signature_verify', 'signature_revoke', 'signature_batch',
      // Trust Score
      'trust_score_update', 'trust_score_recalculate',
      // Review
      'review_create', 'review_update', 'review_delete', 'review_approve',
      // Task
      'task_create', 'task_update', 'task_complete', 'task_delete',
      // Notification
      'notification_send', 'notification_delete',
      // Settings
      'settings_update', 'system_config_change',
      // Blockchain
      'blockchain_record', 'blockchain_verify', 'blockchain_update',
      // Other
      'data_export', 'data_import', 'report_generate', 'access_denied'
    ],
    index: true
  },
  
  // Module/Entity liên quan
  module: {
    type: String,
    enum: ['auth', 'user', 'drug', 'supply_chain', 'digital_signature', 'trust_score', 
           'review', 'task', 'notification', 'settings', 'blockchain', 'report', 
           'import_export', 'other'],
    required: true,
    index: true
  },
  
  // Entity ID và Type
  entityType: {
    type: String,
    enum: ['User', 'Drug', 'SupplyChain', 'DigitalSignature', 'SupplierTrustScore', 
           'Review', 'Task', 'Notification', 'Settings', 'Other'],
    index: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  // Mô tả hành động
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dữ liệu trước và sau thay đổi (cho update actions)
  beforeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  afterData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Chỉ lưu các field quan trọng thay đổi (không lưu toàn bộ object)
  changedFields: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // Kết quả hành động
  result: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success',
    index: true
  },
  
  // Thông báo lỗi (nếu có)
  errorMessage: {
    type: String,
    default: null
  },
  
  // Thông tin request
  ipAddress: {
    type: String,
    index: true
  },
  
  userAgent: {
    type: String,
    default: null
  },
  
  requestMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    required: false,
    default: null
  },
  
  requestPath: {
    type: String,
    default: null
  },
  
  // Mức độ quan trọng
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Correlation ID để trace request
  correlationId: {
    type: String,
    index: true
  }
}, {
  timestamps: false, // Không dùng timestamps mặc định, dùng timestamp field riêng
  collection: 'auditlogs'
});

// Indexes cho performance
auditLogSchema.index({ timestamp: -1 }); // Sort by timestamp descending
auditLogSchema.index({ user: 1, timestamp: -1 }); // User's activity
auditLogSchema.index({ module: 1, timestamp: -1 }); // Module activity
auditLogSchema.index({ action: 1, timestamp: -1 }); // Action type
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 }); // Entity history
auditLogSchema.index({ severity: 1, timestamp: -1 }); // Critical events
auditLogSchema.index({ result: 1, timestamp: -1 }); // Failed actions
auditLogSchema.index({ correlationId: 1 }); // Request tracing

// Compound indexes
auditLogSchema.index({ module: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ userRole: 1, action: 1, timestamp: -1 });

// Static method để tạo audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    // Không log dữ liệu nhạy cảm
    const sanitizedBeforeData = sanitizeData(logData.beforeData);
    const sanitizedAfterData = sanitizeData(logData.afterData);
    
    return await this.create({
      ...logData,
      beforeData: sanitizedBeforeData,
      afterData: sanitizedAfterData,
      timestamp: new Date()
    });
  } catch (error) {
    // Không throw error để không làm fail request chính
    console.error('Error creating audit log:', error);
    return null;
  }
};

// Helper function để loại bỏ dữ liệu nhạy cảm
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'privateKey', 'apiKey', 'creditCard', 'ssn'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

// Static method để lấy audit log với filter
auditLogSchema.statics.getLogs = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'timestamp',
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
  
  // Populate user info
  query.populate('user', 'username fullName role organizationId');
  
  const [logs, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method để lấy audit log cho một entity
auditLogSchema.statics.getEntityHistory = async function(entityType, entityId, limit = 100) {
  return await this.find({
    entityType,
    entityId
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'username fullName role')
    .lean();
};

// Static method để lấy thống kê audit log
auditLogSchema.statics.getStats = async function(dateRange = {}) {
  const match = {};
  if (dateRange.startDate || dateRange.endDate) {
    match.timestamp = {};
    if (dateRange.startDate) match.timestamp.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) match.timestamp.$lte = new Date(dateRange.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byAction: {
          $push: '$action'
        },
        byModule: {
          $push: '$module'
        },
        byResult: {
          $push: '$result'
        },
        bySeverity: {
          $push: '$severity'
        },
        byUser: {
          $push: '$user'
        }
      }
    },
    {
      $project: {
        total: 1,
        actionCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byAction' },
              as: 'action',
              in: {
                k: '$$action',
                v: {
                  $size: {
                    $filter: {
                      input: '$byAction',
                      cond: { $eq: ['$$this', '$$action'] }
                    }
                  }
                }
              }
            }
          }
        },
        moduleCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byModule' },
              as: 'module',
              in: {
                k: '$$module',
                v: {
                  $size: {
                    $filter: {
                      input: '$byModule',
                      cond: { $eq: ['$$this', '$$module'] }
                    }
                  }
                }
              }
            }
          }
        },
        resultCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$byResult' },
              as: 'result',
              in: {
                k: '$$result',
                v: {
                  $size: {
                    $filter: {
                      input: '$byResult',
                      cond: { $eq: ['$$this', '$$result'] }
                    }
                  }
                }
              }
            }
          }
        },
        severityCounts: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: '$bySeverity' },
              as: 'severity',
              in: {
                k: '$$severity',
                v: {
                  $size: {
                    $filter: {
                      input: '$bySeverity',
                      cond: { $eq: ['$$this', '$$severity'] }
                    }
                  }
                }
              }
            }
          }
        },
        uniqueUsers: { $size: { $setUnion: '$byUser' } }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    actionCounts: {},
    moduleCounts: {},
    resultCounts: {},
    severityCounts: {},
    uniqueUsers: 0
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

