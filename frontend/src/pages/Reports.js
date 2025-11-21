import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  Package,
  Users,
  ClipboardList,
  Bell,
  Star,
  RefreshCw,
  Eye,
  Printer,
  Layers,
  Truck,
  BellRing,
  ClipboardCheck,
  Clock,
  QrCode,
  Shield,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI, trustScoreAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [moduleData, setModuleData] = useState(null);
  const [selectedModule, setSelectedModule] = useState('drugs');
  const [kpiData, setKpiData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [riskyDrugs, setRiskyDrugs] = useState(null);
  const [qrScanStats, setQrScanStats] = useState(null);
  const [trustScoreStats, setTrustScoreStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Load overview data
  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getSystemOverview();
      
      if (response.success) {
        setOverviewData(response.data);
      } else {
        toast.error(response.message || 'Không thể tải dữ liệu tổng quan');
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      toast.error('Lỗi khi tải dữ liệu tổng quan: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Load module data
  const loadModuleData = async (module) => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const response = await reportAPI.getModuleStats(module, params);
      
      if (response.success) {
        setModuleData(response.data);
      } else {
        toast.error(response.message || 'Không thể tải dữ liệu module');
      }
    } catch (error) {
      console.error('Error loading module data:', error);
      toast.error('Lỗi khi tải dữ liệu module: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Load KPI data
  const loadKPIData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const response = await reportAPI.getKPIs(params);
      if (response.success) {
        setKpiData(response.data);
      }
    } catch (error) {
      console.error('Error loading KPI data:', error);
      toast.error('Lỗi khi tải KPI');
    } finally {
      setLoading(false);
    }
  };

  // Load alerts
  const loadAlerts = async () => {
    try {
      const response = await reportAPI.getAlerts();
      if (response.success) {
        setAlerts(response.data);
      } else {
        console.error('Error loading alerts:', response.message);
        // Set empty alerts instead of showing error
        setAlerts({
          alerts: [],
          summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
        });
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      // Set empty alerts instead of showing error
      setAlerts({
        alerts: [],
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      });
    }
  };

  // Load QR scan statistics
  const loadQRScanStats = async () => {
    try {
      const response = await reportAPI.getQRScanStats();
      if (response.success) {
        setQrScanStats(response.data);
      } else {
        setQrScanStats(null);
      }
    } catch (error) {
      console.error('Error loading QR scan stats:', error);
      setQrScanStats(null);
    }
  };

  // Load high-risk drugs (AI-based)
  const loadRiskyDrugs = async () => {
    try {
      const response = await reportAPI.getRiskyDrugsReport({ minScore: 60, maxItems: 10 });
      if (response.success) {
        setRiskyDrugs(response.data);
      } else {
        console.error('Error loading risky drugs:', response.message);
        setRiskyDrugs(null);
      }
    } catch (error) {
      console.error('Error loading risky drugs:', error);
      setRiskyDrugs(null);
    }
  };

  // Load trust score statistics
  const loadTrustScoreStats = async () => {
    try {
      const response = await trustScoreAPI.getStats();
      if (response.success && response.data) {
        // Map dữ liệu từ API response
        const overall = response.data.overall || {};
        const byRole = response.data.byRole || [];
        
        // Lấy top suppliers từ ranking
        let topSuppliers = [];
        try {
          const rankingResponse = await trustScoreAPI.getRanking({ limit: 5 });
          if (rankingResponse.success && rankingResponse.data) {
            topSuppliers = rankingResponse.data.suppliers || rankingResponse.data.suppliers || [];
          }
        } catch (err) {
          console.error('Error loading top suppliers:', err);
        }
        
        const stats = {
          totalSuppliers: overall.totalSuppliers || 0,
          averageScore: overall.averageScore || 0,
          byLevel: {
            excellent: overall.levelA || 0,
            good: overall.levelB || 0,
            average: overall.levelC || 0,
            poor: overall.levelD || 0
          },
          byRole: byRole,
          topSuppliers: topSuppliers
        };
        
        console.log('Trust Score Stats loaded:', stats); // Debug log
        setTrustScoreStats(stats);
      } else {
        console.log('No trust score stats data:', response); // Debug log
        setTrustScoreStats(null);
      }
    } catch (error) {
      console.error('Error loading trust score stats:', error);
      setTrustScoreStats(null);
    }
  };

  useEffect(() => {
    if (hasRole('admin') && activeTab === 'overview') {
      loadOverviewData();
    } else if (activeTab === 'modules') {
      loadModuleData(selectedModule);
    } else if (activeTab === 'kpi') {
      console.log('Loading KPI data and trust score stats...');
      loadKPIData();
      loadTrustScoreStats();
    } else if (activeTab === 'alerts') {
      loadAlerts();
      loadRiskyDrugs();
      loadQRScanStats();
      // Auto-refresh alerts & risk list mỗi 30 giây
      const interval = setInterval(() => {
        loadAlerts();
        loadRiskyDrugs();
        loadQRScanStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedModule, dateRange]);

  const handleExport = async (format) => {
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      toast.loading(`Đang chuẩn bị file ${format.toUpperCase()}...`, { id: 'report-export' });
      const response = await reportAPI.exportModuleReport(selectedModule, params, format);
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().getTime();
      link.href = url;
      link.download = `${selectedModule}-report-${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Xuất file ${format.toUpperCase()} thành công!`, { id: 'report-export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Không thể xuất báo cáo: ' + (error.response?.data?.message || error.message), { id: 'report-export' });
    }
  };

  const printReport = () => {
    window.print();
  };

  // Format number with thousand separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'recalled': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMaxCount = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((max, item) => Math.max(max, item.count || 0), 0);
  };

  // Overview Tab
  const renderOverviewTab = () => {
    if (!overviewData) return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu tổng quan...</div>;

    const { overview, charts } = overviewData;

    const maxUsersByRole = getMaxCount(charts.usersByRole);
    const maxTasksByStatus = getMaxCount(charts.tasksByStatus);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng thuốc</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.drugs.total)}</p>
                <p className="text-sm text-green-600">+{overview.drugs.active} hoạt động</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.users.total)}</p>
                <p className="text-sm text-green-600">+{overview.users.active} hoạt động</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nhiệm vụ</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.tasks.total)}</p>
                <p className="text-sm text-blue-600">{overview.tasks.completionRate}% hoàn thành</p>
              </div>
              <ClipboardList className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đánh giá</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.reviews.total)}</p>
                <p className="text-sm text-yellow-600">⭐ {overview.reviews.averageRating}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Charts (Bar visualizations) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Phân bố người dùng theo vai trò</h3>
            {(!charts.usersByRole || charts.usersByRole.length === 0) ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu người dùng theo vai trò.</p>
            ) : (
              <div className="space-y-3">
                {charts.usersByRole.map((item, index) => {
                  const value = item.count || 0;
                  const percent = maxUsersByRole > 0 ? (value / maxUsersByRole) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium capitalize text-gray-700">{item._id}</span>
                        <span className="text-gray-500">{formatNumber(value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Nhiệm vụ theo trạng thái</h3>
            {(!charts.tasksByStatus || charts.tasksByStatus.length === 0) ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu nhiệm vụ.</p>
            ) : (
              <div className="space-y-3">
                {charts.tasksByStatus.map((item, index) => {
                  const value = item.count || 0;
                  const percent = maxTasksByStatus > 0 ? (value / maxTasksByStatus) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(item._id)}`}>
                          {item._id || 'khác'}
                        </span>
                        <span className="text-gray-500">{formatNumber(value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cảnh báo hệ thống</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Thuốc bị thu hồi</p>
                <p className="text-lg font-bold text-red-900">{overview.drugs.recalled}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Thuốc hết hạn</p>
                <p className="text-lg font-bold text-orange-900">{overview.drugs.expired}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Thông báo chưa đọc</p>
                <p className="text-lg font-bold text-blue-900">{overview.notifications.unread}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modules Tab
  const formatMonth = (item) => {
    if (!item?._id) return 'Không xác định';
    const month = item._id.month?.toString().padStart(2, '0');
    return `${month}/${item._id.year || ''}`;
  };

  const getModuleSummary = (moduleKey) => {
    if (!moduleData) return [];
    switch (moduleKey) {
      case 'drugs':
        return [
          { label: 'Tổng số lô', value: moduleData.total, icon: Package, color: 'text-blue-600' },
          { label: 'Đã thu hồi', value: moduleData.recalled, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'Hết hạn', value: moduleData.expired, icon: Calendar, color: 'text-orange-500' },
          { label: 'Sắp hết hạn', value: moduleData.nearExpiry, icon: AlertTriangle, color: 'text-yellow-500' }
        ];
      case 'supply-chain':
        return [
          { label: 'Tổng bước', value: moduleData.totalSteps, icon: Layers, color: 'text-purple-600' },
          { label: 'Trạng thái hoạt động', value: moduleData.byStatus?.reduce((acc, cur) => acc + cur.count, 0), icon: Truck, color: 'text-blue-600' },
          { label: 'Hành động khác nhau', value: moduleData.byAction?.length, icon: BarChart3, color: 'text-emerald-600' }
        ];
      case 'tasks':
        return [
          { label: 'Tổng nhiệm vụ', value: moduleData.total, icon: ClipboardList, color: 'text-indigo-600' },
          { label: 'Tỷ lệ hoàn thành', value: `${moduleData.completionRate || 0}%`, icon: ClipboardCheck, color: 'text-green-600' },
          { label: 'Trạng thái ghi nhận', value: moduleData.byStatus?.length, icon: TrendingUp, color: 'text-blue-500' }
        ];
      case 'notifications':
        return [
          { label: 'Thông báo đã gửi', value: moduleData.total, icon: Bell, color: 'text-blue-600' },
          { label: 'Phân loại', value: moduleData.byType?.length, icon: BellRing, color: 'text-purple-600' },
          { label: 'Theo mức ưu tiên', value: moduleData.byPriority?.length, icon: AlertTriangle, color: 'text-orange-500' }
        ];
      case 'reviews':
        return [
          { label: 'Tổng đánh giá', value: moduleData.total, icon: Star, color: 'text-yellow-500' },
          { label: 'Điểm trung bình', value: moduleData.averageRating ? `${moduleData.averageRating}/5` : '—', icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Loại đánh giá', value: moduleData.byType?.length, icon: FileText, color: 'text-blue-500' }
        ];
      default:
        return [];
    }
  };

  const renderDataList = (title, items, formatter = (item) => item._id, valueFormatter = (item) => item.count) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">{title}</h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
              <span className="text-sm text-gray-700 font-medium">{formatter(item)}</span>
              <span className="text-sm text-gray-500">{typeof valueFormatter(item) === 'number' ? formatNumber(valueFormatter(item)) : valueFormatter(item)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModulesTab = () => {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bộ lọc báo cáo</h3>
              <p className="text-sm text-gray-500">Chọn module và phạm vi thời gian để xem thống kê chi tiết.</p>
            </div>
            <button
              onClick={() => { setDateRange({ startDate: '', endDate: '' }); loadModuleData(selectedModule); }}
              className="hidden md:inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Làm mới</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="drugs">Thuốc</option>
                <option value="supply-chain">Chuỗi cung ứng</option>
                <option value="tasks">Nhiệm vụ</option>
                <option value="notifications">Thông báo</option>
                <option value="reviews">Đánh giá</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => loadModuleData(selectedModule)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 shadow-sm"
              >
                <Filter className="h-4 w-4" />
                <span>Lọc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Module Data */}
        {moduleData ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-soft p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thống kê {selectedModule === 'supply-chain' ? 'Chuỗi cung ứng' : 
                              selectedModule === 'tasks' ? 'Nhiệm vụ' :
                              selectedModule === 'notifications' ? 'Thông báo' :
                              selectedModule === 'reviews' ? 'Đánh giá' : 'Thuốc'}
                  </h3>
                  <p className="text-sm text-gray-500">Tổng hợp dữ liệu đã lọc theo khoảng thời gian và module.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExport('excel')}
                    className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100"
                  >
                    <Download className="h-4 w-4" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={printReport}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200"
                  >
                    <Printer className="h-4 w-4" />
                    <span>In</span>
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {getModuleSummary(selectedModule).map((card, index) => {
                  const Icon = card.icon;
                  const displayValue = typeof card.value === 'number' ? formatNumber(card.value) : (card.value ?? '—');
                  return (
                    <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-5 flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-white ${card.color} shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.label}</p>
                        <p className="text-2xl font-semibold text-gray-900">{displayValue}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedModule === 'drugs' && (
                <>
                  {renderDataList('Theo trạng thái', moduleData.byStatus, (item) => item._id || 'khác')}
                  {renderDataList('Theo tháng', moduleData.byMonth, formatMonth)}
                </>
              )}
              {selectedModule === 'supply-chain' && (
                <>
                  {renderDataList('Theo trạng thái', moduleData.byStatus, (item) => item._id || 'khác')}
                  {renderDataList('Theo hành động', moduleData.byAction, (item) => item._id || 'khác')}
                </>
              )}
              {selectedModule === 'tasks' && (
                <>
                  {renderDataList('Theo trạng thái', moduleData.byStatus, (item) => item._id || 'khác')}
                  {renderDataList('Theo mức độ ưu tiên', moduleData.byPriority, (item) => item._id || 'khác')}
                  {renderDataList('Theo tháng', moduleData.byMonth, formatMonth)}
                </>
              )}
              {selectedModule === 'notifications' && (
                <>
                  {renderDataList('Theo loại thông báo', moduleData.byType, (item) => item._id || 'khác')}
                  {renderDataList('Theo mức ưu tiên', moduleData.byPriority, (item) => item._id || 'khác')}
                </>
              )}
              {selectedModule === 'reviews' && (
                <>
                  {renderDataList('Theo điểm đánh giá', moduleData.byRating, (item) => `${item._id} ⭐`, (item) => `${item.count} lượt`)}
                  {renderDataList('Theo loại đánh giá', moduleData.byType, (item) => item._id || 'khác')}
                </>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-soft p-6">
              <p className="text-sm text-gray-500">
                Biểu đồ trực quan đang được phát triển. Hiện tại dữ liệu được trình bày dưới dạng bảng để thuận tiện cho việc xuất báo cáo.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-soft p-10 text-center">
            <p className="text-gray-500">Chọn module và bấm "Lọc" để xem báo cáo chi tiết.</p>
          </div>
        )}
      </div>
    );
  };

  // Render KPI Tab
  const renderKPITab = () => {
    console.log('renderKPITab called, kpiData:', kpiData, 'trustScoreStats:', trustScoreStats);
    
    if (!kpiData) {
      // Vẫn hiển thị phần compliance và trust score ngay cả khi đang load
      return (
        <div className="space-y-6">
          <div className="p-8 text-center text-gray-500">Đang tải KPI...</div>
          {/* Hiển thị phần chữ ký số và điểm tính nhiệm ngay cả khi đang load */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              KPI Tuân thủ & Chữ ký số
            </h3>
            <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Điểm Tính Nhiệm Nhà Cung Ứng
            </h3>
            {trustScoreStats ? (
              <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chưa có dữ liệu điểm tính nhiệm.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    const getGradeColor = (grade) => {
      switch (grade) {
        case 'A': return 'text-green-600 bg-green-100';
        case 'B': return 'text-blue-600 bg-blue-100';
        case 'C': return 'text-yellow-600 bg-yellow-100';
        case 'D': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiData.drug && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Thuốc</div>
              <div className={`text-2xl font-bold mb-1 ${getGradeColor(kpiData.drug.status?.grade).split(' ')[0]}`}>
                {kpiData.drug.validityRate?.toFixed(1)}%
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${getGradeColor(kpiData.drug.status?.grade)}`}>
                {kpiData.drug.status?.grade || 'N/A'} - {kpiData.drug.status?.label || ''}
              </div>
            </div>
          )}
          {kpiData.supplyChain && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Chuỗi cung ứng</div>
              <div className={`text-2xl font-bold mb-1 ${getGradeColor(kpiData.supplyChain.status?.grade).split(' ')[0]}`}>
                {kpiData.supplyChain.completionRate?.toFixed(1)}%
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${getGradeColor(kpiData.supplyChain.status?.grade)}`}>
                {kpiData.supplyChain.status?.grade || 'N/A'}
              </div>
            </div>
          )}
          {kpiData.quality && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Chất lượng</div>
              <div className={`text-2xl font-bold mb-1 ${getGradeColor(kpiData.quality.status?.grade).split(' ')[0]}`}>
                {kpiData.quality.avgRating?.toFixed(1)}/5
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${getGradeColor(kpiData.quality.status?.grade)}`}>
                {kpiData.quality.status?.grade || 'N/A'}
              </div>
            </div>
          )}
          {kpiData.efficiency && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Hiệu quả</div>
              <div className={`text-2xl font-bold mb-1 ${getGradeColor(kpiData.efficiency.status?.grade).split(' ')[0]}`}>
                {kpiData.efficiency.completionRate?.toFixed(1)}%
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${getGradeColor(kpiData.efficiency.status?.grade)}`}>
                {kpiData.efficiency.status?.grade || 'N/A'}
              </div>
            </div>
          )}
          {kpiData.compliance && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Tuân thủ</div>
              <div className={`text-2xl font-bold mb-1 ${getGradeColor(kpiData.compliance.status?.grade).split(' ')[0]}`}>
                {kpiData.compliance.signatureValidityRate?.toFixed(1)}%
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${getGradeColor(kpiData.compliance.status?.grade)}`}>
                {kpiData.compliance.status?.grade || 'N/A'}
              </div>
            </div>
          )}
        </div>

        {/* Detailed KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {kpiData.drug && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">KPI Thuốc</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ hợp lệ</span>
                  <span className="font-semibold">{kpiData.drug.validityRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ thu hồi</span>
                  <span className="font-semibold text-red-600">{kpiData.drug.recallRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blockchain coverage</span>
                  <span className="font-semibold">{kpiData.drug.blockchainCoverage?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chữ ký số coverage</span>
                  <span className="font-semibold">{kpiData.drug.signatureCoverage?.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
          {kpiData.supplyChain && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">KPI Chuỗi cung ứng</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ hoàn thành</span>
                  <span className="font-semibold">{kpiData.supplyChain.completionRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trung bình bước/chuỗi</span>
                  <span className="font-semibold">{kpiData.supplyChain.avgStepsPerChain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian hoàn thành TB</span>
                  <span className="font-semibold">{kpiData.supplyChain.avgDaysToComplete} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ có vấn đề</span>
                  <span className="font-semibold text-red-600">{kpiData.supplyChain.issueRate?.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KPI Tuân thủ & Chữ ký số - Luôn hiển thị */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              KPI Tuân thủ & Chữ ký số
            </h3>
            {kpiData.compliance ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ chữ ký số hợp lệ</span>
                  <span className="font-semibold">{kpiData.compliance.signatureValidityRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng số chữ ký số</span>
                  <span className="font-semibold">{formatNumber(kpiData.compliance.totalSignatures || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chữ ký số hợp lệ</span>
                  <span className="font-semibold text-green-600">{formatNumber(kpiData.compliance.validSignatures || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ timestamp</span>
                  <span className="font-semibold">{kpiData.compliance.timestampRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chứng chỉ hết hạn</span>
                  <span className="font-semibold text-red-600">{formatNumber(kpiData.compliance.expiredCertificates || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ đọc thông báo</span>
                  <span className="font-semibold">{kpiData.compliance.notificationReadRate?.toFixed(2)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chưa có dữ liệu chữ ký số.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Dữ liệu sẽ được hiển thị sau khi có chữ ký số trong hệ thống.
                </p>
              </div>
            )}
          </div>
          {kpiData.quality && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">KPI Chất lượng</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm đánh giá trung bình</span>
                  <span className="font-semibold">{kpiData.quality.avgRating?.toFixed(2)}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ xác minh</span>
                  <span className="font-semibold">{kpiData.quality.verificationRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ đạt kiểm định</span>
                  <span className="font-semibold">{kpiData.quality.qualityTestPassRate?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ khiếu nại</span>
                  <span className="font-semibold text-red-600">{kpiData.quality.complaintRate?.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust Score Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Điểm Tính Nhiệm Nhà Cung Ứng
          </h3>
          {trustScoreStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-purple-600 uppercase mb-1">Tổng nhà cung ứng</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatNumber(trustScoreStats.totalSuppliers || 0)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-green-600 uppercase mb-1">Điểm TB</p>
                  <p className="text-2xl font-bold text-green-900">
                    {trustScoreStats.averageScore ? trustScoreStats.averageScore.toFixed(1) : '0'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase mb-1">Xuất sắc (A)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(trustScoreStats.byLevel?.excellent || 0)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-orange-600 uppercase mb-1">Cần cải thiện</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatNumber(trustScoreStats.byLevel?.poor || 0)}
                  </p>
                </div>
              </div>
              {trustScoreStats.topSuppliers && trustScoreStats.topSuppliers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Top nhà cung ứng</h4>
                  <div className="space-y-2">
                    {trustScoreStats.topSuppliers.slice(0, 5).map((supplier, index) => {
                      const supplierName = supplier.supplierName || 
                                          supplier.supplier?.fullName || 
                                          supplier.name || 
                                          'Không xác định';
                      const supplierRole = supplier.supplierRole || 
                                         supplier.supplier?.role || 
                                         supplier.role || '';
                      const trustScore = supplier.trustScore || 0;
                      const trustLevel = supplier.trustLevel || 'N/A';
                      
                      return (
                        <div
                          key={supplier._id || supplier.supplier?._id || index}
                          className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {supplierName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {supplierRole && `${supplierRole} · `}
                                Cấp {trustLevel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple-600">
                              {trustScore.toFixed(0)} điểm
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chưa có dữ liệu điểm tính nhiệm.</p>
              <p className="text-xs text-gray-400 mt-1">
                Dữ liệu sẽ được hiển thị sau khi có nhà cung ứng được đánh giá.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Alerts Tab
  const renderAlertsTab = () => {
    if (!alerts) return <div className="p-8 text-center text-gray-500">Đang tải cảnh báo...</div>;

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'critical': return 'bg-red-50 border-red-200 text-red-800';
        case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
        case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
        default: return 'bg-gray-50 border-gray-200 text-gray-800';
      }
    };

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'expired': return AlertTriangle;
        case 'recalled': return AlertTriangle;
        case 'delay': return Clock;
        case 'overdue': return Calendar;
        default: return Bell;
      }
    };

    return (
      <div className="space-y-6">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Tổng cảnh báo</div>
            <div className="text-2xl font-bold text-gray-900">{alerts.summary.total}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-600 mb-1">Khẩn cấp</div>
            <div className="text-2xl font-bold text-red-900">{alerts.summary.critical}</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-sm text-orange-600 mb-1">Cao</div>
            <div className="text-2xl font-bold text-orange-900">{alerts.summary.high}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600 mb-1">Trung bình</div>
            <div className="text-2xl font-bold text-yellow-900">{alerts.summary.medium}</div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Danh sách cảnh báo</h3>
          </div>
          <div className="divide-y">
            {alerts.alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Không có cảnh báo nào</div>
            ) : (
              alerts.alerts.map((alert) => {
                const Icon = getCategoryIcon(alert.category);
                return (
                  <div
                    key={alert.id}
                    className={`p-4 border-l-4 ${getPriorityColor(alert.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{alert.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(alert.priority)}`}>
                              {alert.priority}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <div className="text-xs text-gray-600">
                            {new Date(alert.timestamp).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      {alert.actionRequired && (
                        <button
                          onClick={() => {
                            reportAPI.markAlertAsRead(alert.id);
                            loadAlerts();
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Đánh dấu đã xem
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* High Risk Drugs (AI-based) */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Top lô thuốc rủi ro cao (AI)
              </h3>
              <p className="text-sm text-gray-500">
                Dựa trên Drug Verification AI (trạng thái lô, kiểm định, trust score nhà cung ứng, đánh giá).
              </p>
            </div>
            {riskyDrugs?.summary && (
              <div className="text-xs text-gray-500 text-right space-y-1">
                <div>Tổng đánh giá: {formatNumber(riskyDrugs.summary.totalEvaluated || 0)} lô</div>
                <div>
                  Nguy cơ cao trở lên:{' '}
                  <span className="font-semibold text-red-600">
                    {formatNumber(riskyDrugs.summary.totalHighRisk || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="divide-y">
            {!riskyDrugs?.items || riskyDrugs.items.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Hiện tại không có lô thuốc nào vượt ngưỡng rủi ro cao.
              </div>
            ) : (
              riskyDrugs.items.map((item) => (
                <div key={item._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Mã lô: <span className="font-mono">{item.drugId}</span> · Số lô SX:{' '}
                      <span className="font-mono">{item.batchNumber}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Trạng thái: {item.isRecalled ? 'Đã thu hồi' : item.isExpired ? 'Hết hạn' : item.status}
                    </p>
                    {item.risk?.factors && item.risk.factors.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Yếu tố chính: {item.risk.factors[0].description}
                        {item.risk.factors.length > 1 && ` (+${item.risk.factors.length - 1} yếu tố khác)`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.risk?.level === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : item.risk?.level === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : item.risk?.level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      Nguy cơ: {item.risk?.level || 'N/A'} ({Math.round(item.risk?.score || 0)}%)
                    </span>
                    <button
                      onClick={() => window.open(`/verify/${item.drugId}`, '_blank')}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-3 w-3" />
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QR Scan Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-gray-700" />
                Thống kê quét QR
              </h3>
              <p className="text-sm text-gray-500">
                Tổng quan số lần quét, tỉ lệ thành công và các lần quét gần đây.
              </p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {qrScanStats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase">Tổng lượt quét</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatNumber(qrScanStats.total || 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-green-600 uppercase">Thành công</p>
                    <p className="mt-1 text-2xl font-bold text-green-800">
                      {formatNumber(qrScanStats.success || 0)}
                    </p>
                    {qrScanStats.total > 0 && (
                      <p className="mt-1 text-xs text-green-600">
                        {((qrScanStats.success / qrScanStats.total) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-red-600 uppercase">Thất bại</p>
                    <p className="mt-1 text-2xl font-bold text-red-800">
                      {formatNumber(qrScanStats.failed || 0)}
                    </p>
                    {qrScanStats.total > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {((qrScanStats.failed / qrScanStats.total) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-blue-600 uppercase">Tỷ lệ thành công</p>
                    <p className="mt-1 text-2xl font-bold text-blue-800">
                      {qrScanStats.total > 0
                        ? `${((qrScanStats.success / qrScanStats.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                    {qrScanStats.total > 0 && (
                      <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-blue-600 rounded-full transition-all"
                          style={{
                            width: `${(qrScanStats.success / qrScanStats.total) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Biểu đồ theo ngày */}
                {qrScanStats.byDay && qrScanStats.byDay.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      Thống kê quét theo ngày (30 ngày gần nhất)
                    </p>
                    <div className="space-y-2">
                      {qrScanStats.byDay.slice(-7).map((day, index) => {
                        const dateStr = `${day._id.day.toString().padStart(2, '0')}/${day._id.month.toString().padStart(2, '0')}/${day._id.year}`;
                        const maxTotal = Math.max(...qrScanStats.byDay.map(d => d.total || 0), 1);
                        const successPercent = day.total > 0 ? (day.success / day.total) * 100 : 0;
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-gray-700">{dateStr}</span>
                              <span className="text-gray-500">
                                {formatNumber(day.total)} lần ({formatNumber(day.success)} thành công)
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-blue-500 rounded-full transition-all"
                                style={{ width: `${(day.total / maxTotal) * 100}%` }}
                                title={`${day.total} lần quét, ${successPercent.toFixed(1)}% thành công`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lần quét gần đây */}
                {qrScanStats.recent && qrScanStats.recent.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-2">Lần quét gần đây</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {qrScanStats.recent.map((scan) => (
                        <div
                          key={scan._id}
                          className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                                scan.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {scan.success ? '✓' : '✗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {scan.drug?.name || scan.drugId || 'Không xác định'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {scan.drug?.batchNumber && (
                                  <>Số lô: <span className="font-mono">{scan.drug.batchNumber}</span> · </>
                                )}
                                {scan.drugId && (
                                  <>Mã: <span className="font-mono">{scan.drugId}</span> · </>
                                )}
                                {new Date(scan.createdAt).toLocaleString('vi-VN')}
                              </p>
                              {scan.alertType && (
                                <p className="text-xs text-orange-600 mt-0.5">
                                  ⚠️ Cảnh báo: {scan.alertType === 'recalled' ? 'Đã thu hồi' : 
                                                scan.alertType === 'expired' ? 'Hết hạn' : 
                                                scan.alertType === 'near_expiry' ? 'Sắp hết hạn' : scan.alertType}
                                </p>
                              )}
                            </div>
                          </div>
                          {!scan.success && scan.errorMessage && (
                            <p className="ml-4 max-w-xs text-xs text-red-600 truncate" title={scan.errorMessage}>
                              {scan.errorMessage}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chưa có dữ liệu lịch sử quét QR.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Dữ liệu sẽ được hiển thị sau khi có người dùng quét mã QR.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
          <p className="text-gray-600">Theo dõi và phân tích dữ liệu hệ thống</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('kpi')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'kpi'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KPI Dashboard
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cảnh báo
            {alerts?.summary?.critical > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {alerts.summary.critical}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'modules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Theo module
          </button>
        </nav>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {activeTab === 'overview' && hasRole('admin') && renderOverviewTab()}
          {activeTab === 'kpi' && renderKPITab()}
          {activeTab === 'alerts' && renderAlertsTab()}
          {activeTab === 'modules' && renderModulesTab()}
          
          {activeTab === 'overview' && !hasRole('admin') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <p className="text-yellow-800">
                  Bạn cần quyền Admin để xem thống kê tổng quan hệ thống.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
