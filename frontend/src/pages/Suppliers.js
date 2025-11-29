import React, { useState, useEffect } from 'react';
import { supplierAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierData, setSupplierData] = useState({
    name: '',
    type: 'manufacturer',
    contact: {
      email: '',
      phone: '',
      mobile: ''
    },
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    },
    legal: {
      taxCode: ''
    }
  });
  const [contractData, setContractData] = useState({
    contractType: 'supply',
    buyerId: '',
    signedDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    terms: {
      contractValue: '',
      currency: 'VND',
      paymentTerms: {
        method: 'bank_transfer'
      }
    }
  });
  const [ratingData, setRatingData] = useState({
    quality: 0,
    delivery: 0,
    service: 0,
    price: 0
  });

  useEffect(() => {
    loadSuppliers();
    loadContracts();
  }, [filters, pagination.page]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await supplierAPI.getSuppliers(params);
      if (response && response.success) {
        setSuppliers(response.data?.suppliers || []);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
          pages: response.data?.pagination?.pages || 0
        }));
      } else {
        // Empty data - không phải lỗi
        setSuppliers([]);
        setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      // Chỉ hiển thị toast cho lỗi server (500+), không phải 404
      if (error.response?.status && error.response.status >= 500) {
        // Error đã được xử lý bởi interceptor
        console.warn('Server error loading suppliers:', error.message);
      }
      // Luôn set empty để UI hiển thị "Không có dữ liệu"
      setSuppliers([]);
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await supplierAPI.getContracts({ limit: 10 });
      if (response.success) {
        setContracts(response.data.contracts || []);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateSupplier = async () => {
    try {
      if (!supplierData.name) {
        toast.error('Vui lòng nhập tên nhà cung ứng');
        return;
      }

      await supplierAPI.createSupplier(supplierData);
      setShowSupplierModal(false);
      setSupplierData({
        name: '',
        type: 'manufacturer',
        contact: { email: '', phone: '', mobile: '' },
        address: { street: '', city: '', province: '', postalCode: '' },
        legal: { taxCode: '' }
      });
      loadSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };

  const handleCreateContract = async () => {
    try {
      if (!selectedSupplier || !contractData.endDate) {
        toast.error('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      await supplierAPI.createContract(selectedSupplier._id, contractData);
      setShowContractModal(false);
      setSelectedSupplier(null);
      setContractData({
        contractType: 'supply',
        buyerId: '',
        signedDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        terms: {
          contractValue: '',
          currency: 'VND',
          paymentTerms: { method: 'bank_transfer' }
        }
      });
      loadContracts();
      loadSuppliers();
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  };

  const handleUpdateRating = async () => {
    try {
      if (!selectedSupplier) return;

      await supplierAPI.updateSupplierRating(selectedSupplier._id, ratingData);
      setShowRatingModal(false);
      setSelectedSupplier(null);
      setRatingData({ quality: 0, delivery: 0, service: 0, price: 0 });
      loadSuppliers();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      blacklisted: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhà cung ứng</h1>
          <p className="text-gray-600 mt-2">Quản lý hồ sơ nhà cung ứng và hợp đồng</p>
        </div>
        <button
          onClick={() => setShowSupplierModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Thêm nhà cung ứng
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tất cả loại</option>
            <option value="manufacturer">Nhà sản xuất</option>
            <option value="distributor">Nhà phân phối</option>
            <option value="wholesaler">Bán buôn</option>
            <option value="retailer">Bán lẻ</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="suspended">Tạm ngưng</option>
            <option value="blacklisted">Đen</option>
          </select>
          <button
            onClick={() => {
              setFilters({ type: '', status: '', search: '' });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đánh giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier.supplierCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.type === 'manufacturer' ? 'Nhà sản xuất' :
                       supplier.type === 'distributor' ? 'Nhà phân phối' :
                       supplier.type === 'wholesaler' ? 'Bán buôn' :
                       supplier.type === 'retailer' ? 'Bán lẻ' : supplier.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {renderStars(Math.round(supplier.rating?.overall || 0))}
                        <span className="ml-2 text-gray-600">
                          {supplier.rating?.overall?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {supplier.trustScoreValue || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(supplier.status)}`}>
                        {supplier.status === 'active' ? 'Hoạt động' :
                         supplier.status === 'inactive' ? 'Không hoạt động' :
                         supplier.status === 'suspended' ? 'Tạm ngưng' :
                         supplier.status === 'blacklisted' ? 'Đen' : supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowRatingModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        Đánh giá
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowContractModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Hợp đồng
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Thêm nhà cung ứng</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên nhà cung ứng *
                </label>
                <input
                  type="text"
                  value={supplierData.name}
                  onChange={(e) => setSupplierData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại *
                </label>
                <select
                  value={supplierData.type}
                  onChange={(e) => setSupplierData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="manufacturer">Nhà sản xuất</option>
                  <option value="distributor">Nhà phân phối</option>
                  <option value="wholesaler">Bán buôn</option>
                  <option value="retailer">Bán lẻ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={supplierData.contact.email}
                  onChange={(e) => setSupplierData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={supplierData.contact.phone}
                  onChange={(e) => setSupplierData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã số thuế
                </label>
                <input
                  type="text"
                  value={supplierData.legal.taxCode}
                  onChange={(e) => setSupplierData(prev => ({
                    ...prev,
                    legal: { ...prev.legal, taxCode: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowSupplierModal(false);
                  setSupplierData({
                    name: '',
                    type: 'manufacturer',
                    contact: { email: '', phone: '', mobile: '' },
                    address: { street: '', city: '', province: '', postalCode: '' },
                    legal: { taxCode: '' }
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSupplier}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Đánh giá nhà cung ứng</h2>
            <p className="text-sm text-gray-600 mb-4">{selectedSupplier.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chất lượng (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ratingData.quality}
                  onChange={(e) => setRatingData(prev => ({ ...prev, quality: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giao hàng (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ratingData.delivery}
                  onChange={(e) => setRatingData(prev => ({ ...prev, delivery: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dịch vụ (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ratingData.service}
                  onChange={(e) => setRatingData(prev => ({ ...prev, service: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá cả (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ratingData.price}
                  onChange={(e) => setRatingData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedSupplier(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {showContractModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Tạo hợp đồng</h2>
            <p className="text-sm text-gray-600 mb-4">Nhà cung ứng: {selectedSupplier.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại hợp đồng *
                </label>
                <select
                  value={contractData.contractType}
                  onChange={(e) => setContractData(prev => ({ ...prev, contractType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="supply">Cung ứng</option>
                  <option value="service">Dịch vụ</option>
                  <option value="distribution">Phân phối</option>
                  <option value="partnership">Đối tác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày ký *
                </label>
                <input
                  type="date"
                  value={contractData.signedDate}
                  onChange={(e) => setContractData(prev => ({ ...prev, signedDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={contractData.startDate}
                  onChange={(e) => setContractData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={contractData.endDate}
                  onChange={(e) => setContractData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị hợp đồng
                </label>
                <input
                  type="number"
                  value={contractData.terms.contractValue}
                  onChange={(e) => setContractData(prev => ({
                    ...prev,
                    terms: { ...prev.terms, contractValue: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nhập giá trị"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowContractModal(false);
                  setSelectedSupplier(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateContract}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;

