import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Flag,
  Bell,
  Settings,
  Truck,
  Shield,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Send,
  Users,
  Globe,
  Building2,
  Star,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    priority: '',
    unreadOnly: false
  });
  const [activeTab, setActiveTab] = useState('received'); // received, sent

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 20,
        ...filters
      });

      let response;
      if (activeTab === 'received') {
        response = await notificationAPI.getNotifications(params.toString());
      } else {
        response = await notificationAPI.getSentNotifications(params.toString());
      }
      
      if (response.success) {
        // Normalize _id của mỗi notification
        const normalizedNotifications = (response.data.notifications || []).map(notif => {
          if (notif._id && typeof notif._id === 'object') {
            const normalizedId = normalizeId(notif._id);
            if (normalizedId) {
              return { ...notif, _id: normalizedId };
            }
          }
          return notif;
        });
        setNotifications(normalizedNotifications);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách thông báo');
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, filters, activeTab]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await notificationAPI.getStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [loadNotifications, loadStats]);

  // Create notification
  const onCreateNotification = async (data) => {
    try {
      setLoading(true);
      const response = await notificationAPI.createNotification(data);
      
      if (response.success) {
        toast.success('Tạo thông báo thành công');
        setShowCreateModal(false);
        reset();
        loadNotifications();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo thông báo');
    } finally {
      setLoading(false);
    }
  };

  // Send system notification
  const onSendSystemNotification = async (data) => {
    try {
      setLoading(true);
      const response = await notificationAPI.sendSystemNotification(data);
      
      if (response.success) {
        toast.success('Gửi thông báo hệ thống thành công');
        setShowSystemModal(false);
        reset();
        loadNotifications();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi thông báo hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // Delete notification (for sent tab)
  const deleteNotification = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa thông báo này?')) return;
    try {
      const response = await notificationAPI.deleteNotification(id);
      if (response.success) {
        toast.success('Đã xóa thông báo');
        loadNotifications();
        loadStats();
      }
    } catch (error) {
      toast.error('Lỗi khi xóa thông báo');
    }
  };

  // Mark as read
  const markAsRead = async (id) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      
      if (response.success) {
        toast.success('Đã đánh dấu thông báo là đã đọc');
        loadNotifications();
        loadStats();
      }
    } catch (error) {
      toast.error('Lỗi khi đánh dấu thông báo');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      
      if (response.success) {
        toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
        loadNotifications();
        loadStats();
      }
    } catch (error) {
      toast.error('Lỗi khi đánh dấu tất cả thông báo');
    }
  };

  // Get notification details
  const getNotificationDetails = async (id) => {
    try {
      const response = await notificationAPI.getNotification(id);
      
      if (response.success) {
        setSelectedNotification(response.data.notification);
        setShowDetailModal(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi lấy thông tin thông báo';
      toast.error(errorMessage);
      console.error('Get notification details error:', error);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Get type icon
  const getTypeIcon = (type) => {
    const icons = {
      system: Settings,
      drug_recall: AlertTriangle,
      task_assignment: CheckSquare,
      supply_chain_update: Truck,
      quality_alert: Shield,
      general: Bell,
      urgent: AlertCircle
    };
    return icons[type] || Bell;
  };

  // Helper để normalize ID
  const normalizeId = (id, fallback = '') => {
    if (!id) return fallback;
    if (typeof id === 'string' && id.trim() !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null) {
      // Handle MongoDB ObjectId serialized as { '0': '6', '1': '9', ... }
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) {
        const nestedId = id._id;
        if (typeof nestedId === 'string' && nestedId.trim() !== '' && nestedId !== '[object Object]') {
          return nestedId;
        }
      }
      if (id.id) {
        const idValue = id.id;
        if (typeof idValue === 'string' && idValue.trim() !== '' && idValue !== '[object Object]') {
          return idValue;
        }
      }
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str !== '[object Object]' && str.trim() !== '') {
            return str;
          }
        } catch (e) {
          console.error("Error in toString for ID:", id, e);
        }
      }
    }
    try {
      const str = String(id);
      if (str !== '[object Object]' && str.trim() !== '') {
        return str;
      }
    } catch (e) {
      console.error("Error in String(id) for ID:", id, e);
    }
    return fallback;
  };

  // Helper để tạo unique key cho list items
  const getUniqueKey = (item, idx) => {
    // Luôn đảm bảo key là string và unique
    try {
      // Thử normalize ID trước
      const normalizedId = normalizeId(item._id);
      let idPart = '';
      
      if (normalizedId && normalizedId !== '[object Object]' && normalizedId.trim() !== '' && normalizedId.length > 0) {
        idPart = normalizedId;
      } else {
        // Fallback to other unique identifiers
        const title = String(item.title || 'no-title').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
        const createdAt = item.createdAt ? String(new Date(item.createdAt).getTime()) : String(idx * 1000);
        const senderId = item.sender?._id ? normalizeId(item.sender._id).substring(0, 12) : 'no-sender';
        const type = String(item.type || 'no-type').substring(0, 20);
        idPart = `${idx}-${title}-${type}-${senderId}-${createdAt}`;
      }
      
      // Đảm bảo idPart không rỗng và không phải [object Object]
      const finalIdPart = String(idPart || `notif-${idx}`);
      if (!finalIdPart || finalIdPart === '[object Object]' || finalIdPart.trim() === '') {
        return `notification-${idx}-fallback-${String(idx)}`;
      }
      
      return `notification-${idx}-${finalIdPart}`;
    } catch (error) {
      console.error('Error generating unique key:', error, item);
      // Fallback cuối cùng
      return `notification-${idx}-error-${String(idx)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Thông báo</h1>
          <p className="text-gray-600">Tạo và quản lý thông báo hệ thống</p>
        </div>
        
        <div className="flex space-x-3">
          {hasRole('admin') && (
            <button
              onClick={() => setShowSystemModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Thông báo hệ thống</span>
            </button>
          )}
          
          {hasAnyRole(['admin', 'manufacturer', 'distributor', 'hospital']) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Tạo thông báo</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tổng thông báo</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Chưa đọc</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.unread || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ưu tiên cao</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.high || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Khẩn cấp</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.urgent || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Thông báo nhận được
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Thông báo đã gửi
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tìm theo tiêu đề, nội dung..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thông báo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả loại</option>
                <option value="system">Hệ thống</option>
                <option value="drug_recall">Thu hồi thuốc</option>
                <option value="task_assignment">Giao nhiệm vụ</option>
                <option value="supply_chain_update">Cập nhật chuỗi cung ứng</option>
                <option value="quality_alert">Cảnh báo chất lượng</option>
                <option value="general">Thông báo chung</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả mức độ</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              {activeTab === 'received' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.unreadOnly}
                    onChange={(e) => setFilters({ ...filters, unreadOnly: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Chỉ chưa đọc</span>
                </label>
              )}
              
              <button
                onClick={loadNotifications}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Làm mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                <span>Đang tải...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có thông báo nào
            </div>
          ) : (
            notifications.map((notification, idx) => {
              const TypeIcon = getTypeIcon(notification.type);
              const isUnread = activeTab === 'received' && 
                notification.recipients?.find(r => {
                  const recipientUserId = normalizeId(r.user?._id || r.user?.id);
                  const currentUserId = normalizeId(user?.id || user?._id);
                  return recipientUserId === currentUserId;
                })?.isRead === false;
              
              return (
                <div key={getUniqueKey(notification, idx)} className={`p-6 hover:bg-gray-50 ${isUnread ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <TypeIcon className={`h-5 w-5 ${isUnread ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-sm font-medium ${isUnread ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          {isUnread && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Mới
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>{notification.sender?.fullName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{new Date(notification.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{notification.stats?.totalSent || 0} người nhận</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => getNotificationDetails(normalizeId(notification._id))}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {activeTab === 'received' && isUnread && (
                        <button
                          onClick={() => markAsRead(normalizeId(notification._id))}
                          className="text-green-600 hover:text-green-900"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {activeTab === 'sent' && (normalizeId(notification.sender?._id) === normalizeId(user?.id || user?._id) || user.role === 'admin') && (
                        <>
                          {/* Placeholder button cho tương lai nếu cần chỉnh sửa nội dung */}
                          {/* <button
                            className="text-gray-600 hover:text-gray-900"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button> */}
                          <button
                            onClick={() => deleteNotification(normalizeId(notification._id))}
                            className="text-red-600 hover:text-red-800"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {notifications.length} trong {pagination.total} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.current} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mark All as Read Button */}
      {activeTab === 'received' && stats.unread > 0 && (
        <div className="flex justify-center">
          <button
            onClick={markAllAsRead}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>Đánh dấu tất cả đã đọc ({stats.unread})</span>
          </button>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          onSubmit={onCreateNotification}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* System Notification Modal */}
      {showSystemModal && (
        <SystemNotificationModal
          onSubmit={onSendSystemNotification}
          onClose={() => setShowSystemModal(false)}
          loading={loading}
        />
      )}

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setShowDetailModal(false)}
          onMarkAsRead={markAsRead}
          currentUser={user}
        />
      )}
    </div>
  );
};

// Create Notification Modal Component
const CreateNotificationModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Tạo thông báo mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Tiêu đề là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề thông báo"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung *
            </label>
            <textarea
              rows={4}
              {...register('content', { required: 'Nội dung là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập nội dung thông báo"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thông báo *
              </label>
              <select
                {...register('type', { required: 'Loại thông báo là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn loại</option>
                <option value="general">Thông báo chung</option>
                <option value="drug_recall">Thu hồi thuốc</option>
                <option value="task_assignment">Giao nhiệm vụ</option>
                <option value="supply_chain_update">Cập nhật chuỗi cung ứng</option>
                <option value="quality_alert">Cảnh báo chất lượng</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ ưu tiên *
              </label>
              <select
                {...register('priority', { required: 'Mức độ ưu tiên là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn mức độ</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phạm vi gửi *
            </label>
            <select
              {...register('scope', { required: 'Phạm vi gửi là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn phạm vi</option>
              <option value="all">Tất cả người dùng</option>
              <option value="roles">Theo vai trò</option>
              <option value="specific_users">Người dùng cụ thể</option>
            </select>
            {errors.scope && (
              <p className="text-red-500 text-sm mt-1">{errors.scope.message}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo thông báo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// System Notification Modal Component
const SystemNotificationModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Thông báo hệ thống khẩn cấp</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Tiêu đề là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Nhập tiêu đề thông báo khẩn cấp"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung *
            </label>
            <textarea
              rows={4}
              {...register('content', { required: 'Nội dung là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Nhập nội dung thông báo khẩn cấp"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thông báo
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                defaultValue="system"
              >
                <option value="system">Hệ thống</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="drug_recall">Thu hồi thuốc</option>
                <option value="quality_alert">Cảnh báo chất lượng</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                defaultValue="urgent"
              >
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phạm vi gửi
            </label>
            <select
              {...register('scope')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              defaultValue="all"
            >
              <option value="all">Tất cả người dùng</option>
              <option value="roles">Theo vai trò</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Notification Detail Modal Component
const NotificationDetailModal = ({ notification, onClose, onMarkAsRead, currentUser }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      system: Settings,
      drug_recall: AlertTriangle,
      task_assignment: CheckSquare,
      supply_chain_update: Truck,
      quality_alert: Shield,
      general: Bell,
      urgent: AlertCircle
    };
    return icons[type] || Bell;
  };

  // Helper để normalize ID
  const normalizeId = (id, fallback = '') => {
    if (!id) return fallback;
    if (typeof id === 'string' && id.trim() !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null) {
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) {
        const nestedId = id._id;
        if (typeof nestedId === 'string' && nestedId.trim() !== '' && nestedId !== '[object Object]') {
          return nestedId;
        }
      }
      if (id.id) {
        const idValue = id.id;
        if (typeof idValue === 'string' && idValue.trim() !== '' && idValue !== '[object Object]') {
          return idValue;
        }
      }
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str !== '[object Object]' && str.trim() !== '') {
            return str;
          }
        } catch (e) {
          console.error("Error in toString for ID:", id, e);
        }
      }
    }
    try {
      const str = String(id);
      if (str !== '[object Object]' && str.trim() !== '') {
        return str;
      }
    } catch (e) {
      console.error("Error in String(id) for ID:", id, e);
    }
    return fallback;
  };

  const TypeIcon = getTypeIcon(notification.type);
  const isUnread = notification.recipients?.find(r => {
    const recipientUserId = normalizeId(r.user?._id || r.user?.id);
    const currentUserId = normalizeId(currentUser?.id || currentUser?._id);
    return recipientUserId === currentUserId;
  })?.isRead === false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <TypeIcon className={`h-6 w-6 ${isUnread ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <h3 className="text-lg font-semibold">Chi tiết thông báo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Notification Info */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{notification.title}</h4>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                {notification.priority}
              </span>
              <span className="text-sm text-gray-500">
                {notification.type}
              </span>
              {isUnread && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Chưa đọc
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Nội dung</h5>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {notification.content}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Người gửi:</span>
              <p className="text-gray-600">{notification.sender?.fullName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Thời gian:</span>
              <p className="text-gray-600">{new Date(notification.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Người nhận:</span>
              <p className="text-gray-600">{notification.stats?.totalSent || 0} người</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Đã đọc:</span>
              <p className="text-gray-600">{notification.stats?.totalRead || 0} người</p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          {isUnread && (
            <button
              onClick={() => {
                const normalizedId = normalizeId(notification._id);
                if (normalizedId) {
                  onMarkAsRead(normalizedId);
                  onClose();
                } else {
                  toast.error('ID thông báo không hợp lệ');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Đánh dấu đã đọc
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
