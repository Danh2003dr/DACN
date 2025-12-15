const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');
const fs = require('fs');
const path = require('path');
// Debug logging helper
const debugLog = (data) => { try { fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug.log'), JSON.stringify(data) + '\n'); } catch(e) {} };

// Middleware xác thực JWT token
const authenticate = async (req, res, next) => {
  // Khai báo isBidsPost một lần ở đầu function để dùng lại
  const isBidsPost = req.originalUrl?.includes('/bids') && req.method === 'POST';
  const isBidsRoute = req.originalUrl?.includes('/bids') || req.path?.includes('/bids');
  
  // #region agent log
  if (isBidsRoute) {
    debugLog({location:'middleware/auth.js:6',message:'Authenticate middleware called for bids route',data:{path:req.path,originalUrl:req.originalUrl,hasAuthHeader:!!req.headers?.authorization,method:req.method,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'});
  }
  // #endregion
  try {
    let token;
    
    // Lấy token từ header Authorization (ưu tiên)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Nếu không có trong header, thử lấy từ query parameter (cho SSE/EventSource)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }
    
    // Kiểm tra token có tồn tại không
    if (!token) {
      // Nếu là SSE request, trả về lỗi dạng event stream
      if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
        res.status(401);
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ error: 'Unauthorized', message: 'Không có token xác thực' })}\n\n`);
        return res.end();
      }
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực. Vui lòng đăng nhập để truy cập tài nguyên này.'
      });
    }
    
    try {
      // Xác thực token
      // #region agent log
      if (isBidsPost) {
        debugLog({location:'middleware/auth.js:43',message:'Before jwt.verify',data:{hasToken:!!token,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
      }
      // #endregion
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // #region agent log
      if (isBidsPost) {
        debugLog({location:'middleware/auth.js:46',message:'After jwt.verify, before User.findById',data:{decodedId:decoded?.id,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
      }
      // #endregion
      
      // Tìm user từ token
      const user = await User.findById(decoded.id);
      // #region agent log
      if (isBidsPost) {
        debugLog({location:'middleware/auth.js:50',message:'After User.findById',data:{userFound:!!user,userId:user?._id?.toString(),userActive:user?.isActive,userLocked:user?.isLocked,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
      }
      // #endregion
      
      if (!user) {
        // Nếu là SSE request, trả về lỗi dạng event stream
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          res.status(401);
          res.setHeader('Content-Type', 'text/event-stream');
          res.write(`data: ${JSON.stringify({ error: 'Unauthorized', message: 'Token không hợp lệ' })}\n\n`);
          return res.end();
        }
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ. Người dùng không tồn tại.'
        });
      }
      
      // Kiểm tra tài khoản có bị khóa không
      if (user.isLocked) {
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          res.status(401);
          res.setHeader('Content-Type', 'text/event-stream');
          res.write(`data: ${JSON.stringify({ error: 'Unauthorized', message: 'Tài khoản đã bị khóa' })}\n\n`);
          return res.end();
        }
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần.'
        });
      }
      
      // Kiểm tra tài khoản có bị vô hiệu hóa không
      if (!user.isActive) {
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          res.status(401);
          res.setHeader('Content-Type', 'text/event-stream');
          res.write(`data: ${JSON.stringify({ error: 'Unauthorized', message: 'Tài khoản đã bị vô hiệu hóa' })}\n\n`);
          return res.end();
        }
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa.'
        });
      }
      
      // Thêm thông tin user vào request
      req.user = user;
      // #region agent log
      if (isBidsPost) {
        debugLog({location:'middleware/auth.js:91',message:'Auth middleware calling next() for POST /bids',data:{userId:user?._id?.toString(),userRole:user?.role,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
      }
      // #endregion
      next();
      
    } catch (error) {
      // #region agent log
      if (isBidsPost) {
        debugLog({location:'middleware/auth.js:93',message:'Auth middleware inner catch error',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,500),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
      }
      // #endregion
      // Nếu là SSE request, trả về lỗi dạng event stream
      if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
        res.status(401);
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ error: 'Unauthorized', message: 'Token không hợp lệ hoặc đã hết hạn' })}\n\n`);
        return res.end();
      }
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }
    
  } catch (error) {
    // #region agent log
    if (isBidsPost) {
      debugLog({location:'middleware/auth.js:107',message:'Auth middleware outer catch error',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,500),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
    }
    // #endregion
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực.',
      error: error.message
    });
  }
};

// Middleware kiểm tra quyền truy cập theo vai trò
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập tài nguyên này.'
      });
    }
    
    // Flatten roles array in case arrays are passed
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò ${req.user.role} không có quyền truy cập tài nguyên này.`
      });
    }
    
    next();
  };
};

// Middleware kiểm tra quyền cụ thể
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập tài nguyên này.'
      });
    }
    
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền ${permission}.`
      });
    }
    
    next();
  };
};

// Middleware kiểm tra tài khoản có phải đổi mật khẩu lần đầu không
const requirePasswordChange = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để truy cập tài nguyên này.'
    });
  }
  
  if (req.user.mustChangePassword) {
    return res.status(403).json({
      success: false,
      message: 'Bạn phải đổi mật khẩu lần đầu trước khi sử dụng hệ thống.',
      code: 'MUST_CHANGE_PASSWORD'
    });
  }
  
  next();
};

// Middleware kiểm tra quyền truy cập tài nguyên của chính user đó
const checkOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để truy cập tài nguyên này.'
    });
  }
  
  const resourceUserId = req.params.userId || req.params.id;
  
  // Admin có thể truy cập tất cả
  if (req.user.role === USER_ROLES.ADMIN) {
    return next();
  }
  
  // User chỉ có thể truy cập tài nguyên của chính mình
  if (resourceUserId && resourceUserId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Bạn chỉ có thể truy cập tài nguyên của chính mình.'
    });
  }
  
  next();
};

// Middleware kiểm tra quyền truy cập theo tổ chức
const checkOrganizationAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để truy cập tài nguyên này.'
    });
  }
  
  // Admin có thể truy cập tất cả
  if (req.user.role === USER_ROLES.ADMIN) {
    return next();
  }
  
  const resourceOrgId = req.params.organizationId;
  
  // Kiểm tra user có cùng tổ chức với resource không
  if (resourceOrgId && req.user.organizationId !== resourceOrgId) {
    return res.status(403).json({
      success: false,
      message: 'Bạn chỉ có thể truy cập tài nguyên của tổ chức mình.'
    });
  }
  
  next();
};

// Middleware bảo vệ các route nhạy cảm
const protectSensitiveRoutes = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để truy cập tài nguyên này.'
    });
  }
  
  // Chỉ admin mới có thể truy cập các route nhạy cảm
  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ quản trị viên mới có thể truy cập tài nguyên này.'
    });
  }
  
  next();
};

// Middleware kiểm tra rate limiting (tùy chọn)
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Xóa các request cũ
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
      });
    }
    
    userRequests.push(now);
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  requirePasswordChange,
  checkOwnership,
  checkOrganizationAccess,
  protectSensitiveRoutes,
  rateLimit
};
