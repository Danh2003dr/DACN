const profileService = require('../services/profileService');

/**
 * @desc    Lấy thông tin profile của user hiện tại
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await profileService.getProfile(userId);
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    if (error.message === 'User không tồn tại') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile.',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật thông tin profile
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Chuẩn bị dữ liệu từ request body
    const data = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      location: req.body.location,
      organizationInfo: req.body.organizationInfo
    };
    
    // Xử lý location nếu có (có thể là string hoặc object)
    if (req.body.location) {
      try {
        const locationData = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;
        
        // Nếu frontend gửi {lng, lat, address}, chuyển thành {coordinates, address}
        if (locationData.lng !== undefined && locationData.lat !== undefined) {
          data.location = {
            coordinates: [locationData.lng, locationData.lat],
            address: locationData.address || null
          };
        } else if (locationData.coordinates && locationData.address) {
          data.location = locationData;
        }
      } catch (e) {
        // Nếu parse JSON fail, bỏ qua location
        console.error('Error parsing location data:', e);
      }
    }
    
    const user = await profileService.updateProfile(userId, data);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: {
        user
      }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }
    
    if (error.message === 'User không tồn tại') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    // Xử lý lỗi duplicate key (email đã tồn tại)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} đã tồn tại trong hệ thống.`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin.',
      error: error.message
    });
  }
};

/**
 * @desc    Upload avatar cho user
 * @route   POST /api/profile/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh.'
      });
    }
    
    // Đường dẫn file (relative path)
    const filePath = `/uploads/avatars/${req.file.filename}`;
    
    const user = await profileService.uploadAvatar(userId, filePath);
    
    res.status(200).json({
      success: true,
      message: 'Upload avatar thành công.',
      data: {
        user
      }
    });
    
  } catch (error) {
    if (error.message === 'User không tồn tại') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload avatar.',
      error: error.message
    });
  }
};

/**
 * @desc    Đổi mật khẩu
 * @route   PUT /api/profile/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    const data = {
      currentPassword,
      newPassword
    };
    
    await profileService.changePassword(userId, data);
    
    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
    
  } catch (error) {
    if (error.message === 'User không tồn tại') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Mật khẩu hiện tại không chính xác') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu.',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật cài đặt thông báo
 * @route   PATCH /api/profile/notification-preferences
 * @access  Private
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailEnabled } = req.body;
    
    const prefs = {
      emailEnabled
    };
    
    const user = await profileService.updateNotificationPreferences(userId, prefs);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt thông báo thành công.',
      data: {
        user
      }
    });
    
  } catch (error) {
    if (error.message === 'User không tồn tại') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật cài đặt thông báo.',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  updateNotificationPreferences
};

