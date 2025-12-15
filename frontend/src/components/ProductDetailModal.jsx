import React, { useState, useEffect } from 'react';
import { X, Package, Building2, DollarSign, Minus, Plus, ShoppingCart, Gavel } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { bidAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ProductDetailModal = ({ product, isOpen, onClose }) => {
  const { addItem, getItemQuantity } = useCart();
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'bid'
  const [quantity, setQuantity] = useState(1);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQuantity, setBidQuantity] = useState(1);
  const [acceptedBidPrice, setAcceptedBidPrice] = useState(null);

  // Load accepted bid price khi mở modal
  useEffect(() => {
    if (isOpen && product) {
      const loadAcceptedBid = async () => {
        try {
          const drugId = product.drugId || product._id;
          const response = await bidAPI.getBids({ 
            status: 'accepted', 
            drugId: typeof drugId === 'object' ? drugId.toString() : drugId 
          });
          
          if (response.success && response.data?.bids?.length > 0) {
            // Lấy bid accepted mới nhất
            const latestBid = response.data.bids[0];
            const price = latestBid.counterPrice || latestBid.bidPrice;
            setAcceptedBidPrice(price);
          } else {
            setAcceptedBidPrice(null);
          }
        } catch (error) {
          console.warn('Không thể load accepted bid:', error);
          setAcceptedBidPrice(null);
        }
      };
      
      loadAcceptedBid();
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const minOrderQuantity = product.minOrderQuantity || product.moq || 1;
  // Ưu tiên giá từ bid accepted nếu có, sau đó là giá từ product prop, cuối cùng là giá gốc
  const wholesalePrice = acceptedBidPrice || product.acceptedBidPrice || product.wholesalePrice || product.basePrice || product.price || 0;
  const currentQuantity = getItemQuantity(product.drugId || product._id);
  
  // Helper function để tính giá dựa trên priceTiers
  // NOTE: Nếu có acceptedBidPrice, giá đã được fix từ bid accepted, không áp dụng priceTiers
  const getPriceForQuantity = (qty) => {
    // Nếu có giá từ bid accepted, sử dụng giá đó (không áp dụng priceTiers)
    if (acceptedBidPrice || product.acceptedBidPrice) {
      return acceptedBidPrice || product.acceptedBidPrice;
    }
    
    // Nếu không có bid accepted, áp dụng priceTiers nếu có
    if (!product.priceTiers || product.priceTiers.length === 0) {
      return wholesalePrice;
    }
    const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.price;
      }
    }
    return wholesalePrice;
  };
  
  const currentPrice = getPriceForQuantity(quantity);

  const handleAddToCart = () => {
    if (quantity < minOrderQuantity) {
      toast.error(`Số lượng tối thiểu là ${minOrderQuantity}`);
      return;
    }
    if (quantity > 100) {
      toast.error('Giới hạn không được quá 100');
      return;
    }

    // Truyền cả drug object để CartContext có thể tính tiered pricing
    addItem({
      drugId: product.drugId || product._id,
      name: product.name,
      manufacturerName: product.manufacturerName || product.manufacturerId?.organizationInfo?.name || 'Nhà sản xuất',
      wholesalePrice: currentPrice,
      price: currentPrice,
      imageUrl: product.imageUrl || product.qrCode?.imageUrl,
      minOrderQuantity: minOrderQuantity,
      quantity: quantity,
    }, product); // Truyền product object để có priceTiers

    toast.success('Đã thêm vào giỏ hàng');
    onClose();
  };

  const handlePlaceBid = async () => {
    if (!bidPrice || parseFloat(bidPrice) <= 0) {
      toast.error('Vui lòng nhập giá đấu thầu hợp lệ');
      return;
    }

    if (bidQuantity < minOrderQuantity) {
      toast.error(`Số lượng tối thiểu là ${minOrderQuantity}`);
      return;
    }
    if (bidQuantity > 100) {
      toast.error('Giới hạn không được quá 100');
      return;
    }

    try {
      const drugId = product.drugId || product._id;
      const response = await bidAPI.createBid({
        drugId,
        bidPrice: parseFloat(bidPrice),
        quantity: parseInt(bidQuantity),
        notes: ''
      });

      if (response.success) {
        toast.success('Đã gửi yêu cầu đấu thầu thành công!');
        onClose();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gửi đấu thầu thất bại';
      toast.error(errorMessage);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(minOrderQuantity, Math.min(100, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleBidQuantityChange = (delta) => {
    const newQuantity = Math.max(minOrderQuantity, Math.min(100, bidQuantity + delta));
    setBidQuantity(newQuantity);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Image */}
              <div className="space-y-4">
                <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {product.imageUrl || product.qrCode?.imageUrl ? (
                    <img
                      src={product.imageUrl || product.qrCode?.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-24 h-24" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Details */}
              <div className="space-y-6">
                {/* Product Info */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>
                        Nhà sản xuất:{' '}
                        <span className="font-medium text-gray-900">
                          {product.manufacturerName ||
                            product.manufacturerId?.organizationInfo?.name ||
                            'Chưa có thông tin'}
                        </span>
                      </span>
                    </div>
                    {product.activeIngredient && (
                      <div>
                        <span className="font-medium">Thành phần:</span>{' '}
                        {product.activeIngredient}
                      </div>
                    )}
                    {product.dosage && (
                      <div>
                        <span className="font-medium">Liều lượng:</span> {product.dosage}
                      </div>
                    )}
                    {product.form && (
                      <div>
                        <span className="font-medium">Dạng bào chế:</span> {product.form}
                      </div>
                    )}
                    {product.batchNumber && (
                      <div>
                        <span className="font-medium">Số lô:</span> {product.batchNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {acceptedBidPrice || product.acceptedBidPrice ? 'Giá đã đấu thầu:' : 'Giá bán buôn:'}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(currentPrice)}
                    </span>
                  </div>
                  {acceptedBidPrice || product.acceptedBidPrice ? (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✅ Giá này đã được thỏa thuận qua đấu thầu
                    </div>
                  ) : quantity > 0 && currentPrice !== wholesalePrice && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      💰 Đang áp dụng giá ưu đãi cho {quantity}+ đơn vị
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Số lượng tối thiểu (MOQ):</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {minOrderQuantity} {product.packaging?.unit || 'đơn vị'}
                    </span>
                  </div>
                  
                  {/* Bulk Pricing Table */}
                  {product.priceTiers && product.priceTiers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Bảng giá ưu đãi theo khối lượng:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {[...product.priceTiers].sort((a, b) => a.minQty - b.minQty).map((tier, idx) => {
                          const isActive = quantity >= tier.minQty;
                          return (
                            <div
                              key={idx}
                              className={`flex justify-between items-center text-xs px-2 py-1 rounded ${
                                isActive ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600'
                              }`}
                            >
                              <span>
                                {tier.minQty}+ đơn vị:
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(tier.price)}
                                </span>
                                {tier.discount > 0 && (
                                  <span className="text-green-600">
                                    (-{tier.discount}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('buy')}
                      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        activeTab === 'buy'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Mua ngay
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('bid')}
                      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        activeTab === 'bid'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4" />
                        Đấu thầu
                      </div>
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'buy' ? (
                  <div className="space-y-4">
                    {/* Quantity Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          className="p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <input
                          type="number"
                          min={minOrderQuantity}
                          max={100}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || minOrderQuantity;
                            const clampedVal = Math.max(minOrderQuantity, Math.min(100, val));
                            setQuantity(clampedVal);
                            if (val > 100) {
                              toast.error('Giới hạn không được quá 100', { duration: 2000 });
                            } else if (val < minOrderQuantity && val > 0) {
                              toast.error(`Số lượng tối thiểu là ${minOrderQuantity}`, { duration: 2000 });
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center font-medium"
                        />
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm text-gray-600">
                          (Tối thiểu: {minOrderQuantity})
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-900">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(currentPrice * quantity)}
                        </span>
                      </div>
                      {currentPrice !== wholesalePrice && (
                        <div className="text-xs text-gray-500 mt-1">
                          (Giá gốc: {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(wholesalePrice * quantity)})
                        </div>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddToCart}
                      className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Thêm vào giỏ hàng
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bid Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá đấu thầu (VND)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          placeholder="Nhập giá đấu thầu"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {acceptedBidPrice ? (
                          <span>
                            Giá đã được đấu thầu thành công:{' '}
                            <span className="font-semibold text-green-600">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(acceptedBidPrice)}
                            </span>
                          </span>
                        ) : (
                          <span>
                        Giá hiện tại:{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(wholesalePrice)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Bid Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleBidQuantityChange(-1)}
                          className="p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <input
                          type="number"
                          min={minOrderQuantity}
                          max={100}
                          value={bidQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || minOrderQuantity;
                            const clampedVal = Math.max(minOrderQuantity, Math.min(100, val));
                            setBidQuantity(clampedVal);
                            if (val > 100) {
                              toast.error('Giới hạn không được quá 100', { duration: 2000 });
                            } else if (val < minOrderQuantity && val > 0) {
                              toast.error(`Số lượng tối thiểu là ${minOrderQuantity}`, { duration: 2000 });
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center font-medium"
                        />
                        <button
                          onClick={() => handleBidQuantityChange(1)}
                          className="p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm text-gray-600">
                          (Tối thiểu: {minOrderQuantity})
                        </span>
                      </div>
                    </div>

                    {/* Bid Total */}
                    {bidPrice && parseFloat(bidPrice) > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-gray-900">Tổng đấu thầu:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(parseFloat(bidPrice) * bidQuantity)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Place Bid Button */}
                    <button
                      onClick={handlePlaceBid}
                      className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Gavel className="w-5 h-5" />
                      Gửi đấu thầu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;
