const auditService = require('../services/auditService');

/**
 * Middleware để tự động ghi audit log cho các request
 * Sử dụng correlation ID để trace request qua các service
 */
const auditMiddleware = (options = {}) => {
  const {
    enabled = true,
    logSuccess = true,
    logFailure = true,
    excludePaths = ['/api/health', '/api/auth/login'],
    excludeMethods = ['GET'] // Mặc định không log GET requests
  } = options;

  return async (req, res, next) => {
    // Skip nếu audit log bị tắt
    if (!enabled) {
      return next();
    }

    // Skip nếu path bị exclude
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip nếu method bị exclude
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    // Generate correlation ID nếu chưa có
    if (!req.correlationId) {
      req.correlationId = auditService.generateCorrelationId();
    }

    // Lưu original res.json để intercept response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    let responseData = null;
    let statusCode = null;

    // Intercept response
    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson(data);
    };

    res.send = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend(data);
    };

    // Ghi log sau khi response được gửi
    res.on('finish', async () => {
      try {
        const user = req.user || null;
        const result = statusCode >= 200 && statusCode < 300 ? 'success' : 'failure';
        
        // Chỉ log nếu thỏa mãn điều kiện
        if ((result === 'success' && logSuccess) || (result === 'failure' && logFailure)) {
          // Xác định module và action từ route
          const module = determineModule(req.path);
          const action = determineAction(req.method, req.path, module);
          
          // Tạo description
          const description = `${req.method} ${req.path} - ${result === 'success' ? 'Thành công' : 'Thất bại'}`;
          
          // Lấy entity info nếu có
          const entityInfo = extractEntityInfo(req);
          
          await auditService.createAuditLog({
            user,
            action,
            module,
            entityType: entityInfo.type,
            entityId: entityInfo.id,
            description,
            result,
            errorMessage: result === 'failure' ? (responseData?.message || 'Unknown error') : null,
            severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
            metadata: {
              statusCode,
              path: req.path,
              method: req.method
            }
          }, req);
        }
      } catch (error) {
        // Không throw error để không làm fail request
        console.error('Error in audit middleware:', error);
      }
    });

    next();
  };
};

/**
 * Xác định module từ path
 */
function determineModule(path) {
  if (path.includes('/auth')) return 'auth';
  if (path.includes('/users')) return 'user';
  if (path.includes('/drugs')) return 'drug';
  if (path.includes('/supply-chain')) return 'supply_chain';
  if (path.includes('/digital-signatures')) return 'digital_signature';
  if (path.includes('/trust-scores')) return 'trust_score';
  if (path.includes('/reviews')) return 'review';
  if (path.includes('/tasks')) return 'task';
  if (path.includes('/notifications')) return 'notification';
  if (path.includes('/settings')) return 'settings';
  if (path.includes('/blockchain')) return 'blockchain';
  if (path.includes('/reports')) return 'report';
  return 'other';
}

/**
 * Xác định action từ method và path
 */
function determineAction(method, path, module) {
  const actionMap = {
    'POST': `${module}_create`,
    'PUT': `${module}_update`,
    'PATCH': `${module}_update`,
    'DELETE': `${module}_delete`
  };
  
  // Special cases
  if (path.includes('/login')) return 'login';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/verify')) return `${module}_verify`;
  if (path.includes('/recall')) return 'drug_recall';
  if (path.includes('/revoke')) return 'signature_revoke';
  if (path.includes('/recalculate')) return 'trust_score_recalculate';
  
  return actionMap[method] || `${module}_action`;
}

/**
 * Extract entity info từ request
 */
function extractEntityInfo(req) {
  // Lấy từ params
  const id = req.params.id || req.params.drugId || req.params.userId || 
             req.params.signatureId || req.params.taskId || null;
  
  // Xác định type từ path
  let type = null;
  if (req.path.includes('/drugs')) type = 'Drug';
  else if (req.path.includes('/users')) type = 'User';
  else if (req.path.includes('/digital-signatures')) type = 'DigitalSignature';
  else if (req.path.includes('/tasks')) type = 'Task';
  else if (req.path.includes('/supply-chain')) type = 'SupplyChain';
  
  return { id, type };
}

module.exports = auditMiddleware;

