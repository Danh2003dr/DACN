const User = require('../models/User');

// @desc    Google OAuth callback handler
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
    }
    
    // Tạo JWT token
    const token = user.generateAuthToken();
    
    // Redirect về frontend với token
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true`);
    
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

// @desc    Google OAuth success handler
// @route   GET /api/auth/google/success
// @access  Public
const googleSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không thể xác thực với Google'
      });
    }
    
    const user = req.user;
    const token = user.generateAuthToken();
    
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      patientId: user.patientId,
      organizationInfo: user.organizationInfo,
      mustChangePassword: user.mustChangePassword,
      lastLogin: user.lastLogin,
      authProvider: user.authProvider
    };
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công.',
      data: {
        user: userInfo,
        token: token
      }
    });
    
  } catch (error) {
    console.error('Google success error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý đăng nhập Google.',
      error: error.message
    });
  }
};

// @desc    Google OAuth failure handler
// @route   GET /api/auth/google/failure
// @access  Public
const googleFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.'
  });
};

module.exports = {
  googleCallback,
  googleSuccess,
  googleFailure
};

