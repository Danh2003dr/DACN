import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const handleQuantityChange = (drugId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(drugId);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } else {
      const clampedQuantity = Math.min(100, newQuantity);
      if (newQuantity > 100) {
        toast.error('Giới hạn không được quá 100', { duration: 2000 });
      }
      updateQuantity(drugId, clampedQuantity);
    }
  };

  const handleRemoveItem = (drugId, name) => {
    removeItem(drugId);
    toast.success(`Đã xóa ${name} khỏi giỏ hàng`);
  };

  const handleRequestQuote = () => {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    // TODO: Implement request quote functionality
    toast.success('Yêu cầu báo giá đã được gửi!');
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    closeCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Giỏ hàng ({getTotalItems()})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Giỏ hàng trống</p>
              <p className="text-gray-400 text-sm">Thêm sản phẩm vào giỏ hàng để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.drugId}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.manufacturerName || 'Nhà sản xuất'}
                      </p>
                      <p className="text-lg font-bold text-blue-600 mb-3">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.wholesalePrice || item.price || 0)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.drugId, item.quantity - 1)
                            }
                            className="p-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-12 text-center font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.drugId, item.quantity + 1)
                            }
                            className="p-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.drugId, item.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Tổng:{' '}
                          <span className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(
                              (item.wholesalePrice || item.price || 0) * item.quantity
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total and Actions */}
        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between py-2">
              <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
              <span className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(getTotalPrice())}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRequestQuote}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Yêu cầu báo giá
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thanh toán
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
