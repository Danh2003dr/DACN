const User = require('../models/User');
const { USER_ROLES } = require('../models/User');

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin đăng nhập.'
      });
    }
    
    // Tìm user và xác thực
    const user = await User.findByCredentials(identifier, password);
    
    // Tạo JWT token
    const token = user.generateAuthToken();
    
    // Thông tin user để trả về (không bao gồm password)
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
      lastLogin: user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        user: userInfo,
        token: token
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Đăng ký tài khoản mới (chỉ Admin)
// @route   POST /api/auth/register
// @access  Private (Admin only)
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      address,
      role,
      organizationId,
      patientId,
      organizationInfo
    } = req.body;
    
    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email },
        { organizationId: organizationId },
        { patientId: patientId }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã tồn tại với thông tin này.'
      });
    }
    
    // Tạo user mới
    const userData = {
      username,
      email,
      password,
      fullName,
      phone,
      address,
      role,
      organizationId,
      patientId,
      organizationInfo,
      mustChangePassword: true,
      createdBy: req.user._id
    };
    
    const user = await User.create(userData);
    
    // Tạo token cho user mới
    const token = user.generateAuthToken();
    
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          patientId: user.patientId
        },
        token: token
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
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản.',
      error: error.message
    });
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin.'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }
    
    // Lấy user với password
    const user = await User.findById(req.user._id).select('+password');
    
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.'
      });
    }
    
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.mustChangePassword = false; // Không cần đổi mật khẩu nữa
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu.',
      error: error.message
    });
  }
};

// @desc    Đổi mật khẩu lần đầu (sau khi đăng nhập với mật khẩu mặc định)
// @route   PUT /api/auth/first-change-password
// @access  Private
const firstChangePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin.'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }
    
    // Kiểm tra user có phải đổi mật khẩu lần đầu không
    if (!req.user.mustChangePassword) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đổi mật khẩu rồi.'
      });
    }
    
    // Cập nhật mật khẩu mới
    const user = await User.findById(req.user._id);
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu lần đầu thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu.',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          fullAddress: user.fullAddress,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
          organizationId: user.organizationId,
          patientId: user.patientId,
          organizationInfo: user.organizationInfo,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          mustChangePassword: user.mustChangePassword,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user.',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, address, organizationInfo } = req.body;
    
    const updateData = {};
    
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    
    // Parse organizationInfo if it's a JSON string
    if (organizationInfo) {
      try {
        updateData.organizationInfo = typeof organizationInfo === 'string' 
          ? JSON.parse(organizationInfo) 
          : organizationInfo;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin tổ chức không hợp lệ.'
        });
      }
    }
    
    // Xử lý avatar nếu có
    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Xử lý tọa độ địa chỉ nếu có
    if (req.body.location) {
      try {
        const locationData = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;
        
        if (locationData.coordinates && locationData.address) {
          updateData.location = {
            type: 'Point',
            coordinates: [locationData.lng, locationData.lat], // MongoDB GeoJSON format: [lng, lat]
            address: locationData.address
          };
        }
      } catch (e) {
        console.error('Error parsing location data:', e);
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          fullAddress: user.fullAddress,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
          organizationId: user.organizationId,
          patientId: user.patientId,
          organizationInfo: user.organizationInfo
        }
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
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin.',
      error: error.message
    });
  }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Trong thực tế, có thể blacklist token hoặc lưu vào database
    // Ở đây chỉ trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất.',
      error: error.message
    });
  }
};

// @desc    Tạo tài khoản mặc định cho demo
// @route   POST /api/auth/create-default-accounts
// @access  Private (Admin only)
const createDefaultAccounts = async (req, res) => {
  try {
    const defaultAccounts = [
      { role: USER_ROLES.ADMIN, identifier: 'admin' },
      { role: USER_ROLES.MANUFACTURER, identifier: 'manufacturer1' },
      { role: USER_ROLES.DISTRIBUTOR, identifier: 'distributor1' },
      { role: USER_ROLES.HOSPITAL, identifier: 'hospital1' },
      { role: USER_ROLES.PATIENT, identifier: 'patient1' }
    ];
    
    const createdAccounts = [];
    
    for (const account of defaultAccounts) {
      try {
        const user = await User.createDefaultAccount(account.role, account.identifier);
        createdAccounts.push({
          username: user.username,
          role: user.role,
          organizationId: user.organizationId,
          patientId: user.patientId
        });
      } catch (error) {
        // Tài khoản đã tồn tại
        console.log(`Account ${account.identifier} already exists`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản mặc định thành công.',
      data: {
        accounts: createdAccounts
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản mặc định.',
      error: error.message
    });
  }
};

// Upload avatar only
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh đại diện.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: `/uploads/avatars/${req.file.filename}` },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          fullAddress: user.fullAddress,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
          organizationId: user.organizationId,
          patientId: user.patientId,
          organizationInfo: user.organizationInfo
        }
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật ảnh đại diện.'
    });
  }
};

module.exports = {
  login,
  register,
  changePassword,
  firstChangePassword,
  getMe,
  updateProfile,
  uploadAvatar,
  logout,
  createDefaultAccounts
};
