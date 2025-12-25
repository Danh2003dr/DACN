import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Metrics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadMetrics(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMetrics = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const [metricsResponse, alertsResponse] = await Promise.all([
        api.get('/metrics'),
        api.get('/metrics/alerts?limit=10')
      ]);

      if (metricsResponse.data.success) {
        setMetrics(metricsResponse.data.data);
      }

      if (alertsResponse.data.success) {
        setAlerts(alertsResponse.data.data.alerts || []);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
      const message = err.response?.data?.message || 'Không thể tải dữ liệu metrics';
      setError(message);
      if (!silent) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Math.round(value)}%`;
  };

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

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang tải...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  const summary = metrics?.summary || {};
  const full = metrics?.full || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
            <p className="text-gray-600 mt-2">Theo dõi hiệu suất và tình trạng hệ thống</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                autoRefresh
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {autoRefresh ? 'Tự động làm mới: BẬT' : 'Tự động làm mới: TẮT'}
            </button>
            <button
              onClick={() => loadMetrics()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* CPU Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">CPU Usage</p>
                  <p className={`text-2xl font-semibold mt-2 ${getUsageColor(summary.cpu?.usage || 0)}`}>
                    {formatPercentage(summary.cpu?.usage)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Memory Usage</p>
                  <p className={`text-2xl font-semibold mt-2 ${getUsageColor(summary.memory?.usage || 0)}`}>
                    {formatPercentage(summary.memory?.usage)}
                  </p>
                  {summary.memory && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBytes(summary.memory.used)} / {formatBytes(summary.memory.total)}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Disk Usage</p>
                  <p className={`text-2xl font-semibold mt-2 ${getUsageColor(summary.disk?.usage || 0)}`}>
                    {formatPercentage(summary.disk?.usage)}
                  </p>
                  {summary.disk && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBytes(summary.disk.used)} / {formatBytes(summary.disk.total)}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-2xl font-semibold mt-2 text-gray-900">
                    {summary.uptime ? `${Math.floor(summary.uptime / 3600)}h` : 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Performance Metrics
              </h2>
            </div>
            <div className="p-6">
              {full.performance ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Request Rate</span>
                    <span className="font-medium text-gray-900">
                      {full.performance.requestRate ? `${full.performance.requestRate.toFixed(2)} req/s` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time (avg)</span>
                    <span className="font-medium text-gray-900">
                      {full.performance.responseTime ? `${full.performance.responseTime.toFixed(2)} ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className={`font-medium ${full.performance.errorRate > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatPercentage(full.performance.errorRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Requests</span>
                    <span className="font-medium text-gray-900">
                      {full.performance.totalRequests ? full.performance.totalRequests.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có dữ liệu performance</p>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Server className="w-5 h-5 mr-2 text-green-600" />
                System Information
              </h2>
            </div>
            <div className="p-6">
              {full.system ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Platform</span>
                    <span className="font-medium text-gray-900">{full.system.platform || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Node Version</span>
                    <span className="font-medium text-gray-900">{full.system.nodeVersion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Environment</span>
                    <span className="font-medium text-gray-900">{full.system.env || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có dữ liệu system</p>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Recent Alerts
            </h2>
          </div>
          <div className="p-6">
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getAlertColor(alert.level)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold uppercase text-xs">{alert.level}</span>
                          <span className="text-xs opacity-75">
                            {alert.timestamp ? new Date(alert.timestamp).toLocaleString('vi-VN') : 'N/A'}
                          </span>
                        </div>
                        <p className="font-medium">{alert.message || alert.title}</p>
                        {alert.details && (
                          <p className="text-sm mt-1 opacity-90">{alert.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">Không có cảnh báo nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;

