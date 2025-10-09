import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  QrCode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { drugAPI } from '../utils/api';

const Drugs = () => {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Load drugs data
  const loadDrugs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);

      const response = await drugAPI.getDrugs(params);
      
      if (response.success) {
        setDrugs(response.data.drugs);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      setError('Không thể tải danh sách thuốc');
      console.error('Error loading drugs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterStatus]);

  // Load stats
  const loadStats = async () => {
    try {
      const response = await drugAPI.getDrugStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadDrugs();
    loadStats();
  }, [loadDrugs]);

  // Create new drug
  const onSubmitCreate = async (data) => {
    try {
      const response = await drugAPI.createDrug(data);
      if (response.data.success) {
        setShowCreateModal(false);
        reset();
        loadDrugs();
        loadStats();
        alert('Tạo lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể tạo lô thuốc');
      console.error('Error creating drug:', error);
    }
  };

  // Update drug
  // const onSubmitEdit = async (data) => {
  //   try {
  //     const response = await api.put(`/drugs/${selectedDrug._id}`, data);
  //     if (response.data.success) {
  //       setShowEditModal(false);
  //       reset();
  //       loadDrugs();
  //       alert('Cập nhật lô thuốc thành công!');
  //     }
  //   } catch (error) {
  //     setError('Không thể cập nhật lô thuốc');
  //     console.error('Error updating drug:', error);
  //   }
  // };

  // Delete drug
  const handleDelete = async (drugId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lô thuốc này?')) return;
    
    try {
      const response = await api.delete(`/drugs/${drugId}`);
      if (response.data.success) {
        loadDrugs();
        loadStats();
        alert('Xóa lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể xóa lô thuốc');
      console.error('Error deleting drug:', error);
    }
  };

  // Recall drug
  const handleRecall = async (drugId) => {
    const reason = prompt('Nhập lý do thu hồi:');
    if (!reason) return;
    
    try {
      const response = await api.put(`/drugs/${drugId}/recall`, { reason });
      if (response.data.success) {
        loadDrugs();
        loadStats();
        alert('Thu hồi lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể thu hồi lô thuốc');
      console.error('Error recalling drug:', error);
    }
  };

  // Open edit modal
  const openEditModal = (drug) => {
    setSelectedDrug(drug);
    setValue('name', drug.name);
    setValue('activeIngredient', drug.activeIngredient);
    setValue('dosage', drug.dosage);
    setValue('form', drug.form);
    // setShowEditModal(true);
  };

  // Open QR modal
  const openQRModal = (drug) => {
    setSelectedDrug(drug);
    setShowQRModal(true);
  };

  // Open blockchain modal
  const openBlockchainModal = (drug) => {
    setSelectedDrug(drug);
    setShowBlockchainModal(true);
  };

  // Get status icon
  const getStatusIcon = (drug) => {
    if (drug.isRecalled) return <XCircle className="w-5 h-5 text-red-500" />;
    if (drug.isExpired) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (drug.isNearExpiry) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  // Get status text
  const getStatusText = (drug) => {
    if (drug.isRecalled) return 'Đã thu hồi';
    if (drug.isExpired) return 'Hết hạn';
    if (drug.isNearExpiry) return 'Gần hết hạn';
    return 'Hoạt động';
  };

  // Get status color
  const getStatusColor = (drug) => {
    if (drug.isRecalled) return 'bg-red-100 text-red-800';
    if (drug.isExpired) return 'bg-orange-100 text-orange-800';
    if (drug.isNearExpiry) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lô Thuốc</h1>
          <p className="text-gray-600">Theo dõi và quản lý các lô thuốc trong hệ thống</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'manufacturer') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tạo lô thuốc mới
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tổng số lô</p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold">{stats.active || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đã thu hồi</p>
              <p className="text-2xl font-bold">{stats.recalled || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Sắp hết hạn</p>
              <p className="text-2xl font-bold">{stats.expiringSoon || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã lô, số lô..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="recalled">Đã thu hồi</option>
              <option value="expired">Hết hạn</option>
              <option value="suspended">Tạm dừng</option>
            </select>
          </div>
          
          <button
            onClick={loadDrugs}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Drugs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : drugs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
            <p className="text-gray-600">Chưa có lô thuốc nào trong hệ thống</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông tin thuốc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhà sản xuất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày sản xuất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạn sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drugs.map((drug) => (
                    <tr key={drug._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {drug.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Mã lô: {drug.drugId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Số lô: {drug.batchNumber}
                          </div>
                          {drug.blockchain?.blockchainId && (
                            <div className="text-xs text-blue-600 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                Blockchain: {drug.blockchain.blockchainId.substring(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {drug.manufacturerId?.fullName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(drug.productionDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(drug.expiryDate).toLocaleDateString('vi-VN')}
                        </div>
                        {drug.daysUntilExpiry && (
                          <div className="text-xs text-gray-500">
                            {drug.daysUntilExpiry > 0 ? `${drug.daysUntilExpiry} ngày` : 'Đã hết hạn'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(drug)}`}>
                          {getStatusIcon(drug)}
                          {getStatusText(drug)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openQRModal(drug)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem QR Code"
                          >
                            <QrCode className="w-5 h-5" />
                          </button>
                          {drug.blockchain?.blockchainId && (
                            <button
                              onClick={() => openBlockchainModal(drug)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Xem thông tin Blockchain"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(drug)}
                            className="text-green-600 hover:text-green-900"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {!drug.isRecalled && (
                            <button
                              onClick={() => handleRecall(drug._id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Thu hồi"
                            >
                              <AlertTriangle className="w-5 h-5" />
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(drug._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Drug Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tạo lô thuốc mới</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên thuốc *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Tên thuốc là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành phần hoạt chất *
                    </label>
                    <input
                      type="text"
                      {...register('activeIngredient', { required: 'Thành phần hoạt chất là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.activeIngredient && (
                      <p className="text-red-500 text-sm mt-1">{errors.activeIngredient.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Liều lượng *
                    </label>
                    <input
                      type="text"
                      {...register('dosage', { required: 'Liều lượng là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.dosage && (
                      <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dạng bào chế *
                    </label>
                    <select
                      {...register('form', { required: 'Dạng bào chế là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn dạng bào chế</option>
                      <option value="viên nén">Viên nén</option>
                      <option value="viên nang">Viên nang</option>
                      <option value="siro">Siro</option>
                      <option value="dung dịch tiêm">Dung dịch tiêm</option>
                      <option value="kem">Kem</option>
                      <option value="gel">Gel</option>
                      <option value="thuốc mỡ">Thuốc mỡ</option>
                      <option value="khác">Khác</option>
                    </select>
                    {errors.form && (
                      <p className="text-red-500 text-sm mt-1">{errors.form.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lô sản xuất *
                    </label>
                    <input
                      type="text"
                      {...register('batchNumber', { required: 'Số lô sản xuất là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.batchNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.batchNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sản xuất *
                    </label>
                    <input
                      type="date"
                      {...register('productionDate', { required: 'Ngày sản xuất là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.productionDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.productionDate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn sử dụng *
                    </label>
                    <input
                      type="date"
                      {...register('expiryDate', { required: 'Hạn sử dụng là bắt buộc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Tạo lô thuốc
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedDrug && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900">{selectedDrug.name}</h4>
                  <p className="text-sm text-gray-600">Mã lô: {selectedDrug.drugId}</p>
                </div>
                
                {selectedDrug.qrCode?.imageUrl ? (
                  <div className="bg-white p-4 rounded-lg border">
                    <img
                      src={selectedDrug.qrCode.imageUrl}
                      alt="QR Code"
                      className="mx-auto"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 p-8 rounded-lg">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto" />
                    <p className="text-gray-500 mt-2">QR Code đang được tạo...</p>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>Quét mã QR để xem thông tin chi tiết</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Info Modal */}
      {showBlockchainModal && selectedDrug && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Thông tin Blockchain</h3>
                <button
                  onClick={() => setShowBlockchainModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Thông tin lô thuốc</h4>
                  <p className="text-sm text-blue-800">{selectedDrug.name}</p>
                  <p className="text-sm text-blue-700">Mã lô: {selectedDrug.drugId}</p>
                </div>

                {selectedDrug.blockchain ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Blockchain ID</h5>
                        <p className="text-sm text-gray-600 font-mono break-all">
                          {selectedDrug.blockchain.blockchainId}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Trạng thái</h5>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedDrug.blockchain.blockchainStatus === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedDrug.blockchain.blockchainStatus === 'confirmed' ? 'Đã xác nhận' : 'Đang chờ'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Transaction Hash</h5>
                        <p className="text-sm text-gray-600 font-mono break-all">
                          {selectedDrug.blockchain.transactionHash}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Block Number</h5>
                        <p className="text-sm text-gray-600">
                          {selectedDrug.blockchain.blockNumber?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Chữ ký số</h5>
                      <p className="text-sm text-gray-600 font-mono break-all">
                        {selectedDrug.blockchain.digitalSignature ? 
                          selectedDrug.blockchain.digitalSignature.substring(0, 50) + '...' : 
                          'N/A'
                        }
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Hash dữ liệu</h5>
                      <p className="text-sm text-gray-600 font-mono break-all">
                        {selectedDrug.blockchain.dataHash ? 
                          selectedDrug.blockchain.dataHash.substring(0, 50) + '...' : 
                          'N/A'
                        }
                      </p>
                    </div>

                    {selectedDrug.blockchain.transactionHistory && selectedDrug.blockchain.transactionHistory.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Lịch sử giao dịch</h5>
                        <div className="space-y-2">
                          {selectedDrug.blockchain.transactionHistory.map((tx, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{tx.action}</p>
                                  <p className="text-xs text-gray-600">{tx.details}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(tx.timestamp).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">Block #{tx.blockNumber}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedDrug.blockchain.blockchainId);
                          alert('Đã copy Blockchain ID!');
                        }}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        Copy Blockchain ID
                      </button>
                      <button
                        onClick={() => {
                          window.open(`/verify/${selectedDrug.blockchain.blockchainId}`, '_blank');
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">Lô thuốc này chưa được ghi lên blockchain.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default Drugs;
