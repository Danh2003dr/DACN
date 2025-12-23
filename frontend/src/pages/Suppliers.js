import React, { useState, useEffect } from 'react';
import { supplierAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const { user } = useAuth();
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
    buyerInfo: {
      name: '',
      organization: '',
      taxCode: ''
    },
    signedDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    terms: {
      contractValue: '',
      currency: 'VND',
      paymentTerms: {
        method: 'bank_transfer',
        schedule: '',
        advance: '',
        retention: ''
      },
      deliveryTerms: {
        method: '',
        location: '',
        timeframe: ''
      },
      qualityTerms: {
        standards: [],
        inspection: '',
        warranty: ''
      },
      otherTerms: ''
    },
    notes: ''
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

  // Helper function để normalize ID thành string
  const normalizeId = (id, fallbackKey = '') => {
    if (!id && id !== 0) return '';
    
    // Nếu đã là string hợp lệ, trim và trả về
    if (typeof id === 'string') {
      const trimmed = id.trim();
      if (trimmed !== '' && trimmed !== '[object Object]') {
        return trimmed;
      }
      return '';
    }
    
    // Nếu là number, chuyển sang string
    if (typeof id === 'number') {
      return String(id);
    }
    
    // Nếu là object
    if (typeof id === 'object' && id !== null) {
      // Nếu là ObjectId object, sử dụng toString()
      if (id.toString && typeof id.toString === 'function') {
        try {
          const stringId = id.toString();
          if (stringId && stringId !== '[object Object]' && stringId.trim() !== '') {
            return stringId.trim();
          }
        } catch (e) {
          console.warn('Error calling toString() on ID:', e);
        }
      }
      
      // Thử lấy _id hoặc id từ nested object
      if (id._id !== undefined && id._id !== null) {
        const normalized = normalizeId(id._id, fallbackKey);
        if (normalized) return normalized;
      }
      if (id.id !== undefined && id.id !== null) {
        const normalized = normalizeId(id.id, fallbackKey);
        if (normalized) return normalized;
      }
      
      // Thử lấy từ các key khác nếu có
      if (id.str && typeof id.str === 'string') {
        return id.str.trim();
      }
    }
    
    return '';
  };

  // Tự động điền buyerId và buyerInfo từ user hiện tại khi mở modal
  useEffect(() => {
    if (showContractModal && user) {
      // Normalize user._id để đảm bảo là string
      let userId = '';
      if (user._id) {
        if (typeof user._id === 'string') {
          userId = user._id;
        } else if (typeof user._id === 'object' && user._id.toString) {
          userId = user._id.toString();
        }
      }
      
      setContractData(prev => ({
        ...prev,
        buyerId: userId,
        buyerInfo: {
          name: user.fullName || user.name || '',
          organization: user.organizationInfo?.name || user.organization || '',
          taxCode: user.organizationInfo?.taxCode || user.taxCode || ''
        }
      }));
    }
  }, [showContractModal, user]);

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
      // Không hiển thị toast vì đã dùng skipErrorHandler
      // Chỉ log để debug
      if (error.response?.status && error.response.status >= 500) {
        console.warn('Server error loading suppliers:', error.response?.data?.message || error.message);
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

      // Log selectedSupplier để debug
      console.log('🔍 [handleCreateContract] selectedSupplier:', {
        _id: selectedSupplier._id,
        _idType: typeof selectedSupplier._id,
        supplierCode: selectedSupplier.supplierCode,
        supplierCodeType: typeof selectedSupplier.supplierCode,
        id: selectedSupplier.id,
        fullObject: selectedSupplier
      });

      // Normalize supplier ID - ưu tiên _id, fallback về supplierCode
      let supplierId = '';
      
      // Thử lấy _id trước (ưu tiên vì chắc chắn hơn)
      if (selectedSupplier._id) {
        supplierId = normalizeId(selectedSupplier._id);
        // Validate ObjectId format (24 hex characters)
        if (supplierId && /^[0-9a-fA-F]{24}$/.test(supplierId)) {
          console.log('✅ [handleCreateContract] Using _id as supplierId:', supplierId);
        } else {
          // Nếu _id không hợp lệ, reset để thử supplierCode
          if (!/^[0-9a-fA-F]{24}$/.test(supplierId)) {
            console.warn('⚠️ [handleCreateContract] _id không phải ObjectId hợp lệ, sẽ thử supplierCode');
            supplierId = '';
          }
        }
      }
      
      // Nếu không có _id hợp lệ, thử dùng supplierCode
      if (!supplierId || supplierId === '' || supplierId === '[object Object]' || !/^[0-9a-fA-F]{24}$/.test(supplierId)) {
        if (selectedSupplier.supplierCode && typeof selectedSupplier.supplierCode === 'string') {
          supplierId = selectedSupplier.supplierCode.trim();
          console.log('✅ [handleCreateContract] Using supplierCode as supplierId:', supplierId);
        } else if (selectedSupplier.id) {
          const normalizedId = normalizeId(selectedSupplier.id);
          if (normalizedId && /^[0-9a-fA-F]{24}$/.test(normalizedId)) {
            supplierId = normalizedId;
            console.log('✅ [handleCreateContract] Using id as supplierId:', supplierId);
          }
        }
      }

      // Validate supplierId không được rỗng, không được có dấu chấm ở đầu, và phải có ít nhất 3 ký tự
      if (!supplierId || supplierId === '' || supplierId === '[object Object]' || 
          supplierId.length < 3 || supplierId.startsWith('.')) {
        console.error('❌ [handleCreateContract] Invalid supplier ID:', {
          supplierId,
          supplierIdLength: supplierId?.length,
          selectedSupplier,
          _id: selectedSupplier._id,
          supplierCode: selectedSupplier.supplierCode,
          id: selectedSupplier.id
        });
        toast.error('Không thể lấy ID của nhà cung ứng. Vui lòng thử lại.');
        return;
      }

      console.log('📤 [handleCreateContract] Sending contract data:', {
        supplierId,
        contractType: contractData.contractType,
        startDate: contractData.startDate,
        endDate: contractData.endDate
      });

      await supplierAPI.createContract(supplierId, contractData);
      setShowContractModal(false);
      setSelectedSupplier(null);
      setContractData({
        contractType: 'supply',
        buyerId: user?._id ? (typeof user._id === 'string' ? user._id : user._id.toString()) : '',
        buyerInfo: {
          name: user?.fullName || user?.name || '',
          organization: user?.organizationInfo?.name || user?.organization || '',
          taxCode: user?.organizationInfo?.taxCode || user?.taxCode || ''
        },
        signedDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        terms: {
          contractValue: '',
          currency: 'VND',
          paymentTerms: {
            method: 'bank_transfer',
            schedule: '',
            advance: '',
            retention: ''
          },
          deliveryTerms: {
            method: '',
            location: '',
            timeframe: ''
          },
          qualityTerms: {
            standards: [],
            inspection: '',
            warranty: ''
          },
          otherTerms: ''
        },
        notes: ''
      });
      toast.success('Tạo hợp đồng thành công!');
      loadContracts();
      loadSuppliers();
    } catch (error) {
      console.error('Error creating contract:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tạo hợp đồng';
      toast.error(errorMessage);
    }
  };

  const handleUpdateRating = async () => {
    try {
      if (!selectedSupplier) {
        toast.error('Vui lòng chọn nhà cung ứng để đánh giá');
        return;
      }

      // Validate rating data - kiểm tra giá trị phải > 0
      if (!ratingData.quality || ratingData.quality <= 0 || 
          !ratingData.delivery || ratingData.delivery <= 0 || 
          !ratingData.service || ratingData.service <= 0 || 
          !ratingData.price || ratingData.price <= 0) {
        toast.error('Vui lòng nhập đầy đủ các đánh giá (1-5)');
        return;
      }

      // Normalize supplier ID - ưu tiên _id, fallback về supplierCode
      let supplierId = '';
      
      // Log selectedSupplier để debug
      console.log('🔍 [handleUpdateRating] selectedSupplier:', {
        _id: selectedSupplier._id,
        _idType: typeof selectedSupplier._id,
        supplierCode: selectedSupplier.supplierCode,
        supplierCodeType: typeof selectedSupplier.supplierCode,
        id: selectedSupplier.id,
        fullObject: selectedSupplier
      });
      
      // Thử lấy _id trước (ưu tiên vì chắc chắn hơn)
      if (selectedSupplier._id) {
        supplierId = normalizeId(selectedSupplier._id);
        // Validate ObjectId format (24 hex characters)
        if (supplierId && /^[0-9a-fA-F]{24}$/.test(supplierId)) {
          console.log('✅ Using _id as supplierId:', supplierId);
        } else {
          // Nếu _id không hợp lệ, reset để thử supplierCode
          if (!/^[0-9a-fA-F]{24}$/.test(supplierId)) {
            console.warn('⚠️ _id không phải ObjectId hợp lệ, sẽ thử supplierCode');
            supplierId = '';
          }
        }
      }
      
      // Nếu không có _id hợp lệ, thử dùng supplierCode
      if (!supplierId || supplierId === '' || supplierId === '[object Object]' || !/^[0-9a-fA-F]{24}$/.test(supplierId)) {
        if (selectedSupplier.supplierCode && typeof selectedSupplier.supplierCode === 'string') {
          supplierId = selectedSupplier.supplierCode.trim();
          console.log('✅ Using supplierCode as supplierId:', supplierId);
        } else if (selectedSupplier.id) {
          const normalizedId = normalizeId(selectedSupplier.id);
          if (normalizedId && /^[0-9a-fA-F]{24}$/.test(normalizedId)) {
            supplierId = normalizedId;
            console.log('✅ Using id as supplierId:', supplierId);
          }
        }
      }
      
      // Validate supplierId không được rỗng, không được có dấu chấm ở đầu, và phải có ít nhất 3 ký tự
      if (!supplierId || supplierId === '' || supplierId === '[object Object]' || 
          supplierId.length < 3 || supplierId.startsWith('.')) {
        console.error('❌ Invalid supplier ID:', {
          supplierId,
          supplierIdLength: supplierId?.length,
          selectedSupplier,
          _id: selectedSupplier._id,
          supplierCode: selectedSupplier.supplierCode,
          id: selectedSupplier.id
        });
        toast.error('Không thể lấy ID của nhà cung ứng. Vui lòng thử lại.');
        return;
      }

      console.log('Updating rating for supplier:', {
        supplierId,
        supplierName: selectedSupplier.name,
        supplierCode: selectedSupplier.supplierCode,
        _id: selectedSupplier._id,
        ratingData
      });

      await supplierAPI.updateSupplierRating(supplierId, ratingData);
      setShowRatingModal(false);
      setSelectedSupplier(null);
      toast.success('Cập nhật đánh giá thành công!');
      setRatingData({ quality: 0, delivery: 0, service: 0, price: 0 });
      loadSuppliers();
    } catch (error) {
      console.error('Error updating rating:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        supplier: selectedSupplier
      });
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi cập nhật đánh giá';
      toast.error(errorMessage);
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

  // Helper function để tạo unique key - luôn đảm bảo trả về string và unique
  const getUniqueKey = (item, idx) => {
    let idPart = '';
    
    if (item._id) {
      if (typeof item._id === 'string' && item._id.trim() !== '' && item._id !== '[object Object]') {
        idPart = item._id;
      } else if (typeof item._id === 'object' && item._id !== null) {
        const nestedId = item._id._id || item._id.id;
        if (nestedId && typeof nestedId === 'string' && nestedId !== '[object Object]') {
          idPart = nestedId;
        }
      }
    }
    
    if (!idPart || idPart === '[object Object]') {
      const supplierCode = String(item.supplierCode || '');
      const name = String(item.name || '');
      const createdAt = item.createdAt ? String(new Date(item.createdAt).getTime()) : String(Date.now());
      idPart = `${supplierCode}-${name}-${createdAt}`;
    }
    
    return `supplier-${idx}-${idPart}`;
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
                suppliers.map((supplier, idx) => (
                  <tr key={getUniqueKey(supplier, idx)} className="hover:bg-gray-50">
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
                          // Khởi tạo rating data từ supplier hiện tại hoặc giá trị mặc định
                          setRatingData({
                            quality: supplier.rating?.quality || 0,
                            delivery: supplier.rating?.delivery || 0,
                            service: supplier.rating?.service || 0,
                            price: supplier.rating?.price || 0
                          });
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
              <div className="grid grid-cols-2 gap-4">
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
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị tiền tệ *
                  </label>
                  <select
                    value={contractData.terms.currency}
                    onChange={(e) => setContractData(prev => ({
                      ...prev,
                      terms: { ...prev.terms, currency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (Đô la Mỹ)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
              
              {/* Buyer Info Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Thông tin bên mua</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người đại diện
                    </label>
                    <input
                      type="text"
                      value={contractData.buyerInfo?.name || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        buyerInfo: { ...(prev.buyerInfo || {}), name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Tên người đại diện"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên tổ chức
                    </label>
                    <input
                      type="text"
                      value={contractData.buyerInfo?.organization || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        buyerInfo: { ...(prev.buyerInfo || {}), organization: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Tên tổ chức/công ty"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã số thuế
                    </label>
                    <input
                      type="text"
                      value={contractData.buyerInfo?.taxCode || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        buyerInfo: { ...(prev.buyerInfo || {}), taxCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Mã số thuế"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Điều khoản thanh toán</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phương thức thanh toán
                    </label>
                    <select
                      value={contractData.terms.paymentTerms?.method || 'bank_transfer'}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          paymentTerms: { ...(prev.terms.paymentTerms || {}), method: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="cash">Tiền mặt</option>
                      <option value="check">Séc</option>
                      <option value="credit_card">Thẻ tín dụng</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lịch thanh toán
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.paymentTerms?.schedule || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          paymentTerms: { ...(prev.terms.paymentTerms || {}), schedule: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: 30 ngày sau khi nhận hàng"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỷ lệ ứng trước (%)
                    </label>
                    <input
                      type="number"
                      value={contractData.terms.paymentTerms?.advance || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          paymentTerms: { ...(prev.terms.paymentTerms || {}), advance: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: 30"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỷ lệ giữ lại (%)
                    </label>
                    <input
                      type="number"
                      value={contractData.terms.paymentTerms?.retention || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          paymentTerms: { ...(prev.terms.paymentTerms || {}), retention: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: 5"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Terms Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Điều khoản giao hàng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phương thức giao hàng
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.deliveryTerms?.method || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          deliveryTerms: { ...(prev.terms.deliveryTerms || {}), method: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: Vận chuyển đường bộ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa điểm giao hàng
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.deliveryTerms?.location || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          deliveryTerms: { ...(prev.terms.deliveryTerms || {}), location: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Địa chỉ giao hàng"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian giao hàng
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.deliveryTerms?.timeframe || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          deliveryTerms: { ...(prev.terms.deliveryTerms || {}), timeframe: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: 7-10 ngày làm việc"
                    />
                  </div>
                </div>
              </div>

              {/* Quality Terms Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Điều khoản chất lượng</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu chuẩn chất lượng
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.qualityTerms?.standards?.join(', ') || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          qualityTerms: {
                            ...(prev.terms.qualityTerms || {}),
                            standards: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: GMP, ISO 9001 (phân cách bằng dấu phẩy)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kiểm tra chất lượng
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.qualityTerms?.inspection || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          qualityTerms: { ...(prev.terms.qualityTerms || {}), inspection: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: Kiểm tra tại kho nhận hàng"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bảo hành
                    </label>
                    <input
                      type="text"
                      value={contractData.terms.qualityTerms?.warranty || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: {
                          ...prev.terms,
                          qualityTerms: { ...(prev.terms.qualityTerms || {}), warranty: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="VD: 12 tháng kể từ ngày giao hàng"
                    />
                  </div>
                </div>
              </div>

              {/* Other Terms & Notes */}
              <div className="border-t pt-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điều khoản khác
                    </label>
                    <textarea
                      value={contractData.terms.otherTerms || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        terms: { ...prev.terms, otherTerms: e.target.value }
                      }))}
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Nhập các điều khoản khác (nếu có)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      value={contractData.notes || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      rows="3"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ghi chú bổ sung về hợp đồng"
                    />
                  </div>
                </div>
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

