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
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [moduleData, setModuleData] = useState(null);
  const [selectedModule, setSelectedModule] = useState('drugs');
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

  useEffect(() => {
    if (hasRole('admin') && activeTab === 'overview') {
      loadOverviewData();
    } else if (activeTab === 'modules') {
      loadModuleData(selectedModule);
    }
  }, [activeTab, selectedModule, dateRange]);

  // Export functions (placeholder)
  const exportToExcel = () => {
    toast.success('Tính năng xuất Excel sẽ được triển khai');
  };

  const exportToPDF = () => {
    toast.success('Tính năng xuất PDF sẽ được triển khai');
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

  // Overview Tab
  const renderOverviewTab = () => {
    if (!overviewData) return <div>Đang tải...</div>;

    const { overview, charts } = overviewData;

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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Phân bố người dùng theo vai trò</h3>
            <div className="space-y-3">
              {charts.usersByRole?.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{item._id}</span>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Nhiệm vụ theo trạng thái</h3>
            <div className="space-y-3">
              {charts.tasksByStatus?.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item._id)}`}>
                    {item._id}
                  </span>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
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
                    onClick={exportToExcel}
                    className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100"
                  >
                    <Download className="h-4 w-4" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={exportToPDF}
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
