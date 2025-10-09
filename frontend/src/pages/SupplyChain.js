import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Package,
  Truck,
  Building2,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  QrCode,
  Download,
  RefreshCw,
  Thermometer,
  Droplets,
  Sun,
  FileText,
  Shield,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supplyChainAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SupplyChain = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supplyChains, setSupplyChains] = useState([]);
  const [selectedSupplyChain, setSelectedSupplyChain] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: ''
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load supply chains
  const loadSupplyChains = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...filters
      });

      const response = await supplyChainAPI.getSupplyChains(params.toString());
      
      if (response.success) {
        setSupplyChains(response.data.supplyChains);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách hành trình');
      console.error('Load supply chains error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, filters]);

  useEffect(() => {
    loadSupplyChains();
  }, [loadSupplyChains]);

  // Create new supply chain
  const onCreateSupplyChain = async (data) => {
    try {
      setLoading(true);
      const response = await supplyChainAPI.createSupplyChain(data);
      
      if (response.success) {
        toast.success('Tạo hành trình thành công');
        setShowCreateModal(false);
        reset();
        loadSupplyChains();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo hành trình');
    } finally {
      setLoading(false);
    }
  };

  // Add step to supply chain
  const onAddStep = async (data) => {
    try {
      setLoading(true);
      const response = await supplyChainAPI.addStep(selectedSupplyChain._id, data);
      
      if (response.success) {
        toast.success('Thêm bước thành công');
        setShowStepModal(false);
        reset();
        loadSupplyChains();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm bước');
    } finally {
      setLoading(false);
    }
  };

  // Get supply chain details
  const getSupplyChainDetails = async (id) => {
    try {
      const response = await supplyChainAPI.getSupplyChain(id);
      
      if (response.success) {
        setSelectedSupplyChain(response.data.supplyChain);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('Lỗi khi lấy thông tin hành trình');
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    const icons = {
      manufacturer: Package,
      distributor: Truck,
      hospital: Building2,
      patient: User,
      admin: Shield
    };
    return icons[role] || User;
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      created: 'bg-green-100 text-green-800',
      shipped: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      stored: 'bg-yellow-100 text-yellow-800',
      dispensed: 'bg-indigo-100 text-indigo-800',
      recalled: 'bg-red-100 text-red-800',
      quality_check: 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      recalled: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chuỗi Cung ứng</h1>
          <p className="text-gray-600">Quản lý hành trình thuốc từ sản xuất đến người dùng</p>
        </div>
        
        {hasRole(['admin', 'manufacturer']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo hành trình mới</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
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
                placeholder="Tìm theo lô, tên..."
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
              <option value="active">Hoạt động</option>
              <option value="recalled">Thu hồi</option>
              <option value="expired">Hết hạn</option>
              <option value="completed">Hoàn thành</option>
              <option value="suspended">Tạm dừng</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả vai trò</option>
              <option value="manufacturer">Nhà sản xuất</option>
              <option value="distributor">Nhà phân phối</option>
              <option value="hospital">Bệnh viện</option>
              <option value="patient">Bệnh nhân</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadSupplyChains}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supply Chains List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Danh sách hành trình</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lô thuốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thuốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí hiện tại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bước cuối
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : supplyChains.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Không có hành trình nào
                  </td>
                </tr>
              ) : (
                supplyChains.map((supplyChain) => {
                  const currentStep = supplyChain.steps[supplyChain.steps.length - 1];
                  const RoleIcon = getRoleIcon(currentStep?.actorRole);
                  
                  return (
                    <tr key={supplyChain._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {supplyChain.drugBatchNumber}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplyChain.drugId?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplyChain.drugId?.genericName}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <RoleIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {currentStep?.actorName}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplyChain.status)}`}>
                          {supplyChain.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(currentStep?.action)}`}>
                          {currentStep?.action}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(supplyChain.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => getSupplyChainDetails(supplyChain._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => window.open(supplyChain.qrCode?.verificationUrl, '_blank')}
                            className="text-green-600 hover:text-green-900"
                            title="Xem QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
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
                Hiển thị {supplyChains.length} trong {pagination.total} kết quả
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

      {/* Create Supply Chain Modal */}
      {showCreateModal && (
        <CreateSupplyChainModal
          onSubmit={onCreateSupplyChain}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Add Step Modal */}
      {showStepModal && selectedSupplyChain && (
        <AddStepModal
          supplyChain={selectedSupplyChain}
          onSubmit={onAddStep}
          onClose={() => setShowStepModal(false)}
          loading={loading}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSupplyChain && (
        <SupplyChainDetailModal
          supplyChain={selectedSupplyChain}
          onClose={() => setShowDetailModal(false)}
          onAddStep={() => {
            setShowDetailModal(false);
            setShowStepModal(true);
          }}
        />
      )}
    </div>
  );
};

// Create Supply Chain Modal Component
const CreateSupplyChainModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Tạo hành trình mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Thuốc *
            </label>
            <input
              type="text"
              {...register('drugId', { required: 'ID thuốc là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập ID thuốc"
            />
            {errors.drugId && (
              <p className="text-red-500 text-sm mt-1">{errors.drugId.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lô *
            </label>
            <input
              type="text"
              {...register('drugBatchNumber', { required: 'Số lô là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số lô"
            />
            {errors.drugBatchNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.drugBatchNumber.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng
              </label>
              <input
                type="number"
                {...register('metadata.quantity')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Số lượng"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị
              </label>
              <select
                {...register('metadata.unit')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="unit">Đơn vị</option>
                <option value="box">Hộp</option>
                <option value="bottle">Chai</option>
                <option value="tablet">Viên</option>
              </select>
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
              {loading ? 'Đang tạo...' : 'Tạo hành trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Step Modal Component
const AddStepModal = ({ supplyChain, onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Thêm bước mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hành động *
            </label>
            <select
              {...register('action', { required: 'Hành động là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn hành động</option>
              <option value="shipped">Gửi hàng</option>
              <option value="received">Nhận hàng</option>
              <option value="stored">Lưu kho</option>
              <option value="dispensed">Cấp phát</option>
              <option value="quality_check">Kiểm tra chất lượng</option>
            </select>
            {errors.action && (
              <p className="text-red-500 text-sm mt-1">{errors.action.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm
            </label>
            <input
              type="text"
              {...register('location.address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Địa điểm thực hiện"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              {...register('metadata.notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú về bước này"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang thêm...' : 'Thêm bước'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Supply Chain Detail Modal Component
const SupplyChainDetailModal = ({ supplyChain, onClose, onAddStep }) => {
  const getActionColor = (action) => {
    const colors = {
      created: 'bg-green-100 text-green-800',
      shipped: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      stored: 'bg-yellow-100 text-yellow-800',
      dispensed: 'bg-indigo-100 text-indigo-800',
      recalled: 'bg-red-100 text-red-800',
      quality_check: 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chi tiết hành trình</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Supply Chain Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Lô thuốc:</span> {supplyChain.drugBatchNumber}</p>
              <p><span className="font-medium">Thuốc:</span> {supplyChain.drugId?.name}</p>
              <p><span className="font-medium">Trạng thái:</span> {supplyChain.status}</p>
              <p><span className="font-medium">Ngày tạo:</span> {new Date(supplyChain.createdAt).toLocaleString('vi-VN')}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vị trí hiện tại</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Tại:</span> {supplyChain.currentLocation?.actorName}</p>
              <p><span className="font-medium">Vai trò:</span> {supplyChain.currentLocation?.actorRole}</p>
              <p><span className="font-medium">Địa chỉ:</span> {supplyChain.currentLocation?.address}</p>
              <p><span className="font-medium">Cập nhật:</span> {new Date(supplyChain.currentLocation?.lastUpdated).toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
        
        {/* Steps Timeline */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Hành trình chi tiết</h4>
          <div className="space-y-4">
            {supplyChain.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(step.action)}`}>
                      {step.action}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(step.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900">
                    <p><span className="font-medium">Thực hiện bởi:</span> {step.actorName} ({step.actorRole})</p>
                    {step.location?.address && (
                      <p><span className="font-medium">Địa điểm:</span> {step.location.address}</p>
                    )}
                    {step.metadata?.notes && (
                      <p><span className="font-medium">Ghi chú:</span> {step.metadata.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onAddStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thêm bước
          </button>
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

export default SupplyChain;
