import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderAPI, drugAPI, userAPI, paymentAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { items, clearCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [drugs, setDrugs] = useState({}); // drugId -> drug info
  const [loadingDrugs, setLoadingDrugs] = useState(true);

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.fullName || '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const [billingAddress, setBillingAddress] = useState({
    sameAsShipping: true,
    name: user?.fullName || '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [creditStatus, setCreditStatus] = useState(null); // { creditLimit, currentDebt, availableCredit, canUseCredit }
  const [checkingCredit, setCheckingCredit] = useState(false);

  // Load drug details
  useEffect(() => {
    const loadDrugs = async () => {
      try {
        setLoadingDrugs(true);
        const drugIds = [...new Set(items.map(item => item.drugId))];
        
        const drugsData = {};
        for (const drugId of drugIds) {
          try {
            const response = await drugAPI.getDrugById(drugId);
            if (response.success) {
              drugsData[drugId] = response.data.drug;
            }
          } catch (error) {
            console.error(`Error loading drug ${drugId}:`, error);
          }
        }
        setDrugs(drugsData);
      } catch (error) {
        console.error('Error loading drugs:', error);
        toast.error('Không thể tải thông tin sản phẩm');
      } finally {
        setLoadingDrugs(false);
      }
    };

    if (items.length > 0) {
      loadDrugs();
    } else {
      // Nếu không có items, redirect về marketplace
      navigate('/marketplace');
    }
  }, [items, navigate]);

  // Check credit status
  useEffect(() => {
    const checkCredit = async () => {
      try {
        setCheckingCredit(true);
        const response = await userAPI.checkCreditStatus();
        if (response.success) {
          setCreditStatus(response.data);
        }
      } catch (error) {
        console.error('Error checking credit status:', error);
        // Nếu không check được, vẫn cho phép checkout
      } finally {
        setCheckingCredit(false);
      }
    };

    if (user) {
      checkCredit();
    }
  }, [user]);

  // Check if can use credit payment
  const canUseCreditPayment = () => {
    if (!creditStatus) return false;
    const cartTotal = getTotalPrice();
    return creditStatus.canUseCredit && 
           (creditStatus.currentDebt + cartTotal) <= creditStatus.creditLimit;
  };

  // Group items by manufacturer
  const groupedItems = items.reduce((acc, item) => {
    const drug = drugs[item.drugId];
    if (!drug) return acc;
    
    // Lấy manufacturerId - có thể là object (populated) hoặc string/ObjectId
    let manufacturerId;
    if (drug.manufacturerId) {
      manufacturerId = typeof drug.manufacturerId === 'object' && drug.manufacturerId._id
        ? drug.manufacturerId._id
        : drug.manufacturerId;
    } else {
      return acc; // Skip nếu không có manufacturerId
    }
    
    // Convert manufacturerId thành string - xử lý cả trường hợp char array
    let manufacturerIdStr;
    if (typeof manufacturerId === 'object' && manufacturerId !== null) {
      // Kiểm tra xem có phải là char array không
      const keys = Object.keys(manufacturerId);
      if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
        // Char array: { '0': '6', '1': '9', ... }
        manufacturerIdStr = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => manufacturerId[k]).join('');
      } else if (typeof manufacturerId.toString === 'function') {
        const str = manufacturerId.toString();
        manufacturerIdStr = (str && str !== '[object Object]') ? str : String(manufacturerId);
      } else {
        manufacturerIdStr = String(manufacturerId);
      }
    } else {
      manufacturerIdStr = String(manufacturerId);
    }
    
    if (!acc[manufacturerIdStr]) {
      const manufacturerName = drug.manufacturerId?.organizationInfo?.name ||
                               drug.manufacturerId?.fullName ||
                               item.manufacturerName ||
                               'Nhà sản xuất';
      
      acc[manufacturerIdStr] = {
        manufacturerId: manufacturerIdStr,
        manufacturerName,
        items: []
      };
    }
    
    acc[manufacturerIdStr].items.push({
      ...item,
      drug
    });
    
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city || !shippingAddress.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (!billingAddress.sameAsShipping) {
      if (!billingAddress.name || !billingAddress.address || !billingAddress.city || !billingAddress.phone) {
        toast.error('Vui lòng điền đầy đủ thông tin thanh toán');
        return;
      }
    }

    try {
      setLoading(true);

      // Tạo orders cho từng manufacturer (mỗi manufacturer một order)
      const orders = [];
      for (const manufacturerId in groupedItems) {
        const group = groupedItems[manufacturerId];
        
        // Chuyển đổi items thành format API yêu cầu
        const orderItems = group.items.map(item => ({
          drugId: item.drug?.drugId || item.drugId,
          quantity: item.quantity,
          unitPrice: item.wholesalePrice || item.price || 0,
          discount: 0,
          notes: ''
        }));

        const orderData = {
          orderType: 'purchase',
          sellerId: manufacturerId,
          sellerName: group.manufacturerName,
          sellerOrganization: group.manufacturerName,
          buyerId: user._id,
          buyerName: user.fullName,
          buyerOrganization: user.organizationInfo?.name || '',
          items: orderItems,
          shippingAddress,
          billingAddress: billingAddress.sameAsShipping ? shippingAddress : billingAddress,
          paymentMethod,
          notes,
          status: 'pending' // Đặt trực tiếp là pending thay vì draft
        };

        const response = await orderAPI.createOrder(orderData);
        if (response.success) {
          orders.push(response.data.order);
        }
      }

      if (orders.length > 0) {
        // Nếu là VNPay payment, tạo payment request và redirect
        if (paymentMethod === 'vnpay') {
          try {
            const totalAmount = getTotalPrice();
            
            // Tính tổng tiền của tất cả orders (có thể là nhiều orders nếu có nhiều manufacturer)
            const totalOrderAmount = orders.reduce((sum, order) => {
              return sum + (order.totalAmount || order.items.reduce((itemSum, item) => {
                return itemSum + ((item.unitPrice || 0) * (item.quantity || 0));
              }, 0));
            }, 0);

            // Tạo VNPay payment request
            // Có thể dùng order đầu tiên hoặc tạo một invoice tổng hợp
            // Ở đây tôi sẽ dùng order đầu tiên làm reference
            const firstOrder = orders[0];
            
            // Đảm bảo orderId là string hợp lệ
            // Mongoose ObjectId có thể là object, cần convert sang string
            let orderIdString = null;
            
            if (!firstOrder) {
              throw new Error('Không tìm thấy đơn hàng để thanh toán.');
            }
            
            // Bước 1: Serialize order object để đảm bảo _id được convert đúng
            let serializedOrder = null;
            try {
              serializedOrder = JSON.parse(JSON.stringify(firstOrder));
            } catch (e) {
              console.error('💳 [Checkout] Error serializing order:', e);
              serializedOrder = firstOrder;
            }
            
            // Bước 2: Extract _id từ serialized order
            if (serializedOrder && serializedOrder._id) {
              const rawId = serializedOrder._id;
              
              // Nếu _id đã là string hợp lệ
              if (typeof rawId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawId)) {
                orderIdString = rawId;
              } 
              // Nếu _id là object, thử extract
              else if (typeof rawId === 'object' && rawId !== null) {
                // Thử các cách extract
                if (rawId.$oid) {
                  orderIdString = rawId.$oid;
                } else if (rawId.toString && typeof rawId.toString === 'function') {
                  const idStr = rawId.toString();
                  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                    orderIdString = idStr;
                  }
                } else if (rawId._id) {
                  const idStr = String(rawId._id);
                  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                    orderIdString = idStr;
                  }
                }
              }
              // Nếu _id là string nhưng không đúng format, thử trim và validate
              else if (typeof rawId === 'string') {
                const trimmed = rawId.trim();
                if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
                  orderIdString = trimmed;
                }
              }
            }
            
            // Bước 3: Nếu vẫn chưa có, thử extract từ original order
            if (!orderIdString && firstOrder._id) {
              try {
                if (typeof firstOrder._id === 'string' && /^[0-9a-fA-F]{24}$/.test(firstOrder._id)) {
                  orderIdString = firstOrder._id;
                } else if (firstOrder._id && typeof firstOrder._id.toString === 'function') {
                  const idStr = firstOrder._id.toString();
                  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                    orderIdString = idStr;
                  }
                }
              } catch (e) {
                console.error('💳 [Checkout] Error extracting from original _id:', e);
              }
            }
            
            // Bước 4: Thử dùng field 'id' (Mongoose virtual field)
            if (!orderIdString && firstOrder.id) {
              const idStr = String(firstOrder.id);
              if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                orderIdString = idStr;
              }
            }
            
            // Bước 5: Thử từ serialized order.id
            if (!orderIdString && serializedOrder && serializedOrder.id) {
              const idStr = String(serializedOrder.id);
              if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                orderIdString = idStr;
              }
            }
            
            // Validate orderId format (MongoDB ObjectId là 24 hex characters)
            if (!orderIdString || !/^[0-9a-fA-F]{24}$/.test(orderIdString)) {
              console.error('💳 [Checkout] Invalid orderId format:', {
                orderIdString,
                orderIdType: typeof orderIdString,
                orderIdLength: orderIdString?.length,
                firstOrder: firstOrder ? {
                  _id: firstOrder._id,
                  _idType: typeof firstOrder._id,
                  _idConstructor: firstOrder._id?.constructor?.name,
                  orderNumber: firstOrder.orderNumber,
                  serializedOrder: serializedOrder ? {
                    _id: serializedOrder._id,
                    _idType: typeof serializedOrder._id
                  } : null
                } : null
              });
              throw new Error('ID đơn hàng không hợp lệ. Vui lòng thử lại.');
            }
            
            console.log('💳 [Checkout] Creating VNPay payment:', {
              orderNumber: firstOrder?.orderNumber,
              orderIdString: orderIdString,
              orderIdLength: orderIdString?.length,
              amount: totalOrderAmount || totalAmount,
              orderIdValid: /^[0-9a-fA-F]{24}$/.test(orderIdString),
              firstOrderKeys: firstOrder ? Object.keys(firstOrder) : null,
              firstOrderId: firstOrder?.id,
              firstOrder_id: firstOrder?._id,
              serializedOrderId: serializedOrder?.id,
              serializedOrder_id: serializedOrder?._id
            });
            
            toast.success('Đang chuyển đến trang thanh toán VNPay...');
            
            const vnpayResponse = await paymentAPI.createVnpayPayment({
              orderId: orderIdString, // Đảm bảo là string hợp lệ
              amount: totalOrderAmount || totalAmount,
              orderInfo: `Thanh toán đơn hàng ${firstOrder.orderNumber || orderIdString}`
            });

            if (vnpayResponse.success && vnpayResponse.data.paymentUrl) {
              // Xóa giỏ hàng
              clearCart();
              
              // Redirect đến VNPay payment page
              window.location.href = vnpayResponse.data.paymentUrl;
              return; // Dừng lại, không navigate đến /orders
            } else {
              throw new Error('Không thể tạo yêu cầu thanh toán VNPay');
            }
          } catch (error) {
            console.error('Error creating VNPay payment:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tạo thanh toán VNPay');
            // Vẫn giữ orders đã tạo, user có thể thanh toán sau
            clearCart();
            navigate('/orders');
            return;
          }
        }

        // Các phương thức thanh toán khác (bank_transfer, cash, credit, momo)
        // Xóa giỏ hàng
        clearCart();
        
        toast.success(`Đã tạo ${orders.length} đơn hàng thành công!`);
        
        // Nếu là MoMo, cũng cần xử lý tương tự VNPay
        if (paymentMethod === 'momo') {
          try {
            const totalAmount = getTotalPrice();
            const totalOrderAmount = orders.reduce((sum, order) => {
              return sum + (order.totalAmount || order.items.reduce((itemSum, item) => {
                return itemSum + ((item.unitPrice || 0) * (item.quantity || 0));
              }, 0));
            }, 0);

            const firstOrder = orders[0];
            
            toast.success('Đang chuyển đến trang thanh toán MoMo...');
            
            const momoResponse = await paymentAPI.createMomoPayment({
              orderId: firstOrder._id,
              amount: totalOrderAmount || totalAmount
            });

            if (momoResponse.success && momoResponse.data.paymentUrl) {
              window.location.href = momoResponse.data.paymentUrl;
              return;
            }
          } catch (error) {
            console.error('Error creating MoMo payment:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tạo thanh toán MoMo');
          }
        }
        
        // Redirect đến trang orders
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        data: error.response?.data
      });
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Tạo đơn hàng thất bại';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBillingAddressChange = (field, value) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  if (loadingDrugs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const total = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại Marketplace
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Đơn hàng
              </h2>
              
              <div className="space-y-4">
                {Object.values(groupedItems).map((group, groupIdx) => (
                  <div key={groupIdx} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <p className="font-medium text-gray-700 mb-2">
                      Nhà sản xuất: {group.manufacturerName}
                    </p>
                    <div className="space-y-3">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                              }).format((item.wholesalePrice || item.price || 0) * item.quantity)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                              }).format(item.wholesalePrice || item.price || 0)} / đơn vị
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Địa chỉ giao hàng
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Số nhà, đường"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tỉnh/Thành phố *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quận/Huyện
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã bưu điện
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Địa chỉ thanh toán
              </h2>
              
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={billingAddress.sameAsShipping}
                    onChange={(e) => setBillingAddress({...billingAddress, sameAsShipping: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Giống địa chỉ giao hàng</span>
                </label>
              </div>
              
              {!billingAddress.sameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ tên *
                    </label>
                    <input
                      type="text"
                      required={!billingAddress.sameAsShipping}
                      value={billingAddress.name}
                      onChange={(e) => handleBillingAddressChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required={!billingAddress.sameAsShipping}
                      value={billingAddress.phone}
                      onChange={(e) => handleBillingAddressChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ *
                    </label>
                    <input
                      type="text"
                      required={!billingAddress.sameAsShipping}
                      value={billingAddress.address}
                      onChange={(e) => handleBillingAddressChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố *
                    </label>
                    <input
                      type="text"
                      required={!billingAddress.sameAsShipping}
                      value={billingAddress.city}
                      onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã bưu điện
                    </label>
                    <input
                      type="text"
                      value={billingAddress.postalCode}
                      onChange={(e) => handleBillingAddressChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Phương thức thanh toán
              </h2>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">Chuyển khoản ngân hàng</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">Tiền mặt</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">MoMo</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">VNPay (Thẻ ATM/Internet Banking)</span>
                </label>
                
                {/* Credit Payment Option */}
                {creditStatus && creditStatus.creditLimit > 0 && (
                  <label 
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      canUseCreditPayment() 
                        ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                        : 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit"
                      checked={paymentMethod === 'credit'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={!canUseCreditPayment()}
                      className="text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Mua trả sau (Credit/Net 30)</span>
                        {canUseCreditPayment() && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                            Có thể dùng
                          </span>
                        )}
                      </div>
                      {creditStatus && (
                        <div className="text-xs text-gray-600 mt-1">
                          Hạn mức: {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(creditStatus.creditLimit)} | 
                          Đã dùng: {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(creditStatus.currentDebt)} | 
                          Còn lại: {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(creditStatus.availableCredit)}
                        </div>
                      )}
                      {!canUseCreditPayment() && creditStatus && (
                        <div className="text-xs text-red-600 mt-1">
                          {creditStatus.currentDebt + getTotalPrice() > creditStatus.creditLimit 
                            ? 'Vượt quá hạn mức tín dụng' 
                            : 'Không đủ điều kiện sử dụng'}
                        </div>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ghi chú</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ghi chú cho đơn hàng (tùy chọn)"
              />
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Số lượng sản phẩm:</span>
                  <span className="font-medium text-gray-900">{items.length}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Tổng số lượng:</span>
                  <span className="font-medium text-gray-900">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(total)}
                    </span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Đặt hàng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

