const User = require('../models/User');
const { USER_ROLES } = require('../models/User');

// @desc    Lấy danh sách tất cả users (chỉ Admin)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;
    
    // Tạo filter
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organizationId: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Tính toán pagination
    const skip = (page - 1) * limit;
    
    // Query users
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users.',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin user theo ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user.'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== USER_ROLES.ADMIN && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin user này.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user.',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin user (chỉ Admin hoặc chính user đó)
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { fullName, phone, address, organizationInfo, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user.'
      });
    }
    
    // Kiểm tra quyền cập nhật
    if (req.user.role !== USER_ROLES.ADMIN && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật user này.'
      });
    }
    
    // Chỉ Admin mới có thể cập nhật isActive
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (organizationInfo) updateData.organizationInfo = organizationInfo;
    if (req.user.role === USER_ROLES.ADMIN && isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật user thành công.',
      data: { user: updatedUser }
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
      message: 'Lỗi server khi cập nhật user.',
      error: error.message
    });
  }
};

// @desc    Xóa user (chỉ Admin)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user.'
      });
    }
    
    // Không cho phép xóa chính mình
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính mình.'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa user thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user.',
      error: error.message
    });
  }
};

// @desc    Khóa/Mở khóa tài khoản user (chỉ Admin)
// @route   PUT /api/users/:id/toggle-lock
// @access  Private (Admin only)
const toggleUserLock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user.'
      });
    }
    
    // Không cho phép khóa chính mình
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể khóa tài khoản của chính mình.'
      });
    }
    
    // Toggle isActive
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản thành công.`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          isActive: user.isActive
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái user.',
      error: error.message
    });
  }
};

// @desc    Reset mật khẩu user (chỉ Admin)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu mới.'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user.'
      });
    }
    
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.mustChangePassword = true; // Bắt buộc đổi mật khẩu lần đầu
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Reset mật khẩu thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          mustChangePassword: user.mustChangePassword
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi reset mật khẩu.',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê users
// @route   GET /api/users/stats
// @access  Private (Admin only)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const lockedUsers = await User.countDocuments({ isActive: false });
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentUsers = await User.find()
      .select('username fullName role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        locked: lockedUsers,
        byRole: usersByRole,
        recent: recentUsers
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê users.',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách users theo tổ chức
// @route   GET /api/users/organization/:organizationId
// @access  Private
const getUsersByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== USER_ROLES.ADMIN && req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xem users của tổ chức mình.'
      });
    }
    
    const users = await User.find({ organizationId })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { users }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy users theo tổ chức.',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserLock,
  resetUserPassword,
  getUserStats,
  getUsersByOrganization
};
