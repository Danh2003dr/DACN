import React, { useState, useEffect } from 'react';
import { orderAPI, drugAPI } from '../utils/api';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  Clock,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    orderType: '',
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Form data
  const [orderForm, setOrderForm] = useState({
    orderType: 'purchase',
    buyerId: '',
    buyerName: '',
    buyerOrganization: '',
    sellerId: '',
    sellerName: '',
    sellerOrganization: '',
    items: [{ drugId: '', quantity: '', unitPrice: '', unit: 'viên', discount: '', notes: '' }],
    shippingAddress: {
      name: '',
      address: '',
      city: '',
      province: '',
      phone: '',
      email: ''
    },
    paymentMethod: 'bank_transfer',
    shippingMethod: 'standard',
    requiredDate: '',
    notes: ''
  });

  // Helper function để chuyển đổi ID thành string an toàn
  const normalizeId = (id) => {
    if (!id && id !== 0) return '';
    if (typeof id === 'string') {
      if (id === '[object Object]') return '';
      return id.trim();
    }
    if (typeof id === 'number') return String(id);
    if (typeof id === 'object') {
      if (id._id !== undefined) return normalizeId(id._id);
      if (id.id !== undefined) return normalizeId(id.id);
      if (typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str === '[object Object]') {
            if (typeof id.valueOf === 'function') {
              const val = id.valueOf();
              if (val && typeof val === 'object' && val.toString) {
                return val.toString();
              }
              return String(val);
            }
            if (id.str) return String(id.str);
            return '';
          }
          return str;
        } catch (e) {
          console.warn('Error converting ID to string:', e, id);
          return '';
        }
      }
      console.warn('Unable to normalize ID, object without toString:', id);
      return '';
    }
    return String(id);
  };

  // Load orders
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const response = await orderAPI.getOrders(params);
      if (response && response.success) {
        // Normalize _id thành string để tránh lỗi [object Object]
        const normalizedOrders = (response.data?.orders || []).map(order => {
          const validId = order.id && order.id !== '[object Object]' 
            ? order.id 
            : normalizeId(order._id || order.id);
          
          return {
            ...order,
            _id: validId,
            id: validId
          };
        });
        setOrders(normalizedOrders);
        setPagination(response.data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
      } else {
        // Empty data - không phải lỗi
        setOrders([]);
        setPagination({ page: 1, limit: 50, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Chỉ hiển thị toast nếu không phải 404 (empty data)
      if (error.response?.status !== 404 && error.response?.status !== 200) {
        // Error đã được xử lý bởi interceptor, chỉ log ở đây
        console.warn('Failed to load orders:', error.message);
      }
      // Luôn set empty data để UI hiển thị "Không có dữ liệu"
      setOrders([]);
      setPagination({ page: 1, limit: 50, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await orderAPI.getStats(params);
      if (response && response.success) {
        setStats(response.data?.stats || null);
      } else {
        // Empty stats - không phải lỗi
        setStats(null);
      }
    } catch (error) {
      // Chỉ log, không hiển thị toast (đã được xử lý bởi interceptor nếu cần)
      console.warn('Error loading stats:', error.message);
      setStats(null);
    }
  };

  useEffect(() => {
    loadOrders(1);
    loadStats();
  }, []);

  // Create order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await orderAPI.createOrder(orderForm);
      setShowCreateModal(false);
      setOrderForm({
        orderType: 'purchase',
        buyerId: '',
        buyerName: '',
        buyerOrganization: '',
        sellerId: '',
        sellerName: '',
        sellerOrganization: '',
        items: [{ drugId: '', quantity: '', unitPrice: '', unit: 'viên', discount: '', notes: '' }],
        shippingAddress: {
          name: '',
          address: '',
          city: '',
          province: '',
          phone: '',
          email: ''
        },
        paymentMethod: 'bank_transfer',
        shippingMethod: 'standard',
        requiredDate: '',
        notes: ''
      });
      loadOrders(1);
      loadStats();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  // Status actions
  const handleConfirm = async (orderId) => {
    try {
      const id = normalizeId(orderId);
      if (!id || id === '[object Object]') {
        toast.error('ID đơn hàng không hợp lệ');
        return;
      }
      await orderAPI.confirmOrder(id);
      toast.success('Đã xác nhận đơn hàng');
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Không thể xác nhận đơn hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProcess = async (orderId) => {
    const locationId = prompt('Nhập Location ID để xử lý đơn hàng:');
    if (!locationId) return;
    
    try {
      const id = normalizeId(orderId);
      if (!id || id === '[object Object]') {
        toast.error('ID đơn hàng không hợp lệ');
        return;
      }
      await orderAPI.processOrder(id, locationId);
      toast.success('Đã xử lý đơn hàng');
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Không thể xử lý đơn hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleShip = async (orderId) => {
    const trackingNumber = prompt('Nhập mã vận đơn:');
    if (!trackingNumber) return;
    
    try {
      const id = normalizeId(orderId);
      if (!id || id === '[object Object]') {
        toast.error('ID đơn hàng không hợp lệ');
        return;
      }
      await orderAPI.shipOrder(id, { trackingNumber });
      toast.success('Đã cập nhật trạng thái giao hàng');
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Error shipping order:', error);
      toast.error('Không thể cập nhật trạng thái giao hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      const id = normalizeId(orderId);
      if (!id || id === '[object Object]') {
        toast.error('ID đơn hàng không hợp lệ');
        return;
      }
      await orderAPI.deliverOrder(id);
      toast.success('Đã xác nhận giao hàng');
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Error delivering order:', error);
      toast.error('Không thể xác nhận giao hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancel = async (orderId) => {
    const reason = prompt('Nhập lý do hủy đơn hàng:');
    if (!reason) return;
    
    try {
      const id = normalizeId(orderId);
      if (!id || id === '[object Object]') {
        toast.error('ID đơn hàng không hợp lệ');
        return;
      }
      await orderAPI.cancelOrder(id, reason);
      toast.success('Đã hủy đơn hàng');
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Không thể hủy đơn hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processing': return <Package className="w-4 h-4 text-purple-600" />;
      case 'shipped': return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4" />;
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
      const orderNumber = String(item.orderNumber || '');
      const orderDate = item.orderDate ? String(new Date(item.orderDate).getTime()) : String(Date.now());
      const orderType = String(item.orderType || '');
      idPart = `${orderNumber}-${orderType}-${orderDate}`;
    }
    
    // Luôn kết hợp index làm phần chính để đảm bảo unique tuyệt đối
    return `order-${idx}-${idPart}`;
  };

  // Add item to form
  const addOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { drugId: '', quantity: '', unitPrice: '', unit: 'viên', discount: '', notes: '' }]
    });
  };

  // Remove item from form
  const removeOrderItem = (index) => {
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: newItems });
  };

  // Update order item
  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    setOrderForm({ ...orderForm, items: newItems });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Đơn hàng</h1>
          <p className="text-gray-600">Tạo và quản lý đơn hàng (Purchase Order, Sales Order)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo đơn hàng
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng giá trị</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN').format(stats.totalAmount || 0)} đ
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.statusCounts?.processing || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã giao</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.statusCounts?.delivered || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Mã đơn hàng, tên..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn</label>
            <select
              value={filters.orderType}
              onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="purchase">Purchase Order</option>
              <option value="sales">Sales Order</option>
              <option value="transfer">Transfer Order</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setFilters({
                  orderType: '',
                  status: '',
                  search: '',
                  startDate: '',
                  endDate: ''
                });
                setTimeout(() => {
                  loadOrders(1);
                  loadStats();
                }, 100);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Reset
            </button>
            <button
              onClick={() => {
                loadOrders(1);
                loadStats();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người mua/Bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={getUniqueKey(order, idx)} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {order.orderType === 'purchase' ? 'Purchase' : order.orderType === 'sales' ? 'Sales' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.orderType === 'purchase' ? order.sellerName : order.buyerName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN').format(order.totalAmount || 0)} đ
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Chi tiết
                        </button>
                        {order.status === 'draft' && (
                          <button
                            onClick={() => handleConfirm(order._id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Xác nhận
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleProcess(order._id)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Xử lý
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleShip(order._id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleDeliver(order._id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Nhận hàng
                          </button>
                        )}
                        {!['delivered', 'completed', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Hủy
                          </button>
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
                onClick={() => loadOrders(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadOrders(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal - Simplified version */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Tạo đơn hàng mới</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn hàng *</label>
                  <select
                    value={orderForm.orderType}
                    onChange={(e) => setOrderForm({ ...orderForm, orderType: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="purchase">Purchase Order</option>
                    <option value="sales">Sales Order</option>
                    <option value="transfer">Transfer Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày yêu cầu giao</label>
                  <input
                    type="date"
                    value={orderForm.requiredDate}
                    onChange={(e) => setOrderForm({ ...orderForm, requiredDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {orderForm.orderType === 'purchase' ? 'Người bán' : 'Người mua'} *
                  </label>
                  <input
                    type="text"
                    value={orderForm.orderType === 'purchase' ? orderForm.sellerName : orderForm.buyerName}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      [orderForm.orderType === 'purchase' ? 'sellerName' : 'buyerName']: e.target.value
                    })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổ chức</label>
                  <input
                    type="text"
                    value={orderForm.orderType === 'purchase' ? orderForm.sellerOrganization : orderForm.buyerOrganization}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      [orderForm.orderType === 'purchase' ? 'sellerOrganization' : 'buyerOrganization']: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items *</label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    + Thêm item
                  </button>
                </div>
                <div className="space-y-2">
                  {orderForm.items.map((item, index) => (
                    <div key={`order-form-item-${index}-${item.drugId || ''}`} className="grid grid-cols-6 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Mã thuốc</label>
                        <input
                          type="text"
                          value={item.drugId}
                          onChange={(e) => updateOrderItem(index, 'drugId', e.target.value)}
                          placeholder="Drug ID"
                          required
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Số lượng</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          required
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Giá đơn vị</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateOrderItem(index, 'unitPrice', e.target.value)}
                          placeholder="0"
                          required
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Giảm giá (%)</label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateOrderItem(index, 'discount', e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        {orderForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            className="w-full px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Chi tiết đơn hàng: {selectedOrder.orderNumber}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Loại đơn hàng</p>
                  <p className="font-medium">{selectedOrder.orderType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày đặt</p>
                  <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng giá trị</p>
                  <p className="font-medium">{new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount || 0)} đ</p>
                </div>
              </div>
              
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={`order-detail-item-${index}-${item.drugId || item.drugName || ''}`} className="border rounded p-2">
                        <p className="font-medium">{item.drugName || item.drugId}</p>
                        <p className="text-sm text-gray-600">
                          Số lượng: {item.quantity} {item.unit} - Giá: {new Intl.NumberFormat('vi-VN').format(item.unitPrice || 0)} đ
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

