const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');

/**
 * Audit Service
 * Service để ghi audit log tự động cho các thao tác quan trọng
 */

// Generate correlation ID cho request
const generateCorrelationId = () => {
  return uuidv4();
};

/**
 * Tạo audit log
 * @param {Object} logData - Dữ liệu log
 * @param {Object} logData.user - User object hoặc user ID
 * @param {String} logData.action - Loại hành động
 * @param {String} logData.module - Module liên quan
 * @param {String} logData.description - Mô tả hành động
 * @param {String} logData.entityType - Loại entity (User, Drug, etc.)
 * @param {ObjectId} logData.entityId - ID của entity
 * @param {Object} logData.beforeData - Dữ liệu trước khi thay đổi
 * @param {Object} logData.afterData - Dữ liệu sau khi thay đổi
 * @param {String} logData.result - Kết quả (success, failure, partial)
 * @param {String} logData.errorMessage - Thông báo lỗi (nếu có)
 * @param {String} logData.severity - Mức độ (low, medium, high, critical)
 * @param {Object} logData.metadata - Metadata bổ sung
 * @param {Object} req - Express request object (optional, để lấy IP, user agent)
 */
const createAuditLog = async (logData, req = null) => {
  try {
    // Kiểm tra xem audit log có được bật không
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne();
    if (settings && settings.enableAuditLog === false) {
      return null; // Audit log bị tắt
    }

    // Lấy thông tin user
    let user, username, userRole;
    if (logData.user) {
      if (typeof logData.user === 'object' && logData.user._id) {
        user = logData.user._id;
        username = logData.user.username || logData.user.email || 'Unknown';
        userRole = logData.user.role || 'admin'; // Default to admin if role not found
      } else if (typeof logData.user === 'string' || logData.user instanceof require('mongoose').Types.ObjectId) {
        // User is ObjectId string
        user = logData.user;
        username = logData.username || 'Unknown';
        userRole = logData.userRole || 'admin'; // Default to admin if role not found
      } else {
        // Invalid user object, skip audit log
        return null;
      }
    } else {
      // System action (không có user)
      user = null;
      username = 'SYSTEM';
      userRole = 'system';
    }

    // Lấy thông tin request nếu có
    const ipAddress = req?.ip || req?.connection?.remoteAddress || logData.ipAddress || null;
    const userAgent = (req && typeof req.get === 'function') ? req.get('user-agent') : (logData.userAgent || null);
    const requestMethod = (req?.method && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) 
      ? req.method 
      : (logData.requestMethod || null);
    const requestPath = req?.originalUrl || req?.path || logData.requestPath || null;
    const correlationId = req?.correlationId || logData.correlationId || generateCorrelationId();

    // Xác định changedFields từ beforeData và afterData
    const changedFields = [];
    if (logData.beforeData && logData.afterData) {
      const before = logData.beforeData;
      const after = logData.afterData;
      
      for (const key in after) {
        if (before[key] !== after[key]) {
          changedFields.push({
            field: key,
            oldValue: before[key],
            newValue: after[key]
          });
        }
      }
    }

    // Tạo audit log
    const auditLog = await AuditLog.createLog({
      user,
      username,
      userRole,
      action: logData.action,
      module: logData.module,
      entityType: logData.entityType,
      entityId: logData.entityId,
      description: logData.description,
      beforeData: logData.beforeData,
      afterData: logData.afterData,
      changedFields,
      result: logData.result || 'success',
      errorMessage: logData.errorMessage || null,
      severity: logData.severity || 'medium',
      metadata: logData.metadata || {},
      ipAddress,
      userAgent,
      requestMethod,
      requestPath,
      correlationId
    });

    return auditLog;
  } catch (error) {
    // Không throw error để không làm fail request chính
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * Log authentication events
 */
const logAuth = {
  login: async (user, req, result = 'success', errorMessage = null) => {
    return await createAuditLog({
      user,
      action: result === 'success' ? 'login' : 'login_failed',
      module: 'auth',
      description: result === 'success' 
        ? `User ${user.username} đăng nhập thành công`
        : `Đăng nhập thất bại cho ${user?.username || 'unknown'}: ${errorMessage || 'Invalid credentials'}`,
      result: result === 'success' ? 'success' : 'failure',
      errorMessage,
      severity: result === 'success' ? 'low' : 'medium'
    }, req);
  },

  logout: async (user, req) => {
    return await createAuditLog({
      user,
      action: 'logout',
      module: 'auth',
      description: `User ${user.username} đăng xuất`,
      severity: 'low'
    }, req);
  },

  passwordChange: async (user, req) => {
    return await createAuditLog({
      user,
      action: 'password_change',
      module: 'auth',
      description: `User ${user.username} đổi mật khẩu`,
      severity: 'high'
    }, req);
  }
};

/**
 * Log CRUD operations
 */
const logCRUD = {
  create: async (user, entityType, entityId, entityData, module, req, description = null) => {
    return await createAuditLog({
      user,
      action: `${module}_create`,
      module,
      entityType,
      entityId,
      description: description || `Tạo mới ${entityType}: ${entityId}`,
      afterData: entityData,
      severity: 'medium'
    }, req);
  },

  update: async (user, entityType, entityId, beforeData, afterData, module, req, description = null) => {
    return await createAuditLog({
      user,
      action: `${module}_update`,
      module,
      entityType,
      entityId,
      description: description || `Cập nhật ${entityType}: ${entityId}`,
      beforeData,
      afterData,
      severity: 'medium'
    }, req);
  },

  delete: async (user, entityType, entityId, entityData, module, req, description = null) => {
    return await createAuditLog({
      user,
      action: `${module}_delete`,
      module,
      entityType,
      entityId,
      description: description || `Xóa ${entityType}: ${entityId}`,
      beforeData: entityData,
      severity: 'high'
    }, req);
  }
};

/**
 * Log blockchain operations
 */
const logBlockchain = {
  record: async (user, entityType, entityId, blockchainData, req) => {
    return await createAuditLog({
      user,
      action: 'blockchain_record',
      module: 'blockchain',
      entityType,
      entityId,
      description: `Ghi dữ liệu ${entityType} lên blockchain`,
      afterData: {
        blockchainId: blockchainData.blockchainId,
        transactionHash: blockchainData.transactionHash,
        blockNumber: blockchainData.blockNumber
      },
      severity: 'high'
    }, req);
  },

  verify: async (user, entityType, entityId, verificationResult, req) => {
    return await createAuditLog({
      user,
      action: 'blockchain_verify',
      module: 'blockchain',
      entityType,
      entityId,
      description: `Xác minh ${entityType} trên blockchain`,
      result: verificationResult.isValid ? 'success' : 'failure',
      metadata: {
        isValid: verificationResult.isValid,
        blockchainId: verificationResult.blockchainId
      },
      severity: 'medium'
    }, req);
  }
};

/**
 * Log digital signature operations
 */
const logDigitalSignature = {
  create: async (user, signatureId, signatureData, req) => {
    return await createAuditLog({
      user,
      action: 'signature_create',
      module: 'digital_signature',
      entityType: 'DigitalSignature',
      entityId: signatureId,
      description: `Tạo chữ ký số cho ${signatureData.targetType}`,
      afterData: {
        targetType: signatureData.targetType,
        targetId: signatureData.targetId,
        caProvider: signatureData.caProvider
      },
      severity: 'high'
    }, req);
  },

  verify: async (user, signatureId, verificationResult, req) => {
    return await createAuditLog({
      user,
      action: 'signature_verify',
      module: 'digital_signature',
      entityType: 'DigitalSignature',
      entityId: signatureId,
      description: `Xác thực chữ ký số`,
      result: verificationResult.isValid ? 'success' : 'failure',
      metadata: {
        isValid: verificationResult.isValid,
        reason: verificationResult.reason
      },
      severity: 'medium'
    }, req);
  },

  revoke: async (user, signatureId, reason, req) => {
    return await createAuditLog({
      user,
      action: 'signature_revoke',
      module: 'digital_signature',
      entityType: 'DigitalSignature',
      entityId: signatureId,
      description: `Thu hồi chữ ký số: ${reason}`,
      metadata: { reason },
      severity: 'high'
    }, req);
  }
};

/**
 * Log access denied
 */
const logAccessDenied = async (user, resource, reason, req) => {
  return await createAuditLog({
    user,
    action: 'access_denied',
    module: 'other',
    description: `Truy cập bị từ chối: ${resource} - ${reason}`,
    result: 'failure',
    errorMessage: reason,
    severity: 'high',
    metadata: { resource }
  }, req);
};

module.exports = {
  createAuditLog,
  logAuth,
  logCRUD,
  logBlockchain,
  logDigitalSignature,
  logAccessDenied,
  generateCorrelationId
};

