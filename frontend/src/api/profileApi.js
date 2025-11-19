import axiosClient from './axiosClient';

/**
 * API functions cho module Quản lý Hồ sơ Cá nhân
 */

/**
 * Lấy thông tin profile của user hiện tại
 * @returns {Promise} Response từ API
 */
export const getProfile = async () => {
  const response = await axiosClient.get('/auth/me');
  return response.data;
};

/**
 * Cập nhật thông tin profile
 * @param {Object} data - Dữ liệu cập nhật
 * @param {string} data.fullName - Họ tên
 * @param {string} data.email - Email
 * @param {string} data.phone - Số điện thoại
 * @param {string} data.address - Địa chỉ
 * @param {Object} data.location - Thông tin vị trí { coordinates: [lng, lat], address: string }
 * @param {Object} data.organizationInfo - Thông tin tổ chức { name, address, phone, email }
 * @returns {Promise} Response từ API
 */
export const updateProfile = async (data) => {
  const response = await axiosClient.put('/auth/update-profile', data);
  return response.data;
};

/**
 * Upload avatar cho user
 * @param {FormData} formData - FormData chứa file avatar (field name: 'avatar')
 * @returns {Promise} Response từ API
 */
export const uploadAvatar = async (formData) => {
  const response = await axiosClient.post('/auth/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Đổi mật khẩu
 * @param {Object} data - Dữ liệu đổi mật khẩu
 * @param {string} data.currentPassword - Mật khẩu hiện tại
 * @param {string} data.newPassword - Mật khẩu mới
 * @param {string} data.confirmPassword - Xác nhận mật khẩu mới
 * @returns {Promise} Response từ API
 */
export const changePassword = async (data) => {
  const response = await axiosClient.put('/auth/change-password', data);
  return response.data;
};

/**
 * Cập nhật cài đặt thông báo
 * @param {Object} data - Dữ liệu cài đặt
 * @param {boolean} data.emailEnabled - Bật/tắt nhận thông báo qua email
 * @returns {Promise} Response từ API
 */
export const updateNotificationPreferences = async (data) => {
  const response = await axiosClient.patch('/auth/notification-preferences', data);
  return response.data;
};

