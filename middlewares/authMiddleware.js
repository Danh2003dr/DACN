const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware xác thực JWT token
 * - Lấy token từ Authorization Bearer header
 * - Verify JWT token
 * - Gán req.user với thông tin user
 * - Trả về 401 nếu token không hợp lệ
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Lấy token từ header Authorization Bearer
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
      // Verify JWT token
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
      
      // Gán req.user với thông tin user (không bao gồm password)
      req.user = {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        patientId: user.patientId,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        mustChangePassword: user.mustChangePassword
      };
      
      next();
      
    } catch (error) {
      // JWT verification failed
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ.'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
        });
      }
      
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

module.exports = authenticate;

