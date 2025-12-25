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
  AlertTriangle,
  Cpu,
  HardDrive,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { settingsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [systemInfo, setSystemInfo] = useState({});
  const [blockchainStatus, setBlockchainStatus] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [metricsAlerts, setMetricsAlerts] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showMetricsSection, setShowMetricsSection] = useState(false);

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

  // Auto-refresh metrics
  useEffect(() => {
    if (autoRefresh && showMetricsSection) {
      const interval = setInterval(() => {
        loadMetrics(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, showMetricsSection]);

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
        setMessage(response.message || 'Kết nối blockchain thành công!');
        setMessageType('success');
        // Đợi một chút rồi refresh lại blockchain status để đảm bảo dữ liệu mới nhất
        setTimeout(async () => {
          await loadBlockchainStatus();
        }, 500);
      } else {
        setMessage('Kết nối blockchain thất bại: ' + (response.message || 'Lỗi không xác định'));
        setMessageType('error');
        // Vẫn refresh status để hiển thị trạng thái hiện tại
        await loadBlockchainStatus();
      }
    } catch (error) {
      setMessage('Lỗi khi test kết nối blockchain: ' + (error.response?.data?.message || error.message));
      setMessageType('error');
      // Vẫn refresh status
      await loadBlockchainStatus();
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

  // Load metrics function
  const loadMetrics = async (silent = false) => {
    try {
      if (!silent) {
        setMetricsLoading(true);
      }
      setMetricsError(null);

      const [metricsResponse, alertsResponse] = await Promise.all([
        api.get('/metrics'),
        api.get('/metrics/alerts?limit=10')
      ]);

      if (metricsResponse.data.success) {
        setMetrics(metricsResponse.data.data);
      }

      if (alertsResponse.data.success) {
        setMetricsAlerts(alertsResponse.data.data.alerts || []);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
      const message = err.response?.data?.message || 'Không thể tải dữ liệu metrics';
      setMetricsError(message);
      if (!silent) {
        toast.error(message);
      }
    } finally {
      setMetricsLoading(false);
    }
  };

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format percentage helper
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Math.round(value)}%`;
  };

  // Get alert color helper
  const getAlertColor = (level) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Get usage color helper
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <PageHeader
          title="Cài đặt Hệ thống"
          subtitle="Quản lý cấu hình và tùy chọn hệ thống"
        />
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
              <Button
                type="button"
                variant="purple"
                onClick={testBlockchainConnection}
                disabled={loading}
                leftIcon={Activity}
              >
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </Button>
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

          {/* System Metrics Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Collapsible Header */}
            <button
              onClick={() => {
                if (!showMetricsSection) {
                  loadMetrics(); // Load metrics when opening
                }
                setShowMetricsSection(!showMetricsSection);
              }}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-gray-900">System Metrics</h2>
                  <p className="text-sm text-gray-500">Theo dõi hiệu suất và tình trạng hệ thống</p>
                </div>
              </div>
              {showMetricsSection ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showMetricsSection && (
              <div className="p-6 border-t border-gray-200 space-y-6">
                {/* Controls */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant={autoRefresh ? 'success' : 'secondary'}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    {autoRefresh ? 'Tự động làm mới: BẬT' : 'Tự động làm mới: TẮT'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => loadMetrics()}
                    disabled={metricsLoading}
                    leftIcon={RefreshCw}
                  >
                    Làm mới
                  </Button>
                </div>

                {/* Error Message */}
                {metricsError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{metricsError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                {metrics?.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* CPU Usage */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">CPU Usage</p>
                          <p className={`text-2xl font-semibold mt-2 ${getUsageColor(metrics.summary.cpu?.usage || 0)}`}>
                            {formatPercentage(metrics.summary.cpu?.usage)}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Memory Usage</p>
                          <p className={`text-2xl font-semibold mt-2 ${getUsageColor(metrics.summary.memory?.usage || 0)}`}>
                            {formatPercentage(metrics.summary.memory?.usage)}
                          </p>
                          {metrics.summary.memory && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatBytes(metrics.summary.memory.used)} / {formatBytes(metrics.summary.memory.total)}
                            </p>
                          )}
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </div>

                    {/* Disk Usage */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Disk Usage</p>
                          <p className={`text-2xl font-semibold mt-2 ${getUsageColor(metrics.summary.disk?.usage || 0)}`}>
                            {formatPercentage(metrics.summary.disk?.usage)}
                          </p>
                          {metrics.summary.disk && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatBytes(metrics.summary.disk.used)} / {formatBytes(metrics.summary.disk.total)}
                            </p>
                          )}
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    {/* Uptime */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Uptime</p>
                          <p className="text-2xl font-semibold mt-2 text-gray-900">
                            {metrics.summary.uptime ? `${Math.floor(metrics.summary.uptime / 3600)}h` : 'N/A'}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance & System Info */}
                {metrics?.full && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Performance Metrics */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                        Performance Metrics
                      </h3>
                      {metrics.full.performance ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Request Rate</span>
                            <span className="font-medium text-gray-900">
                              {metrics.full.performance.requestRate ? `${metrics.full.performance.requestRate.toFixed(2)} req/s` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Response Time (avg)</span>
                            <span className="font-medium text-gray-900">
                              {metrics.full.performance.responseTime ? `${metrics.full.performance.responseTime.toFixed(2)} ms` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Error Rate</span>
                            <span className={`font-medium ${metrics.full.performance.errorRate > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPercentage(metrics.full.performance.errorRate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Requests</span>
                            <span className="font-medium text-gray-900">
                              {metrics.full.performance.totalRequests ? metrics.full.performance.totalRequests.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Chưa có dữ liệu performance</p>
                      )}
                    </div>

                    {/* System Information */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <Server className="w-5 h-5 mr-2 text-green-600" />
                        System Information
                      </h3>
                      {metrics.full.system ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Platform</span>
                            <span className="font-medium text-gray-900">{metrics.full.system.platform || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Node Version</span>
                            <span className="font-medium text-gray-900">{metrics.full.system.nodeVersion || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Environment</span>
                            <span className="font-medium text-gray-900">{metrics.full.system.env || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Chưa có dữ liệu system</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Alerts */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                    Recent Alerts
                  </h3>
                  {metricsAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {metricsAlerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 ${getAlertColor(alert.level)}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold uppercase text-xs">{alert.level}</span>
                                <span className="text-xs opacity-75">
                                  {alert.timestamp ? new Date(alert.timestamp).toLocaleString('vi-VN') : 'N/A'}
                                </span>
                              </div>
                              <p className="font-medium text-sm">{alert.message || alert.title}</p>
                              {alert.details && (
                                <p className="text-xs mt-1 opacity-90">{alert.details}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Không có cảnh báo nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                  systemInfo.databaseStatus === 'connected' 
                    ? 'text-green-600' 
                    : systemInfo.databaseStatus === 'connecting' || systemInfo.databaseStatus === 'disconnecting'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {systemInfo.databaseStatus === 'connected' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : systemInfo.databaseStatus === 'connecting' || systemInfo.databaseStatus === 'disconnecting' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {systemInfo.databaseStatus === 'connected' 
                    ? 'Kết nối' 
                    : systemInfo.databaseStatus === 'connecting'
                    ? 'Đang kết nối'
                    : systemInfo.databaseStatus === 'disconnecting'
                    ? 'Đang ngắt kết nối'
                    : 'Ngắt kết nối'}
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
