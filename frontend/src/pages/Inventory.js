import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  Plus,
  Minus,
  ArrowRightLeft,
  ClipboardCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Box,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [locations, setLocations] = useState([]);
  
  // Modal states
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showStocktakeModal, setShowStocktakeModal] = useState(false);
  
  // Selected item
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    locationId: '',
    drugId: '',
    status: '',
    lowStock: false,
    nearExpiry: false,
    expired: false,
    search: ''
  });

  // Form data
  const [stockInForm, setStockInForm] = useState({
    drugId: '',
    batchNumber: '',
    locationId: '',
    locationName: '',
    locationType: 'warehouse',
    quantity: '',
    unit: 'viên',
    unitPrice: '',
    expiryDate: '',
    productionDate: '',
    supplierId: '',
    supplierName: '',
    notes: ''
  });

  const [stockOutForm, setStockOutForm] = useState({
    drugId: '',
    locationId: '',
    quantity: '',
    reason: 'sale',
    recipientName: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    drugId: '',
    fromLocationId: '',
    toLocationId: '',
    toLocationName: '',
    toLocationType: 'warehouse',
    quantity: '',
    notes: ''
  });

  const [stocktakeForm, setStocktakeForm] = useState({
    locationId: '',
    items: [{ drugId: '', actualQuantity: '', notes: '' }],
    stocktakeDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    drugId: '',
    locationId: '',
    newQuantity: '',
    reason: 'adjustment',
    notes: ''
  });

  // Load data
  const loadInventory = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
        )
      };
      
      const response = await inventoryAPI.getInventory(params);
      if (response && response.success) {
        setItems(response.data.items || []);
        setPagination(response.data.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền xem danh sách tồn kho này');
      } else if (error.response?.status !== 404) {
        toast.error('Lỗi khi tải danh sách tồn kho');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = {};
      if (filters.locationId) params.locationId = filters.locationId;
      
      const response = await inventoryAPI.getStats(params);
      if (response && response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền xem thống kê tồn kho');
      }
    }
  };

  useEffect(() => {
    loadInventory(1);
    loadStats();
  }, []);

  // Refresh data
  const handleRefresh = () => {
    loadInventory(pagination.page);
    loadStats();
  };

  // Stock In
  const handleStockIn = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!stockInForm.drugId || !stockInForm.locationId || !stockInForm.locationName || !stockInForm.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const quantity = parseFloat(stockInForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      const response = await inventoryAPI.stockIn(stockInForm);
      
      if (response && response.success) {
        toast.success(`Nhập kho thành công: ${quantity} ${stockInForm.unit || 'viên'}`);
        setShowStockInModal(false);
        setStockInForm({
          drugId: '',
          batchNumber: '',
          locationId: '',
          locationName: '',
          locationType: 'warehouse',
          quantity: '',
          unit: 'viên',
          unitPrice: '',
          expiryDate: '',
          productionDate: '',
          supplierId: '',
          supplierName: '',
          notes: ''
        });
        handleRefresh();
      } else {
        toast.error(response?.message || 'Lỗi khi nhập kho');
      }
    } catch (error) {
      console.error('Error stocking in:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền nhập kho tại địa điểm này');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi nhập kho. Vui lòng thử lại.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Stock Out
  const handleStockOut = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!stockOutForm.drugId || !stockOutForm.locationId || !stockOutForm.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const quantity = parseFloat(stockOutForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    // Kiểm tra số lượng không vượt quá tồn kho
    if (selectedItem && quantity > selectedItem.quantity) {
      toast.error(`Số lượng xuất (${quantity}) không được vượt quá tồn kho hiện tại (${selectedItem.quantity} ${selectedItem.unit || 'viên'})`);
      return;
    }

    try {
      setLoading(true);
      const response = await inventoryAPI.stockOut(stockOutForm);
      
      if (response && response.success) {
        toast.success(`Xuất kho thành công: ${quantity} ${selectedItem?.unit || 'viên'}`);
      setShowStockOutModal(false);
      setStockOutForm({
        drugId: '',
        locationId: '',
        quantity: '',
        reason: 'sale',
        recipientName: '',
        notes: ''
      });
        setSelectedItem(null);
      handleRefresh();
      } else {
        toast.error(response?.message || 'Lỗi khi xuất kho');
      }
    } catch (error) {
      console.error('Error stocking out:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền xuất kho tại địa điểm này');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi xuất kho. Vui lòng thử lại.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Open stock out modal with selected item
  const handleOpenStockOutModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setStockOutForm({
        drugId: item.drugId || item.drug?._id || '',
        locationId: item.location?.locationId || '',
        quantity: '',
        reason: 'sale',
        recipientName: '',
        notes: ''
      });
    }
    setShowStockOutModal(true);
  };

  // Transfer Stock
  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await inventoryAPI.transferStock(transferForm);
      
      if (response && response.success) {
        toast.success('Chuyển kho thành công!');
      setShowTransferModal(false);
      setTransferForm({
        drugId: '',
        fromLocationId: '',
        toLocationId: '',
        toLocationName: '',
        toLocationType: 'warehouse',
        quantity: '',
        notes: ''
      });
        setSelectedItem(null);
      handleRefresh();
      } else {
        toast.error(response?.message || 'Lỗi khi chuyển kho');
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền chuyển kho giữa các địa điểm này');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi chuyển kho. Vui lòng thử lại.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load locations for dropdown
  const loadLocations = async () => {
    try {
      const response = await inventoryAPI.getLocations();
      if (response && response.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  // Open transfer modal with selected item
  const handleOpenTransferModal = async (item = null) => {
    // Load locations when opening modal
    await loadLocations();
    
    if (item) {
      setSelectedItem(item);
      setTransferForm({
        drugId: item.drugId || item.drug?._id || '',
        fromLocationId: item.location?.locationId || '',
        toLocationId: '',
        toLocationName: '',
        toLocationType: 'warehouse',
        quantity: '',
        notes: ''
      });
    }
    setShowTransferModal(true);
  };

  // Handle location selection for destination
  const handleLocationSelect = (locationId) => {
    const selectedLocation = locations.find(loc => loc.locationId === locationId);
    if (selectedLocation) {
      setTransferForm({
        ...transferForm,
        toLocationId: selectedLocation.locationId,
        toLocationName: selectedLocation.locationName,
        toLocationType: selectedLocation.locationType || 'warehouse'
      });
    }
  };

  // Stocktake
  const handleStocktake = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!stocktakeForm.locationId) {
      toast.error('Vui lòng nhập Location ID');
      return;
    }

    // Filter out empty items
    const validItems = stocktakeForm.items.filter(item => item.drugId && item.actualQuantity !== '');
    if (validItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một item để kiểm kê');
      return;
    }

    // Validate actualQuantity
    for (const item of validItems) {
      const actualQty = parseFloat(item.actualQuantity);
      if (isNaN(actualQty) || actualQty < 0) {
        toast.error(`Số lượng thực tế phải là số >= 0 cho item ${item.drugId}`);
        return;
      }
    }

    try {
      setLoading(true);
      const response = await inventoryAPI.stocktake({
        ...stocktakeForm,
        items: validItems.map(item => ({
          drugId: item.drugId,
          actualQuantity: parseFloat(item.actualQuantity),
          notes: item.notes || ''
        }))
      });
      
      if (response && response.success) {
        const summary = response.data?.summary || {};
        const adjustedCount = summary.adjustedItems || 0;
        const totalCount = summary.totalItems || 0;
        toast.success(`Kiểm kê thành công: ${adjustedCount}/${totalCount} items được điều chỉnh`);
        setShowStocktakeModal(false);
        setStocktakeForm({
          locationId: '',
          items: [{ drugId: '', actualQuantity: '', notes: '' }],
          stocktakeDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        handleRefresh();
      } else {
        toast.error(response?.message || 'Lỗi khi kiểm kê kho');
      }
    } catch (error) {
      console.error('Error stocktaking:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền kiểm kê kho tại địa điểm này');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi kiểm kê kho. Vui lòng thử lại.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Adjust Stock
  const handleAdjust = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!adjustForm.drugId || !adjustForm.locationId || !adjustForm.newQuantity) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newQuantity = parseFloat(adjustForm.newQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error('Số lượng mới phải lớn hơn hoặc bằng 0');
      return;
    }

    // Kiểm tra nếu số lượng không thay đổi
    if (selectedItem && newQuantity === selectedItem.quantity) {
      toast.error('Số lượng mới phải khác số lượng hiện tại');
      return;
    }

    try {
      setLoading(true);
      const response = await inventoryAPI.adjustStock({
        ...adjustForm,
        newQuantity: newQuantity
      });
      
      if (response && response.success) {
        const oldQty = selectedItem?.quantity || 0;
        const diff = newQuantity - oldQty;
        const diffText = diff > 0 ? `tăng ${diff}` : `giảm ${Math.abs(diff)}`;
        toast.success(`Điều chỉnh kho thành công: ${diffText} ${selectedItem?.unit || 'viên'}`);
      setShowAdjustModal(false);
      setAdjustForm({
        drugId: '',
        locationId: '',
        newQuantity: '',
        reason: 'adjustment',
        notes: ''
      });
        setSelectedItem(null);
      handleRefresh();
      } else {
        toast.error(response?.message || 'Lỗi khi điều chỉnh kho');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Bạn không có quyền điều chỉnh kho tại địa điểm này');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi điều chỉnh kho. Vui lòng thử lại.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Open adjust modal with selected item
  const handleOpenAdjustModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setAdjustForm({
        drugId: item.drugId || item.drug?._id || '',
        locationId: item.location?.locationId || '',
        newQuantity: item.quantity?.toString() || '',
        reason: 'adjustment',
        notes: ''
      });
    }
    setShowAdjustModal(true);
  };

  // Add item to stocktake form
  const addStocktakeItem = () => {
    setStocktakeForm({
      ...stocktakeForm,
      items: [...stocktakeForm.items, { drugId: '', actualQuantity: '', notes: '' }]
    });
  };

  // Remove item from stocktake form
  const removeStocktakeItem = (index) => {
    const newItems = stocktakeForm.items.filter((_, i) => i !== index);
    setStocktakeForm({ ...stocktakeForm, items: newItems });
  };

  // Update stocktake item
  const updateStocktakeItem = (index, field, value) => {
    const newItems = [...stocktakeForm.items];
    newItems[index][field] = value;
    setStocktakeForm({ ...stocktakeForm, items: newItems });
  };

  // Add item from inventory table to stocktake
  const addItemToStocktake = (item) => {
    const existingIndex = stocktakeForm.items.findIndex(i => i.drugId === (item.drugId || item.drug?._id));
    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...stocktakeForm.items];
      newItems[existingIndex].actualQuantity = item.quantity?.toString() || '';
      setStocktakeForm({ ...stocktakeForm, items: newItems });
    } else {
      // Add new item
      setStocktakeForm({
        ...stocktakeForm,
        locationId: item.location?.locationId || stocktakeForm.locationId,
        items: [
          ...stocktakeForm.items,
          {
            drugId: item.drugId || item.drug?._id || '',
            actualQuantity: item.quantity?.toString() || '',
            notes: ''
          }
        ]
      });
    }
    setShowStocktakeModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      case 'quarantine': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'recalled': return 'bg-purple-100 text-purple-800';
      case 'damaged': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function để tạo unique key - luôn đảm bảo trả về string và unique
  const getUniqueKey = (item, idx) => {
    // Luôn bắt đầu với index để đảm bảo uniqueness ngay từ đầu
    let idPart = '';
    
    // Thử lấy ID từ nhiều nguồn
    if (item._id) {
      if (typeof item._id === 'string' && item._id.trim() !== '' && item._id !== '[object Object]') {
        idPart = item._id;
      } else if (typeof item._id === 'object' && item._id !== null) {
        // Nếu _id là object, lấy nested _id hoặc id
        const nestedId = item._id._id || item._id.id;
        if (nestedId && typeof nestedId === 'string' && nestedId !== '[object Object]') {
          idPart = nestedId;
        }
      }
    }
    
    // Nếu không có ID hợp lệ, tạo từ các giá trị khác
    if (!idPart || idPart === '[object Object]') {
      const drugId = String(item.drugId || item.drug?._id || '');
      const batchNumber = String(item.batchNumber || '');
      const locationId = String(item.location?.locationId || item.locationId || '');
      const createdAt = item.createdAt ? String(new Date(item.createdAt).getTime()) : String(Date.now());
      idPart = `${drugId}-${batchNumber}-${locationId}-${createdAt}`;
    }
    
    // Luôn kết hợp index làm phần chính để đảm bảo unique tuyệt đối
    return `inventory-${idx}-${idPart}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Kho hàng</h1>
          <p className="text-gray-600">Theo dõi và quản lý tồn kho real-time</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {hasAnyRole(['admin', 'manufacturer', 'distributor', 'hospital']) && (
            <>
              <button
                onClick={() => setShowStockInModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nhập kho
              </button>
              <button
                onClick={() => setShowStockOutModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Xuất kho
              </button>
              <button
                onClick={() => handleOpenTransferModal()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Chuyển kho
              </button>
            </>
          )}
          {hasAnyRole(['admin', 'manufacturer']) && (
            <>
              <button
                onClick={() => handleOpenAdjustModal()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Điều chỉnh
              </button>
              <button
                onClick={() => setShowStocktakeModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                Kiểm kê
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems || 0}</p>
              </div>
              <Box className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số lượng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity || 0}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStock || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sắp hết hạn</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.nearExpiry || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Tên thuốc, mã lô..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm
            </label>
            <input
              type="text"
              value={filters.locationId}
              onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
              placeholder="Location ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              <option value="">Tất cả</option>
              <option value="available">Có sẵn</option>
              <option value="reserved">Đã đặt</option>
              <option value="quarantine">Cách ly</option>
              <option value="expired">Hết hạn</option>
              <option value="recalled">Thu hồi</option>
              <option value="damaged">Hư hỏng</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Sắp hết hàng</span>
            </label>
            <button
              onClick={() => {
                setFilters({
                  locationId: '',
                  drugId: '',
                  status: '',
                  lowStock: false,
                  nearExpiry: false,
                  expired: false,
                  search: ''
                });
                setTimeout(() => {
                  loadInventory(1);
                  loadStats();
                }, 100);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Reset
            </button>
            <button
              onClick={() => {
                loadInventory(1);
                loadStats();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thuốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạn sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={getUniqueKey(item, idx)} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.drugName}</div>
                      <div className="text-sm text-gray-500">Lô: {item.batchNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.location.locationName}</div>
                      <div className="text-sm text-gray-500">{item.location.locationId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.quantity} {item.unit}
                      </div>
                      {item.quantity <= item.minStock && item.quantity > 0 && (
                        <div className="text-xs text-orange-600">Sắp hết hàng</div>
                      )}
                      {item.quantity === 0 && (
                        <div className="text-xs text-red-600">Hết hàng</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(item.expiryDate)}</div>
                      {item.daysUntilExpiry !== null && (
                        <div className={`text-xs ${item.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {item.daysUntilExpiry > 0 ? `Còn ${item.daysUntilExpiry} ngày` : 'Đã hết hạn'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('vi-VN').format(item.totalValue || 0)} đ
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {hasAnyRole(['admin', 'manufacturer', 'distributor', 'hospital']) && (
                          <>
                            <button
                              onClick={() => handleOpenStockOutModal(item)}
                              className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
                              title="Xuất kho"
                            >
                              <Minus className="w-3 h-3" />
                              Xuất
                            </button>
                            <button
                              onClick={() => handleOpenTransferModal(item)}
                              className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
                              title="Chuyển kho"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Chuyển
                            </button>
                          </>
                        )}
                        {hasAnyRole(['admin', 'manufacturer']) && (
                          <>
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              title="Điều chỉnh số lượng"
                            >
                              <Package className="w-3 h-3" />
                              Điều chỉnh
                            </button>
                            <button
                              onClick={() => addItemToStocktake(item)}
                              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                              title="Thêm vào kiểm kê"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              Kiểm kê
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Trang {pagination.page} / {pagination.pages} (Tổng: {pagination.total})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadInventory(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadInventory(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nhập kho</h2>
            <form onSubmit={handleStockIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã thuốc *</label>
                  <input
                    type="text"
                    value={stockInForm.drugId}
                    onChange={(e) => setStockInForm({ ...stockInForm, drugId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lô</label>
                  <input
                    type="text"
                    value={stockInForm.batchNumber}
                    onChange={(e) => setStockInForm({ ...stockInForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location ID *</label>
                  <input
                    type="text"
                    value={stockInForm.locationId}
                    onChange={(e) => setStockInForm({ ...stockInForm, locationId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên địa điểm *</label>
                  <input
                    type="text"
                    value={stockInForm.locationName}
                    onChange={(e) => setStockInForm({ ...stockInForm, locationName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
                  <input
                    type="number"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                  <select
                    value={stockInForm.unit}
                    onChange={(e) => setStockInForm({ ...stockInForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="viên">Viên</option>
                    <option value="hộp">Hộp</option>
                    <option value="chai">Chai</option>
                    <option value="lọ">Lọ</option>
                    <option value="túi">Túi</option>
                    <option value="ống">Ống</option>
                    <option value="gói">Gói</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá đơn vị</label>
                  <input
                    type="number"
                    value={stockInForm.unitPrice}
                    onChange={(e) => setStockInForm({ ...stockInForm, unitPrice: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn sử dụng</label>
                  <input
                    type="date"
                    value={stockInForm.expiryDate}
                    onChange={(e) => setStockInForm({ ...stockInForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={stockInForm.notes}
                  onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {showStockOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Minus className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold">Xuất kho</h2>
            </div>
            
            {/* Thông tin item nếu được chọn từ bảng */}
            {selectedItem && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Thông tin hàng hóa:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tên thuốc:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.drugName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Số lô:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.batchNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa điểm:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.location?.locationName || selectedItem.location?.locationId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tồn kho:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      {selectedItem.quantity} {selectedItem.unit || 'viên'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleStockOut} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã thuốc / ID thuốc *
                </label>
                <input
                  type="text"
                  value={stockOutForm.drugId}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, drugId: e.target.value })}
                  required
                  placeholder="Nhập mã thuốc hoặc chọn từ danh sách"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {selectedItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Đang chọn: {selectedItem.drugName} (Lô: {selectedItem.batchNumber})
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location ID *
                </label>
                <input
                  type="text"
                  value={stockOutForm.locationId}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, locationId: e.target.value })}
                  required
                  placeholder="VD: WH001, DIST001, HOSP001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {selectedItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Hiện tại: {selectedItem.location?.locationId || 'N/A'} - {selectedItem.location?.locationName || ''}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng xuất *
                </label>
                <input
                  type="number"
                  value={stockOutForm.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStockOutForm({ ...stockOutForm, quantity: value });
                  }}
                  required
                  min="1"
                  step="1"
                  placeholder="Nhập số lượng"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    selectedItem && parseFloat(stockOutForm.quantity) > selectedItem.quantity
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                {selectedItem && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      Tồn kho hiện tại: <span className="font-medium">{selectedItem.quantity} {selectedItem.unit || 'viên'}</span>
                    </p>
                    {parseFloat(stockOutForm.quantity) > selectedItem.quantity && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Số lượng xuất vượt quá tồn kho!
                      </p>
                    )}
                    {stockOutForm.quantity && parseFloat(stockOutForm.quantity) <= selectedItem.quantity && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Số lượng còn lại sau khi xuất: {selectedItem.quantity - parseFloat(stockOutForm.quantity || 0)} {selectedItem.unit || 'viên'}
                      </p>
                    )}
              </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do xuất kho *
                </label>
                <select
                  value={stockOutForm.reason}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="sale">Bán hàng</option>
                  <option value="consumption">Tiêu thụ</option>
                  <option value="damage">Hư hỏng</option>
                  <option value="expired">Hết hạn</option>
                  <option value="recall">Thu hồi</option>
                  <option value="transfer_out">Chuyển kho</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người nhận / Đơn vị nhận
                </label>
                <input
                  type="text"
                  value={stockOutForm.recipientName}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, recipientName: e.target.value })}
                  placeholder="Tên người nhận hoặc đơn vị (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={stockOutForm.notes}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Ghi chú về việc xuất kho (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  <strong>Lưu ý:</strong> Hệ thống sẽ tự động:
                </p>
                <ul className="text-sm text-orange-700 mt-2 list-disc list-inside space-y-1">
                  <li>Giảm số lượng tồn kho tại địa điểm này</li>
                  <li>Ghi lại transaction history</li>
                  <li>Cập nhật thống kê real-time</li>
                  <li>Ghi audit log cho việc xuất kho</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockOutModal(false);
                    setStockOutForm({
                      drugId: '',
                      locationId: '',
                      quantity: '',
                      reason: 'sale',
                      recipientName: '',
                      notes: ''
                    });
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedItem && parseFloat(stockOutForm.quantity) > selectedItem.quantity)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4" />
                      Xác nhận xuất kho
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Điều chỉnh kho</h2>
            </div>
            
            {/* Thông tin item nếu được chọn từ bảng */}
            {selectedItem && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Thông tin hàng hóa:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tên thuốc:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.drugName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Số lô:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.batchNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa điểm:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.location?.locationName || selectedItem.location?.locationId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tồn kho hiện tại:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {selectedItem.quantity} {selectedItem.unit || 'viên'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã thuốc / ID thuốc *
                </label>
                <input
                  type="text"
                  value={adjustForm.drugId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, drugId: e.target.value })}
                  required
                  placeholder="Nhập mã thuốc hoặc chọn từ danh sách"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Đang chọn: {selectedItem.drugName} (Lô: {selectedItem.batchNumber})
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location ID *
                </label>
                <input
                  type="text"
                  value={adjustForm.locationId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, locationId: e.target.value })}
                  required
                  placeholder="VD: WH001, DIST001, HOSP001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Hiện tại: {selectedItem.location?.locationId || 'N/A'} - {selectedItem.location?.locationName || ''}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng mới *
                </label>
                <input
                  type="number"
                  value={adjustForm.newQuantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAdjustForm({ ...adjustForm, newQuantity: value });
                  }}
                  required
                  min="0"
                  step="1"
                  placeholder="Nhập số lượng mới"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    selectedItem && parseFloat(adjustForm.newQuantity) === selectedItem.quantity
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300'
                  }`}
                />
                {selectedItem && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Số lượng hiện tại:</span>
                      <span className="font-medium text-gray-900">{selectedItem.quantity} {selectedItem.unit || 'viên'}</span>
                    </div>
                    {adjustForm.newQuantity && (
                      <>
                        {parseFloat(adjustForm.newQuantity) === selectedItem.quantity ? (
                          <p className="text-xs text-yellow-600 mt-1">
                            ⚠️ Số lượng mới giống số lượng hiện tại!
                          </p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Số lượng mới:</span>
                              <span className="font-medium text-blue-600">{adjustForm.newQuantity} {selectedItem.unit || 'viên'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Chênh lệch:</span>
                              <span className={`font-medium ${
                                parseFloat(adjustForm.newQuantity) > selectedItem.quantity 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {parseFloat(adjustForm.newQuantity) > selectedItem.quantity ? '+' : ''}
                                {parseFloat(adjustForm.newQuantity) - selectedItem.quantity} {selectedItem.unit || 'viên'}
                                {parseFloat(adjustForm.newQuantity) > selectedItem.quantity ? (
                                  <TrendingUp className="w-3 h-3 inline ml-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 inline ml-1" />
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do điều chỉnh
                </label>
                <select
                  value={adjustForm.reason || 'adjustment'}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="adjustment">Điều chỉnh tồn kho</option>
                  <option value="inventory_check">Kiểm kê</option>
                  <option value="correction">Sửa lỗi</option>
                  <option value="damage_found">Phát hiện hư hỏng</option>
                  <option value="found">Tìm thấy hàng</option>
                  <option value="lost">Mất hàng</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Ghi chú về việc điều chỉnh (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Hệ thống sẽ tự động:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                  <li>Cập nhật số lượng tồn kho thành số lượng mới</li>
                  <li>Ghi lại transaction history với chênh lệch</li>
                  <li>Cập nhật thống kê real-time</li>
                  <li>Ghi audit log cho việc điều chỉnh</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustForm({
                      drugId: '',
                      locationId: '',
                      newQuantity: '',
                      reason: 'adjustment',
                      notes: ''
                    });
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedItem && parseFloat(adjustForm.newQuantity) === selectedItem.quantity)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      Xác nhận điều chỉnh
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Chuyển kho</h2>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã thuốc / ID thuốc *
                  </label>
                  <input
                    type="text"
                    value={transferForm.drugId}
                    onChange={(e) => setTransferForm({ ...transferForm, drugId: e.target.value })}
                    required
                    placeholder="Nhập mã thuốc hoặc chọn từ danh sách"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {selectedItem && (
                    <p className="text-xs text-gray-500 mt-1">
                      Đang chọn: {selectedItem.drugName} (Lô: {selectedItem.batchNumber})
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng chuyển *
                  </label>
                  <input
                    type="number"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                    required
                    min="1"
                    placeholder="Nhập số lượng"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {selectedItem && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tồn kho hiện tại: {selectedItem.quantity} {selectedItem.unit || 'viên'}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Kho nguồn (Xuất từ)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location ID nguồn *
                    </label>
                    <input
                      type="text"
                      value={transferForm.fromLocationId}
                      onChange={(e) => setTransferForm({ ...transferForm, fromLocationId: e.target.value })}
                      required
                      placeholder="VD: WH001, DIST001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {selectedItem && (
                      <p className="text-xs text-gray-500 mt-1">
                        Hiện tại: {selectedItem.location?.locationId || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Kho đích (Nhập vào)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn kho đích *
                    </label>
                    <select
                      value={transferForm.toLocationId}
                      onChange={(e) => handleLocationSelect(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">-- Chọn kho đích --</option>
                      {locations
                        .filter(loc => loc.locationId !== transferForm.fromLocationId)
                        .map((location) => (
                          <option key={location.locationId} value={location.locationId}>
                            {location.locationName} ({location.locationId})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Chọn từ {locations.length} kho có sẵn
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hoặc nhập Location ID mới
                    </label>
                    <input
                      type="text"
                      value={transferForm.toLocationId}
                      onChange={(e) => setTransferForm({ ...transferForm, toLocationId: e.target.value })}
                      placeholder="VD: WH002, HOSP001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên địa điểm đích *
                    </label>
                    <input
                      type="text"
                      value={transferForm.toLocationName}
                      onChange={(e) => setTransferForm({ ...transferForm, toLocationName: e.target.value })}
                      required
                      placeholder="VD: Kho chính Hà Nội"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại địa điểm
                    </label>
                    <select
                      value={transferForm.toLocationType}
                      onChange={(e) => setTransferForm({ ...transferForm, toLocationType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="warehouse">Kho hàng</option>
                      <option value="distribution_center">Trung tâm phân phối</option>
                      <option value="hospital">Bệnh viện</option>
                      <option value="pharmacy">Nhà thuốc</option>
                      <option value="manufacturing_plant">Nhà máy</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Ghi chú về việc chuyển kho (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Hệ thống sẽ tự động:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                  <li>Xuất hàng từ kho nguồn ({transferForm.fromLocationId || '...'})</li>
                  <li>Nhập hàng vào kho đích ({transferForm.toLocationId || '...'})</li>
                  <li>Ghi lại transaction history</li>
                  <li>Cập nhật số lượng tồn kho real-time</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferForm({
                      drugId: '',
                      fromLocationId: '',
                      toLocationId: '',
                      toLocationName: '',
                      toLocationType: 'warehouse',
                      quantity: '',
                      notes: ''
                    });
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      Xác nhận chuyển kho
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stocktake Modal */}
      {showStocktakeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold">Kiểm kê kho</h2>
            </div>
            
            <form onSubmit={handleStocktake} className="space-y-4">
              {/* Location và Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location ID *
                  </label>
                  <input
                    type="text"
                    value={stocktakeForm.locationId}
                    onChange={(e) => setStocktakeForm({ ...stocktakeForm, locationId: e.target.value })}
                    required
                    placeholder="VD: WH001, DIST001, HOSP001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kiểm kê *
                  </label>
                  <input
                    type="date"
                    value={stocktakeForm.stocktakeDate}
                    onChange={(e) => setStocktakeForm({ ...stocktakeForm, stocktakeDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Danh sách hàng hóa kiểm kê
                  </h3>
                  <button
                    type="button"
                    onClick={addStocktakeItem}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm item
                  </button>
                </div>

                <div className="space-y-3">
                  {stocktakeForm.items.map((item, index) => {
                    // Tìm item trong inventory để hiển thị thông tin
                    const inventoryItem = items.find(i => 
                      (i.drugId || i.drug?._id) === item.drugId && 
                      i.location?.locationId === stocktakeForm.locationId
                    );
                    const currentQuantity = inventoryItem?.quantity || 0;
                    const actualQty = parseFloat(item.actualQuantity) || 0;
                    const difference = actualQty - currentQuantity;

                    return (
                      <div key={`stocktake-item-${index}-${String(item.drugId || '')}-${index}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-12 gap-3 items-start">
                          <div className="col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mã thuốc / ID thuốc *
                            </label>
                            <input
                              type="text"
                              value={item.drugId}
                              onChange={(e) => updateStocktakeItem(index, 'drugId', e.target.value)}
                              required
                              placeholder="Nhập mã thuốc"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            />
                            {inventoryItem && (
                              <p className="text-xs text-gray-500 mt-1">
                                {inventoryItem.drugName} (Lô: {inventoryItem.batchNumber})
                              </p>
                            )}
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tồn kho hiện tại
                            </label>
                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
                              {currentQuantity} {inventoryItem?.unit || 'viên'}
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Số lượng thực tế *
                            </label>
                            <input
                              type="number"
                              value={item.actualQuantity}
                              onChange={(e) => updateStocktakeItem(index, 'actualQuantity', e.target.value)}
                              required
                              min="0"
                              step="1"
                              placeholder="0"
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                                difference !== 0 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Chênh lệch
                            </label>
                            <div className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                              difference > 0 
                                ? 'bg-green-100 border-green-300 text-green-700' 
                                : difference < 0 
                                ? 'bg-red-100 border-red-300 text-red-700'
                                : 'bg-gray-100 border-gray-300 text-gray-700'
                            }`}>
                              {difference > 0 ? '+' : ''}{difference} {inventoryItem?.unit || 'viên'}
                              {difference !== 0 && (
                                difference > 0 ? (
                                  <TrendingUp className="w-3 h-3 inline ml-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 inline ml-1" />
                                )
                              )}
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              &nbsp;
                            </label>
                            <button
                              type="button"
                              onClick={() => removeStocktakeItem(index)}
                              className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                              disabled={stocktakeForm.items.length === 1}
                            >
                              Xóa
                            </button>
                          </div>
                          
                          <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              &nbsp;
                            </label>
                            {inventoryItem && (
                              <button
                                type="button"
                                onClick={() => updateStocktakeItem(index, 'actualQuantity', currentQuantity.toString())}
                                className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                                title="Điền số lượng hiện tại"
                              >
                                =
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateStocktakeItem(index, 'notes', e.target.value)}
                            placeholder="Ghi chú (tùy chọn)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú chung
                </label>
                <textarea
                  value={stocktakeForm.notes}
                  onChange={(e) => setStocktakeForm({ ...stocktakeForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Ghi chú về việc kiểm kê (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Lưu ý:</strong> Hệ thống sẽ tự động:
                </p>
                <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
                  <li>So sánh số lượng thực tế với số lượng trong hệ thống</li>
                  <li>Chỉ điều chỉnh các items có chênh lệch</li>
                  <li>Ghi lại transaction history cho mỗi điều chỉnh</li>
                  <li>Cập nhật số lượng tồn kho real-time</li>
                  <li>Ghi audit log cho toàn bộ quá trình kiểm kê</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowStocktakeModal(false);
                    setStocktakeForm({
                      locationId: '',
                      items: [{ drugId: '', actualQuantity: '', notes: '' }],
                      stocktakeDate: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || stocktakeForm.items.filter(i => i.drugId && i.actualQuantity).length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      Xác nhận kiểm kê
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

