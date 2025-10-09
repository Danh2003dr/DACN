import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Database,
  Shield,
  Globe,
  Bell,
  Key,
  Server,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { settingsAPI } from '../utils/api';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [systemInfo, setSystemInfo] = useState({});
  const [blockchainStatus, setBlockchainStatus] = useState({});

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Load system settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response.success) {
        const settings = response.data;
        setValue('systemName', settings.systemName || 'Drug Traceability Blockchain System');
        setValue('companyName', settings.companyName || '');
        setValue('companyAddress', settings.companyAddress || '');
        setValue('companyPhone', settings.companyPhone || '');
        setValue('companyEmail', settings.companyEmail || '');
        setValue('blockchainNetwork', settings.blockchainNetwork || 'sepolia');
        setValue('blockchainProvider', settings.blockchainProvider || 'infura');
        setValue('notificationEmail', settings.notificationEmail || '');
        setValue('backupFrequency', settings.backupFrequency || 'daily');
        setValue('sessionTimeout', settings.sessionTimeout || 60);
        setValue('maxLoginAttempts', settings.maxLoginAttempts || 5);
        setValue('passwordMinLength', settings.passwordMinLength || 8);
        setValue('requireSpecialChars', settings.requireSpecialChars || true);
        setValue('enableTwoFactor', settings.enableTwoFactor || false);
        setValue('enableAuditLog', settings.enableAuditLog || true);
        setValue('enableEmailNotifications', settings.enableEmailNotifications || true);
        setValue('enableSMSNotifications', settings.enableSMSNotifications || false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Không thể tải cài đặt hệ thống');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Load system information
  const loadSystemInfo = async () => {
    try {
      const response = await settingsAPI.getSystemInfo();
      setSystemInfo(response.data);
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  };

  // Load blockchain status
  const loadBlockchainStatus = async () => {
    try {
      const response = await settingsAPI.getBlockchainStatus();
      setBlockchainStatus(response.data);
    } catch (error) {
      console.error('Error loading blockchain status:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
    loadBlockchainStatus();
  }, []);

  // Save settings
  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateSettings(data);
      if (response.success) {
        setMessage('Cài đặt đã được lưu thành công!');
        setMessageType('success');
        setTimeout(() => {
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      setMessage('Không thể lưu cài đặt');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  // Test blockchain connection
  const testBlockchainConnection = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.testBlockchainConnection();
      if (response.success) {
        setMessage('Kết nối blockchain thành công!');
        setMessageType('success');
        loadBlockchainStatus();
      } else {
        setMessage('Kết nối blockchain thất bại: ' + response.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Lỗi khi test kết nối blockchain');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn reset về cài đặt mặc định?')) {
      return;
    }
    try {
      setLoading(true);
      const response = await settingsAPI.resetToDefaults();
      if (response.success) {
        setMessage('Đã reset về cài đặt mặc định');
        setMessageType('success');
        loadSettings();
      }
    } catch (error) {
      setMessage('Không thể reset cài đặt');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt Hệ thống</h1>
        </div>
        <p className="text-gray-600">Quản lý cấu hình và tùy chọn hệ thống</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Thông tin Hệ thống</h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hệ thống
                  </label>
                  <input
                    type="text"
                    {...register('systemName', { required: 'Tên hệ thống là bắt buộc' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Drug Traceability Blockchain System"
                  />
                  {errors.systemName && (
                    <p className="text-red-500 text-sm mt-1">{errors.systemName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên công ty
                  </label>
                  <input
                    type="text"
                    {...register('companyName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên công ty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    {...register('companyAddress')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Địa chỉ công ty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    {...register('companyPhone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Số điện thoại"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('companyEmail')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email công ty"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Blockchain Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Cài đặt Blockchain</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mạng Blockchain
                </label>
                <select
                  {...register('blockchainNetwork')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sepolia">Sepolia Testnet</option>
                  <option value="mainnet">Ethereum Mainnet</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BSC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  {...register('blockchainProvider')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="infura">Infura</option>
                  <option value="alchemy">Alchemy</option>
                  <option value="ganache">Ganache (Local)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={testBlockchainConnection}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                <Activity className="w-4 h-4" />
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Bảo mật</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout phiên (phút)
                </label>
                <input
                  type="number"
                  {...register('sessionTimeout', { min: 5, max: 480 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lần đăng nhập tối đa
                </label>
                <input
                  type="number"
                  {...register('maxLoginAttempts', { min: 3, max: 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Độ dài mật khẩu tối thiểu
                </label>
                <input
                  type="number"
                  {...register('passwordMinLength', { min: 6, max: 20 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('requireSpecialChars')}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Yêu cầu ký tự đặc biệt
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('enableTwoFactor')}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Bật xác thực 2 yếu tố
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('enableAuditLog')}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Bật nhật ký kiểm tra
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Thông báo</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email thông báo
                </label>
                <input
                  type="email"
                  {...register('notificationEmail')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tần suất sao lưu
                </label>
                <select
                  {...register('backupFrequency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hàng giờ</option>
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="monthly">Hàng tháng</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('enableEmailNotifications')}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Bật thông báo email
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('enableSMSNotifications')}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Bật thông báo SMS
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>

            <button
              type="button"
              onClick={resetToDefaults}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Reset mặc định
            </button>
          </div>
        </div>

        {/* System Status Sidebar */}
        <div className="space-y-6">
          {/* System Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Thông tin Hệ thống</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phiên bản:</span>
                <span className="text-sm font-medium">{systemInfo.version || '1.0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime:</span>
                <span className="text-sm font-medium">{systemInfo.uptime || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database:</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  systemInfo.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemInfo.databaseStatus === 'connected' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {systemInfo.databaseStatus === 'connected' ? 'Kết nối' : 'Lỗi'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Memory:</span>
                <span className="text-sm font-medium">{systemInfo.memoryUsage || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Blockchain</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  blockchainStatus.connected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {blockchainStatus.connected ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {blockchainStatus.connected ? 'Kết nối' : 'Ngắt kết nối'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mạng:</span>
                <span className="text-sm font-medium">{blockchainStatus.network || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Block hiện tại:</span>
                <span className="text-sm font-medium">{blockchainStatus.currentBlock || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gas Price:</span>
                <span className="text-sm font-medium">{blockchainStatus.gasPrice || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={loadSettings}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới cài đặt
              </button>
              
              <button
                onClick={loadSystemInfo}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md"
              >
                <Database className="w-4 h-4" />
                Kiểm tra hệ thống
              </button>
              
              <button
                onClick={testBlockchainConnection}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md"
              >
                <Globe className="w-4 h-4" />
                Test Blockchain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
