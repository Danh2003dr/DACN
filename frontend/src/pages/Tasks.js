import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Flag,
  FileText,
  Upload,
  Download,
  Star,
  RefreshCw,
  MoreVertical,
  Play,
  Pause,
  StopCircle,
  XCircle,
  MapPin,
  Package,
  Truck,
  Building2,
  Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    type: '',
    assignedTo: ''
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...filters
      });

      const response = await taskAPI.getTasks(params.toString());
      
      if (response.success) {
        setTasks(response.data.tasks);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách nhiệm vụ');
      console.error('Load tasks error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await taskAPI.getStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [loadTasks, loadStats]);

  // Create new task
  const onCreateTask = async (data) => {
    try {
      setLoading(true);
      const response = await taskAPI.createTask(data);
      
      if (response.success) {
        toast.success('Tạo nhiệm vụ thành công');
        setShowCreateModal(false);
        reset();
        loadTasks();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  // Add task update
  const onAddUpdate = async (data) => {
    try {
      setLoading(true);
      const response = await taskAPI.addUpdate(selectedTask._id, data);
      
      if (response.success) {
        toast.success('Cập nhật tiến độ thành công');
        setShowUpdateModal(false);
        reset();
        loadTasks();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật tiến độ');
    } finally {
      setLoading(false);
    }
  };

  // Rate task
  const onRateTask = async (data) => {
    try {
      setLoading(true);
      const response = await taskAPI.rateTask(selectedTask._id, data);
      
      if (response.success) {
        toast.success('Đánh giá chất lượng thành công');
        setShowRateModal(false);
        reset();
        loadTasks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đánh giá chất lượng');
    } finally {
      setLoading(false);
    }
  };

  // Delete task (admin only)
  const deleteTask = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa nhiệm vụ này?')) return;
    try {
      setLoading(true);
      const response = await taskAPI.deleteTask(id);
      if (response.success) {
        toast.success('Đã xóa nhiệm vụ');
        loadTasks();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  // Get task details
  const getTaskDetails = async (id) => {
    try {
      const response = await taskAPI.getTask(id);
      
      if (response.success) {
        setSelectedTask(response.data.task);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('Lỗi khi lấy thông tin nhiệm vụ');
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

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      on_hold: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      in_progress: Play,
      completed: CheckCircle,
      cancelled: XCircle,
      on_hold: Pause
    };
    return icons[status] || Clock;
  };

  // Get type icon
  const getTypeIcon = (type) => {
    const icons = {
      transport: Truck,
      quality_check: CheckCircle,
      storage: Package,
      distribution: Truck,
      manufacturing: Package,
      recall: AlertTriangle,
      other: FileText
    };
    return icons[type] || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhiệm vụ</h1>
          <p className="text-gray-600">Giao nhiệm vụ và theo dõi tiến độ công việc</p>
        </div>
        
        {hasAnyRole(['admin', 'manufacturer', 'distributor']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo nhiệm vụ mới</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tổng nhiệm vụ</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Play className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đang thực hiện</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgress || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Hoàn thành</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Quá hạn</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdue || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                placeholder="Tìm theo tiêu đề, mô tả..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="on_hold">Tạm dừng</option>
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại nhiệm vụ
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại</option>
              <option value="transport">Vận chuyển</option>
              <option value="quality_check">Kiểm tra chất lượng</option>
              <option value="storage">Lưu trữ</option>
              <option value="distribution">Phân phối</option>
              <option value="manufacturing">Sản xuất</option>
              <option value="recall">Thu hồi</option>
              <option value="other">Khác</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadTasks}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Danh sách nhiệm vụ</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhiệm vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người thực hiện
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiến độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạn hoàn thành
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Không có nhiệm vụ nào
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status);
                  const TypeIcon = getTypeIcon(task.type);
                  
                  return (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <TypeIcon className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {task.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {task.type} • {task.priority}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {task.assignedTo?.fullName}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {task.progress}%
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${task.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => getTaskDetails(task._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {task.status === 'completed' && task.assignedBy?._id === user.id && !task.qualityRating?.rating && (
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowRateModal(true);
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Đánh giá"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}

                          {hasRole('admin') && (
                            <button
                              onClick={() => deleteTask(task._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Xóa nhiệm vụ"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {tasks.length} trong {pagination.total} kết quả
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onSubmit={onCreateTask}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowDetailModal(false)}
          onAddUpdate={() => {
            setShowDetailModal(false);
            setShowUpdateModal(true);
          }}
          onRate={() => {
            setShowDetailModal(false);
            setShowRateModal(true);
          }}
          currentUser={user}
        />
      )}

      {/* Add Update Modal */}
      {showUpdateModal && selectedTask && (
        <AddUpdateModal
          task={selectedTask}
          onSubmit={onAddUpdate}
          onClose={() => setShowUpdateModal(false)}
          loading={loading}
        />
      )}

      {/* Rate Task Modal */}
      {showRateModal && selectedTask && (
        <RateTaskModal
          task={selectedTask}
          onSubmit={onRateTask}
          onClose={() => setShowRateModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Tạo nhiệm vụ mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Tiêu đề là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề nhiệm vụ"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả *
            </label>
            <textarea
              rows={3}
              {...register('description', { required: 'Mô tả là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết nhiệm vụ"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại nhiệm vụ *
              </label>
              <select
                {...register('type', { required: 'Loại nhiệm vụ là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn loại</option>
                <option value="transport">Vận chuyển</option>
                <option value="quality_check">Kiểm tra chất lượng</option>
                <option value="storage">Lưu trữ</option>
                <option value="distribution">Phân phối</option>
                <option value="manufacturing">Sản xuất</option>
                <option value="recall">Thu hồi</option>
                <option value="other">Khác</option>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hạn hoàn thành *
              </label>
              <input
                type="datetime-local"
                {...register('dueDate', { required: 'Hạn hoàn thành là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.dueDate && (
                <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người thực hiện *
              </label>
              <input
                type="text"
                {...register('assignedTo', { required: 'Người thực hiện là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ID người dùng"
              />
              {errors.assignedTo && (
                <p className="text-red-500 text-sm mt-1">{errors.assignedTo.message}</p>
              )}
            </div>
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
              {loading ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Detail Modal Component
const TaskDetailModal = ({ task, onClose, onAddUpdate, onRate, currentUser }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      on_hold: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chi tiết nhiệm vụ</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Task Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Tiêu đề:</span> {task.title}</p>
              <p><span className="font-medium">Loại:</span> {task.type}</p>
              <p><span className="font-medium">Mức độ:</span> 
                <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </p>
              <p><span className="font-medium">Trạng thái:</span> 
                <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Người thực hiện</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Giao cho:</span> {task.assignedTo?.fullName}</p>
              <p><span className="font-medium">Giao bởi:</span> {task.assignedBy?.fullName}</p>
              <p><span className="font-medium">Hạn hoàn thành:</span> {new Date(task.dueDate).toLocaleString('vi-VN')}</p>
              <p><span className="font-medium">Tiến độ:</span> {task.progress}%</p>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {task.description}
          </p>
        </div>
        
        {/* Updates Timeline */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Lịch sử cập nhật</h4>
          <div className="space-y-4">
            {task.updates && task.updates.length > 0 ? (
              task.updates.map((update, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(update.status)}`}>
                        {update.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(update.updatedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      <p>{update.updateText}</p>
                      <p className="text-gray-500 mt-1">
                        Bởi: {update.updatedBy?.fullName} • Tiến độ: {update.progress}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Chưa có cập nhật nào</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          {(task.assignedTo?._id === currentUser.id || task.assignedBy?._id === currentUser.id) && (
            <button
              onClick={onAddUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cập nhật tiến độ
            </button>
          )}
          
          {task.status === 'completed' && task.assignedBy?._id === currentUser.id && !task.qualityRating?.rating && (
            <button
              onClick={onRate}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Đánh giá chất lượng
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

// Add Update Modal Component
const AddUpdateModal = ({ task, onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Cập nhật tiến độ</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              defaultValue={task.status}
            >
              <option value="pending">Chờ xử lý</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="on_hold">Tạm dừng</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiến độ (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('progress')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              defaultValue={task.progress}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung cập nhật *
            </label>
            <textarea
              rows={4}
              {...register('updateText', { required: 'Nội dung cập nhật là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả tiến độ và những gì đã thực hiện"
            />
            {errors.updateText && (
              <p className="text-red-500 text-sm mt-1">{errors.updateText.message}</p>
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
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rate Task Modal Component
const RateTaskModal = ({ task, onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Đánh giá chất lượng</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đánh giá chất lượng *
            </label>
            <select
              {...register('rating', { required: 'Đánh giá là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn đánh giá</option>
              <option value="1">1 sao - Rất kém</option>
              <option value="2">2 sao - Kém</option>
              <option value="3">3 sao - Trung bình</option>
              <option value="4">4 sao - Tốt</option>
              <option value="5">5 sao - Xuất sắc</option>
            </select>
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhận xét
            </label>
            <textarea
              rows={4}
              {...register('comment')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhận xét chi tiết về chất lượng thực hiện nhiệm vụ"
            />
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
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Đang đánh giá...' : 'Đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;
