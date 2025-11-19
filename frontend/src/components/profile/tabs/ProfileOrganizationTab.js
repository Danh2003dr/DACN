import React, { useState, useEffect } from 'react';
import { updateProfile } from '../../../api/profileApi';

const ProfileOrganizationTab = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.organizationInfo?.name || '',
    address: user?.organizationInfo?.address || '',
    email: user?.organizationInfo?.email || '',
    phone: user?.organizationInfo?.phone || ''
  });

  // Reset form khi user thay đổi
  useEffect(() => {
    setFormData({
      name: user?.organizationInfo?.name || '',
      address: user?.organizationInfo?.address || '',
      email: user?.organizationInfo?.email || '',
      phone: user?.organizationInfo?.phone || ''
    });
  }, [user]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email format nếu có
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Email tổ chức không hợp lệ');
        return;
      }
    }

    // Validate phone format nếu có (10-11 chữ số)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Số điện thoại tổ chức phải có 10-11 chữ số');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await updateProfile({
        organizationInfo: {
          name: formData.name.trim() || null,
          address: formData.address.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null
        }
      });

      if (response.success && response.data.user) {
        // Cập nhật user data
        if (onUpdate) {
          onUpdate(response.data.user);
        }
        setIsEditing(false);
      } else {
        setError('Cập nhật thông tin tổ chức thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.join(', ') || 
                          'Đã xảy ra lỗi khi cập nhật thông tin tổ chức';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Hủy chỉnh sửa
  const handleCancel = () => {
    setFormData({
      name: user?.organizationInfo?.name || '',
      address: user?.organizationInfo?.address || '',
      email: user?.organizationInfo?.email || '',
      phone: user?.organizationInfo?.phone || ''
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Thông tin tổ chức</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tên tổ chức */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Tên tổ chức
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            placeholder="Nhập tên tổ chức"
          />
        </div>

        {/* Địa chỉ tổ chức */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ tổ chức
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            placeholder="Nhập địa chỉ tổ chức"
          />
        </div>

        {/* Email tổ chức */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email tổ chức
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            placeholder="Nhập email tổ chức"
          />
        </div>

        {/* Số điện thoại tổ chức */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại tổ chức
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            placeholder="Nhập số điện thoại tổ chức (10-11 chữ số)"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Action buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </span>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Hủy
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileOrganizationTab;

