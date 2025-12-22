import React, { useState, useEffect } from 'react';
import { orderAPI, drugAPI, userAPI, invoiceAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
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
  ChevronRight,
  FileText,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import pdfMake from 'pdfmake/build/pdfmake';

// Khởi tạo vfs rỗng - sẽ load fonts khi cần
if (!pdfMake.vfs) {
  pdfMake.vfs = {};
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Drugs list for order form
  const [drugsList, setDrugsList] = useState([]);
  const [drugsLoading, setDrugsLoading] = useState(false);
  const [drugSearchTerm, setDrugSearchTerm] = useState({}); // Map: itemIndex -> searchTerm
  
  // Users list for buyer/seller selection
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [buyerSellerSearchTerm, setBuyerSellerSearchTerm] = useState('');
  const [showBuyerSellerDropdown, setShowBuyerSellerDropdown] = useState(false);
  
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
    // Load drugs and users list when opening create modal
    if (showCreateModal) {
      if (drugsList.length === 0) {
        loadDrugsList('');
      }
      if (usersList.length === 0) {
        loadUsersList('');
      }
    }
  }, [showCreateModal]);

  // Create order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      // Tìm user ID từ tên nếu cần
      let buyerId = orderForm.buyerId;
      let sellerId = orderForm.sellerId;

      // Helper function để convert ID thành string (ObjectId format)
      const normalizeId = (id) => {
        if (!id && id !== 0) return '';
        
        // Nếu đã là string hợp lệ
        if (typeof id === 'string') {
          // Loại bỏ các string không hợp lệ
          if (id === '[object Object]' || id === 'null' || id === 'undefined') {
            return '';
          }
          const trimmed = id.trim();
          // Kiểm tra nếu là ObjectId format (24 hex characters)
          if (trimmed && /^[0-9a-fA-F]{24}$/.test(trimmed)) {
            return trimmed;
          }
          return trimmed;
        }
        
        // Nếu là object (MongoDB ObjectId hoặc object có _id/id)
        if (typeof id === 'object' && id !== null) {
          // Trường hợp đặc biệt: ObjectId được serialize thành object với keys số (char array)
          // Ví dụ: { '0': '6', '1': '9', '2': '7', ... }
          const keys = Object.keys(id);
          if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
            const normalized = keys
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(key => id[key])
              .join('');
            // Kiểm tra nếu là ObjectId format hợp lệ
            if (normalized && /^[0-9a-fA-F]{24}$/.test(normalized)) {
              return normalized;
            }
            if (normalized && normalized !== '[object Object]') {
              return normalized;
            }
          }
          
          // Thử lấy _id hoặc id từ object
          const nestedId = id._id || id.id;
          if (nestedId) {
            // Nếu nestedId cũng là object, đệ quy
            if (typeof nestedId === 'object') {
              return normalizeId(nestedId);
            }
            // Nếu nestedId là string, trả về
            if (typeof nestedId === 'string') {
              const trimmed = nestedId.trim();
              if (trimmed && /^[0-9a-fA-F]{24}$/.test(trimmed)) {
                return trimmed;
              }
              return trimmed;
            }
          }
          
          // Thử toString() nếu có
          if (id.toString && typeof id.toString === 'function') {
            const str = id.toString();
            if (str && str !== '[object Object]') {
              if (/^[0-9a-fA-F]{24}$/.test(str)) {
                return str;
              }
              return str;
            }
          }
          
          // Nếu object rỗng, trả về empty
          if (keys.length === 0) {
            return '';
          }
          
          return '';
        }
        
        // Nếu là number, chuyển thành string
        if (typeof id === 'number') {
          return String(id);
        }
        
        return '';
      };

      // Với Purchase Order: user hiện tại là buyer, cần tìm seller
      if (orderForm.orderType === 'purchase') {
        // Đảm bảo buyerId được set từ user hiện tại
        // Thử nhiều cách để lấy ID từ user
        let currentUserId = '';
        if (user) {
          if (user._id) {
            currentUserId = normalizeId(user._id);
          }
          if (!currentUserId && user.id) {
            currentUserId = normalizeId(user.id);
          }
          // Nếu vẫn không có, thử lấy trực tiếp từ user object
          if (!currentUserId) {
            const userIdStr = String(user._id || user.id || '');
            if (userIdStr && userIdStr !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(userIdStr)) {
              currentUserId = userIdStr;
            }
          }
        }
        
        buyerId = currentUserId;
        
        // Log để debug
        console.log('Purchase Order - Setting buyerId:', {
          buyerId,
          user: user ? { _id: user._id, id: user.id, fullName: user.fullName } : null
        });
        
        // Validate buyerId
        if (!buyerId || buyerId === '' || buyerId === '[object Object]') {
          toast.error('Không thể xác định người mua. Vui lòng đăng nhập lại.');
          console.error('Cannot determine buyerId for Purchase Order. User:', user);
          return;
        }
        
        // Nếu có sellerName nhưng không có sellerId, thử tìm user
        if (orderForm.sellerName && !sellerId) {
          try {
            const usersResponse = await userAPI.getUsers({ search: orderForm.sellerName, limit: 5 });
            if (usersResponse?.success && usersResponse?.data?.users?.length > 0) {
              // Tìm user khớp với tên
              const matchedUser = usersResponse.data.users.find(u => 
                u.fullName === orderForm.sellerName || 
                u.organizationInfo?.name === orderForm.sellerName
              );
              if (matchedUser) {
                sellerId = normalizeId(matchedUser._id || matchedUser.id);
              }
            }
          } catch (error) {
            console.warn('Không thể tìm user từ tên:', error);
          }
        }
        
        // Đảm bảo sellerId là string - ưu tiên sellerId từ form (đã được set khi chọn từ dropdown)
        sellerId = normalizeId(orderForm.sellerId || sellerId);
        
        // Nếu vẫn không có sellerId, thử tìm từ sellerName
        if (!sellerId && orderForm.sellerName) {
          try {
            const usersResponse = await userAPI.getUsers({ search: orderForm.sellerName, limit: 10 });
            if (usersResponse?.success && usersResponse?.data?.users?.length > 0) {
              // Tìm user khớp chính xác với tên
              const matchedUser = usersResponse.data.users.find(u => 
                u.fullName === orderForm.sellerName || 
                u.organizationInfo?.name === orderForm.sellerName ||
                (u.fullName && orderForm.sellerName.includes(u.fullName)) ||
                (u.organizationInfo?.name && orderForm.sellerName.includes(u.organizationInfo.name))
              );
              if (matchedUser) {
                sellerId = normalizeId(matchedUser._id || matchedUser.id);
              }
            }
          } catch (error) {
            console.warn('Không thể tìm user từ tên:', error);
          }
        }
        
        if (!sellerId || sellerId === '' || sellerId === '[object Object]') {
          toast.error('Vui lòng nhập thông tin người bán (hoặc chọn từ danh sách)');
          console.error('Validation failed - sellerId:', sellerId, 'sellerName:', orderForm.sellerName);
          return;
        }
      }
      
      // Với Sales Order: user hiện tại là seller, cần tìm buyer
      if (orderForm.orderType === 'sales') {
        // Đảm bảo sellerId được set từ user hiện tại
        // Thử nhiều cách để lấy ID từ user
        let currentUserId = '';
        if (user) {
          if (user._id) {
            currentUserId = normalizeId(user._id);
          }
          if (!currentUserId && user.id) {
            currentUserId = normalizeId(user.id);
          }
          // Nếu vẫn không có, thử lấy trực tiếp từ user object
          if (!currentUserId) {
            const userIdStr = String(user._id || user.id || '');
            if (userIdStr && userIdStr !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(userIdStr)) {
              currentUserId = userIdStr;
            }
          }
        }
        
        sellerId = currentUserId;
        
        // Log để debug
        console.log('Sales Order - Setting sellerId:', {
          sellerId,
          user: user ? { _id: user._id, id: user.id, fullName: user.fullName } : null
        });
        
        // Validate sellerId
        if (!sellerId || sellerId === '' || sellerId === '[object Object]') {
          toast.error('Không thể xác định người bán. Vui lòng đăng nhập lại.');
          console.error('Cannot determine sellerId for Sales Order. User:', user);
          return;
        }
        
        // Nếu có buyerName nhưng không có buyerId, thử tìm user
        if (orderForm.buyerName && !buyerId) {
          try {
            const usersResponse = await userAPI.getUsers({ search: orderForm.buyerName, limit: 5 });
            if (usersResponse?.success && usersResponse?.data?.users?.length > 0) {
              // Tìm user khớp với tên
              const matchedUser = usersResponse.data.users.find(u => 
                u.fullName === orderForm.buyerName || 
                u.organizationInfo?.name === orderForm.buyerName
              );
              if (matchedUser) {
                buyerId = normalizeId(matchedUser._id || matchedUser.id);
              }
            }
          } catch (error) {
            console.warn('Không thể tìm user từ tên:', error);
          }
        }
        
        // Đảm bảo buyerId là string - ưu tiên buyerId từ form (đã được set khi chọn từ dropdown)
        buyerId = normalizeId(orderForm.buyerId || buyerId);
        
        // Nếu vẫn không có buyerId, thử tìm từ buyerName
        if (!buyerId && orderForm.buyerName) {
          try {
            const usersResponse = await userAPI.getUsers({ search: orderForm.buyerName, limit: 10 });
            if (usersResponse?.success && usersResponse?.data?.users?.length > 0) {
              // Tìm user khớp chính xác với tên
              const matchedUser = usersResponse.data.users.find(u => 
                u.fullName === orderForm.buyerName || 
                u.organizationInfo?.name === orderForm.buyerName ||
                (u.fullName && orderForm.buyerName.includes(u.fullName)) ||
                (u.organizationInfo?.name && orderForm.buyerName.includes(u.organizationInfo.name))
              );
              if (matchedUser) {
                buyerId = normalizeId(matchedUser._id || matchedUser.id);
              }
            }
          } catch (error) {
            console.warn('Không thể tìm user từ tên:', error);
          }
        }
        
        if (!buyerId || buyerId === '' || buyerId === '[object Object]') {
          toast.error('Vui lòng nhập thông tin người mua (hoặc chọn từ danh sách)');
          console.error('Validation failed - buyerId:', buyerId, 'buyerName:', orderForm.buyerName);
          return;
        }
      }

      // Valid enum values cho unit
      const validUnits = ['viên', 'hộp', 'chai', 'lọ', 'túi', 'ống', 'gói'];
      
      // Validate và normalize items trước khi submit
      const normalizedItems = orderForm.items.map(item => {
        // Đảm bảo unit hợp lệ
        let unit = item.unit || 'viên';
        if (!validUnits.includes(unit)) {
          console.warn(`Invalid unit "${unit}" for item, defaulting to "viên"`);
          unit = 'viên';
        }
        
        return {
          ...item,
          unit: unit,
          // Đảm bảo quantity và unitPrice là number
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0
        };
      });
      
      // Chuẩn bị dữ liệu đơn hàng với buyerId và sellerId (đảm bảo là string)
      // Không spread orderForm trực tiếp để tránh lấy object thay vì string
      const orderData = {
        orderType: orderForm.orderType,
        items: normalizedItems,
        shippingAddress: orderForm.shippingAddress,
        billingAddress: orderForm.billingAddress,
        paymentMethod: orderForm.paymentMethod,
        shippingMethod: orderForm.shippingMethod,
        requiredDate: orderForm.requiredDate,
        notes: orderForm.notes,
        // Đảm bảo buyerId và sellerId là string
        buyerId: normalizeId(buyerId || orderForm.buyerId || ''),
        sellerId: normalizeId(sellerId || orderForm.sellerId || ''),
        // Đảm bảo buyerName và sellerName được điền
        buyerName: orderForm.buyerName || (orderForm.orderType === 'purchase' ? user?.fullName : ''),
        buyerOrganization: orderForm.buyerOrganization || '',
        sellerName: orderForm.sellerName || (orderForm.orderType === 'sales' ? user?.fullName : ''),
        sellerOrganization: orderForm.sellerOrganization || '',
      };

      // Debug: Log để kiểm tra
      console.log('Order data before submit:', {
        buyerId: orderData.buyerId,
        buyerIdType: typeof orderData.buyerId,
        sellerId: orderData.sellerId,
        sellerIdType: typeof orderData.sellerId
      });

      // Validate: buyerId và sellerId không được rỗng và phải là string hợp lệ
      if (!orderData.buyerId || orderData.buyerId === '' || orderData.buyerId === '[object Object]') {
        toast.error('Vui lòng nhập thông tin người mua');
        return;
      }
      if (!orderData.sellerId || orderData.sellerId === '' || orderData.sellerId === '[object Object]') {
        toast.error('Vui lòng nhập thông tin người bán');
        return;
      }

      // Validate ObjectId format (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(orderData.buyerId)) {
        toast.error('ID người mua không hợp lệ. Vui lòng chọn lại từ danh sách.');
        console.error('Invalid buyerId format:', orderData.buyerId);
        return;
      }
      if (!objectIdRegex.test(orderData.sellerId)) {
        toast.error('ID người bán không hợp lệ. Vui lòng chọn lại từ danh sách.');
        console.error('Invalid sellerId format:', orderData.sellerId);
        return;
      }

      await orderAPI.createOrder(orderData);
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

  // Format date time for invoice
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate Invoice PDF
  const generateInvoicePDF = (order) => {
    try {
      // Đảm bảo fonts đã được load
      if (!pdfMake.vfs || Object.keys(pdfMake.vfs).length === 0) {
        try {
          const pdfFonts = require('pdfmake/build/vfs_fonts');
          if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
            pdfMake.vfs = pdfFonts.pdfMake.vfs;
          } else if (pdfFonts && pdfFonts.vfs) {
            pdfMake.vfs = pdfFonts.vfs;
          }
        } catch (e) {
          console.warn('Could not load pdfmake fonts:', e);
          // Tạo vfs rỗng nếu không load được
          if (!pdfMake.vfs) {
            pdfMake.vfs = {};
          }
        }
      }

      // Định nghĩa document structure cho pdfmake
      const docDefinition = {
        content: [
          // Header
          {
            text: 'HÓA ĐƠN ĐIỆN TỬ',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Hệ thống Quản lý Nguồn gốc Thuốc',
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          
          // Thông tin đơn hàng
          {
            text: 'Thông tin đơn hàng',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          {
            columns: [
              {
                width: '*',
                text: [
                  { text: 'Mã đơn hàng: ', bold: true },
                  { text: order.orderNumber || 'N/A' }
                ]
              },
              {
                width: '*',
                text: [
                  { text: 'Loại đơn: ', bold: true },
                  { text: order.orderType === 'purchase' ? 'Mua hàng' : order.orderType === 'sales' ? 'Bán hàng' : 'Chuyển kho' }
                ]
              }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            columns: [
              {
                width: '*',
                text: [
                  { text: 'Ngày đặt: ', bold: true },
                  { text: formatDateTime(order.orderDate) }
                ]
              },
              {
                width: '*',
                text: [
                  { text: 'Trạng thái: ', bold: true },
                  { text: order.status }
                ]
              }
            ],
            margin: [0, 0, 0, 15]
          },

          // Thông tin người mua/bán
          {
            text: 'Thông tin bên mua / bên bán',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          ...(order.buyerName ? [{
            text: [
              { text: 'Người mua: ', bold: true },
              { text: order.buyerName }
            ],
            margin: [0, 0, 0, 5]
          }] : []),
          ...(order.buyerOrganization ? [{
            text: [
              { text: 'Tổ chức: ', bold: true },
              { text: order.buyerOrganization }
            ],
            margin: [0, 0, 0, 5]
          }] : []),
          ...(order.sellerName ? [{
            text: [
              { text: 'Người bán: ', bold: true },
              { text: order.sellerName }
            ],
            margin: [0, 0, 0, 5]
          }] : []),
          ...(order.sellerOrganization ? [{
            text: [
              { text: 'Tổ chức: ', bold: true },
              { text: order.sellerOrganization }
            ],
            margin: [0, 0, 0, 15]
          }] : []),

          // Địa chỉ giao hàng
          ...(order.shippingAddress ? [{
            text: 'Địa chỉ giao hàng',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              ...(order.shippingAddress.name ? [{ text: order.shippingAddress.name + '\n', bold: true }] : []),
              ...(order.shippingAddress.address ? [{ text: order.shippingAddress.address + '\n' }] : []),
              {
                text: [
                  order.shippingAddress.city,
                  order.shippingAddress.province,
                  order.shippingAddress.postalCode
                ].filter(Boolean).join(', ') + '\n'
              },
              ...(order.shippingAddress.phone ? [{ text: 'Điện thoại: ' + order.shippingAddress.phone }] : [])
            ],
            margin: [0, 0, 0, 15]
          }] : []),

          // Chi tiết sản phẩm
          ...(order.items && order.items.length > 0 ? [{
            text: 'Chi tiết sản phẩm',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'STT', style: 'tableHeader', bold: true },
                  { text: 'Tên sản phẩm', style: 'tableHeader', bold: true },
                  { text: 'SL', style: 'tableHeader', bold: true },
                  { text: 'Đơn giá', style: 'tableHeader', bold: true },
                  { text: 'Thành tiền', style: 'tableHeader', bold: true }
                ],
                ...order.items.map((item, index) => {
                  const quantity = item.quantity || 0;
                  const unitPrice = item.unitPrice || 0;
                  const discount = item.discount || 0;
                  const itemTotal = unitPrice * quantity * (1 - discount / 100);
                  
                  return [
                    { text: String(index + 1), alignment: 'center' },
                    { text: item.drugName || item.drugId || 'Không có tên' },
                    { text: `${quantity} ${item.unit || ''}`, alignment: 'center' },
                    { text: new Intl.NumberFormat('vi-VN').format(unitPrice) + ' đ', alignment: 'right' },
                    { text: new Intl.NumberFormat('vi-VN').format(itemTotal) + ' đ', alignment: 'right' }
                  ];
                })
              ]
            },
            margin: [0, 0, 0, 15]
          }] : []),

          // Tổng giá trị
          {
            text: 'Tổng giá trị',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          ...(order.subtotal ? [{
            columns: [
              { text: 'Tạm tính:', width: 'auto' },
              { text: new Intl.NumberFormat('vi-VN').format(order.subtotal) + ' đ', alignment: 'right', width: '*' }
            ],
            margin: [0, 0, 0, 5]
          }] : []),
          ...(order.tax && order.tax > 0 ? [{
            columns: [
              { text: 'Thuế VAT:', width: 'auto' },
              { text: new Intl.NumberFormat('vi-VN').format(order.tax) + ' đ', alignment: 'right', width: '*' }
            ],
            margin: [0, 0, 0, 5]
          }] : []),
          ...(order.shippingFee && order.shippingFee > 0 ? [{
            columns: [
              { text: 'Phí vận chuyển:', width: 'auto' },
              { text: new Intl.NumberFormat('vi-VN').format(order.shippingFee) + ' đ', alignment: 'right', width: '*' }
            ],
            margin: [0, 0, 0, 5]
          }] : []),
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }],
            margin: [0, 10, 0, 10]
          },
          {
            columns: [
              { text: 'TỔNG CỘNG:', style: 'totalLabel', bold: true, width: 'auto' },
              { text: new Intl.NumberFormat('vi-VN').format(order.totalAmount || 0) + ' đ', style: 'totalAmount', alignment: 'right', width: '*' }
            ],
            margin: [0, 0, 0, 15]
          },

          // Phương thức thanh toán
          ...(order.paymentMethod ? [{
            text: [
              { text: 'Phương thức thanh toán: ', bold: true },
              {
                text: order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                      order.paymentMethod === 'cash' ? 'Tiền mặt' :
                      order.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                      order.paymentMethod === 'momo' ? 'MoMo' :
                      order.paymentMethod === 'check' ? 'Séc' :
                      order.paymentMethod
              }
            ],
            margin: [0, 0, 0, 10]
          }] : []),

          // Ghi chú
          ...(order.notes ? [{
            text: [
              { text: 'Ghi chú: ', bold: true },
              { text: order.notes }
            ],
            margin: [0, 0, 0, 20]
          }] : []),

          // Footer
          {
            text: 'Hóa đơn điện tử được tạo tự động bởi hệ thống',
            style: 'footer',
            alignment: 'center',
            margin: [0, 20, 0, 5]
          },
          {
            text: `Ngày xuất: ${formatDateTime(new Date())}`,
            style: 'footer',
            alignment: 'center'
          }
        ],
        styles: {
          header: {
            fontSize: 20,
            bold: true
          },
          subheader: {
            fontSize: 12
          },
          sectionTitle: {
            fontSize: 14,
            bold: true
          },
          tableHeader: {
            fillColor: '#eeeeee',
            alignment: 'center'
          },
          totalLabel: {
            fontSize: 12
          },
          totalAmount: {
            fontSize: 12,
            bold: true
          },
          footer: {
            fontSize: 8,
            italics: true
          }
        },
        defaultStyle: {
          fontSize: 10,
          font: 'Roboto'
        }
      };

      // Tạo và tải PDF
      const fileName = `HoaDon_${order.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
      
      toast.success('Đã xuất hóa đơn điện tử thành công!');
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Lỗi khi xuất hóa đơn. Vui lòng thử lại.');
    }
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
    // Load drugs list when adding first item
    if (drugsList.length === 0) {
      loadDrugsList('');
    }
  };

  // Remove item from form
  const removeOrderItem = (index) => {
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: newItems });
  };

  // Load drugs list for order form
  const loadDrugsList = async (searchTerm = '') => {
    try {
      setDrugsLoading(true);
      const params = { limit: 100 };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await drugAPI.getDrugs(params);
      if (response && response.success) {
        setDrugsList(response.data?.drugs || []);
      }
    } catch (error) {
      console.error('Error loading drugs:', error);
      setDrugsList([]);
    } finally {
      setDrugsLoading(false);
    }
  };

  // Load users list for buyer/seller selection
  const loadUsersList = async (searchTerm = '') => {
    try {
      setUsersLoading(true);
      const params = { limit: 50 };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await userAPI.getUsers(params);
      if (response && response.success) {
        setUsersList(response.data?.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsersList([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle buyer/seller search
  const handleBuyerSellerSearch = (searchTerm) => {
    setBuyerSellerSearchTerm(searchTerm);
    if (searchTerm.length >= 2) {
      loadUsersList(searchTerm);
      setShowBuyerSellerDropdown(true);
    } else if (searchTerm.length === 0) {
      loadUsersList('');
      setShowBuyerSellerDropdown(true);
    } else {
      setShowBuyerSellerDropdown(false);
    }
  };

  // Select buyer/seller from dropdown
  const selectBuyerSeller = (selectedUser) => {
    // Helper để normalize ID thành string - xử lý cả trường hợp ObjectId là object với keys số
    const normalizeUserId = (id) => {
      if (!id && id !== 0) return '';
      
      // Nếu đã là string hợp lệ
      if (typeof id === 'string' && id !== '[object Object]' && id.trim() !== '') {
        const trimmed = id.trim();
        // Kiểm tra nếu là ObjectId format (24 hex characters)
        if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
          return trimmed;
        }
        return trimmed;
      }
      
      // Nếu là object
      if (typeof id === 'object' && id !== null) {
        // Trường hợp đặc biệt: ObjectId được serialize thành object với keys số (char array)
        // Ví dụ: { '0': '6', '1': '9', '2': '7', ... }
        const keys = Object.keys(id);
        if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
          // Sắp xếp keys theo số và join lại thành string
          const normalized = keys
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => id[key])
            .join('');
          
          // Kiểm tra nếu là ObjectId format hợp lệ
          if (/^[0-9a-fA-F]{24}$/.test(normalized)) {
            return normalized;
          }
          // Nếu không phải ObjectId format nhưng vẫn là string hợp lệ, trả về
          if (normalized && normalized !== '[object Object]') {
            return normalized;
          }
        }
        
        // Thử lấy _id hoặc id từ object
        const nestedId = id._id || id.id;
        if (nestedId) {
          if (typeof nestedId === 'string' && nestedId !== '[object Object]') {
            const trimmed = nestedId.trim();
            if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
              return trimmed;
            }
            return trimmed;
          }
          if (typeof nestedId === 'object') {
            return normalizeUserId(nestedId);
          }
        }
        
        // Thử toString() nếu có
        if (id.toString && typeof id.toString === 'function') {
          const str = id.toString();
          if (str && str !== '[object Object]') {
            if (/^[0-9a-fA-F]{24}$/.test(str)) {
              return str;
            }
            return str;
          }
        }
        
        // Nếu object rỗng hoặc không có giá trị hợp lệ, trả về empty
        if (keys.length === 0) {
          return '';
        }
      }
      
      // Nếu là number
      if (typeof id === 'number') {
        return String(id);
      }
      
      return '';
    };
    
    // Thử nhiều cách để lấy userId
    let userId = '';
    
    // Ưu tiên 1: _id
    if (selectedUser._id) {
      userId = normalizeUserId(selectedUser._id);
    }
    
    // Ưu tiên 2: id
    if (!userId && selectedUser.id) {
      userId = normalizeUserId(selectedUser.id);
    }
    
    // Ưu tiên 3: Thử tìm trong toàn bộ object (có thể ID nằm ở đâu đó)
    if (!userId) {
      // Tìm tất cả các keys có thể chứa ID
      const possibleIdKeys = ['userId', 'user_id', 'userID', 'ID', 'Id'];
      for (const key of possibleIdKeys) {
        if (selectedUser[key]) {
          userId = normalizeUserId(selectedUser[key]);
          if (userId) break;
        }
      }
    }
    
    // Nếu vẫn không có userId hợp lệ, log warning và thử tìm từ email/username
    if (!userId || userId === '' || userId === '[object Object]') {
      console.error('Cannot extract valid userId from selectedUser:', selectedUser);
      console.log('Attempting to find user by email/username...');
      
      // Thử tìm user từ email hoặc username nếu có
      if (selectedUser.email || selectedUser.username) {
        // Không thể tìm ngay tại đây, cần async call
        // Nhưng để tránh phức tạp, ta sẽ báo lỗi và yêu cầu user chọn lại
        toast.error('Không thể lấy ID của người dùng. Vui lòng thử chọn lại từ danh sách.');
        return;
      }
      
      toast.error('Không thể lấy ID của người dùng. Vui lòng thử lại.');
      return;
    }
    
    const userName = selectedUser.fullName || '';
    const userOrg = selectedUser.organizationInfo?.name || selectedUser.organizationId || '';
    
    console.log('Selecting buyer/seller:', { userId, userName, userOrg, orderType: orderForm.orderType });
    
    if (orderForm.orderType === 'purchase') {
      // Purchase: user hiện tại là buyer, chọn seller
      setOrderForm({
        ...orderForm,
        sellerId: userId,
        sellerName: userName,
        sellerOrganization: userOrg
      });
    } else {
      // Sales: user hiện tại là seller, chọn buyer
      setOrderForm({
        ...orderForm,
        buyerId: userId,
        buyerName: userName,
        buyerOrganization: userOrg
      });
    }
    
    setBuyerSellerSearchTerm('');
    setShowBuyerSellerDropdown(false);
  };

  // Update order item
  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    
    // Valid enum values cho unit
    const validUnits = ['viên', 'hộp', 'chai', 'lọ', 'túi', 'ống', 'gói'];
    
    // Nếu chọn thuốc từ dropdown, tự động điền giá nếu có
    if (field === 'drugId' && value) {
      const selectedDrug = drugsList.find(d => 
        d.drugId === value || d._id?.toString() === value || d.id === value
      );
      if (selectedDrug) {
        // Tự động điền giá nếu có
        if (selectedDrug.wholesalePrice || selectedDrug.price) {
          newItems[index].unitPrice = selectedDrug.wholesalePrice || selectedDrug.price;
        }
        // Tự động điền đơn vị nếu có và hợp lệ
        if (selectedDrug.packaging?.unit) {
          const drugUnit = selectedDrug.packaging.unit;
          // Chỉ set nếu unit hợp lệ, nếu không thì giữ nguyên hoặc set mặc định
          if (validUnits.includes(drugUnit)) {
            newItems[index].unit = drugUnit;
          } else {
            // Nếu unit không hợp lệ, set mặc định là 'viên'
            newItems[index].unit = 'viên';
          }
        } else {
          // Nếu không có unit từ drug, đảm bảo có unit mặc định
          if (!newItems[index].unit || !validUnits.includes(newItems[index].unit)) {
            newItems[index].unit = 'viên';
          }
        }
      }
    }
    
    // Validate unit nếu field là unit
    if (field === 'unit' && value) {
      if (!validUnits.includes(value)) {
        // Nếu unit không hợp lệ, set mặc định là 'viên'
        newItems[index].unit = 'viên';
      }
    }
    
    setOrderForm({ ...orderForm, items: newItems });
  };

  // Handle drug search for specific item
  const handleDrugSearch = (index, searchTerm) => {
    setDrugSearchTerm({ ...drugSearchTerm, [index]: searchTerm });
    // Cập nhật drugId nếu người dùng nhập trực tiếp (không chọn từ dropdown)
    updateOrderItem(index, 'drugId', searchTerm);
    
    if (searchTerm.length >= 2) {
      loadDrugsList(searchTerm);
    } else if (searchTerm.length === 0) {
      loadDrugsList('');
    }
  };

  // Select drug from dropdown
  const selectDrug = (index, drug) => {
    const drugId = drug.drugId || drug._id?.toString() || drug.id;
    const newItems = [...orderForm.items];
    
    // Valid enum values cho unit
    const validUnits = ['viên', 'hộp', 'chai', 'lọ', 'túi', 'ống', 'gói'];
    
    // Cập nhật drugId
    newItems[index].drugId = drugId;
    
    // Tự động điền giá nếu có
    if (drug.wholesalePrice || drug.price) {
      newItems[index].unitPrice = drug.wholesalePrice || drug.price;
    }
    
    // Tự động điền đơn vị nếu có và hợp lệ
    if (drug.packaging?.unit) {
      const drugUnit = drug.packaging.unit;
      // Chỉ set nếu unit hợp lệ
      if (validUnits.includes(drugUnit)) {
        newItems[index].unit = drugUnit;
      } else {
        // Nếu unit không hợp lệ, set mặc định là 'viên'
        newItems[index].unit = 'viên';
      }
    } else {
      // Nếu không có unit từ drug, đảm bảo có unit mặc định
      if (!newItems[index].unit || !validUnits.includes(newItems[index].unit)) {
        newItems[index].unit = 'viên';
      }
    }
    
    // Tự động điền đơn vị nếu có
    if (drug.packaging?.unit) {
      newItems[index].unit = drug.packaging.unit;
    }
    
    setOrderForm({ ...orderForm, items: newItems });
    // Clear search term sau khi chọn
    setDrugSearchTerm({ ...drugSearchTerm, [index]: '' });
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
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {orderForm.orderType === 'purchase' ? 'Người bán' : 'Người mua'} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={buyerSellerSearchTerm || (orderForm.orderType === 'purchase' ? orderForm.sellerName : orderForm.buyerName)}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleBuyerSellerSearch(newValue);
                        // Cập nhật tên trong form
                        // Nếu người dùng xóa hoặc thay đổi tên, giữ lại ID nếu có (không clear ID khi chỉ sửa tên)
                        setOrderForm({
                          ...orderForm,
                          [orderForm.orderType === 'purchase' ? 'sellerName' : 'buyerName']: newValue,
                          // Chỉ clear ID nếu người dùng xóa hết tên
                          // Nếu có tên mới, giữ lại ID (có thể là người dùng đang sửa tên nhưng vẫn muốn giữ ID)
                        });
                      }}
                      onFocus={() => {
                        if (usersList.length === 0) loadUsersList('');
                        setShowBuyerSellerDropdown(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowBuyerSellerDropdown(false);
                        }, 200);
                      }}
                      placeholder="Tìm kiếm hoặc nhập tên"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {showBuyerSellerDropdown && usersList.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto left-0 right-0">
                        {usersList
                          .filter(user => {
                            const search = buyerSellerSearchTerm.toLowerCase();
                            return !search || 
                              (user.fullName && user.fullName.toLowerCase().includes(search)) ||
                              (user.organizationInfo?.name && user.organizationInfo.name.toLowerCase().includes(search)) ||
                              (user.email && user.email.toLowerCase().includes(search));
                          })
                          .map((user, idx) => {
                            // Tạo unique key an toàn
                            let uniqueKey = '';
                            const userId = user._id || user.id;
                            
                            if (userId) {
                              if (typeof userId === 'string' && userId !== '[object Object]') {
                                uniqueKey = userId;
                              } else if (typeof userId === 'object' && userId !== null) {
                                uniqueKey = userId.toString ? userId.toString() : `user-obj-${idx}`;
                              } else {
                                uniqueKey = String(userId);
                              }
                            }
                            
                            // Nếu không có userId hợp lệ, dùng email hoặc tên
                            if (!uniqueKey || uniqueKey === '[object Object]') {
                              uniqueKey = user.email || user.fullName || `user-${idx}`;
                            }
                            
                            // Đảm bảo unique bằng cách thêm index nếu cần
                            uniqueKey = `user-${idx}-${uniqueKey}`;
                            
                            return (
                            <div
                              key={uniqueKey}
                              onClick={() => selectBuyerSeller(user)}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                            >
                              <div className="font-semibold text-sm text-gray-900">
                                {user.fullName || user.email}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {user.organizationInfo?.name && (
                                  <span className="text-xs text-gray-600">
                                    {user.organizationInfo.name}
                                  </span>
                                )}
                                {user.role && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {user.role}
                                  </span>
                                )}
                                {user.email && (
                                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
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
                    placeholder="Tự động điền khi chọn người bán/mua"
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
                  {orderForm.items.map((item, index) => {
                    const currentSearchTerm = drugSearchTerm[index] || '';
                    const filteredDrugs = currentSearchTerm
                      ? drugsList.filter(d => 
                          (d.drugId && d.drugId.toLowerCase().includes(currentSearchTerm.toLowerCase())) ||
                          (d.name && d.name.toLowerCase().includes(currentSearchTerm.toLowerCase())) ||
                          (d.batchNumber && d.batchNumber.toLowerCase().includes(currentSearchTerm.toLowerCase()))
                        )
                      : drugsList.slice(0, 10); // Hiển thị 10 thuốc đầu tiên nếu không có search
                    
                    const selectedDrug = drugsList.find(d => 
                      d.drugId === item.drugId || d._id?.toString() === item.drugId || d.id === item.drugId
                    );
                    
                    return (
                    <div key={`order-form-item-${index}-${item.drugId || ''}`} className="grid grid-cols-6 gap-2 items-start">
                      <div className="relative">
                        <label className="flex items-center text-xs text-gray-600 mb-1 h-5">Mã thuốc *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={currentSearchTerm !== undefined && currentSearchTerm !== '' 
                              ? currentSearchTerm 
                              : (item.drugId || '')}
                            onChange={(e) => handleDrugSearch(index, e.target.value)}
                            onFocus={() => {
                              if (drugsList.length === 0) loadDrugsList('');
                              // Hiển thị danh sách khi focus nếu chưa có giá trị
                              if (!item.drugId && !currentSearchTerm) {
                                setDrugSearchTerm({ ...drugSearchTerm, [index]: '' });
                              } else if (item.drugId && !currentSearchTerm) {
                                // Nếu đã có drugId, hiển thị nó trong search term để có thể tìm kiếm
                                setDrugSearchTerm({ ...drugSearchTerm, [index]: item.drugId });
                              }
                            }}
                            onBlur={() => {
                              // Clear search term sau khi blur (để dropdown ẩn đi)
                              setTimeout(() => {
                                setDrugSearchTerm({ ...drugSearchTerm, [index]: '' });
                              }, 200);
                            }}
                            placeholder="Tìm kiếm hoặc nhập mã thuốc"
                            required
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          {currentSearchTerm && filteredDrugs.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto left-0 right-0">
                              {filteredDrugs.map((drug, drugIdx) => {
                                // Tạo unique key an toàn
                                let drugKey = drug.drugId || '';
                                if (!drugKey || drugKey === '[object Object]') {
                                  const drugId = drug._id || drug.id;
                                  if (drugId) {
                                    drugKey = typeof drugId === 'string' ? drugId : (drugId.toString ? drugId.toString() : `drug-${drugIdx}`);
                                  } else {
                                    drugKey = `drug-${index}-${drugIdx}-${Date.now()}`;
                                  }
                                }
                                
                                return (
                                <div
                                  key={drugKey}
                                  onClick={() => selectDrug(index, drug)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                                >
                                  <div className="font-semibold text-sm text-gray-900 truncate" title={`${drug.drugId} - ${drug.name}`}>
                                    {drug.drugId} - {drug.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {drug.batchNumber && (
                                      <span className="text-xs text-gray-600 truncate max-w-[120px]" title={drug.batchNumber}>
                                        Lô: {drug.batchNumber}
                                      </span>
                                    )}
                                    {drug.form && (
                                      <span className="text-xs text-gray-600">
                                        {drug.form}
                                      </span>
                                    )}
                                    {(drug.wholesalePrice || drug.price) && (
                                      <span className="text-xs font-semibold text-blue-600">
                                        {new Intl.NumberFormat('vi-VN', {
                                          style: 'currency',
                                          currency: 'VND',
                                          notation: 'compact',
                                          maximumFractionDigits: 0
                                        }).format(drug.wholesalePrice || drug.price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-xs text-gray-600 mb-1 h-5">
                          Số lượng *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          required
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <div className="text-xs text-gray-400 mt-0.5">({item.unit || 'đơn vị'})</div>
                      </div>
                      <div>
                        <label className="flex items-center text-xs text-gray-600 mb-1 h-5" title="Giá cho 1 đơn vị sản phẩm">
                          Giá đơn vị (VND) *
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateOrderItem(index, 'unitPrice', e.target.value)}
                          placeholder="0"
                          required
                          min="0"
                          step="1000"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          title="Giá cho 1 đơn vị sản phẩm. Tổng giá = Giá đơn vị × Số lượng"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-xs text-gray-600 mb-1 h-5">Giảm giá (%)</label>
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
                      <div className="flex flex-col">
                        <div className="h-5"></div>
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
                      {/* Hiển thị tổng giá bên dưới hàng items */}
                      {item.unitPrice && item.quantity && (
                        <div className="col-span-6 text-xs text-gray-600 mt-1 pl-2">
                          <span className="font-medium">Tổng giá:</span> {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0))}
                          {item.discount && parseFloat(item.discount) > 0 && (
                            <span className="ml-2">
                              (Sau giảm giá {item.discount}%: {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                              }).format((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0) * (1 - parseFloat(item.discount) / 100))})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
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
            <div className="space-y-6">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Loại đơn hàng</p>
                  <p className="font-medium">{selectedOrder.orderType === 'purchase' ? 'Mua hàng' : selectedOrder.orderType === 'sales' ? 'Bán hàng' : 'Chuyển kho'}</p>
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
                {selectedOrder.requiredDate && (
                  <div>
                    <p className="text-sm text-gray-600">Ngày yêu cầu giao hàng</p>
                    <p className="font-medium">{formatDate(selectedOrder.requiredDate)}</p>
                  </div>
                )}
              </div>

              {/* Thông tin người mua/bán */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Thông tin người mua/bán</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.buyerName && (
                    <div>
                      <p className="text-sm text-gray-600">Người mua</p>
                      <p className="font-medium">{selectedOrder.buyerName}</p>
                      {selectedOrder.buyerOrganization && (
                        <p className="text-sm text-gray-500">{selectedOrder.buyerOrganization}</p>
                      )}
                    </div>
                  )}
                  {selectedOrder.sellerName && (
                    <div>
                      <p className="text-sm text-gray-600">Người bán</p>
                      <p className="font-medium">{selectedOrder.sellerName}</p>
                      {selectedOrder.sellerOrganization && (
                        <p className="text-sm text-gray-500">{selectedOrder.sellerOrganization}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              {selectedOrder.shippingAddress && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Địa chỉ giao hàng</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.address}</p>
                    <p className="text-sm text-gray-600">
                      {[selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.province, selectedOrder.shippingAddress.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.shippingAddress.phone && (
                      <p className="text-sm text-gray-600">Điện thoại: {selectedOrder.shippingAddress.phone}</p>
                    )}
                    {selectedOrder.shippingAddress.email && (
                      <p className="text-sm text-gray-600">Email: {selectedOrder.shippingAddress.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Địa chỉ thanh toán */}
              {selectedOrder.billingAddress && !selectedOrder.billingAddress.sameAsShipping && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Địa chỉ thanh toán</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{selectedOrder.billingAddress.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.billingAddress.address}</p>
                    <p className="text-sm text-gray-600">
                      {[selectedOrder.billingAddress.city, selectedOrder.billingAddress.province, selectedOrder.billingAddress.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.billingAddress.phone && (
                      <p className="text-sm text-gray-600">Điện thoại: {selectedOrder.billingAddress.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Chi tiết sản phẩm */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Chi tiết sản phẩm</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={`order-detail-item-${index}-${item.drugId || item.drugName || ''}`} className="border rounded-lg p-4 bg-gray-50">
                        <p className="font-medium mb-2">{item.drugName || item.drugId || 'Không có tên'}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Số lượng: </span>
                            <span className="font-medium">{item.quantity} {item.unit || 'đơn vị'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Đơn giá: </span>
                            <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(item.unitPrice || 0)} đ</span>
                          </div>
                          {item.discount && item.discount > 0 && (
                            <div>
                              <span className="text-gray-600">Giảm giá: </span>
                              <span className="font-medium text-red-600">-{item.discount}%</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Thành tiền: </span>
                            <span className="font-medium text-blue-600">
                              {new Intl.NumberFormat('vi-VN').format((item.unitPrice || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100))} đ
                            </span>
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">Ghi chú: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tổng giá trị */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Tổng giá trị</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(selectedOrder.subtotal || 0)} đ</span>
                  </div>
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thuế VAT:</span>
                      <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(selectedOrder.tax || 0)} đ</span>
                    </div>
                  )}
                  {selectedOrder.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(selectedOrder.shippingFee || 0)} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-lg font-bold text-blue-600">{new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount || 0)} đ</span>
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán và vận chuyển */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán</p>
                  <p className="font-medium">
                    {selectedOrder.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                     selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' :
                     selectedOrder.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                     selectedOrder.paymentMethod === 'momo' ? 'MoMo' :
                     selectedOrder.paymentMethod === 'check' ? 'Séc' :
                     selectedOrder.paymentMethod || 'Chưa chọn'}
                  </p>
                  {selectedOrder.paymentStatus && (
                    <p className="text-sm text-gray-500 mt-1">
                      Trạng thái: <span className="font-medium">{selectedOrder.paymentStatus}</span>
                    </p>
                  )}
                </div>
                {selectedOrder.shipping && selectedOrder.shipping.method && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phương thức vận chuyển</p>
                    <p className="font-medium">
                      {selectedOrder.shipping.method === 'standard' ? 'Tiêu chuẩn' :
                       selectedOrder.shipping.method === 'express' ? 'Nhanh' :
                       selectedOrder.shipping.method === 'overnight' ? 'Qua đêm' :
                       selectedOrder.shipping.method === 'pickup' ? 'Tự lấy' :
                       selectedOrder.shipping.method}
                    </p>
                    {selectedOrder.shipping.trackingNumber && (
                      <p className="text-sm text-gray-500 mt-1">
                        Mã vận đơn: <span className="font-medium">{selectedOrder.shipping.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Ghi chú</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                {/* Nút tạo hóa đơn - chỉ hiện khi order đã confirmed và chưa có invoice */}
                {selectedOrder.status === 'confirmed' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' ? (
                  <button
                    onClick={async () => {
                      try {
                        const response = await invoiceAPI.createInvoiceFromOrder(selectedOrder._id);
                        if (response.success) {
                          toast.success('Đã tạo hóa đơn thành công!');
                          setShowDetailModal(false);
                          setSelectedOrder(null);
                          loadOrders(pagination.page);
                        } else {
                          toast.error(response.message || 'Không thể tạo hóa đơn');
                        }
                      } catch (error) {
                        console.error('Error creating invoice:', error);
                        toast.error('Lỗi khi tạo hóa đơn: ' + (error.response?.data?.message || error.message));
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Tạo hóa đơn
                  </button>
                ) : null}
                <button
                  onClick={() => generateInvoicePDF(selectedOrder)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Xuất hóa đơn PDF
                </button>
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

