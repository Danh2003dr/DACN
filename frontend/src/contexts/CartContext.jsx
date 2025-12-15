import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  items: [],
  isOpen: false,
};

// Action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  TOGGLE_CART: 'TOGGLE_CART',
  OPEN_CART: 'OPEN_CART',
  CLOSE_CART: 'CLOSE_CART',
};

// Helper function để tính giá dựa trên priceTiers
const getPriceForQuantity = (drug, quantity) => {
  if (!drug) {
    return 0;
  }
  
  // Nếu không có priceTiers, dùng wholesalePrice hoặc basePrice
  if (!drug.priceTiers || drug.priceTiers.length === 0) {
    return drug.wholesalePrice || drug.basePrice || drug.price || 0;
  }
  
  // Sắp xếp priceTiers theo minQty giảm dần (tier cao nhất trước)
  const sortedTiers = [...drug.priceTiers].sort((a, b) => b.minQty - a.minQty);
  
  // Tìm tier phù hợp với quantity
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQty) {
      return tier.price;
    }
  }
  
  // Nếu quantity nhỏ hơn tất cả tiers, dùng wholesalePrice hoặc basePrice
  return drug.wholesalePrice || drug.basePrice || drug.price || 0;
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item, drug } = action.payload; // drug chứa đầy đủ thông tin bao gồm priceTiers
      const existingItem = state.items.find(
        (i) => i.drugId === item.drugId
      );

      const newQuantity = existingItem 
        ? existingItem.quantity + (item.quantity || 1)
        : (item.quantity || 1);

      if (existingItem) {
        // Nếu item đã tồn tại, cập nhật số lượng và tính lại giá
        const updatedItems = state.items.map((i) => {
          if (i.drugId === item.drugId) {
            const drugData = drug || i.drug; // Sử dụng drug mới nếu có, nếu không dùng drug cũ
            const unitPrice = getPriceForQuantity(drugData, newQuantity);
            return { 
              ...i, 
              quantity: newQuantity,
              unitPrice: unitPrice, // Cập nhật giá theo quantity mới
              drug: drugData || i.drug // Cập nhật drug info nếu có
            };
          }
          return i;
        });
        return { ...state, items: updatedItems };
      } else {
        // Thêm item mới
        const unitPrice = getPriceForQuantity(drug, newQuantity);
        return {
          ...state,
          items: [...state.items, { 
            ...item, 
            quantity: newQuantity,
            unitPrice: unitPrice,
            wholesalePrice: unitPrice, // Giữ lại để backward compatibility
            drug: drug // Lưu drug object để có thể tính lại giá sau
          }],
        };
      }
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const { drugId } = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.drugId !== drugId),
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { drugId, quantity } = action.payload;
      if (quantity <= 0) {
        // Nếu quantity <= 0, xóa item
        return {
          ...state,
          items: state.items.filter((item) => item.drugId !== drugId),
        };
      }
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.drugId === drugId) {
            // Tính lại giá dựa trên quantity mới
            const drugData = item.drug;
            const unitPrice = getPriceForQuantity(drugData, quantity);
            return { 
              ...item, 
              quantity,
              unitPrice: unitPrice,
              wholesalePrice: unitPrice // Cập nhật để backward compatibility
            };
          }
          return item;
        }),
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return { ...state, items: [] };

    case CART_ACTIONS.LOAD_CART:
      return { ...state, items: action.payload.items || [] };

    case CART_ACTIONS.TOGGLE_CART:
      return { ...state, isOpen: !state.isOpen };

    case CART_ACTIONS.OPEN_CART:
      return { ...state, isOpen: true };

    case CART_ACTIONS.CLOSE_CART:
      return { ...state, isOpen: false };

    default:
      return state;
  }
};

// Context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('b2b_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: cartData } });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('b2b_cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  // Actions
  // item: { drugId, quantity, ... }
  // drug: (optional) drug object đầy đủ với priceTiers để tính tiered pricing
  const addItem = (item, drug = null) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { item, drug } });
  };

  const removeItem = (drugId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { drugId } });
  };

  const updateQuantity = (drugId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { drugId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const toggleCart = () => {
    dispatch({ type: CART_ACTIONS.TOGGLE_CART });
  };

  const openCart = () => {
    dispatch({ type: CART_ACTIONS.OPEN_CART });
  };

  const closeCart = () => {
    dispatch({ type: CART_ACTIONS.CLOSE_CART });
  };

  // Calculate totals
  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      // Sử dụng unitPrice đã được tính dựa trên tiered pricing
      const price = item.unitPrice || item.wholesalePrice || item.price || 0;
      return total + price * item.quantity;
    }, 0);
  };
  
  // Tính giá cho một item cụ thể (có thể dùng để hiển thị giá trong UI)
  const getItemPrice = (drugId) => {
    const item = state.items.find((i) => i.drugId === drugId);
    if (!item) return 0;
    return (item.unitPrice || item.wholesalePrice || item.price || 0) * item.quantity;
  };
  
  // Lấy thông tin tier discount cho một item
  const getItemTierInfo = (drugId) => {
    const item = state.items.find((i) => i.drugId === drugId);
    if (!item || !item.drug || !item.drug.priceTiers || item.drug.priceTiers.length === 0) {
      return null;
    }
    
    const sortedTiers = [...item.drug.priceTiers].sort((a, b) => b.minQty - a.minQty);
    const currentTier = sortedTiers.find(tier => item.quantity >= tier.minQty);
    
    if (!currentTier) return null;
    
    // Tính giá base (không có discount)
    const basePrice = item.drug.wholesalePrice || item.drug.basePrice || 0;
    const savings = basePrice > 0 ? ((basePrice - currentTier.price) / basePrice * 100) : 0;
    
    return {
      tier: currentTier,
      discount: currentTier.discount || savings,
      minQty: currentTier.minQty,
      price: currentTier.price
    };
  };

  const getItemQuantity = (drugId) => {
    const item = state.items.find((i) => i.drugId === drugId);
    return item ? item.quantity : 0;
  };

  const value = {
    items: state.items,
    isOpen: state.isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    getTotalItems,
    getTotalPrice,
    getItemQuantity,
    getItemPrice,
    getItemTierInfo,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
