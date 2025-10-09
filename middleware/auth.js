const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');

// Middleware xác thực JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Lấy token từ header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực. Vui lòng đăng nhập để truy cập tài nguyên này.'
      });
    }
    
    try {
      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Tìm user từ token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ. Người dùng không tồn tại.'
        });
      }
      
      // Kiểm tra tài khoản có bị khóa không
      if (user.isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần.'
        });
      }
      
      // Kiểm tra tài khoản có bị vô hiệu hóa không
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa.'
        });
      }
      
      // Thêm thông tin user vào request
      req.user = user;
      next();
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }
    
  } catch (error) {
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
    
    if (!roles.includes(req.user.role)) {
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
