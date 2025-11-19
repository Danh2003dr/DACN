const User = require('../models/User');

/**
 * Lấy thông tin profile của user
 * @param {String} userId - ID của user
 * @returns {Promise<Object>} Thông tin user
 * @throws {Error} Nếu user không tồn tại
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User không tồn tại');
  }
  
  // Trả về thông tin profile (không bao gồm password)
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    location: user.location,
    avatar: user.avatar,
    role: user.role,
    organizationId: user.organizationId,
    patientId: user.patientId,
    organizationInfo: user.organizationInfo,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    mustChangePassword: user.mustChangePassword,
    lastLogin: user.lastLogin,
    notificationPreferences: user.notificationPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Cập nhật thông tin profile
 * @param {String} userId - ID của user
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise<Object>} User đã được cập nhật
 * @throws {Error} Nếu user không tồn tại hoặc validation fail
 */
const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User không tồn tại');
  }
  
  // Chỉ cho phép cập nhật các field thuộc hồ sơ cá nhân
  const updateData = {};
  
  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName;
  }
  
  if (data.email !== undefined) {
    updateData.email = data.email.toLowerCase().trim();
  }
  
  if (data.phone !== undefined) {
    updateData.phone = data.phone || null;
  }
  
  if (data.address !== undefined) {
    updateData.address = data.address || null;
  }
  
  // Xử lý location
  if (data.location !== undefined) {
    if (data.location && data.location.coordinates && data.location.address) {
      updateData.location = {
        type: 'Point',
        coordinates: data.location.coordinates, // [longitude, latitude]
        address: data.location.address
      };
    } else if (data.location === null) {
      updateData.location = {
        type: 'Point',
        coordinates: null,
        address: null
      };
    }
  }
  
  // Xử lý organizationInfo
  if (data.organizationInfo !== undefined) {
    if (data.organizationInfo && Object.keys(data.organizationInfo).length > 0) {
      updateData.organizationInfo = {
        name: data.organizationInfo.name || null,
        address: data.organizationInfo.address || null,
        phone: data.organizationInfo.phone || null,
        email: data.organizationInfo.email ? data.organizationInfo.email.toLowerCase().trim() : null
      };
    } else {
      updateData.organizationInfo = {
        name: null,
        address: null,
        phone: null,
        email: null
      };
    }
  }
  
  // Cập nhật user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).lean(); // Dùng lean() để đảm bảo trả về plain object với đầy đủ fields
  
  if (!updatedUser) {
    throw new Error('Không thể cập nhật thông tin user');
  }
  
  // Trả về thông tin đã cập nhật (không bao gồm password)
  return {
    id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    phone: updatedUser.phone,
    address: updatedUser.address,
    location: updatedUser.location,
    avatar: updatedUser.avatar,
    role: updatedUser.role,
    organizationId: updatedUser.organizationId,
    patientId: updatedUser.patientId,
    organizationInfo: updatedUser.organizationInfo,
    isActive: updatedUser.isActive,
    isEmailVerified: updatedUser.isEmailVerified,
    mustChangePassword: updatedUser.mustChangePassword,
    lastLogin: updatedUser.lastLogin,
    notificationPreferences: updatedUser.notificationPreferences,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };
};

/**
 * Upload avatar cho user
 * @param {String} userId - ID của user
 * @param {String} filePath - Đường dẫn file avatar (relative path)
 * @returns {Promise<Object>} User đã được cập nhật avatar
 * @throws {Error} Nếu user không tồn tại
 */
const uploadAvatar = async (userId, filePath) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: filePath },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw new Error('User không tồn tại');
  }
  
  // Trả về thông tin đã cập nhật (không bao gồm password)
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    location: user.location,
    avatar: user.avatar,
    role: user.role,
    organizationId: user.organizationId,
    patientId: user.patientId,
    organizationInfo: user.organizationInfo,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    mustChangePassword: user.mustChangePassword,
    lastLogin: user.lastLogin,
    notificationPreferences: user.notificationPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Đổi mật khẩu cho user
 * @param {String} userId - ID của user
 * @param {Object} data - { currentPassword, newPassword }
 * @returns {Promise<Boolean>} true nếu thành công
 * @throws {Error} Nếu mật khẩu hiện tại không đúng hoặc user không tồn tại
 */
const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data;
  
  // Lấy user với password
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new Error('User không tồn tại');
  }
  
  // Kiểm tra mật khẩu hiện tại
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('Mật khẩu hiện tại không chính xác');
  }
  
  // Cập nhật mật khẩu mới
  user.password = newPassword;
  user.mustChangePassword = false; // Không cần đổi mật khẩu nữa
  await user.save();
  
  return true;
};

/**
 * Cập nhật cài đặt thông báo cho user
 * @param {String} userId - ID của user
 * @param {Object} prefs - { emailEnabled }
 * @returns {Promise<Object>} User đã được cập nhật notificationPreferences
 * @throws {Error} Nếu user không tồn tại
 */
const updateNotificationPreferences = async (userId, prefs) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { 
      notificationPreferences: {
        emailEnabled: prefs.emailEnabled !== undefined ? prefs.emailEnabled : true
      }
    },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw new Error('User không tồn tại');
  }
  
  // Trả về thông tin đã cập nhật (không bao gồm password)
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    location: user.location,
    avatar: user.avatar,
    role: user.role,
    organizationId: user.organizationId,
    patientId: user.patientId,
    organizationInfo: user.organizationInfo,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    mustChangePassword: user.mustChangePassword,
    lastLogin: user.lastLogin,
    notificationPreferences: user.notificationPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  updateNotificationPreferences
};

