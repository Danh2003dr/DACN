import React, { useState, useEffect } from 'react';
import { updateNotificationPreferences } from '../../../api/profileApi';

const ProfileNotificationTab = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(
    user?.notificationPreferences?.emailEnabled ?? true
  );

  // Cập nhật state khi user thay đổi
  useEffect(() => {
    setEmailEnabled(user?.notificationPreferences?.emailEnabled ?? true);
  }, [user]);

  // Xử lý toggle switch
  const handleToggle = async (e) => {
    const newValue = e.target.checked;
    setEmailEnabled(newValue);
    setError(null);
    setSuccess(false);

    try {
      setLoading(true);

      const response = await updateNotificationPreferences({
        emailEnabled: newValue
      });

      if (response.success && response.data.user) {
        // Cập nhật user data
        if (onUpdate) {
          onUpdate(response.data.user);
        }
        setSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError('Cập nhật cài đặt thông báo thất bại. Vui lòng thử lại.');
        // Revert toggle on error
        setEmailEnabled(!newValue);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.join(', ') || 
                          'Đã xảy ra lỗi khi cập nhật cài đặt thông báo';
      setError(errorMessage);
      // Revert toggle on error
      setEmailEnabled(!newValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cài đặt thông báo</h2>
        <p className="text-sm text-gray-600">
          Quản lý cách bạn nhận thông báo từ hệ thống.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label htmlFor="emailEnabled" className="block text-sm font-medium text-gray-900 mb-1">
                Nhận thông báo qua email
              </label>
              <p className="text-sm text-gray-500">
                Bật để nhận thông báo quan trọng qua email
              </p>
            </div>
            <div className="ml-4">
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  checked={emailEnabled}
                  onChange={handleToggle}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Cập nhật cài đặt thông báo thành công!
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang cập nhật...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileNotificationTab;

